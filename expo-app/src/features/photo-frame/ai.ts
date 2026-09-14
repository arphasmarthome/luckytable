/* AI motion generation flow (port of openAiDialog / startAiGeneration in prototype/photo-frame/app.js).
 * Without an endpoint the deterministic local demo runs; with one, the photo is posted as multipart
 * form data and an async job is polled through `statusUrl` until it completes or fails. */
import { t } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { MOTION_SECONDS, WEATHER_PRESETS, normalizedEffectType, normalizedWeatherPreset, sourceUri, weatherLabel } from "./data";
import { frame, photoById, useFrameStore } from "./store";
import type { GenerationOptions, Motion, Photo } from "./types";

/** Set this (or `globalThis.PHOTO_AI_MOTION_ENDPOINT` on web, like the prototype) to enable server generation. */
const PHOTO_AI_MOTION_ENDPOINT = "";

export function aiEndpoint(): string {
  const global = globalThis as { PHOTO_AI_MOTION_ENDPOINT?: unknown };
  return typeof global.PHOTO_AI_MOTION_ENDPOINT === "string" ? global.PHOTO_AI_MOTION_ENDPOINT : PHOTO_AI_MOTION_ENDPOINT;
}

let aiRun = 0;
let aiAbortController: AbortController | null = null;

export const PROCESSING_PHASES: Record<"weather" | "action", string[]> = {
  weather: ["上傳照片", "分析場景光線", "生成天氣變化", "融合自然效果"],
  action: ["上傳照片", "辨識人物物件", "延伸畫面動作", "調整自然動態"],
};

function abortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

function wait(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, milliseconds);
    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function updateAiProgress(run: number, progress: number, currentStep: number) {
  if (run !== aiRun || !useFrameStore.getState().ai) return false;
  frame.patchAi({ progress, currentStep });
  return true;
}

export function aiPhoto(): Photo | null {
  return photoById(useFrameStore.getState().ai?.photoId);
}

/** Prepare the AI run for a photo; the caller opens the dialog and calls startAiGeneration(). */
export function beginAi(photoId: string): Photo | null {
  const photo = photoById(photoId);
  if (!photo) return null;
  const settings = useDeviceStore.getState().settings;
  frame.selectPhoto(photo.id);
  frame.setAi({
    photoId: photo.id,
    phase: "processing",
    effectType: normalizedEffectType(settings.effectType),
    weatherPreset: normalizedWeatherPreset(settings.weatherPreset),
    progress: 0,
    currentStep: 0,
    result: null,
    error: "",
  });
  return photo;
}

/** Cancel any run in flight and clear the AI state (dialog closed / 取消處理 / 完成). */
export function cancelAi() {
  aiRun += 1;
  aiAbortController?.abort();
  aiAbortController = null;
  if (useFrameStore.getState().ai) frame.setAi(null);
}

async function photoBlob(photo: Photo, signal: AbortSignal): Promise<Blob> {
  const uri = sourceUri(photo.src);
  const response = uri ? await fetch(uri, { signal }) : null;
  if (!response || !response.ok) throw new Error(t("無法讀取這張照片，請重新上傳後再試。"));
  return response.blob();
}

type ServerPayload = {
  status?: string;
  message?: string;
  statusUrl?: string;
  videoUrl?: string;
  motionUrl?: string;
  posterUrl?: string;
  durationSeconds?: number | string;
  effectType?: string;
  weatherPreset?: string;
  analysis?: Partial<Motion["analysis"]>;
  result?: ServerPayload;
};

function normalizedResult(payload: ServerPayload, photo: Photo, options: GenerationOptions): Motion {
  const result = payload.result || payload;
  const videoUrl = result.videoUrl || result.motionUrl || "";
  if (!videoUrl) throw new Error(t("服務已回應，但沒有提供動態影片。"));
  const effectType = normalizedEffectType(result.effectType || options.effectType);
  const weatherPreset = effectType === "weather-transition" ? normalizedWeatherPreset(result.weatherPreset || options.weatherPreset) : "";
  return {
    kind: "server",
    effectType,
    weatherPreset,
    durationSeconds: Number(result.durationSeconds) || MOTION_SECONDS,
    videoUrl,
    posterUrl: result.posterUrl || photo.src,
    analysis: {
      subject: result.analysis?.subject || (effectType === "weather-transition" ? "整體場景" : "家庭人物"),
      depth: result.analysis?.depth || (effectType === "weather-transition" ? "人物與背景分層" : "自然景深"),
      motion: result.analysis?.motion || (effectType === "weather-transition" ? weatherLabel(weatherPreset) : "人物自然微動"),
    },
    generatedAt: "剛剛",
  };
}

