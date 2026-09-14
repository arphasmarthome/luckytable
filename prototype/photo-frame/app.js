const i18n = window.LuckyI18n;
const t = i18n.t;

const demoPhotos = [
  {
    id: "tea",
    title: "週末午後",
    capturedAt: "今天・14:20",
    owner: "James",
    src: "assets/family-tea.png",
    file: null,
    uploaded: false,
    motion: {
      kind: "demo",
      effectType: "action-extension",
      weatherPreset: "",
      durationSeconds: 5,
      videoUrl: "",
      posterUrl: "assets/family-tea.png",
      analysis: {
        subject: "4 位家人",
        depth: "前後三層",
        motion: "人物自然微動",
      },
      generatedAt: "剛剛",
    },
  },
  {
    id: "sofa",
    title: "一起窩在沙發",
    capturedAt: "8 月 31 日・20:12",
    owner: "miles",
    src: "assets/family-sofa.png",
    file: null,
    uploaded: false,
    motion: null,
  },
  {
    id: "laughter",
    title: "笑成一團",
    capturedAt: "8 月 24 日・16:45",
    owner: "大家好",
    src: "assets/family-laughter.png",
    file: null,
    uploaded: false,
    motion: null,
  },
  {
    id: "reunion",
    title: "全家都到齊",
    capturedAt: "8 月 18 日・12:30",
    owner: "James",
    src: "assets/family-reunion.png",
    file: null,
    uploaded: false,
    motion: {
      kind: "demo",
      effectType: "action-extension",
      weatherPreset: "",
      durationSeconds: 5,
      videoUrl: "",
      posterUrl: "assets/family-reunion.png",
      analysis: {
        subject: "6 位家人",
        depth: "前後三層",
        motion: "人物自然微動",
      },
      generatedAt: "昨天",
    },
  },
];

const state = {
  photos: demoPhotos,
  selectedId: "tea",
  cinemaFallback: false,
  ai: null,
  settings: {
    autoPlayMotion: true,
    effectType: "action-extension",
    weatherPreset: "clouds",
    device: "餐桌日曆機",
  },
};

const photoStage = document.querySelector("#photoStage");
const viewerToolbar = document.querySelector("#viewerToolbar");
const pageStatus = document.querySelector("#pageStatus");
const photoInput = document.querySelector("#photoInput");
const aiDialog = document.querySelector("#aiDialog");
const aiDialogBody = document.querySelector("#aiDialogBody");
const settingsDialog = document.querySelector("#settingsDialog");
const settingsDialogBody = document.querySelector("#settingsDialogBody");
const removeDialog = document.querySelector("#removeDialog");
const toast = document.querySelector("#toast");

let toastTimer = 0;
let aiRun = 0;
let aiAbortController = null;

const effectLabels = {
  "action-extension": "動作延伸",
  "weather-transition": "天氣變化",
};

const weatherPresets = {
  sunlight: { label: "陽光流動", icon: "sun" },
  clouds: { label: "雲層掠過", icon: "weather-cloud" },
  rain: { label: "細雨落下", icon: "rain" },
  snow: { label: "飄雪", icon: "snow" },
};

