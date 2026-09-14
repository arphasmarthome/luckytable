(() => {
  "use strict";

  if (!document.documentElement.classList.contains("device-embedded")) return;
  const i18n = window.LuckyI18n;
  const t = i18n.t;
  const asset = "../device/assets/";
  const isRecipe = document.documentElement.dataset.devicePage === "recipe";

  if (!isRecipe) {
    const referencePhotos = [
      { id: "lucky-main", title: "小小的快樂", src: `${asset}lucky-memory-main.webp` },
      { id: "lucky-food", title: "好好吃飯", src: `${asset}lucky-memory-food.webp` },
      { id: "lucky-sunset", title: "一起看夕陽", src: `${asset}lucky-memory-sunset.webp` },
    ].map((photo) => ({ ...photo, capturedAt: "9 月 9 日", owner: "James", file: null, uploaded: false, motion: null }));
    state.photos.unshift(...referencePhotos);
    state.selectedId = "lucky-main";
    const originalStage = renderStage;
    window.renderStage = () => {
      originalStage();
      const heading = document.querySelector(".frame-page h1");
      if (heading) heading.textContent = t("家庭記憶");
      const photo = currentPhoto();
      if (!photo) {
        document.querySelector(".lucky-filmstrip")?.remove();
        return;
      }
      pageStatus.textContent = t("{n} 張照片", { n: state.photos.length });
      viewerToolbar.innerHTML = `<div class="toolbar-copy"><strong>${escapeHtml(t(photo.title))}</strong><span>${state.photos.indexOf(photo) + 1} / ${state.photos.length} · ${escapeHtml(t(photo.capturedAt))} · ${escapeHtml(t(photo.owner))}</span></div>`;
      viewerToolbar.insertAdjacentHTML("beforeend", `<div class="lucky-photo-controls"><button type="button" data-action="previous" aria-label="${escapeHtml(t("上一張照片"))}" title="${escapeHtml(t("上一張照片"))}">${icon("chevron-left")}</button><button type="button" data-action="next" aria-label="${escapeHtml(t("下一張照片"))}" title="${escapeHtml(t("下一張照片"))}">${icon("chevron-right")}</button><span class="lucky-photo-state">${icon(photo.motion ? "sparkles" : "images")}${escapeHtml(photo.motion ? t("動態效果演示") : t("原始照片"))}</span></div>`);
      let filmstrip = document.querySelector(".lucky-filmstrip");
      if (!filmstrip) {
        filmstrip = document.createElement("nav");
        filmstrip.className = "lucky-filmstrip";
        viewerToolbar.after(filmstrip);
      }
      filmstrip.setAttribute("aria-label", t("照片切換"));
      filmstrip.innerHTML = state.photos.map((item) => `<button type="button" data-lucky-photo="${escapeHtml(item.id)}" class="${item.id === photo.id ? "is-selected" : ""}" aria-label="${escapeHtml(t(item.title))}" aria-pressed="${item.id === photo.id}"><img src="${escapeHtml(item.src)}" alt="" />${item.motion ? icon("sparkles") : ""}</button>`).join("");
    };
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-lucky-photo]");
      if (button) selectPhoto(button.dataset.luckyPhoto);
    });
    render();
    return;
  }

  let catalogPage = 0;
  let fortuneView = "theme";
  let zodiacIndex = 0;
  const zodiac = ["牡羊座", "金牛座", "雙子座", "巨蟹座", "獅子座", "處女座", "天秤座", "天蠍座", "射手座", "摩羯座", "水瓶座", "雙魚座"];
  const zodiacSymbols = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  const zodiacNotes = ["多聽家人的想法，溫柔回應會帶來好心情。", "用熟悉的味道，陪家人度過安穩的一天。", "交換今天的新鮮事，讓晚餐多一點驚喜。", "一起分享熱湯與家常菜，留時間給重要的人。"];

  const soup = recipeData.find((recipe) => recipe.id === "tomato-eggs");
  if (soup) {
    soup.image = `${asset}recipe-tomato-soup.webp`;
    soup.steps[0].image = `${asset}recipe-preparation.webp`;
  }

  const missingDialog = document.createElement("dialog");
  missingDialog.className = "lucky-missing-dialog";
  missingDialog.setAttribute("aria-labelledby", "luckyMissingTitle");
  document.body.append(missingDialog);

  function showMissing(recipe) {
    if (!recipe.missing.length || cartHasRecipeMissing(recipe)) return;
    missingDialog.innerHTML = `<form method="dialog"><header class="dialog-heading"><div><h2 id="luckyMissingTitle">${escapeHtml(t("補齊這道菜的食材"))}</h2><p>${escapeHtml(t(recipe.title))} · ${escapeHtml(t("{n} 人份", { n: state.servings }))}</p></div><button class="icon-button" type="button" data-lucky-action="close-missing" aria-label="${escapeHtml(t("關閉缺料清單"))}">${icon("x")}</button></header><div class="lucky-missing-items">${missingIngredientsFor(recipe).map(([name, amount, unit], index) => `<label><input type="checkbox" name="missing" value="${index}" checked /><span>${escapeHtml(t(name))}</span><small>${scaledAmount(amount)} ${escapeHtml(t(unit))}</small></label>`).join("")}</div><footer><button class="text-button" type="button" data-lucky-action="close-missing">${escapeHtml(t("稍後再說"))}</button><button class="primary-button" type="button" data-lucky-action="confirm-missing">${icon("shopping-cart")}${escapeHtml(t("加入購物車"))}</button></footer></form>`;
    missingDialog.dataset.recipeId = recipe.id;
    missingDialog.showModal();
  }

  window.renderHub = () => `
    <section class="page hub-page" aria-labelledby="hubTitle">
      <header class="page-heading hub-heading"><div><h1 id="hubTitle">${escapeHtml(t("今晚要煮什麼？"))}</h1><p>${escapeHtml(t("從現有食材開始，或選一道想吃的菜。"))}</p></div><div class="page-heading-actions">${state.maxStep > 1 ? `<button class="tertiary-button" type="button" data-action="continue-flow">${icon("reset")}${escapeHtml(t("繼續規劃"))}</button>` : ""}<button class="tertiary-button" type="button" data-action="open-cart">${icon("shopping-cart")}${escapeHtml(t("購物清單"))}${state.shoppingCart.length ? ` · ${state.shoppingCart.length}` : ""}</button><button class="tertiary-button" type="button" data-action="open-inventory">${icon("boxes")}${escapeHtml(t("家中庫存"))}</button></div></header>
      <div class="hub-layout"><div class="path-grid">
        <button class="path-card" type="button" data-action="start-fridge-flow"><span class="path-image"><img src="${ASSET_ROOT}/recipe-hub/fridge.webp" alt="${escapeHtml(t("冰箱中的新鮮食材"))}" /><i class="path-icon">${icon("camera")}</i></span><span class="path-copy"><strong>${escapeHtml(t("看看我能做什麼"))}</strong><p>${escapeHtml(t("掃描你的冰箱"))}</p>${icon("chevron-right")}</span></button>
        <button class="path-card" type="button" data-action="go-catalog"><span class="path-image"><img src="${ASSET_ROOT}/recipe-hub/choose.webp" alt="${escapeHtml(t("豆腐彩蔬料理"))}" /><i class="path-icon">${icon("book")}</i></span><span class="path-copy"><strong>${escapeHtml(t("選一道菜"))}</strong><p>${escapeHtml(t("選擇你想吃的料理"))}</p>${icon("chevron-right")}</span></button>
        <button class="path-card" type="button" data-action="go-fortune"><span class="path-image"><img src="${ASSET_ROOT}/recipe-hub/today.webp" alt="${escapeHtml(t("蔬菜烘蛋"))}" /><i class="path-icon">${icon("sparkles")}</i></span><span class="path-copy"><strong>${escapeHtml(t("幸運食譜推薦"))}</strong><p>${escapeHtml(t("今天的幸運選擇"))}</p>${icon("chevron-right")}</span></button>
      </div><aside class="meal-context" aria-labelledby="mealContextTitle"><div class="context-intro"><i>${icon("check")}</i><span><strong id="mealContextTitle">${escapeHtml(t("本餐成員飲食資訊"))}</strong><small>${escapeHtml(t("一起吃"))}</small></span></div><div class="context-rules">${escapeHtml(t("過敏與偏好・待核對"))}</div><div class="context-pantry"><span data-label="${escapeHtml(t("家中庫存"))}">${icon("boxes")}${escapeHtml(t("常備庫存 {n} 種", { n: state.inventory.length }))}</span><button class="text-button" type="button" data-action="open-inventory">${icon("sliders")}${escapeHtml(t("管理"))}</button></div></aside></div>
    </section>`;

  window.renderConditionsStep = () => `
    <section class="page flow-page" aria-labelledby="conditionsTitle">${renderFlowCommand(3)}<div class="flow-panel conditions-layout">
      <aside class="condition-summary" data-scroll-key="condition-summary"><h2>${escapeHtml(t("食材・{n}", { n: selectedIngredients().length }))}</h2><div class="lucky-ingredient-chips">${selectedIngredients().map((item) => `<span>${escapeHtml(t(item.name))} ×${item.quantity}</span>`).join("")}</div><div class="safety-row">${escapeHtml(t("過敏與忌口尚未自動排除，請核對以下資料。"))}</div></aside>
      <div class="condition-form" data-scroll-key="condition-form"><header class="step-intro"><h1 id="conditionsTitle">${escapeHtml(t("今晚怎麼吃？"))}</h1></header>
        <fieldset class="condition-group lucky-member-group"><legend>${escapeHtml(t("誰一起吃？"))}</legend><div class="guest-stepper"><button type="button" data-action="guest-minus" aria-label="${escapeHtml(t("減少朋友人數"))}">${icon("minus")}</button><span>${escapeHtml(t("{n} 位朋友", { n: state.conditions.guests }))}</span><button type="button" data-action="guest-plus" aria-label="${escapeHtml(t("增加朋友人數"))}">${icon("plus")}</button></div><div class="member-selector">${renderMemberButtons()}</div></fieldset>
        <fieldset class="condition-group"><legend>${escapeHtml(t("想吃哪種菜系？"))}</legend><div class="option-grid five">${optionButtons(["中式", "西式", "港式", "日式", "都可以"], [state.conditions.cuisine], "select-cuisine")}</div></fieldset>
        <fieldset class="condition-group"><legend>${escapeHtml(t("今晚有多少時間？"))}</legend><div class="option-grid four">${optionButtons(["15 分鐘內", "30 分鐘內", "45 分鐘內", "不限時間"], [state.conditions.time], "select-time")}</div></fieldset>
        <fieldset class="condition-group"><legend>${escapeHtml(t("口味方向"))}</legend><div class="option-grid four">${optionButtons(["清爽少油", "孩子喜歡", "暖胃湯品", "高蛋白"], state.conditions.tastes, "toggle-taste")}</div></fieldset>
      </div><footer class="flow-footer"><button class="tertiary-button" type="button" data-action="edit-ingredients">${icon("chevron-left")}${escapeHtml(t("修改食材"))}</button><div class="flow-footer-actions"><button class="primary-button" type="button" data-action="generate-results" ${state.conditions.members.length || state.conditions.guests ? "" : "disabled"}>${escapeHtml(t("查看推薦"))}${icon("chevron-right")}</button></div></footer>
    </div></section>`;

  window.renderRecipeCard = (recipe, mode = "select") => {
    const selected = recipe.id === state.selectedRecipeId && mode === "select";
    const selectable = mode === "select";
    return `<article class="recipe-card ${selected ? "is-selected" : ""}"><button type="button" data-action="${selectable ? "select-recipe" : "open-detail"}" data-id="${recipe.id}" ${selectable ? `aria-pressed="${selected}"` : ""}><div class="recipe-image"><img src="${recipe.image}" alt="${escapeHtml(t("{title}完成料理", { title: t(recipe.title) }))}" />${selectable ? `<span class="match-badge ${recipe.match < 100 ? "is-missing" : ""}">${recipe.match}%</span>` : ""}</div><div class="recipe-card-copy"><h2>${escapeHtml(t(recipe.title))}</h2><div class="recipe-facts"><span>${escapeHtml(t(recipe.cuisine))} · ${escapeHtml(t("{n} kcal/份", { n: recipe.calories }))}</span><span>${icon("clock")}${escapeHtml(t("{n} 分鐘", { n: recipe.time }))}</span></div>${selectable ? `<p class="ingredient-status ${recipe.missing.length ? "is-missing" : ""}">${icon(recipe.missing.length ? "shopping-cart" : "check")}${escapeHtml(recipe.missing.length ? t("缺：{items}", { items: i18n.list(recipe.missing.map((name) => t(name))) }) : t("食材齊全"))}</p>` : `<i class="lucky-card-arrow">${icon("chevron-right")}</i>`}</div>${selected ? `<span class="lucky-card-selected">${icon("check")}</span>` : ""}</button></article>`;
  };

  window.renderResultsStep = () => {
    const recipes = getVisibleRecipes("results");
    ensureSelectedVisible(recipes);
    const recipe = recipes.find((item) => item.id === state.selectedRecipeId);
    const missingInCart = recipe && cartHasRecipeMissing(recipe);
    return `<section class="page flow-page results-page" aria-labelledby="resultsTitle">
      ${renderFlowCommand(4)}
      <header class="page-heading"><div><h1 id="resultsTitle">${escapeHtml(t("推薦料理"))}</h1><p>${escapeHtml(t(state.conditions.cuisine))} · ${escapeHtml(t(state.conditions.time))} · ${escapeHtml(state.conditions.tastes.length ? i18n.list(state.conditions.tastes.map((taste) => t(taste))) : t("不限口味"))}</p></div><div class="page-heading-actions"><button class="text-button" type="button" data-action="shuffle-results">${icon("shuffle")}${escapeHtml(t("換一批"))}</button><button class="tertiary-button" type="button" data-action="open-filters">${icon("sliders")}${escapeHtml(t("篩選"))}</button></div></header>
      <div class="results-toolbar"><div class="chip-row">${["全部", "25 分鐘內", "孩子喜歡", "清爽低脂"].map((filter) => `<button type="button" class="filter-chip ${state.quickFilter === filter ? "is-selected" : ""}" data-action="quick-filter" data-value="${filter}">${escapeHtml(t(filter))}</button>`).join("")}</div><span class="safety-badge">${escapeHtml(t("{n} 道食材齊全", { n: recipes.filter((item) => !item.missing.length).length }))}</span></div>
      ${recipes.length ? `<div class="recipe-grid">${recipes.map((item) => renderRecipeCard(item)).join("")}</div><footer class="action-dock ${recipe.missing.length ? "has-cart" : ""}"><button class="text-button dock-edit" type="button" data-action="go-step" data-step="3">${icon("sliders")}${escapeHtml(t("本餐設定"))}</button><div class="dock-selection"><span>${escapeHtml(t("已選料理"))}</span><strong>${escapeHtml(t(recipe.title))}</strong></div><div class="dock-actions"><button class="text-button" type="button" data-action="open-cart">${icon("shopping-cart")}${escapeHtml(t("購物清單"))}${state.shoppingCart.length ? ` · ${state.shoppingCart.length}` : ""}</button>${recipe.missing.length ? `<button class="secondary-button dock-cart" type="button" data-action="${missingInCart ? "open-cart" : "add-missing-to-cart"}">${icon("shopping-cart")}${escapeHtml(missingInCart ? t("缺料已加入") : t("加入缺料 · {n}", { n: recipe.missing.length }))}</button>` : ""}<button class="tertiary-button dock-detail" type="button" data-action="view-selected-detail">${escapeHtml(t("查看做法"))}</button><button class="primary-button dock-start" type="button" data-action="start-cooking">${escapeHtml(t("開始烹飪"))}${icon("chevron-right")}</button></div></footer>` : `<div class="empty-state">${icon("search")}<strong>${escapeHtml(t("沒有符合條件的菜譜"))}</strong><button class="secondary-button" type="button" data-action="reset-filters">${escapeHtml(t("重設篩選"))}</button></div>`}
    </section>`;
  };

  function catalogBody() {
    const recipes = getVisibleRecipes("catalog");
    const pageCount = Math.max(1, Math.ceil(recipes.length / 6));
    catalogPage = Math.min(catalogPage, pageCount - 1);
    return { recipes, pageCount, cards: recipes.slice(catalogPage * 6, catalogPage * 6 + 6).map((recipe) => renderRecipeCard(recipe, "open")).join("") };
  }

  function catalogPager(count, pageCount) {
    return `<span>${count ? catalogPage * 6 + 1 : 0}-${Math.min(catalogPage * 6 + 6, count)} / ${count}</span><div><button class="icon-button" type="button" data-lucky-action="catalog-prev" aria-label="${escapeHtml(t("上一頁"))}" ${catalogPage === 0 ? "disabled" : ""}>${icon("chevron-left")}</button><span>${catalogPage + 1} / ${pageCount}</span><button class="icon-button" type="button" data-lucky-action="catalog-next" aria-label="${escapeHtml(t("下一頁"))}" ${catalogPage >= pageCount - 1 ? "disabled" : ""}>${icon("chevron-right")}</button></div>`;
  }

  window.renderCatalog = () => {
    const { recipes, pageCount, cards } = catalogBody();
    const categories = ["全部", "中式", "西式", "日式", "家常", "高蛋白", "清爽低脂", "孩子喜歡"];
    return `<section class="page catalog-page" aria-labelledby="catalogTitle"><header class="page-heading"><div class="lucky-back-heading"><button class="back-button" type="button" data-action="go-hub" aria-label="${escapeHtml(t("返回食譜首頁"))}">${icon("chevron-left")}</button><h1 id="catalogTitle">${escapeHtml(t("選一道菜"))}</h1></div><div class="page-heading-actions"><button class="tertiary-button" type="button" data-action="open-filters">${icon("sliders")}${escapeHtml(t("更多分類"))}</button><button class="primary-button" type="button" data-action="shuffle-catalog">${icon("shuffle")}${escapeHtml(t("換一批"))}</button></div></header><div class="catalog-toolbar"><label class="search-box">${icon("search")}<input id="catalogSearch" type="search" value="${escapeHtml(state.catalogSearch)}" placeholder="${escapeHtml(t("搜尋此批料理"))}" aria-label="${escapeHtml(t("搜尋料理"))}" /></label><span class="catalog-count" id="catalogCount">${escapeHtml(t("{n} 道料理", { n: recipes.length }))}</span></div><nav class="category-list" aria-label="${escapeHtml(t("料理分類"))}">${categories.map((category) => `<button type="button" class="${state.catalogCategory === category ? "is-selected" : ""}" data-action="select-category" data-value="${category}">${escapeHtml(t(category))}</button>`).join("")}</nav><div class="recipe-grid" id="catalogGrid">${cards || `<div class="empty-state">${icon("search")}<strong>${escapeHtml(t("找不到相符料理"))}</strong><button class="text-button" type="button" data-action="reset-filters">${escapeHtml(t("重設篩選"))}</button></div>`}</div><footer class="lucky-pagination" id="luckyCatalogPager">${catalogPager(recipes.length, pageCount)}</footer></section>`;
  };

  const originalFortune = renderFortune;
  window.renderFortune = () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = originalFortune();
    const page = wrapper.firstElementChild;
    page.insertAdjacentHTML("afterbegin", `<div class="lucky-fortune-back"><button class="back-button" type="button" data-action="go-hub">${icon("chevron-left")}${escapeHtml(t("食譜首頁"))}</button></div>`);
    page.querySelector("h1").textContent = t("好運食譜");
    page.querySelector(".page-heading > div > p:last-child").textContent = t("主題調整推薦方向，過敏與忌口請另行核對。");
    page.querySelector(".page-heading-actions").insertAdjacentHTML("afterbegin", `<div class="lucky-fortune-tabs" role="tablist" aria-label="${escapeHtml(t("今日幸運主題"))}"><button type="button" role="tab" aria-selected="${fortuneView === "theme"}" data-lucky-action="fortune-theme">${escapeHtml(t("生活主題"))}</button><button type="button" role="tab" aria-selected="${fortuneView === "zodiac"}" data-lucky-action="fortune-zodiac">${escapeHtml(t("星座"))}</button></div>`);
    if (fortuneView === "zodiac") {
      page.querySelector(".fortune-theme").outerHTML = `<section class="lucky-zodiac"><div><h2>${icon("sparkles")}${escapeHtml(t("今日星座運勢"))}</h2><p>${escapeHtml(i18n.dayTitle(new Date()))}</p><h3><span>${zodiacSymbols[zodiacIndex]}</span>${escapeHtml(t(zodiac[zodiacIndex]))}</h3><strong>${escapeHtml(t("今日指數 ★★★★★"))}</strong><p>${escapeHtml(t(zodiacNotes[zodiacIndex % zodiacNotes.length]))}</p><small>${escapeHtml(t("娛樂主題・不影響飲食安全判斷"))}</small></div><div class="lucky-zodiac-grid">${zodiac.map((name, index) => `<button type="button" class="${index === zodiacIndex ? "is-selected" : ""}" data-lucky-action="zodiac" data-zodiac="${index}" aria-pressed="${index === zodiacIndex}"><span>${zodiacSymbols[index]}</span>${escapeHtml(t(name))}</button>`).join("")}</div></section>`;
    }
    return wrapper.innerHTML;
  };

  const originalCooking = renderCooking;
  window.renderCooking = () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = originalCooking();
    const recipe = selectedRecipe();
    const step = recipe.steps[state.cookingStep];
    wrapper.querySelector(".cooking-header > .back-button").remove();
    if (step.image) wrapper.querySelector(".step-media img").src = step.image;
    const complete = wrapper.querySelector(".complete-step");
    complete.remove();
    wrapper.querySelector(".cooking-page").insertAdjacentHTML("beforeend", `<footer class="lucky-cooking-footer"><button class="text-button" type="button" data-action="exit-cooking">${icon("chevron-left")}${escapeHtml(t("離開料理"))}</button><div><button class="tertiary-button" type="button" data-action="select-cooking-step" data-index="${Math.max(0, state.cookingStep - 1)}" ${state.cookingStep === 0 ? "disabled" : ""}>${icon("chevron-left")}${escapeHtml(t("上一步"))}</button>${state.completedSteps.has(state.cookingStep) ? `<button class="text-button" type="button" data-action="complete-step">${icon("reset")}${escapeHtml(t("取消完成"))}</button>` : ""}<button class="primary-button" type="button" data-lucky-action="next-cooking">${escapeHtml(state.cookingStep === recipe.steps.length - 1 ? t("完成料理") : t("下一步"))}${icon("chevron-right")}</button></div></footer>`);
    return wrapper.innerHTML;
  };

  const originalDetail = renderDetail;
  window.renderDetail = () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = originalDetail();
    const recipe = selectedRecipe();
    const footer = wrapper.querySelector(".detail-actions");
    footer.classList.add("lucky-detail-footer");
    footer.querySelector('[data-action="show-source"]').textContent = t("食譜來源");
    footer.querySelector(".page-heading-actions").insertAdjacentHTML("afterbegin", `<button class="text-button" type="button" data-action="open-cart">${icon("shopping-cart")}${escapeHtml(t("購物清單"))}${state.shoppingCart.length ? ` · ${state.shoppingCart.length}` : ""}</button>${recipe.missing.length ? `<button class="secondary-button" type="button" data-lucky-action="detail-missing">${icon("plus")}${escapeHtml(t("補齊食材 · {n}", { n: recipe.missing.length }))}</button>` : ""}`);
    wrapper.querySelector(".detail-page").append(footer);
    return wrapper.innerHTML;
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (["select-category", "shuffle-catalog", "reset-filters"].includes(button.dataset.action)) catalogPage = 0;
    if (button.dataset.action === "select-recipe") {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.selectedRecipeId = button.dataset.id;
      render();
      showMissing(selectedRecipe());
      return;
    }
    if (button.dataset.action === "go-hub") {
      event.preventDefault();
      event.stopImmediatePropagation();
      goToScreen("hub");
      return;
    }
    const action = button.dataset.luckyAction;
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (action === "close-missing") missingDialog.close();
    if (action === "detail-missing") {
      if (cartHasRecipeMissing(selectedRecipe())) { renderCart(); cartDialog.showModal(); }
      else showMissing(selectedRecipe());
    }
    if (action === "confirm-missing") {
      const recipe = withRecipeAvailability(recipeData.find((item) => item.id === missingDialog.dataset.recipeId));
      const missing = missingIngredientsFor(recipe);
      const names = [...missingDialog.querySelectorAll("input:checked")].map((input) => missing[Number(input.value)][0]);
      if (!names.length) return showToast(t("請選擇至少一項食材。"));
      addMissingToCart({ ...recipe, missing: names });
      missingDialog.close();
      render();
      showToast(t("已加入 {n} 項缺少的食材。", { n: names.length }));
    }
    if (action === "catalog-prev" || action === "catalog-next") { catalogPage += action === "catalog-next" ? 1 : -1; render(); }
    if (action === "fortune-theme" || action === "fortune-zodiac") { fortuneView = action === "fortune-theme" ? "theme" : "zodiac"; render(); }
    if (action === "zodiac") { zodiacIndex = Number(button.dataset.zodiac); render(); }
    if (action === "next-cooking") {
      state.completedSteps.add(state.cookingStep);
      if (state.cookingStep === selectedRecipe().steps.length - 1) {
        goToScreen("hub");
        showToast(t("料理完成，可以準備上桌了。"));
        return;
      }
      state.cookingStep += 1;
      resetTimerForCurrentStep();
      render();
      speakCurrentStep();
    }
  }, true);

  document.addEventListener("input", (event) => {
    if (event.target.id !== "catalogSearch") return;
    event.stopImmediatePropagation();
    state.catalogSearch = event.target.value;
    catalogPage = 0;
    const { recipes, pageCount, cards } = catalogBody();
    document.querySelector("#catalogCount").textContent = t("{n} 道料理", { n: recipes.length });
    document.querySelector("#catalogGrid").innerHTML = cards || `<div class="empty-state">${icon("search")}<strong>${escapeHtml(t("找不到相符料理"))}</strong></div>`;
    document.querySelector("#luckyCatalogPager").innerHTML = catalogPager(recipes.length, pageCount);
  }, true);

  render();
})();