async function runServerGeneration(photo: Photo, options: GenerationOptions, run: number, signal: AbortSignal): Promise<Motion> {
  const endpoint = aiEndpoint();
  updateAiProgress(run, 12, 0);
  const blob = await photoBlob(photo, signal);
  const form = new FormData();
  form.append("photo", blob, photo.fileName || `${photo.id}.png`);
  form.append("photoId", photo.id);
  form.append("durationSeconds", String(MOTION_SECONDS));
  form.append("effectType", options.effectType);
  if (options.effectType === "weather-transition") form.append("weatherPreset", options.weatherPreset);
  form.append("style", "natural");
  updateAiProgress(run, 26, 1);

  const response = await fetch(endpoint, { method: "POST", body: form, credentials: "include", signal });
  if (!response.ok) throw new Error(t("家庭 AI 服務暫時無法使用（{status}）。", { status: response.status }));
  let payload = (await response.json()) as ServerPayload;

  const statusUrl = payload.statusUrl;
  if (!payload.videoUrl && !payload.motionUrl && !payload.result?.videoUrl && statusUrl) {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      updateAiProgress(run, Math.min(88, 38 + attempt * 1.5), attempt < 8 ? 1 : attempt < 20 ? 2 : 3);
      await wait(1500, signal);
      const statusResponse = await fetch(statusUrl, { credentials: "include", signal });
      if (!statusResponse.ok) throw new Error(t("無法取得生成進度（{status}）。", { status: statusResponse.status }));
      payload = (await statusResponse.json()) as ServerPayload;
      if (payload.status === "failed") throw new Error(payload.message || t("服務無法完成這張照片。"));
      if (payload.status === "completed" || payload.videoUrl || payload.result?.videoUrl) break;
    }
  }

  updateAiProgress(run, 96, 3);
  return normalizedResult(payload, photo, options);
}

async function runDemoGeneration(photo: Photo, options: GenerationOptions, run: number, signal: AbortSignal): Promise<Motion> {
  const phases: [number, number, number][] = [
    [18, 0, 420],
    [42, 1, 520],
    [68, 2, 620],
    [88, 3, 560],
    [100, 3, 360],
  ];
  for (const [progress, step, duration] of phases) {
    await wait(duration, signal);
    updateAiProgress(run, progress, step);
  }
  const weather = options.effectType === "weather-transition";
  return {
    kind: "demo",
    effectType: options.effectType,
    weatherPreset: weather ? options.weatherPreset : "",
    durationSeconds: MOTION_SECONDS,
    videoUrl: "",
    posterUrl: photo.src,
    analysis: {
      subject: weather ? "整體場景" : photo.id === "reunion" ? "6 位家人" : "家庭人物",
      depth: weather ? "人物與背景分層" : "前後三層",
      motion: weather ? WEATHER_PRESETS[normalizedWeatherPreset(options.weatherPreset)].label : "人物自然微動",
    },
    generatedAt: "剛剛",
  };
}

/** Start (or retry) generation for the photo in the current AI state. */
export async function startAiGeneration() {
  const photo = aiPhoto();
  const ai = useFrameStore.getState().ai;
  if (!photo || !ai) return;
  const options: GenerationOptions = { effectType: normalizedEffectType(ai.effectType), weatherPreset: normalizedWeatherPreset(ai.weatherPreset) };
  aiAbortController?.abort();
  aiAbortController = new AbortController();
  const run = ++aiRun;
  frame.patchAi({ phase: "processing", progress: 4, currentStep: 0, error: "" });

  try {
    const result = aiEndpoint()
      ? await runServerGeneration(photo, options, run, aiAbortController.signal)
      : await runDemoGeneration(photo, options, run, aiAbortController.signal);
    if (run !== aiRun || !useFrameStore.getState().ai) return;
    frame.setMotion(photo.id, result);
    frame.patchAi({ result, phase: "complete" });
  } catch (error) {
    if ((error instanceof Error && error.name === "AbortError") || run !== aiRun || !useFrameStore.getState().ai) return;
    frame.patchAi({ phase: "error", error: error instanceof Error ? error.message : t("家庭 AI 服務暫時無法使用，原圖沒有變更。") });
  } finally {
    if (run === aiRun) aiAbortController = null;
  }
}
