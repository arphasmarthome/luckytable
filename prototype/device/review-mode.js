/* Review-only hit targets live in the top document; module state stays in its iframe. */
(() => {
  "use strict";
  // Temporarily disabled for sharing. Set true to restore the switch and iframe reporters.
  const reviewEnabled = false;
  if (!reviewEnabled) {
    document.body.dataset.reviewMode = "interact";
    if (window.parent === window) {
      const url = new URL(location.href);
      if (url.searchParams.has("review")) {
        url.searchParams.delete("review");
        window.history.replaceState(window.history.state, "", url);
      }
    }
    return;
  }

  const channel = "lumiq-review";
  const controls = 'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="button"], label';
  const candidates = `${controls}, img, h1, h2, h3`;
  const reviewUI = ".review-layer, #reviewModeControl";

  function contentAt(x, y) {
    return document.elementsFromPoint(x, y).find(element => !element.closest(reviewUI));
  }

  function sourceSelector(element) {
    const parts = [];
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      if (node.id) { parts.unshift(`#${CSS.escape(node.id)}`); break; }
      const siblings = [...node.parentElement.children].filter(item => item.tagName === node.tagName);
      parts.unshift(`${node.localName}${siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : ""}`);
    }
    return parts.join(" > ");
  }

  function targetName(element) {
    const labelledBy = (element.getAttribute("aria-labelledby") || "").split(/\s+/)
      .map(id => document.getElementById(id)?.textContent || "").join(" ").trim();
    return (element.getAttribute("aria-label") || labelledBy || element.getAttribute("alt") ||
      element.innerText || element.getAttribute("title") || [...(element.labels || [])].map(label => label.innerText).join(" ") ||
      element.getAttribute("placeholder") || element.getAttribute("name") || element.id || element.localName)
      .replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function visibleRect(element) {
    if (!element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return null;
    const rect = element.getBoundingClientRect();
    let left = Math.max(0, rect.left), top = Math.max(0, rect.top);
    let right = Math.min(innerWidth, rect.right), bottom = Math.min(innerHeight, rect.bottom);
    for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) {
      const style = getComputedStyle(node), bounds = node.getBoundingClientRect();
      if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) { left = Math.max(left, bounds.left); right = Math.min(right, bounds.right); }
      if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) { top = Math.max(top, bounds.top); bottom = Math.min(bottom, bounds.bottom); }
    }
    if (right - left < 2 || bottom - top < 2) return null;
    const points = [[.5, .5], [.2, .2], [.8, .2], [.2, .8], [.8, .8]];
    const exposed = points.some(([x, y]) => {
      const hit = contentAt(left + (right - left) * x, top + (bottom - top) * y);
      return hit && (hit === element || element.contains(hit));
    });
    return exposed ? { x: left, y: top, width: right - left, height: bottom - top } : null;
  }

  function collectTargets(scope) {
    return [...scope.querySelectorAll(candidates)].flatMap(element => {
      if (element.closest(reviewUI) || element.parentElement.closest('button, a[href], summary, [role="button"]')) return [];
      const rect = visibleRect(element);
      if (!rect) return [];
      return [{ selector: sourceSelector(element), name: targetName(element), rect,
        kind: element.matches(controls) ? "control" : element.localName === "img" ? "image" : "heading",
        action: element.dataset.luckyAction || element.dataset.deviceAction || element.dataset.action || element.id || element.localName,
        disabled: element.matches(":disabled") || element.getAttribute("aria-disabled") === "true" }];
    });
  }

  function scrollAt(data) {
    if (![data.x, data.y, data.dx, data.dy].every(Number.isFinite)) return;
    let node = contentAt(data.x, data.y);
    while (node) {
      const style = getComputedStyle(node);
      const vertical = data.dy && /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
      const horizontal = data.dx && /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth;
      if (vertical || horizontal) {
        const previousX = node.scrollLeft, previousY = node.scrollTop;
        node.scrollBy({ left: horizontal ? data.dx : 0, top: vertical ? data.dy : 0, behavior: "instant" });
        if (node.scrollLeft !== previousX || node.scrollTop !== previousY) break;
      }
      node = node.parentElement;
    }
  }

  function installReporter() {
    const page = document.documentElement.dataset.devicePage;
    let enabled = false, generation = 0, timer = 0, lastSnapshot = "";
    const send = (type, payload = {}) => window.parent.postMessage({ channel, type, page, ...payload }, "*");
    function snapshot() {
      timer = 0;
      if (!enabled) return;
      const modal = [...document.querySelectorAll("dialog:modal")].at(-1);
      const scope = modal || document.querySelector("#appMain");
      if (!scope) return;
      const screen = modal?.id || modal?.className || scope.firstElementChild?.className || page;
      const targets = collectTargets(scope);
      const serialized = JSON.stringify({ screen, targets });
      if (serialized === lastSnapshot) return;
      lastSnapshot = serialized;
      send("targets", { generation, screen, targets });
    }
    function schedule() {
      if (enabled && !timer) timer = window.setTimeout(snapshot, 60);
    }
    window.addEventListener("message", event => {
      const data = event.data;
      if (event.source !== window.parent || data?.channel !== channel || data.page !== page) return;
      if (data.type === "mode") {
        enabled = data.enabled === true;
        generation = data.generation;
        lastSnapshot = "";
        window.clearTimeout(timer);
        timer = 0;
        schedule();
      }
      if (enabled && data.generation === generation && data.type === "scroll") { scrollAt(data); schedule(); }
    });
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ["open", "hidden", "class", "style", "disabled", "aria-disabled", "aria-label", "checked", "value"] });
    for (const type of ["scroll", "load", "toggle"]) document.addEventListener(type, schedule, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("pagehide", () => { observer.disconnect(); window.clearTimeout(timer); });
    send("ready");
  }

  function installController() {
    const layer = document.getElementById("reviewLayer");
    const control = document.getElementById("reviewModeControl");
    if (!layer || !control) return;
    const slot = document.getElementById("reviewModeSlot");
    slot.hidden = false;
    control.hidden = false;
    const dialog = document.getElementById("appDialog");
    const main = document.getElementById("appMain");
    const frames = { make: document.getElementById("makeFrame"), "photo-frame": document.getElementById("photoFrame") };
    let mode = new URL(location.href).searchParams.get("review") === "1" ? "comment" : "interact";
    let activePage = "", generation = 0, localTimer = 0;
    const focusState = new Map();
    const send = (page, type, payload = {}) => frames[page].contentWindow?.postMessage({ channel, type, page, generation, ...payload }, "*");
    control.querySelectorAll("[data-review-icon]").forEach(container => {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("fill", "none");
      svg.setAttribute("stroke", "currentColor");
      svg.setAttribute("stroke-width", "1.8");
      svg.setAttribute("stroke-linecap", "round");
      svg.setAttribute("stroke-linejoin", "round");
      svg.setAttribute("aria-hidden", "true");
      (window.lucide?.[container.dataset.reviewIcon] || []).forEach(([tag, attributes]) => {
        const node = document.createElementNS(svg.namespaceURI, tag);
        Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
        svg.append(node);
      });
      container.append(svg);
    });
    function placeControls() {
      const host = dialog.open ? dialog.querySelector(".dialog-header") : slot;
      if (host && !host.contains(control)) host.insertBefore(control, host.querySelector("[data-close-dialog]"));
      const layerHost = dialog.open ? dialog : main;
      if (layer.parentElement !== layerHost) layerHost.append(layer);
    }
    function syncFocus(scope) {
      for (const [element, value] of focusState) {
        if (mode === "comment" && scope?.contains(element)) continue;
        if (value === null) element.removeAttribute("tabindex");
        else element.setAttribute("tabindex", value);
        focusState.delete(element);
      }
      if (mode !== "comment" || !scope) return;
      scope.querySelectorAll(`${controls}, [tabindex]`).forEach(element => {
        if (element.closest(reviewUI) || focusState.has(element)) return;
        focusState.set(element, element.getAttribute("tabindex"));
        element.tabIndex = -1;
      });
    }
    function localSnapshot() {
      localTimer = 0;
      if (mode !== "comment" || activePage) return;
      placeControls();
      const scope = dialog.open ? dialog : document.getElementById("localView");
      const bounds = layer.getBoundingClientRect(), scale = bounds.width / layer.clientWidth;
      if (!scale) return;
      const targets = collectTargets(scope).map(target => ({ ...target, rect: {
        x: (target.rect.x - bounds.left) / scale, y: (target.rect.y - bounds.top) / scale,
        width: target.rect.width / scale, height: target.rect.height / scale,
      } }));
      applyTargets("device", `${document.body.dataset.page}:${dialog.open ? "dialog" : "page"}`, targets);
      syncFocus(scope);
    }
    function scheduleLocal() {
      if (mode === "comment" && !activePage && !localTimer) localTimer = window.setTimeout(localSnapshot, 60);
    }
    function update() {
      placeControls();
      activePage = dialog.open ? "" : Object.keys(frames).find(page => !frames[page].hidden) || "";
      generation += 1;
      layer.replaceChildren();
      layer.hidden = mode !== "comment";
      layer.dataset.page = activePage || "device";
      document.body.dataset.reviewMode = mode;
      control.querySelectorAll("button").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.reviewMode === mode)));
      for (const [page, frame] of Object.entries(frames)) {
        frame.inert = mode === "comment";
        send(page, "mode", { enabled: mode === "comment" && page === activePage });
      }
      syncFocus(mode === "comment" && !activePage ? dialog.open ? dialog : document.getElementById("localView") : null);
      scheduleLocal();
    }
    function setMode(next) {
      mode = next;
      const url = new URL(location.href);
      if (mode === "comment") url.searchParams.set("review", "1");
      else url.searchParams.delete("review");
      window.history.replaceState({}, "", url);
      update();
    }
    function targetId(page, screen, selector, action) {
      let hash = 2166136261;
      for (const char of `${screen}|${selector}`) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      return `review-${page}-${action.replace(/[^a-z0-9-]/gi, "-")}-${(hash >>> 0).toString(36)}`;
    }
    function applyTargets(page, screen, targets) {
      const retained = new Set();
      for (const target of targets.slice(0, 600)) {
        if (!target.rect || ![target.rect.x, target.rect.y, target.rect.width, target.rect.height].every(Number.isFinite) || typeof target.selector !== "string") continue;
        const id = targetId(page, String(screen), target.selector, String(target.action || "control"));
        let button = document.getElementById(id);
        if (!button || button.parentElement !== layer) {
          button = document.createElement("button");
          button.type = "button";
          button.id = id;
          button.className = "review-target";
          button.tabIndex = -1;
          layer.append(button);
        }
        const name = String(target.name || target.action || "control");
        if (button.textContent !== name) button.textContent = name;
        button.setAttribute("aria-label", name);
        button.title = name;
        button.dataset.sourcePage = page;
        button.dataset.sourceScreen = String(screen);
        button.dataset.sourceSelector = target.selector;
        button.dataset.sourceAction = String(target.action);
        button.dataset.sourceDisabled = String(target.disabled === true);
        Object.assign(button.style, { left: `${target.rect.x}px`, top: `${target.rect.y}px`, width: `${target.rect.width}px`, height: `${target.rect.height}px`, zIndex: target.kind === "control" ? "3" : target.kind === "heading" ? "2" : "1" });
        retained.add(id);
      }
      for (const button of [...layer.children]) if (!retained.has(button.id)) button.remove();
    }
    window.addEventListener("message", event => {
      const data = event.data;
      const page = Object.keys(frames).find(key => frames[key].contentWindow === event.source);
      if (!page || data?.channel !== channel || data.page !== page) return;
      if (data.type === "ready") { send(page, "mode", { enabled: mode === "comment" && page === activePage }); return; }
      if (data.type !== "targets" || mode !== "comment" || page !== activePage || data.generation !== generation || !Array.isArray(data.targets)) return;
      applyTargets(page, data.screen, data.targets);
    });
    // Targets carry metadata only, so clicks can reach the browser's annotation listeners without triggering actions.
    control.addEventListener("click", event => {
      const toggle = event.target.closest("button[data-review-mode]");
      if (toggle) setMode(toggle.dataset.reviewMode);
    });
    layer.addEventListener("wheel", event => {
      if (mode !== "comment") return;
      event.preventDefault();
      const rect = layer.getBoundingClientRect(), scale = rect.width / layer.clientWidth;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1;
      const data = { dx: (event.shiftKey ? event.deltaY : event.deltaX) * unit / scale, dy: (event.shiftKey ? 0 : event.deltaY) * unit / scale };
      if (activePage) send(activePage, "scroll", { ...data, x: (event.clientX - rect.left) / scale, y: (event.clientY - rect.top) / scale });
      else { scrollAt({ ...data, x: event.clientX, y: event.clientY }); scheduleLocal(); }
    }, { passive: false });
    let updatePending = false;
    const observer = new MutationObserver(() => {
      if (updatePending) return;
      updatePending = true;
      queueMicrotask(() => { updatePending = false; update(); });
    });
    for (const frame of Object.values(frames)) {
      observer.observe(frame, { attributes: true, attributeFilter: ["hidden"] });
      frame.addEventListener("load", update);
    }
    observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    const localObserver = new MutationObserver(records => {
      if (!records.some(record => !(record.target.nodeType === 1 ? record.target : record.target.parentElement)?.closest(reviewUI))) return;
      placeControls();
      scheduleLocal();
    });
    for (const scope of [document.getElementById("localView"), dialog]) localObserver.observe(scope, {
      childList: true, subtree: true, characterData: true, attributes: true,
      attributeFilter: ["class", "style", "open", "hidden", "disabled", "aria-label"],
    });
    for (const type of ["scroll", "load"]) document.addEventListener(type, scheduleLocal, true);
    window.addEventListener("resize", scheduleLocal);
    update();
  }

  if (window.parent !== window && document.documentElement.classList.contains("device-embedded")) installReporter();
  else installController();
})();
