(() => {
  "use strict";

  if (window.parent === window || new URLSearchParams(window.location.search).get("device") !== "1") return;

  const i18n = window.LuckyI18n;
  const t = i18n.t;
  const page = window.location.pathname.includes("/photo-frame/") ? "photo-frame" : "recipe";
  const root = document.documentElement;
  root.classList.add("device-embedded", "device-inactive");
  root.dataset.devicePage = page;
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "../device/embed.css";
  document.head.append(stylesheet);
  const luckyStylesheet = document.createElement("link");
  luckyStylesheet.rel = "stylesheet";
  luckyStylesheet.href = "../device/lucky-embed.css?v=i18n-1";
  document.head.append(luckyStylesheet);
  const luckyScript = document.createElement("script");
  luckyScript.src = "../device/lucky-embed.js";
  document.head.append(luckyScript);
  const reviewScript = document.createElement("script");
  reviewScript.src = "../device/review-mode.js";
  document.head.append(reviewScript);

  const navigation = {
    "首頁": "home", "食譜": "make", "做菜": "make", "健康": "health", "行事曆": "calendar",
    "家庭": "family", "相框": "photo-frame", "設定": "settings", "個人帳號": "family",
  };
  let active = false;
  let snapshotTimer = 0;
  let lastSnapshot = "";
  let lastDinnerContext = "";
  let suspendedTimer = false;
  let recipeMembers = [];
  const dietDialog = page === "recipe" ? document.createElement("dialog") : null;
  if (dietDialog) {
    dietDialog.className = "device-diet-dialog";
    dietDialog.setAttribute("aria-labelledby", "deviceDietTitle");
    document.body.append(dietDialog);
  }

  if (page === "photo-frame") {
    // This iframe is a session-only prototype. Never read or write the standalone page's
    // stored service configuration, and never send prototype photos to a real endpoint.
    window.PHOTO_AI_MOTION_ENDPOINT = "";
  }

  if (page === "recipe") {
    const originalMemberButtons = renderMemberButtons;
    window.renderMemberButtons = () => recipeMembers.length
      ? recipeMembers.map((member) => {
          const selected = state.conditions.members.includes(member.key);
          const initial = /^[a-z]/i.test(member.name) ? member.name[0].toUpperCase() : member.name.slice(-1);
          return `<button type="button" class="${selected ? "is-selected" : ""}" data-action="toggle-member" data-value="${member.key}" aria-pressed="${selected}"><i>${escapeHtml(initial)}</i>${escapeHtml(member.name)}${selected ? icon("check") : ""}</button>`;
        }).join("")
      : originalMemberButtons();
  }

  function dinnerNames() {
    return state.conditions.members.map((key) => recipeMembers.find((member) => member.key === key)?.name || t(key));
  }

  function send(type, payload = {}) {
    // file:// previews have an opaque origin, so the receiver authenticates the window source.
    window.parent.postMessage({ channel: "lumiq-device", type, page, ...payload }, "*");
  }

  function updateText(selector, value) {
    const element = document.querySelector(selector);
    if (element && element.textContent !== value) element.textContent = value;
  }

  function renderDietInformation() {
    updateText(".hub-heading p", t("從現有食材開始，或選一道想吃的菜。"));
    updateText("#mealContextTitle", t("今晚用餐"));
    updateText(".condition-summary > p:not(.eyebrow)", t("菜系、時間和口味會影響排序。家庭飲食資訊仍需人工核對。"));
    updateText(".conditions-layout .flow-footer-copy strong", t("本餐條件已選擇"));
    updateText(".conditions-layout .flow-footer-copy span", t("過敏與忌口待人工核對"));
    updateText(".conditions-layout .step-intro > p:last-child", t("選擇這一餐的成員、菜系、時間與口味。"));
    updateText(".catalog-toolbar .safety-badge", t("過敏與忌口待核對"));
    updateText(".detail-top .safety-badge", t("過敏與忌口待核對"));
    updateText(".fortune-page .page-heading > div > p:last-child", t("主題調整推薦方向，過敏與忌口請另行核對。"));
    const anchor = appMain.querySelector(".context-rules, .condition-summary .safety-row, .catalog-toolbar, .results-toolbar, .detail-top, .fortune-page .page-heading-actions");
    if (!anchor) return;
    if (!anchor.querySelector("[data-device-diet]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "device-diet-button";
      button.dataset.deviceDiet = "";
      button.dataset.deviceAction = "open-diet";
      button.innerHTML = `${icon("users")}${escapeHtml(t("飲食資料"))}<span>${escapeHtml(t("待核對"))}</span>`;
      if (anchor.classList.contains("context-rules") || anchor.classList.contains("safety-row")) anchor.replaceChildren(button);
      else anchor.append(button);
    }
    const members = recipeMembers.filter((member) => state.conditions.members.includes(member.key));
    const signature = JSON.stringify([i18n.locale, members]);
    if (dietDialog.dataset.signature === signature) return;
    dietDialog.dataset.signature = signature;
    dietDialog.innerHTML = `<header class="dialog-heading"><h2 id="deviceDietTitle">${escapeHtml(t("本餐飲食資料"))}</h2><button type="button" class="icon-button" data-device-action="close-diet" aria-label="${escapeHtml(t("關閉飲食資料"))}">${icon("x")}</button></header>
      <p class="device-diet-notice">${escapeHtml(t("過敏與忌口尚未自動排除，請核對食材。"))}</p>
      <dl>${members.length ? members.map((member) => `<div><dt>${escapeHtml(member.name)}</dt><dd><strong>${escapeHtml(t("過敏與忌口"))}</strong>${escapeHtml(member.allergy ? t(member.allergy) : t("尚未填寫"))}</dd><dd><strong>${escapeHtml(t("飲食偏好"))}</strong>${escapeHtml(member.preference ? t(member.preference) : t("尚未填寫"))}</dd></div>`).join("") : `<div>${escapeHtml(t("尚未選擇用餐成員"))}</div>`}</dl><footer><button type="button" class="primary-button" data-device-action="close-diet">${escapeHtml(t("完成核對"))}</button></footer>`;
  }

  function decorateRecipe() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("device") !== "1") {
      url.searchParams.set("device", "1");
      window.history.replaceState(null, "", url);
    }
    const diners = dinnerNames();
    updateText(".context-intro small", diners.length || state.conditions.guests
      ? t("{names}一起吃", { names: `${i18n.list(diners)}${state.conditions.guests ? t("・朋友 {n} 位", { n: state.conditions.guests }) : ""}` })
      : t("尚未選擇用餐成員"));
    document.querySelectorAll(".condition-summary .chip-row .chip").forEach((chip) => {
      const member = recipeMembers.find((item) => item.key === chip.textContent);
      if (member) chip.textContent = member.name;
    });
    renderDietInformation();
    if (state.acquisitionMode !== "manual") {
      updateText("#scanTitle", t("正在演示食材分析…"));
      updateText(".recognition-figure figcaption strong", t("示例辨識結果"));
      updateText(".recognition-figure .status-badge", t("示例資料・請核對"));
    }
    updateText(".capture-actions .sync-callout", t("照片輸入・本機演示"));
    if (phoneUploadDialog.open) {
      clearPhoneUploadTimers();
      updateText(".phone-upload-session span", t("手機上傳流程演示"));
      updateText(".phone-upload-copy p", t("尚未連接手機服務"));
      let button = phoneUploadDialog.querySelector("[data-device-action='simulate-phone']");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "primary-button device-demo-upload";
        button.dataset.deviceAction = "simulate-phone";
        phoneUploadDialog.querySelector("footer").append(button);
      }
      if (button.textContent !== t("模擬手機上傳")) button.textContent = t("模擬手機上傳");
    }
  }

  function decoratePhoto() {
    const photo = currentPhoto();
    let label = photoStage.querySelector(".device-demo-label");
    if (photo?.motion?.kind === "demo") {
      if (!label) {
        label = document.createElement("span");
        label.className = "device-demo-label";
        photoStage.append(label);
      }
      if (label.textContent !== t("效果演示")) label.textContent = t("效果演示");
    } else if (label) label.remove();
    if (!active) document.querySelectorAll("video").forEach((video) => video.pause());
  }

  function snapshot(force = false) {
    if (page === "recipe") decorateRecipe();
    else decoratePhoto();
    const photo = page === "photo-frame" ? currentPhoto() : null;
    const payload = page === "recipe"
      ? {
          cartItems: state.shoppingCart.map((item) => ({ ...item, quantity: item.amount, sourceRecipeIds: [...item.sourceRecipeIds] })),
          screen: state.screen,
          step: state.step,
          servings: state.servings,
          dinnerNames: dinnerNames(),
          dinnerMembers: lastDinnerContext ? state.conditions.members.map((key) => recipeMembers.find((member) => member.key === key)?.id).filter(Boolean) : undefined,
          inventoryCount: state.inventory.length,
        }
      : {
          photo: photo ? { id: photo.id, title: photo.title, src: new URL(photo.src, document.baseURI).href, motion: Boolean(photo.motion), motionKind: photo.motion?.kind || "" } : null,
          photoCount: state.photos.length,
          motionCount: state.photos.filter((item) => item.motion).length,
          settings: {
            autoPlayMotion: state.settings.autoPlayMotion,
            effectType: state.settings.effectType,
            weatherPreset: state.settings.weatherPreset,
            device: state.settings.device,
          },
        };
    const signature = JSON.stringify(payload);
    if (force || signature !== lastSnapshot) {
      lastSnapshot = signature;
      send("snapshot", payload);
    }
  }

  function scheduleSnapshot() {
    window.clearTimeout(snapshotTimer);
    snapshotTimer = window.setTimeout(snapshot, 60);
  }

  function applyLocale(context) {
    const code = context.locale || context.settings?.language;
    if (!code || !i18n.setLocale(code)) return;
    render();
    if (page === "recipe") {
      if (inventoryDialog.open) renderInventory();
      if (cartDialog.open) renderCart();
      if (filterDialog.open) renderFilterOptions();
      if (sourceDialog.open) renderSourceInfo();
      if (phoneUploadDialog.open) renderPhoneUploadStatus();
      updateClock();
    } else {
      updateClock();
      if (state.ai) renderAiDialog();
    }
  }

  function applyContext(context) {
    applyLocale(context);
    if (page === "photo-frame" && context.settings) {
      const incoming = context.settings;
      const effects = { motion: "action-extension", weather: "weather-transition" };
      const weather = { sunny: "sunlight", cloudy: "clouds", rainy: "rain", snowy: "snow" };
      let changed = false;
      for (const [key, value] of Object.entries({
        autoPlayMotion: typeof incoming.autoPlayMotion === "boolean" ? incoming.autoPlayMotion : state.settings.autoPlayMotion,
        effectType: normalizedEffectType(effects[incoming.effectType] || incoming.effectType || state.settings.effectType),
        weatherPreset: normalizedWeatherPreset(weather[incoming.weatherPreset] || incoming.weatherPreset || state.settings.weatherPreset),
      })) {
        if (state.settings[key] !== value) {
          state.settings[key] = value;
          changed = true;
        }
      }
      if (changed) render();
    }
    if (page !== "recipe" || !Array.isArray(context.members) || !Array.isArray(context.dinnerMembers)) return;
    const signature = JSON.stringify([context.members.map((member) => [member?.id, member?.name, member?.allergy, member?.preference]), context.dinnerMembers]);
    if (signature === lastDinnerContext) return;
    lastDinnerContext = signature;
    // The legacy condition summary interpolates members directly into HTML. Safe internal keys
    // keep its state model intact while display names are escaped or assigned as text.
    recipeMembers = context.members.filter((member) => member && typeof member.id === "string" && typeof member.name === "string")
      .map((member, index) => ({ id: member.id, name: member.name, allergy: String(member.allergy || ""), preference: String(member.preference || ""), key: `device-member-${index}` }));
    state.conditions.members = recipeMembers.filter((member) => context.dinnerMembers.includes(member.id)).map((member) => member.key);
    if (state.screen !== "cooking" && state.screen !== "detail") state.servings = dinnerPartySize();
    render();
  }

  function activate(params = {}, context = {}) {
    const wasInactive = !active;
    active = true;
    root.classList.remove("device-inactive");
    applyContext(context);
    if (page === "recipe") {
      if (["hub", "catalog", "fortune"].includes(params.screen) && params.screen !== state.screen) goToScreen(params.screen);
      if (params.filter === "healthy") {
        state.catalogCategory = "清爽低脂";
        state.catalogSearch = "";
        state.catalogOffset = 0;
        if (state.screen !== "catalog") goToScreen("catalog");
        else render();
      }
      if (params.action === "inventory") {
        renderInventory();
        if (!inventoryDialog.open) inventoryDialog.showModal();
      }
      if (params.action === "cart") {
        renderCart();
        if (!cartDialog.open) cartDialog.showModal();
      }
      if (params.action === "phone-upload") {
        if (!phoneUploadDialog.open) openPhoneUpload();
        clearPhoneUploadTimers();
      }
      if (wasInactive && suspendedTimer && state.screen === "cooking") {
        state.timerRunning = true;
        state.timerDeadline = 0;
        startTimerInterval();
      }
      suspendedTimer = false;
      if (state.screen === "cooking" && state.keepAwake) void syncWakeLock();
    } else {
      if (params.photoId) selectPhoto(params.photoId);
      if (params.action === "settings" || params.action === "upload") openSettingsDialog();
      if (params.action === "upload") settingsDialog.querySelector("label[for='photoInput']")?.scrollIntoView({ block: "nearest" });
      if (params.action === "fullscreen") {
        closeSettingsDialog();
        void toggleFullscreen();
      }
      if (state.settings.autoPlayMotion) {
        document.querySelectorAll("video").forEach((video) => video.play().catch(() => {}));
      }
    }
    snapshot(true);
  }

  function deactivate() {
    if (!active) return;
    active = false;
    root.classList.add("device-inactive");
    if (page === "recipe") {
      cancelPhoneUpload();
      if (state.scanning) {
        cancelRecognition();
        state.step = 1;
        render();
      }
      stopVoiceGuide();
      void releaseWakeLock();
      suspendedTimer = state.timerRunning;
      if (state.timerRunning) {
        state.timerRemaining = Math.max(0, Math.ceil((state.timerDeadline - Date.now()) / 1000));
        state.timerRunning = false;
        state.timerDeadline = 0;
        window.clearInterval(timerInterval);
        timerInterval = 0;
      }
    } else {
      closeAiDialog();
      document.querySelectorAll("video").forEach((video) => video.pause());
      state.cinemaFallback = false;
      photoStage.classList.remove("is-cinema-fallback");
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    }
    document.querySelectorAll("dialog[open]").forEach((dialog) => dialog.close("cancel"));
    snapshot();
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.data?.channel !== "lumiq-device") return;
    if (event.data.page && event.data.page !== page) return;
    if (event.data.type === "activate") activate(event.data.params || {}, event.data.context || {});
    if (event.data.type === "deactivate") deactivate();
    if (event.data.type === "snapshot-request") snapshot(true);
    if (event.data.type === "context") {
      applyContext(event.data.context || {});
      snapshot(true);
    }
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button, [data-nav]");
    if (!button) return;
    if (page === "recipe" && ["open-diet", "close-diet"].includes(button.dataset.deviceAction)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (button.dataset.deviceAction === "open-diet") dietDialog.showModal();
      else dietDialog.close();
      return;
    }
    if (button.dataset.nav && navigation[button.dataset.nav]) {
      event.preventDefault();
      event.stopImmediatePropagation();
      send("navigate", { page: navigation[button.dataset.nav], params: button.dataset.nav === "設定" && page === "photo-frame" ? { section: "frame" } : {} });
      return;
    }
    if (page === "recipe" && button.dataset.action === "start-fridge-flow") {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!phoneUploadDialog.open) openPhoneUpload();
      clearPhoneUploadTimers();
      snapshot();
      return;
    }
    if (page === "recipe" && button.dataset.deviceAction === "simulate-phone") {
      event.preventDefault();
      event.stopImmediatePropagation();
      cancelPhoneUpload();
      state.uploadedPhoto = "";
      startRecognition("demo");
      snapshot();
      return;
    }
    if (page === "recipe" && ["open-detail", "view-selected-detail"].includes(button.dataset.action)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const servings = state.servings || dinnerPartySize();
      openDetail(button.dataset.id || state.selectedRecipeId, button.dataset.action === "view-selected-detail" ? "results" : state.screen);
      state.servings = servings;
      render();
      snapshot();
      return;
    }
    if (page === "recipe" && button.dataset.action === "start-cooking") {
      window.setTimeout(() => {
        if (state.screen !== "cooking") return;
        const recipe = selectedRecipe();
        send("meal", { recipeTitle: recipe.title, recipeId: recipe.id, servings: state.servings });
      }, 0);
    }
    queueMicrotask(scheduleSnapshot);
  }, true);

  for (const type of ["change", "submit"]) document.addEventListener(type, () => queueMicrotask(scheduleSnapshot), true);
  const observer = new MutationObserver(scheduleSnapshot);
  const observed = page === "recipe"
    ? [appMain, cartDialog, inventoryDialog, phoneUploadDialog]
    : [photoStage, viewerToolbar, aiDialogBody, settingsDialogBody];
  observed.forEach((element) => observer.observe(element, { childList: true, subtree: true }));
  window.addEventListener("beforeunload", () => observer.disconnect());
  if (page === "photo-frame") document.querySelectorAll("video").forEach((video) => video.pause());
  luckyScript.addEventListener("load", () => {
    snapshot(true);
    send("ready", { storageScope: "page-session", serviceMode: "demo" });
  });
  luckyScript.addEventListener("error", () => {
    snapshot(true);
    send("ready", { storageScope: "page-session", serviceMode: "demo" });
  });
})();