function icon(name) {
  return `<svg aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tx(value) {
  return escapeHtml(t(value));
}

function currentPhoto() {
  return state.photos.find((photo) => photo.id === state.selectedId) || state.photos[0] || null;
}

function shouldPlayMotion(photo = currentPhoto()) {
  return Boolean(photo?.motion && state.settings.autoPlayMotion);
}

function normalizedEffectType(value) {
  return value === "weather-transition" ? "weather-transition" : "action-extension";
}

function normalizedWeatherPreset(value) {
  return Object.hasOwn(weatherPresets, value) ? value : "clouds";
}

function motionLabel(motion) {
  return t(effectLabels[normalizedEffectType(motion?.effectType)]);
}

function weatherLabel(preset) {
  return t(weatherPresets[normalizedWeatherPreset(preset)].label);
}

function weatherParticles(kind, count) {
  return Array.from({ length: count }, (_, index) => {
    const x = (index * 37 + 11) % 96;
    const delay = ((index * 19) % 23) / 10;
    const size = kind === "snow" ? 3 + (index % 4) : 1;
    return `<span style="--particle-x:${x}%;--particle-delay:-${delay}s;--particle-size:${size}px"></span>`;
  }).join("");
}

function demoEffectMarkup(photo, motion) {
  const src = escapeHtml(photo.src);
  if (normalizedEffectType(motion?.effectType) === "action-extension") {
    return `<div class="demo-subject-layer" aria-hidden="true"><img src="${src}" alt="" /></div>`;
  }

  const preset = normalizedWeatherPreset(motion?.weatherPreset);
  if (preset === "sunlight") {
    return `<div class="demo-weather weather-sunlight" aria-hidden="true"><span></span><span></span></div>`;
  }
  if (preset === "clouds") {
    return `<div class="demo-weather weather-clouds" aria-hidden="true"><span></span><span></span><span></span></div>`;
  }
  if (preset === "rain") {
    return `<div class="demo-weather weather-rain" aria-hidden="true">${weatherParticles("rain", 22)}</div>`;
  }
  return `<div class="demo-weather weather-snow" aria-hidden="true">${weatherParticles("snow", 18)}</div>`;
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function updateClock() {
  const value = i18n.formatTime(new Date());
  const clock = document.querySelector("#currentTime");
  clock.textContent = value;
  clock.dateTime = value;
}

function stageMedia(photo) {
  const motion = photo.motion;
  if (motion?.kind === "server" && motion.videoUrl) {
    const poster = motion.posterUrl || photo.src;
    return `
      <img class="stage-backdrop" src="${escapeHtml(poster)}" alt="" aria-hidden="true" />
      <video class="stage-video" src="${escapeHtml(motion.videoUrl)}" poster="${escapeHtml(poster)}" muted loop playsinline ${shouldPlayMotion(photo) ? "autoplay" : ""}></video>
    `;
  }
  return `
    <img class="stage-backdrop" src="${escapeHtml(photo.src)}" alt="" aria-hidden="true" />
    <img class="stage-main-image" src="${escapeHtml(photo.src)}" alt="${tx(photo.title)}" />
    ${motion?.kind === "demo" ? demoEffectMarkup(photo, motion) : ""}
  `;
}

function aiActionMarkup(photo) {
  const label = photo?.motion ? t("一鍵更新 AI 動態") : t("一鍵生成 AI 動態");
  const photoAttributes = photo
    ? ` data-action="beautify" data-photo-id="${escapeHtml(photo.id)}"`
    : " disabled";
  return `<button class="ai-button stage-ai-action" type="button"${photoAttributes} aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${icon("wand")}<span class="sr-only">${escapeHtml(label)}</span></button>`;
}

function renderStage() {
  const photo = currentPhoto();
  const enhancedCount = state.photos.filter((item) => item.motion).length;
  pageStatus.textContent = state.photos.length
    ? t("已同步 {photos} 張照片・{motion} 張 AI 動態", { photos: state.photos.length, motion: enhancedCount })
    : t("目前沒有照片");
  if (!photo) {
    photoStage.className = "photo-stage";
    photoStage.innerHTML = `
      <div class="empty-stage">
        ${icon("images")}
        <strong>${tx("相簿還是空的")}</strong>
        <p>${tx("從手機或這台裝置加入第一張照片。")}</p>
      </div>
      ${aiActionMarkup(null)}
    `;
    viewerToolbar.innerHTML = `
      <div class="toolbar-copy"><strong>${tx("尚未選擇照片")}</strong><span>${tx("請到設定加入照片")}</span></div>
    `;
    return;
  }

  const hasMotion = Boolean(photo.motion);
  const effectType = hasMotion ? normalizedEffectType(photo.motion.effectType) : "";
  const weatherPreset = effectType === "weather-transition" ? normalizedWeatherPreset(photo.motion.weatherPreset) : "";
  const motionClass = hasMotion ? ` is-motion is-${effectType}` : "";
  const demoClass = photo.motion?.kind === "demo" ? " is-demo-motion" : "";
  const weatherClass = weatherPreset ? ` is-weather-${weatherPreset}` : "";
  const isPlaying = shouldPlayMotion(photo);
  const playingClass = isPlaying ? " is-playing" : "";
  const fallbackClass = state.cinemaFallback ? " is-cinema-fallback" : "";
  photoStage.className = `photo-stage${motionClass}${demoClass}${weatherClass}${playingClass}${fallbackClass}`;
  photoStage.innerHTML = `
    ${stageMedia(photo)}
    <div class="stage-shade"></div>
    <div class="stage-caption">
      ${hasMotion ? `<span class="stage-ai-badge">${icon(effectType === "weather-transition" ? "weather-cloud" : "sparkles")}${escapeHtml(motionLabel(photo.motion))}・${escapeHtml(t("{n} 秒", { n: photo.motion.durationSeconds || 5 }))}</span>` : ""}
      <small>${tx(photo.capturedAt)}・${tx(photo.owner)}</small>
      <strong>${tx(photo.title)}</strong>
    </div>
    <div class="stage-controls">
      <button type="button" data-action="previous" aria-label="${tx("上一張照片")}">${icon("chevron-left")}</button>
      <button type="button" data-action="next" aria-label="${tx("下一張照片")}">${icon("chevron-right")}</button>
    </div>
    ${aiActionMarkup(photo)}
    ${hasMotion ? `<div class="stage-progress" aria-hidden="true"><span></span></div>` : ""}
  `;

  const motionStatus = hasMotion
    ? `${motionLabel(photo.motion)}・${t("同一張照片 {n} 秒", { n: photo.motion.durationSeconds || 5 })}${isPlaying ? t("自動播放中") : t("自動播放已關閉")}`
    : t("靜態照片・只會手動切換");
  viewerToolbar.innerHTML = `
    <div class="toolbar-copy"><strong>${state.photos.indexOf(photo) + 1} / ${state.photos.length}・${tx(photo.title)}</strong><span>${escapeHtml(motionStatus)}</span></div>
  `;

  window.requestAnimationFrame(() => {
    const video = photoStage.querySelector("video");
    if (!video) return;
    if (isPlaying) video.play().catch(() => {});
    else video.pause();
  });
}

function render() {
  renderStage();
  if (settingsDialog.open) renderSettingsDialog();
}

function renderSettingsDialog() {
  const photo = currentPhoto();
  const effectType = normalizedEffectType(state.settings.effectType);
  const weatherPreset = normalizedWeatherPreset(state.settings.weatherPreset);
  const isWeather = effectType === "weather-transition";
  const photoStatus = photo
    ? `${t(photo.title)}・${photo.motion ? t("{effect}已就緒", { effect: motionLabel(photo.motion) }) : t("尚未生成動態")}`
    : t("尚未加入照片");
  settingsDialogBody.innerHTML = `
    <div class="settings-content">
      <section class="settings-section">
        <div class="settings-section-heading"><div><strong>${tx("照片")}</strong><small>${escapeHtml(photoStatus)}</small></div><label class="settings-action" for="photoInput">${icon("upload")}${tx("加入照片")}</label></div>
      </section>
      <section class="settings-section">
        <div class="settings-section-heading"><div><strong>${tx("播放")}</strong><small>${tx(state.settings.autoPlayMotion ? "AI 動態自動播放" : "只顯示靜態照片")}</small></div><label class="settings-switch"><input id="autoPlayMotion" type="checkbox" ${state.settings.autoPlayMotion ? "checked" : ""} /><span aria-hidden="true"></span></label></div>
        <fieldset class="settings-fieldset">
          <legend>${tx("一鍵生成預設")}</legend>
          <div class="settings-segmented" role="radiogroup" aria-label="${tx("一鍵生成預設")}">
            <button type="button" role="radio" aria-checked="${!isWeather}" class="${!isWeather ? "is-selected" : ""}" data-settings-effect="action-extension">${icon("sparkles")}<span>${tx("動作延伸")}</span></button>
            <button type="button" role="radio" aria-checked="${isWeather}" class="${isWeather ? "is-selected" : ""}" data-settings-effect="weather-transition">${icon("weather-cloud")}<span>${tx("天氣變化")}</span></button>
          </div>
          ${isWeather ? `<div class="settings-weather" role="radiogroup" aria-label="${tx("天氣預設")}">${Object.entries(weatherPresets).map(([value, preset]) => `<button type="button" role="radio" aria-checked="${weatherPreset === value}" class="${weatherPreset === value ? "is-selected" : ""}" data-settings-weather="${value}">${icon(preset.icon)}<span>${tx(preset.label)}</span></button>`).join("")}</div>` : ""}
        </fieldset>
      </section>
      <section class="settings-section">
        <label class="settings-label" for="settingsDevice">${tx("顯示裝置")}</label>
        <select id="settingsDevice" class="settings-select">
          ${["餐桌日曆機", "客廳相框", "臥室螢幕"].map((device) => `<option value="${device}" ${state.settings.device === device ? "selected" : ""}>${tx(device)}</option>`).join("")}
        </select>
        <div class="settings-actions-grid">
          <button type="button" data-settings-action="fullscreen">${icon("maximize")}${tx("全螢幕")}</button>
          <button type="button" data-settings-action="send-photo">${icon("send")}${tx("顯示這張")}</button>
          <button type="button" data-settings-action="send-motion" ${photo?.motion ? "" : "disabled"}>${icon("monitor")}${tx("播放動態")}</button>
          <button type="button" class="is-danger" data-settings-action="remove" ${photo ? "" : "disabled"}>${icon("trash")}${tx("移除照片")}</button>
        </div>
        ${photo?.motion ? `<button type="button" class="settings-text-action" data-settings-action="restore-original">${tx("保留原圖並移除動態版本")}</button>` : ""}
      </section>
    </div>
  `;
}

function openSettingsDialog() {
  renderSettingsDialog();
  if (!settingsDialog.open) settingsDialog.showModal();
}

function closeSettingsDialog() {
  if (settingsDialog.open) settingsDialog.close();
}

function changePhoto(direction) {
  if (!state.photos.length) return;
  const currentIndex = Math.max(0, state.photos.findIndex((photo) => photo.id === state.selectedId));
  const nextIndex = (currentIndex + direction + state.photos.length) % state.photos.length;
  state.selectedId = state.photos[nextIndex].id;
  render();
}

function selectPhoto(id) {
  if (!state.photos.some((photo) => photo.id === id)) return;
  state.selectedId = id;
  render();
}

async function toggleFullscreen() {
  if (!currentPhoto()) return;
  if (document.fullscreenElement) {
    await document.exitFullscreen();
    return;
  }
  if (state.cinemaFallback) {
    state.cinemaFallback = false;
    renderStage();
    return;
  }
  if (photoStage.requestFullscreen) {
    try {
      await photoStage.requestFullscreen();
    } catch {
      state.cinemaFallback = true;
      renderStage();
    }
  } else {
    state.cinemaFallback = true;
    renderStage();
  }
}

function readPhotoFile(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast(t("請選擇照片檔案。"));
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showToast(t("照片需小於 20 MB。"));
    return;
  }

  const src = URL.createObjectURL(file);
  const title = file.name.replace(/\.[^.]+$/, "").trim().slice(0, 32) || t("新加入的照片");
  const photo = {
    id: `upload-${Date.now()}`,
    title,
    capturedAt: "剛剛",
    owner: "這台裝置",
    src,
    file,
    uploaded: true,
    motion: null,
  };
  state.photos.unshift(photo);
  state.selectedId = photo.id;
  render();
  showToast(t("已加入「{title}」，可選擇 AI 美化。", { title }));
}

function openAiDialog(photoId) {
  const photo = state.photos.find((item) => item.id === photoId);
  if (!photo) return;
  state.selectedId = photo.id;
  state.ai = {
    photoId: photo.id,
    phase: "processing",
    effectType: normalizedEffectType(state.settings.effectType),
    weatherPreset: normalizedWeatherPreset(state.settings.weatherPreset),
    progress: 0,
    currentStep: 0,
    result: null,
    error: "",
  };
  render();
  renderAiDialog();
  aiDialog.showModal();
  void startAiGeneration();
}

function closeAiDialog() {
  aiRun += 1;
  aiAbortController?.abort();
  aiAbortController = null;
  state.ai = null;
  if (aiDialog.open) aiDialog.close();
}

function aiPhoto() {
  return state.photos.find((photo) => photo.id === state.ai?.photoId) || null;
}

function demoPreviewMarkup(photo, result) {
  return `
    <div class="demo-preview-canvas">
      <img class="demo-preview-base" src="${escapeHtml(photo.src)}" alt="${escapeHtml(t("{title}動態預覽", { title: t(photo.title) }))}" />
      ${demoEffectMarkup(photo, result)}
    </div>
  `;
}

function renderAiDialog() {
  const photo = aiPhoto();
  if (!state.ai || !photo) return;

  if (state.ai.phase === "processing") {
    const isWeather = normalizedEffectType(state.ai.effectType) === "weather-transition";
    const phases = isWeather
      ? ["上傳照片", "分析場景光線", "生成天氣變化", "融合自然效果"]
      : ["上傳照片", "辨識人物物件", "延伸畫面動作", "調整自然動態"];
    aiDialogBody.innerHTML = `
      <div class="ai-processing" aria-busy="true">
        <div class="processing-visual"><img src="${escapeHtml(photo.src)}" alt="" /><span class="scan-line"></span></div>
        <div class="processing-copy">
          <div><h3>${tx(phases[state.ai.currentStep])}</h3><strong>${Math.round(state.ai.progress)}%</strong></div>
          <div class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(state.ai.progress)}"><span style="width:${state.ai.progress}%"></span></div>
          <ol class="phase-list">${phases.map((label, index) => `<li class="${index < state.ai.currentStep ? "is-done" : index === state.ai.currentStep ? "is-active" : ""}">${tx(label)}</li>`).join("")}</ol>
          <span class="processing-mode">${tx(window.PHOTO_AI_MOTION_ENDPOINT ? "家庭 AI 服務" : "本機示範模式")}</span>
        </div>
        <div class="dialog-actions"><button class="secondary-button" type="button" data-ai-action="close">${tx("取消處理")}</button></div>
      </div>
    `;
    return;
  }

  if (state.ai.phase === "complete") {
    const result = state.ai.result;
    const preview = result.kind === "server" && result.videoUrl
      ? `<video src="${escapeHtml(result.videoUrl)}" poster="${escapeHtml(result.posterUrl || photo.src)}" autoplay loop muted playsinline></video>`
      : demoPreviewMarkup(photo, result);
    const resultLabel = motionLabel(result);
    aiDialogBody.innerHTML = `
      <div class="ai-complete">
        <div class="ai-result-preview is-playing is-${normalizedEffectType(result.effectType)}">${preview}<span>${icon(result.effectType === "weather-transition" ? "weather-cloud" : "sparkles")}${escapeHtml(resultLabel)}・${escapeHtml(t("{n} 秒", { n: result.durationSeconds || 5 }))}</span>${result.kind === "demo" ? `<small>${tx("本機示範效果")}</small>` : ""}</div>
        <h3>${escapeHtml(t("{effect}已加入相框", { effect: resultLabel }))}</h3>
        <p>${tx("同一張照片會播放 5 秒畫面內動態，不會自動切換到下一張。")}</p>
        <div class="analysis-grid">
          <div><small>${tx("畫面主體")}</small><strong>${tx(result.analysis.subject)}</strong></div>
          <div><small>${tx("場景分析")}</small><strong>${tx(result.analysis.depth)}</strong></div>
          <div><small>${tx("動態方式")}</small><strong>${tx(result.analysis.motion)}</strong></div>
        </div>
        <div class="dialog-actions"><button class="primary-button" type="button" data-ai-action="done">${icon("check")}${tx("完成")}</button></div>
      </div>
    `;
    return;
  }

  aiDialogBody.innerHTML = `
    <div class="ai-error">
      <span class="error-mark">${icon("alert")}</span>
      <h3>${tx("這次沒有產生成功")}</h3>
      <p>${tx(state.ai.error || "家庭 AI 服務暫時無法使用，原圖沒有變更。")}</p>
      <div class="dialog-actions">
        <button class="secondary-button" type="button" data-ai-action="close">${tx("保留原圖")}</button>
        <button class="primary-button" type="button" data-ai-action="retry">${icon("rotate")}${tx("重新嘗試")}</button>
      </div>
    </div>
  `;
}

function wait(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

function updateAiProgress(run, progress, currentStep) {
  if (run !== aiRun || !state.ai) return false;
  state.ai.progress = progress;
  state.ai.currentStep = currentStep;
  renderAiDialog();
  return true;
}

async function photoBlob(photo, signal) {
  if (photo.file) return photo.file;
  const response = await fetch(photo.src, { signal });
  if (!response.ok) throw new Error(t("無法讀取這張照片，請重新上傳後再試。"));
  return response.blob();
}

function normalizedResult(payload, photo, options) {
  const result = payload.result || payload;
  const videoUrl = result.videoUrl || result.motionUrl || "";
  if (!videoUrl) throw new Error(t("服務已回應，但沒有提供動態影片。"));
  const effectType = normalizedEffectType(result.effectType || options.effectType);
  const weatherPreset = effectType === "weather-transition"
    ? normalizedWeatherPreset(result.weatherPreset || options.weatherPreset)
    : "";
  return {
    kind: "server",
    effectType,
    weatherPreset,
    durationSeconds: Number(result.durationSeconds) || 5,
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

async function runServerGeneration(photo, options, run, signal) {
  const endpoint = window.PHOTO_AI_MOTION_ENDPOINT;
  updateAiProgress(run, 12, 0);
  const blob = await photoBlob(photo, signal);
  const form = new FormData();
  form.append("photo", blob, photo.file?.name || `${photo.id}.png`);
  form.append("photoId", photo.id);
  form.append("durationSeconds", "5");
  form.append("effectType", options.effectType);
  if (options.effectType === "weather-transition") form.append("weatherPreset", options.weatherPreset);
  form.append("style", "natural");
  updateAiProgress(run, 26, 1);

  const response = await fetch(endpoint, {
    method: "POST",
    body: form,
    credentials: "include",
    signal,
  });
  if (!response.ok) throw new Error(t("家庭 AI 服務暫時無法使用（{status}）。", { status: response.status }));
  let payload = await response.json();

  if (!payload.videoUrl && !payload.motionUrl && !payload.result?.videoUrl && payload.statusUrl) {
    for (let attempt = 0; attempt < 36; attempt += 1) {
      updateAiProgress(run, Math.min(88, 38 + attempt * 1.5), attempt < 8 ? 1 : attempt < 20 ? 2 : 3);
      await wait(1500, signal);
      const statusResponse = await fetch(payload.statusUrl, { credentials: "include", signal });
      if (!statusResponse.ok) throw new Error(t("無法取得生成進度（{status}）。", { status: statusResponse.status }));
      payload = await statusResponse.json();
      if (payload.status === "failed") throw new Error(payload.message || t("服務無法完成這張照片。"));
      if (payload.status === "completed" || payload.videoUrl || payload.result?.videoUrl) break;
    }
  }

  updateAiProgress(run, 96, 3);
  return normalizedResult(payload, photo, options);
}

async function runDemoGeneration(photo, options, run, signal) {
  const phases = [
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
  return {
    kind: "demo",
    effectType: options.effectType,
    weatherPreset: options.effectType === "weather-transition" ? options.weatherPreset : "",
    durationSeconds: 5,
    videoUrl: "",
    posterUrl: photo.src,
    analysis: {
      subject: options.effectType === "weather-transition" ? "整體場景" : photo.id === "reunion" ? "6 位家人" : "家庭人物",
      depth: options.effectType === "weather-transition" ? "人物與背景分層" : "前後三層",
      motion: options.effectType === "weather-transition" ? weatherPresets[normalizedWeatherPreset(options.weatherPreset)].label : "人物自然微動",
    },
    generatedAt: "剛剛",
  };
}

async function startAiGeneration() {
  const photo = aiPhoto();
  if (!photo || !state.ai) return;
  const options = {
    effectType: normalizedEffectType(state.ai.effectType),
    weatherPreset: normalizedWeatherPreset(state.ai.weatherPreset),
  };
  aiAbortController?.abort();
  aiAbortController = new AbortController();
  const run = ++aiRun;
  state.ai.phase = "processing";
  state.ai.progress = 4;
  state.ai.currentStep = 0;
  state.ai.error = "";
  renderAiDialog();

  try {
    const result = window.PHOTO_AI_MOTION_ENDPOINT
      ? await runServerGeneration(photo, options, run, aiAbortController.signal)
      : await runDemoGeneration(photo, options, run, aiAbortController.signal);
    if (run !== aiRun || !state.ai) return;
    photo.motion = result;
    state.ai.result = result;
    state.ai.phase = "complete";
    render();
    renderAiDialog();
  } catch (error) {
    if (error?.name === "AbortError" || run !== aiRun || !state.ai) return;
    state.ai.phase = "error";
    state.ai.error = error instanceof Error ? error.message : t("家庭 AI 服務暫時無法使用，原圖沒有變更。");
    renderAiDialog();
  } finally {
    if (run === aiRun) aiAbortController = null;
  }
}

function removeSelectedPhoto() {
  const photo = currentPhoto();
  if (!photo) return;
  const index = state.photos.indexOf(photo);
  if (photo.uploaded) URL.revokeObjectURL(photo.src);
  state.photos.splice(index, 1);
  state.selectedId = state.photos[Math.min(index, state.photos.length - 1)]?.id || "";
  render();
  showToast(t("已移除「{title}」。", { title: t(photo.title) }));
}

function selectedDevice() {
  return t(state.settings.device || "餐桌日曆機");
}

document.addEventListener("click", (event) => {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    const destination = navButton.dataset.nav;
    if (destination === "相框") return;
    if (destination === "食譜") window.location.href = "../make/index.html";
    else if (destination === "行事曆") window.location.href = "../calendar/index.html";
    else if (destination === "設定") openSettingsDialog();
    else showToast(t("{page}功能保持原入口，本頁聚焦家庭相框。", { page: t(destination) }));
    return;
  }

  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  if (action === "select-photo") selectPhoto(button.dataset.photoId);
  if (action === "previous") changePhoto(-1);
  if (action === "next") changePhoto(1);
  if (action === "beautify") openAiDialog(button.dataset.photoId);
});

aiDialog.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ai-action]");
  if (!button) return;
  const action = button.dataset.aiAction;
  if (action === "close" || action === "done") closeAiDialog();
  if (action === "start" || action === "retry") void startAiGeneration();
});

aiDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeAiDialog();
});

settingsDialog.addEventListener("click", (event) => {
  const effectButton = event.target.closest("[data-settings-effect]");
  if (effectButton) {
    state.settings.effectType = normalizedEffectType(effectButton.dataset.settingsEffect);
    renderSettingsDialog();
    return;
  }

  const weatherButton = event.target.closest("[data-settings-weather]");
  if (weatherButton) {
    state.settings.weatherPreset = normalizedWeatherPreset(weatherButton.dataset.settingsWeather);
    renderSettingsDialog();
    return;
  }

  const button = event.target.closest("[data-settings-action]");
  if (!button) return;
  const action = button.dataset.settingsAction;
  if (action === "close") closeSettingsDialog();
  if (action === "fullscreen") {
    closeSettingsDialog();
    void toggleFullscreen();
  }
  if (action === "remove" && currentPhoto()) {
    closeSettingsDialog();
    removeDialog.showModal();
  }
  if (action === "send-photo") showToast(t("已通知{device}顯示「{title}」。", { device: selectedDevice(), title: t(currentPhoto()?.title) }));
  if (action === "send-motion" && currentPhoto()?.motion) showToast(t("已通知{device}播放「{title}」的 5 秒動態。", { device: selectedDevice(), title: t(currentPhoto().title) }));
  if (action === "restore-original") {
    const photo = currentPhoto();
    if (!photo?.motion) return;
    photo.motion = null;
    render();
    renderSettingsDialog();
    showToast(t("已回復原圖；原始照片沒有變更。"));
  }
});

settingsDialog.addEventListener("change", (event) => {
  if (event.target.matches("#autoPlayMotion")) {
    state.settings.autoPlayMotion = event.target.checked;
    render();
    renderSettingsDialog();
  }
  if (event.target.matches("#settingsDevice")) {
    state.settings.device = event.target.value;
  }
});

removeDialog.addEventListener("close", () => {
  if (removeDialog.returnValue === "confirm") removeSelectedPhoto();
});

photoInput.addEventListener("change", () => {
  readPhotoFile(photoInput.files?.[0]);
  photoInput.value = "";
});

document.querySelector("#headerSync").addEventListener("click", (event) => {
  const button = event.currentTarget;
  button.classList.add("is-syncing");
  button.querySelector("span").textContent = t("正在同步");
  window.setTimeout(() => {
    button.classList.remove("is-syncing");
    button.querySelector("span").textContent = t("雲端連線正常");
    showToast(t("照片已同步・剛剛"));
  }, 850);
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && state.cinemaFallback) state.cinemaFallback = false;
});

document.addEventListener("keydown", (event) => {
  if (event.target.matches("input, select, textarea, [contenteditable]")) return;
  if (aiDialog.open || removeDialog.open) return;
  if (event.key === "ArrowLeft") changePhoto(-1);
  if (event.key === "ArrowRight") changePhoto(1);
  if (event.key === "Escape" && state.cinemaFallback) {
    state.cinemaFallback = false;
    renderStage();
  }
});

window.addEventListener("beforeunload", () => {
  state.photos.filter((photo) => photo.uploaded).forEach((photo) => URL.revokeObjectURL(photo.src));
});

updateClock();
window.setInterval(updateClock, 30000);
render();
