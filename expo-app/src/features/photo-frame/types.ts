/* Photo frame domain types (port of the `state` shape in prototype/photo-frame/app.js). */

export type EffectType = "action-extension" | "weather-transition";
export type WeatherPreset = "sunlight" | "clouds" | "rain" | "snow";

/** A bundled asset (`require(...)`) or a URI / data URL. */
export type PhotoSource = number | string;

export type MotionAnalysis = { subject: string; depth: string; motion: string };

export type Motion = {
  /** `demo` = deterministic local effect (no server); `server` = generated clip from the AI endpoint. */
  kind: "demo" | "server";
  effectType: EffectType;
  weatherPreset: WeatherPreset | "";
  durationSeconds: number;
  videoUrl: string;
  posterUrl: PhotoSource;
  analysis: MotionAnalysis;
  /** Traditional Chinese source string; pass through t() to display. */
  generatedAt: string;
};

export type Photo = {
  id: string;
  /** Traditional Chinese source string; pass through t() to display. */
  title: string;
  capturedAt: string;
  owner: string;
  src: PhotoSource;
  fileName?: string;
  uploaded: boolean;
  motion: Motion | null;
};

export type AiPhase = "processing" | "complete" | "error";

export type AiState = {
  photoId: string;
  phase: AiPhase;
  effectType: EffectType;
  weatherPreset: WeatherPreset;
  progress: number;
  currentStep: number;
  result: Motion | null;
  error: string;
};

export type GenerationOptions = { effectType: EffectType; weatherPreset: WeatherPreset };
