/* LuckyUI 1920 x 1080 interaction prototype; all business state stays in memory. */
(() => {
  'use strict';
  const i18n = window.LuckyI18n;
  const t = i18n.t;
  const today = new Date();
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const todayKey = dateKey(today);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = (name) => {
    const key = name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('');
    const nodes = window.lucide?.[key] || window.lucide?.Circle;
    return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${(nodes || []).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ')}></${tag}>`).join('')}</svg>`;
  };
  const state = {
    today: todayKey,
    members: [
      { id: 'james', name: 'James', role: '爸爸', color: '#38829b', initials: 'J', age: 38 },
      { id: 'sophia', name: 'Sophia', role: '媽媽', color: '#d47860', initials: 'S', age: 36 },
      { id: 'emma', name: 'Emma', role: '女兒', color: '#9d79ad', initials: 'E', age: 10 },
      { id: 'oliver', name: 'Oliver', role: '兒子', color: '#b28c37', initials: 'O', age: 7 },
    ],
    dinnerMembers: ['james', 'sophia', 'emma', 'oliver'],
    dinner: { time: '18:30', recipeTitle: '', recipeId: '' },
    cartItems: [],
    calendar: { view: 'month', date: todayKey, member: 'all' },
    family: { member: 'emma', tab: 'tasks' },
    health: { member: 'james', tab: 'profile', wearables: {} },
    events: [
      { id: 'event-1', title: '晨間散步', date: todayKey, time: '07:30', endTime: '08:00', memberId: 'james', location: '社區公園', source: 'manual', done: false },
      { id: 'event-2', title: '鋼琴課', date: todayKey, time: '16:00', endTime: '17:00', memberId: 'emma', location: '音樂教室', source: 'manual', done: false },
      { id: 'event-3', title: '接 Oliver 放學', date: todayKey, time: '17:15', endTime: '17:45', memberId: 'sophia', location: '小學門口', source: 'manual', done: false },
      { id: 'event-4', title: '一起吃晚餐', date: todayKey, time: '18:30', endTime: '19:30', memberId: 'family', location: '家裡', source: 'manual', done: false },
    ],
    tasks: [
      { id: 'task-1', title: '閱讀 20 分鐘', memberId: 'emma', points: 10, completions: [], completionPoints: {} },
      { id: 'task-2', title: '整理自己的書包', memberId: 'oliver', points: 5, completions: [], completionPoints: {} },
      { id: 'task-3', title: '晚餐後一起收拾', memberId: 'james', points: 5, completions: [], completionPoints: {} },
      { id: 'task-4', title: '睡前整理書桌', memberId: 'emma', points: 5, completions: [], completionPoints: {} },
      { id: 'task-5', title: '每天散步 30 分鐘', memberId: 'sophia', points: 10, completions: [], completionPoints: {} },
    ],
    rewards: [
      { id: 'reward-1', title: '週末一起看電影', memberId: 'emma', cost: 80, redeemed: false },
      { id: 'reward-2', title: '選一套喜歡的積木', memberId: 'oliver', cost: 100, redeemed: false },
      { id: 'reward-3', title: '週末野餐', memberId: 'james', cost: 50, redeemed: false },
    ],
    pointsLog: [],
    settings: { section: 'device', wifi: true, network: 'Family_WiFi', brightness: 85, city: '臺北市', language: i18n.locale, units: 'metric', reminders: true, leadTime: 15, notificationPermission: false, offlineDownloaded: false, paired: true, autoPlayMotion: true, effectType: 'action-extension', weatherPreset: 'clouds', version: '0.18.0', updateAvailable: true },
    photo: null,
    uiVersion: 'LuckyUI-focused', designWidth: 1920, designHeight: 1080,
  };
  const healthSamples = [
    { height: 176, weight: 73, age: 38, sex: 'male', activity: 1.4, goal: 'maintain' },
    { height: 163, weight: 56, age: 36, sex: 'female', activity: 1.55, goal: 'maintain' },
    { height: 140, weight: 33, age: 10, sex: 'female', activity: 1.4, goal: 'maintain' },
    { height: 122, weight: 24, age: 7, sex: 'male', activity: 1.4, goal: 'maintain' },
  ];
  state.members.forEach((person, i) => Object.assign(person, { initial: person.initials, points: [40, 35, 75, 50][i], allergy: i === 2 ? '花生過敏' : '無已知過敏', preference: i > 1 ? '口味清淡、少辣' : '蔬菜、家常料理', health: { ...healthSamples[i], records: [] } }));
  for (const [offset, title, memberId, time] of [[1, '採買一週食材', 'sophia', '10:00'], [2, '足球練習', 'oliver', '16:00'], [3, '週末家庭野餐', 'family', '11:00'], [-1, '牙齒定期檢查', 'emma', '15:00']]) {
    const day = new Date(today); day.setDate(day.getDate() + offset);
    state.events.push({ id: `event-relative-${offset}`, title, memberId, date: dateKey(day), time, endTime: '', source: 'manual', done: false });
  }
  const routes = [
    ['home', '首頁', 'house'], ['make', '做菜', 'chef-hat'], ['health', '健康', 'shield-plus'],
    ['calendar', '行事曆', 'calendar-days'], ['family', '積分', 'trophy'], ['photo-frame', '相框', 'images'], ['settings', '設定', 'settings'],
  ];
  const main = document.getElementById('localView');
  const dialog = document.getElementById('appDialog');
  const frames = { make: document.getElementById('makeFrame'), 'photo-frame': document.getElementById('photoFrame') };
  const ready = new Set();
  const pending = {};
  const photos = [
    { id: 'lucky-main', src: 'assets/lucky-memory-main.webp', title: '一起探索的日子', date: new Date(today.getFullYear(), 8, 8) },
    { id: 'lucky-food', src: 'assets/lucky-memory-food.webp', title: '今天的好好吃飯', date: new Date(today.getFullYear(), 8, 9) },
    { id: 'lucky-sunset', src: 'assets/lucky-memory-sunset.webp', title: '把好時光留下來', date: new Date(today.getFullYear(), 8, 8) },
  ];
  let photoIndex = 0;
  let miniMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let route = '';
  let routeParams = {};
  let toastTimer;
  let focusBeforeModal;
  let calendarModule;
  let familyModule;
  let healthModule;
  const member = (id) => state.members.find(item => item.id === id) || { name: t('全家'), color: '#196b54', initials: t('家|family-initial') };
  const avatar = (person) => `<span class="member-avatar" style="--member-color:${person.color}">${escapeHtml(person.initials || person.name.slice(0, 1))}</span>`;
  const toast = (message) => {
    clearTimeout(toastTimer);
    document.getElementById('toastRegion').innerHTML = `<div class="toast-message">${escapeHtml(message)}</div>`;
    toastTimer = setTimeout(() => document.getElementById('toastRegion').replaceChildren(), 3600);
  };
  function closeModal() { if (dialog.open) dialog.close(); }
  function modal(options, body, onMount) {
    const config = typeof options === 'string' ? { title: options, body, onMount } : options;
    focusBeforeModal = document.activeElement;
    dialog.innerHTML = `<header class="dialog-header"><h2>${escapeHtml(config.title)}</h2><button class="icon-button" data-close-dialog aria-label="${escapeHtml(t('關閉'))}">${icon('x')}</button></header><div class="dialog-body">${config.body || config.html || ''}</div>${config.footer ? `<footer class="dialog-footer">${config.footer}</footer>` : ''}`;
    if (!dialog.open) dialog.showModal();
    (config.onMount || config.onOpen)?.(dialog);
    return dialog;
  }
  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-dialog]')) closeModal();
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
    }
  });
  dialog.addEventListener('close', () => { if (focusBeforeModal?.isConnected) focusBeforeModal.focus(); });
  function send(page, type, extra = {}) {
    frames[page]?.contentWindow?.postMessage({ channel: 'lumiq-device', type, page, ...extra }, '*');
  }
  const context = () => ({ members: state.members, dinnerMembers: state.dinnerMembers, settings: state.settings, locale: i18n.locale });
  function notify() {
    renderHeader();
    if (route === 'home') renderHome();
    console.debug('[Device prototype state]', state);
  }
  const ctx = { state, today, icon, escapeHtml, escape: escapeHtml, member, avatar, toast, modal, openModal: modal, dialog: modal, closeModal, closeDialog: closeModal, navigate, notify, onChange: notify, emit: () => console.debug('[Device prototype state]', state), refresh: () => renderRoute(), render: () => renderRoute(), dateKey, i18n, t };
  window.DevicePrototype = { state, navigate, ctx, i18n };

  function navigate(page, params = {}) {
    if (!routes.some(item => item[0] === page)) return;
    routeParams = params;
    if (location.hash !== `#${page}`) location.hash = page;
    else renderRoute();
  }
  function renderClock() {
    document.getElementById('systemClock').textContent = i18n.formatTime(new Date());
  }
  function renderHeader() {
    document.getElementById('mainNav').innerHTML = routes.map(([id, label, glyph]) => `<a href="#${id}" ${route === id ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${escapeHtml(t(label))}</span></a>`).join('');
    document.getElementById('navigationTitle').textContent = route === 'make' && state.makeScreen === 'cook' ? t('料理中') : t(routes.find(item => item[0] === route)?.[1] || '首頁');
    document.getElementById('weatherDisplay').innerHTML = `${icon('cloud-sun')}<span>${escapeHtml(t(state.settings.city))} <strong>24°</strong></span>`;
    document.getElementById('connectionButton').innerHTML = icon(state.settings.wifi ? 'wifi' : 'wifi-off');
    document.getElementById('connectionButton').title = state.settings.wifi ? t('{network} · 演示連線', { network: state.settings.network }) : t('離線模式 · 演示');
    renderClock();
    document.getElementById('systemDate').textContent = route === 'home' ? i18n.formatDate(today, { year: 'numeric', month: 'long', day: 'numeric' }) : i18n.formatDate(today, { month: 'short', day: 'numeric', weekday: 'short' });
    document.getElementById('accountButton').innerHTML = icon('user-round');
    document.getElementById('syncGlyph').innerHTML = icon('cloud-check');
    document.getElementById('homeTaskGlyph').innerHTML = icon('list-checks');
    document.getElementById('homeTaskCount').textContent = state.tasks.filter(task => !task.completions.includes(todayKey)).length;
  }
  function renderRoute() {
    const previous = route;
    route = location.hash.slice(1) || 'home';
    if (route === 'recipe') { location.hash = 'make'; return; } // legacy links keep working
    if (!routes.some(item => item[0] === route)) route = 'home';
    document.body.dataset.page = route;
    if (previous && previous !== route && frames[previous]) send(previous, 'deactivate');
    closeModal();
    const embedded = Boolean(frames[route]);
    main.hidden = embedded;
    for (const [key, frame] of Object.entries(frames)) frame.hidden = key !== route;
    if (embedded) {
      pending[route] = routeParams;
      if (ready.has(route)) { send(route, 'activate', { params: routeParams, context: context() }); delete pending[route]; }
    } else if (route === 'home') renderHome();
    else if (route === 'settings') { if (routeParams.section) state.settings.section = routeParams.section; renderSettings(); }
    else {
      const module = route === 'calendar' ? calendarModule : route === 'family' ? familyModule : healthModule;
      if (module?.render) {
        if (route === 'calendar') {
          for (const key of ['date', 'view', 'member']) if (routeParams[key]) state.calendar[key] = routeParams[key];
        }
        main.innerHTML = module.render(ctx);
        if (route === 'calendar' && routeParams.action) module.click(routeParams.action === 'voice' ? 'cal-voice' : 'cal-add', { dataset: { date: state.calendar.date } }, ctx);
        if (route === 'calendar' && routeParams.eventId) module.click('cal-detail', { dataset: { id: routeParams.eventId } }, ctx);
      }
      else main.innerHTML = `<header class="page-heading"><h1>${escapeHtml(t(routes.find(item => item[0] === route)[1]))}</h1></header><p>${escapeHtml(t('正在準備此模組。'))}</p>`;
    }
    renderHeader();
    renderSwitcher();
    routeParams = {};
    if (previous !== route) { document.getElementById('appMain').scrollTo(0, 0); if (!dialog.open) document.getElementById('appMain').focus({ preventScroll: true }); }
  }

  function dayEvents() {
    return state.events.filter(event => (event.date || event.startDate || event.start?.slice(0, 10)) === todayKey).sort((a, b) => String(a.startTime || a.start || a.time || '').localeCompare(String(b.startTime || b.start || b.time || '')));
  }
  function photoMarkup() {
    const photo = photos[photoIndex];
    return `<section class="home-photo" aria-label="${escapeHtml(t('家庭照片'))}"><a href="#photo-frame" data-open-photo="${photo.id}"><img src="${photo.src}" alt="${escapeHtml(t(photo.title))}"></a><div class="photo-dots">${photos.map((_, i) => `<button data-photo="${i}" class="${i === photoIndex ? 'active' : ''}" aria-label="${escapeHtml(t('第 {n} 張照片', { n: i + 1 }))}" aria-pressed="${i === photoIndex}"><i></i></button>`).join('')}</div><button class="photo-open-link" data-open-photo="${photo.id}" title="${escapeHtml(t('開啟家庭相框'))}" aria-label="${escapeHtml(t('開啟家庭相框'))}">${icon('expand')}</button></section>`;
  }
  function agendaMarkup() {
    const events = dayEvents();
    return `<div class="home-today"><div class="home-today-heading"><h3>${escapeHtml(t('今天的安排'))}</h3><span>${escapeHtml(t('{n} 個行程', { n: events.length }))}</span></div><div class="agenda-list">${events.length ? events.slice(0, 4).map(event => {
      const person = member(event.memberId || event.memberIds?.[0]);
      return `<a class="agenda-row" href="#calendar" data-event="${escapeHtml(event.id)}" style="--member-color:${person.color}"><time>${event.allDay || !event.time ? escapeHtml(t('全天')) : escapeHtml(event.time)}</time><i class="agenda-marker"></i><div><strong>${escapeHtml(t(event.title))}</strong><p>${escapeHtml(person.name)}</p></div></a>`;
    }).join('') : `<p class="empty-note">${escapeHtml(t('今天沒有行程'))}</p>`}</div><div class="home-agenda-actions"><a class="text-button" href="#calendar">${escapeHtml(t('全部 {n} 個行程', { n: events.length }))}${icon('arrow-right')}</a></div></div>`;
  }
  function miniCalendarMarkup() {
    const year = miniMonth.getFullYear(), month = miniMonth.getMonth();
    const start = new Date(year, month, 1);
    start.setDate(start.getDate() - start.getDay());
    const cells = Array.from({ length: 35 + (new Date(year, month, 1).getDay() + new Date(year, month + 1, 0).getDate() > 35 ? 7 : 0) }, (_, i) => {
      const date = new Date(start); date.setDate(start.getDate() + i); const key = dateKey(date);
      return `<button data-date="${key}" class="${key === todayKey ? 'today' : ''} ${date.getMonth() !== month ? 'faded' : ''} ${state.events.some(e => (e.date || e.startDate) === key) ? 'has-event' : ''}" aria-label="${key}">${date.getDate()}</button>`;
    }).join('');
    return `<div class="mini-calendar-grid" style="--mini-weeks:${new Date(year, month, 1).getDay() + new Date(year, month + 1, 0).getDate() > 35 ? 6 : 5}">${[0, 1, 2, 3, 4, 5, 6].map(d => `<span>${escapeHtml(i18n.weekday(d, 'short'))}</span>`).join('')}${cells}</div>`;
  }
  function taskMarkup() {
    const tasks = state.tasks;
    return `<section class="home-module"><div class="section-heading"><h2>${escapeHtml(t('一起完成的小事'))}</h2><a href="#family">${escapeHtml(t('全部'))} ${icon('arrow-up-right')}</a></div>${tasks.length ? tasks.map(task => {
      const done = Boolean(task.done || task.completedDates?.includes(todayKey) || task.completions?.includes?.(todayKey));
      return `<div class="task-row ${done ? 'done' : ''}"><button class="task-check ${done ? 'is-done' : ''}" data-task="${escapeHtml(task.id)}" aria-label="${escapeHtml(done ? t('取消完成') : t('完成'))} ${escapeHtml(t(task.title))}" aria-pressed="${done}">${icon(done ? 'circle-check' : 'circle')}</button><div><strong>${escapeHtml(t(task.title))}</strong><p>${escapeHtml(member(task.memberId).name)}</p></div><span class="points">+${task.points || 5}</span></div>`;
    }).join('') : `<p class="empty-note">${escapeHtml(t('尚未設定任務'))}</p><a class="text-button" href="#family">${escapeHtml(t('新增家庭任務'))}</a>`}</section>`;
  }
  function dinnerMarkup() {
    return `<section class="home-dinner-region"><header class="section-heading"><div><h2>${escapeHtml(t('今晚一起吃'))}</h2><p class="dinner-time">${state.dinner.time}${state.dinner.recipeTitle ? `<span class="meal-name"> · ${escapeHtml(t(state.dinner.recipeTitle))}</span>` : ''}</p></div><a class="secondary-button" href="#make" data-action="open-cart" aria-label="${escapeHtml(t('購物清單'))}" title="${escapeHtml(t('購物清單'))}">${icon('shopping-cart')}${escapeHtml(t('購物清單'))}${state.cartItems.length ? `<span>${state.cartItems.length}</span>` : ''}</a></header><div class="dinner-members">${state.members.map(person => `<label class="dinner-person"><input type="checkbox" data-diner="${person.id}" ${state.dinnerMembers.includes(person.id) ? 'checked' : ''}>${avatar(person)}<span>${escapeHtml(person.name)}</span><i class="dinner-tick">${icon('check')}</i></label>`).join('')}</div><footer class="dinner-submit"><span class="home-dinner-count">${escapeHtml(state.dinnerMembers.length ? t('{n} 人用餐', { n: state.dinnerMembers.length }) : t('尚未選擇用餐成員'))}</span><button class="primary-button" data-action="plan-dinner" ${!state.dinnerMembers.length ? 'disabled' : ''}>${escapeHtml(t('規劃晚餐'))}${icon('arrow-right')}</button></footer></section>`;
  }
  function memoriesMarkup() {
    return `<section class="home-memory-region"><div class="section-heading"><h2>${escapeHtml(t('最近的回憶'))}</h2><a class="text-button" href="#photo-frame">${escapeHtml(t('開啟相框'))} ${icon('arrow-right')}</a></div><div class="memory-strip">${photos.map(photo => `<a class="memory-item" href="#photo-frame" data-open-photo="${photo.id}"><img src="${photo.src}" alt="${escapeHtml(t(photo.title))}"><time>${escapeHtml(i18n.monthDay(photo.date))}</time></a>`).join('')}</div></section>`;
  }
  /* ---- household (family) data: preferences, will-cook days, add / remove members ---- */
  const HOUSEHOLD_KEY = 'lucky-table.household';
  const HOUSEHOLD_SEED = {
    james: { likes: ['牛肉', '蒜頭', '白米飯', '辣的菜', '湯品'], dislikes: ['香菜', '苦瓜'], allergies: [], cook: [1, 0, 0, 1, 0, 0, 0] },
    sophia: { likes: ['湯品', '豆腐', '白米飯', '番茄', '蒜頭'], dislikes: ['香菜', '內臟'], allergies: [], cook: [0, 1, 0, 0, 1, 0, 0] },
    emma: { likes: ['雞蛋', '白米飯', '花椰菜', '湯品'], dislikes: ['辣的菜', '香菜', '菇類'], allergies: ['花生'], cook: [0, 0, 0, 0, 1, 0, 0] },
    oliver: { likes: ['雞蛋', '咖哩', '白米飯'], dislikes: ['辣的菜', '炸物'], allergies: [], cook: [0, 0, 0, 0, 0, 0, 1] },
  };
  const HOUSEHOLD_SUGGEST = { likes: ['牛肉', '豆腐', '湯品', '海鮮', '雞蛋', '辣的菜'], dislikes: ['香菜', '菇類', '苦瓜', '內臟', '炸物', '辣的菜'], allergies: ['花生', '帶殼海鮮', '雞蛋', '牛奶', '麩質', '大豆'] };
  const HOUSEHOLD_COLORS = ['#38829b', '#d47860', '#9d79ad', '#b28c37', '#3f8f6b', '#8a6bb8'];
  const cookIndexToday = (today.getDay() + 6) % 7; // prefs.cook runs Mon..Sun
  function emptyPrefs() { return { likes: [], dislikes: [], allergies: [], cook: [0, 0, 0, 0, 0, 0, 0] }; }
  function syncDiet(person) {
    const p = person.prefs;
    person.allergy = p.allergies.length ? `${p.allergies.join('、')}過敏` : '無已知過敏';
    person.preference = p.likes.length ? p.likes.slice(0, 3).join('、') : person.preference || '';
  }
  function persistHousehold() {
    try { localStorage.setItem(HOUSEHOLD_KEY, JSON.stringify({ members: state.members.map(m => ({ id: m.id, name: m.name, role: m.role, color: m.color, initials: m.initials, age: m.age, prefs: m.prefs })), dinnerMembers: state.dinnerMembers })); } catch { /* storage unavailable */ }
  }
  function restoreHousehold() {
    state.members.forEach(m => { m.prefs = HOUSEHOLD_SEED[m.id] ? JSON.parse(JSON.stringify(HOUSEHOLD_SEED[m.id])) : emptyPrefs(); });
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(HOUSEHOLD_KEY) || 'null'); } catch { stored = null; }
    if (stored && Array.isArray(stored.members) && stored.members.length) {
      const next = [];
      stored.members.forEach((s, i) => {
        if (!s || typeof s.id !== 'string') return;
        const existing = state.members.find(m => m.id === s.id);
        const prefs = Object.assign(emptyPrefs(), s.prefs || {});
        if (!Array.isArray(prefs.cook) || prefs.cook.length !== 7) prefs.cook = [0, 0, 0, 0, 0, 0, 0];
        if (existing) next.push(Object.assign(existing, { name: String(s.name || existing.name), prefs }));
        else next.push({ id: s.id, name: String(s.name || s.id), role: s.role || '家人|role', color: s.color || HOUSEHOLD_COLORS[i % HOUSEHOLD_COLORS.length], initials: s.initials || String(s.name || '?').slice(0, 1).toUpperCase(), initial: s.initials || String(s.name || '?').slice(0, 1).toUpperCase(), age: s.age || null, points: 0, prefs, health: { height: 165, weight: 60, age: s.age || 30, sex: 'female', activity: 1.4, goal: 'maintain', records: [] } });
      });
      if (next.length) state.members = next;
      if (Array.isArray(stored.dinnerMembers)) state.dinnerMembers = stored.dinnerMembers.filter(id => state.members.some(m => m.id === id));
    }
    state.members.forEach(syncDiet);
  }
  restoreHousehold();
  state.household = { selected: state.members[0]?.id || '', field: 'likes' };
  state.tonightDishes = [];
  state.votes = [];

  function householdCookLabel(person) {
    const days = person.prefs.cook.map((on, i) => (on ? i18n.weekday((i + 1) % 7, 'short') : '')).filter(Boolean);
    return days.length ? t('本週掌廚：{days}', { days: i18n.list(days) }) : t('本週不掌廚');
  }
  function householdMarkup() {
    const h = state.household;
    const sel = state.members.find(m => m.id === h.selected) || state.members[0];
    const dayLabel = i => i18n.weekday((i + 1) % 7, 'short').slice(0, i18n.isZh ? 1 : 2);
    const cookCount = i => state.members.filter(m => m.prefs.cook[i]).length;
    const together = [0, 1, 2, 3, 4, 5, 6].filter(i => cookCount(i) > 1).map(i => `${i18n.weekday((i + 1) % 7)} — ${i18n.list(state.members.filter(m => m.prefs.cook[i]).map(m => m.name))}`);
    const tally = field => { const seen = {}; state.members.forEach(m => m.prefs[field].forEach(v => { (seen[v] = seen[v] || []).push(m.name); })); return Object.entries(seen).map(([value, who]) => ({ value, who })); };
    const shared = field => tally(field).filter(x => x.who.length > 1).sort((a, b) => b.who.length - a.who.length);
    const allergies = tally('allergies');
    const block = (title, rows) => `<div class="hh-shared-block"><span class="hh-kicker">${escapeHtml(t(title))}</span>${rows.length ? `<dl>${rows.map(r => `<div><dt>${escapeHtml(t(r.value))}</dt><dd>${escapeHtml(i18n.list(r.who))}</dd></div>`).join('')}</dl>` : `<p class="muted">${escapeHtml(t('目前沒有紀錄'))}</p>`}</div>`;
    const fieldLabel = { likes: '喜歡', dislikes: '不喜歡', allergies: '過敏' };
    const firstAllergy = allergies[0];
    return `<header class="settings-section-heading"><h2>${escapeHtml(t('家庭'))}</h2><span class="settings-session">${escapeHtml(t('餐桌上的家人'))}</span></header>
    <div class="household-layout">
      <div class="hh-left">
        <div class="hh-cards">${state.members.map(m => `<div class="hh-card ${sel && sel.id === m.id ? 'is-selected' : ''}" style="--member-color:${m.color}">
          <button class="hh-select" data-action="household-select" data-id="${escapeHtml(m.id)}">${avatar(m)}<span><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(t(m.role))} · ${escapeHtml(householdCookLabel(m))}</small></span></button>
          ${state.members.length > 1 ? `<button class="icon-button hh-remove" data-action="household-remove" data-id="${escapeHtml(m.id)}" title="${escapeHtml(t('移除 {name}', { name: m.name }))}" aria-label="${escapeHtml(t('移除 {name}', { name: m.name }))}">${icon('x')}</button>` : ''}
          <span class="hh-kicker">${escapeHtml(t('本週掌廚'))}</span>
          <div class="hh-days">${[0, 1, 2, 3, 4, 5, 6].map(i => `<button class="hh-day ${m.prefs.cook[i] ? 'is-on' : ''} ${m.prefs.cook[i] && cookCount(i) > 1 ? 'is-shared' : ''}" data-action="household-cook" data-id="${escapeHtml(m.id)}" data-day="${i}" aria-pressed="${Boolean(m.prefs.cook[i])}" title="${escapeHtml(i18n.weekday((i + 1) % 7))}">${escapeHtml(dayLabel(i))}</button>`).join('')}</div>
        </div>`).join('')}
        <form id="household-add" class="hh-card hh-add"><span class="hh-kicker">${escapeHtml(t('新增成員'))}</span><input name="name" maxlength="20" autocomplete="off" placeholder="${escapeHtml(t('姓名…'))}" required aria-label="${escapeHtml(t('新增成員'))}"><button class="primary-button" type="submit">${icon('plus')}${escapeHtml(t('新增'))}</button></form>
        </div>
        ${together.length ? `<div class="hh-together"><strong>${escapeHtml(t('一起下廚'))}</strong><span>${escapeHtml(together.join(' · '))}</span></div>` : ''}
      </div>
      <div class="hh-right">
        ${sel ? `<section class="hh-profile" style="--member-color:${sel.color}"><header>${avatar(sel)}<div><h3>${escapeHtml(sel.name)}</h3><p>${escapeHtml(t(sel.role))} · ${escapeHtml(householdCookLabel(sel))}</p></div></header>
          ${['likes', 'dislikes', 'allergies'].map(f => `<div class="hh-pref"><span class="hh-kicker">${escapeHtml(t(fieldLabel[f]))}</span><div class="hh-chips">${sel.prefs[f].length ? sel.prefs[f].map((v, ix) => `<span class="hh-chip">${escapeHtml(t(v))}<button type="button" data-action="household-pref-remove" data-field="${f}" data-index="${ix}" aria-label="${escapeHtml(t('移除'))} ${escapeHtml(t(v))}">×</button></span>`).join('') : `<span class="muted">${escapeHtml(t('目前沒有紀錄'))}</span>`}</div></div>`).join('')}
          <form id="household-pref" class="hh-add-pref"><div class="segmented">${['likes', 'dislikes', 'allergies'].map(f => `<button type="button" class="${h.field === f ? 'is-active' : ''}" data-action="household-field" data-field="${f}">${escapeHtml(t(fieldLabel[f]))}</button>`).join('')}</div><input name="value" maxlength="20" autocomplete="off" placeholder="${escapeHtml(t('自行輸入…'))}" aria-label="${escapeHtml(t(fieldLabel[h.field]))}"><button class="secondary-button" type="submit">${icon('plus')}${escapeHtml(t('新增'))}</button></form>
          <div class="hh-suggest">${HOUSEHOLD_SUGGEST[h.field].filter(v => !sel.prefs[h.field].includes(v)).map(v => `<button type="button" class="member-chip" data-action="household-suggest" data-value="${escapeHtml(v)}">+ ${escapeHtml(t(v))}</button>`).join('')}</div>
        </section>` : ''}
        <section class="hh-shared"><h3>${escapeHtml(t('全家的共同點'))}</h3>${block('多人都喜歡', shared('likes'))}${block('多人都不喜歡', shared('dislikes'))}${block('家中的過敏原', allergies)}
          ${firstAllergy ? `<div class="hh-note"><strong>${escapeHtml(t('過敏優先'))}</strong><span>${escapeHtml(t('只要 {name} 在餐桌上，所有建議都不會出現{allergy}。', { name: firstAllergy.who[0], allergy: t(firstAllergy.value) }))}</span></div>` : ''}
        </section>
      </div>
    </div>`;
  }
  function householdAddPref(value) {
    const sel = state.members.find(m => m.id === state.household.selected); if (!sel) return;
    const v = String(value || '').trim(); if (!v) return;
    const list = sel.prefs[state.household.field];
    if (!list.some(x => x.toLowerCase() === v.toLowerCase())) list.push(v);
    syncDiet(sel); persistHousehold(); renderSettings();
  }
  function householdSubmit(form) {
    const data = new FormData(form);
    if (form.id === 'household-add') {
      const name = String(data.get('name') || '').trim(); if (!name) return;
      const id = `member-${Date.now().toString(36)}`;
      const person = { id, name, role: '家人|role', color: HOUSEHOLD_COLORS[state.members.length % HOUSEHOLD_COLORS.length], initials: name.slice(0, 1).toUpperCase(), initial: name.slice(0, 1).toUpperCase(), age: null, points: 0, prefs: emptyPrefs(), health: { height: 165, weight: 60, age: 30, sex: 'female', activity: 1.4, goal: 'maintain', records: [] } };
      syncDiet(person); state.members.push(person); state.household.selected = id; persistHousehold();
      send('make', 'context', { context: context() }); renderSettings(); renderHeader(); toast(t('已新增 {name}', { name }));
    }
    if (form.id === 'household-pref') { householdAddPref(data.get('value')); form.reset(); }
  }
  function householdClick(action, target) {
    const id = target.dataset.id;
    if (action === 'household-select') { state.household.selected = id; renderSettings(); return; }
    if (action === 'household-remove') {
      if (state.members.length <= 1) return;
      const person = state.members.find(m => m.id === id);
      state.members = state.members.filter(m => m.id !== id);
      state.dinnerMembers = state.dinnerMembers.filter(x => x !== id);
      if (state.household.selected === id) state.household.selected = state.members[0].id;
      if (state.family.member === id) state.family.member = state.members[0].id;
      if (state.health.member === id) state.health.member = state.members[0].id;
      persistHousehold(); send('make', 'context', { context: context() }); renderSettings(); renderHeader(); toast(t('已移除 {name}', { name: person ? person.name : id })); return;
    }
    if (action === 'household-cook') { const m = state.members.find(x => x.id === id); const d = Number(target.dataset.day); if (m) { m.prefs.cook[d] = m.prefs.cook[d] ? 0 : 1; persistHousehold(); renderSettings(); } return; }
    if (action === 'household-field') { state.household.field = target.dataset.field; renderSettings(); return; }
    if (action === 'household-pref-remove') { const sel = state.members.find(m => m.id === state.household.selected); if (sel) { sel.prefs[target.dataset.field].splice(Number(target.dataset.index), 1); syncDiet(sel); persistHousehold(); renderSettings(); } return; }
    if (action === 'household-suggest') { householdAddPref(target.dataset.value); }
  }

  /* ---- home: tonight's dishes · family joining · everyone's vote · today's schedule ---- */
  function tonightDishesMarkup() {
    const dishes = Array.isArray(state.tonightDishes) ? state.tonightDishes : [];
    const diners = state.members.filter(m => state.dinnerMembers.includes(m.id));
    const cooks = state.members.filter(m => m.prefs && m.prefs.cook[cookIndexToday]);
    const allReady = dishes.length > 0 && dishes.every(d => d.ready);
    return `<section class="home-card home-tonight" aria-label="${escapeHtml(t('今晚的菜色'))}"><header class="home-card-head"><h2>${escapeHtml(t('今晚的菜色'))}</h2><span class="pill ${diners.length ? '' : 'is-off'}">${escapeHtml(diners.length ? t('{n} 人一起吃', { n: diners.length }) : t('尚未有人加入'))}</span></header>
      ${dishes.length ? `<ul class="tonight-list">${dishes.map(d => `<li><a class="tonight-row" href="#make" data-open-make-dish="${escapeHtml(d.id)}"><span class="tonight-thumb">${d.img ? `<img src="${escapeHtml(d.img)}" alt="" onerror="this.remove()">` : icon('utensils')}</span><span class="tonight-copy"><strong>${escapeHtml(d.name)}</strong><small>${escapeHtml(state.dinner.time)} · ${escapeHtml(cooks.length ? i18n.list(cooks.map(m => m.name)) : t('全家'))} · ${d.minutes} ${escapeHtml(t('分鐘'))}</small></span><span class="tonight-badge ${d.ready ? '' : 'is-short'}">${escapeHtml(d.cooked ? t('已完成') : d.ready ? t('食材齊全') : t('缺 {n} 項', { n: d.missing }))}</span></a></li>`).join('')}</ul>` : `<p class="empty-note">${escapeHtml(t('今晚還沒有菜單'))}</p>`}
      <footer class="home-card-foot"><a class="secondary-button" href="#make" data-action="open-cart">${icon('shopping-cart')}${escapeHtml(t('購物清單'))}${state.cartItems.length ? `<span>${state.cartItems.length}</span>` : ''}</a><button class="secondary-button" data-action="open-recipes">${icon('book-open')}${escapeHtml(t('食譜'))}</button><button class="primary-button" data-action="start-cooking" ${allReady ? '' : 'disabled'}>${icon('flame')}${escapeHtml(t('開始料理'))}</button></footer></section>`;
  }
  function familyJoiningMarkup() {
    return `<section class="home-card home-family" aria-label="${escapeHtml(t('今晚一起吃'))}"><header class="home-card-head"><h2>${escapeHtml(t('家人'))}</h2><span class="muted">${escapeHtml(t('今晚一起吃'))}</span></header>
      <ul class="joining-list">${state.members.map(m => { const on = state.dinnerMembers.includes(m.id); return `<li class="joining-row" style="--member-color:${m.color}">${avatar(m)}<div><strong>${escapeHtml(m.name)}</strong><small>${escapeHtml(householdCookLabel(m))}</small></div><div class="segmented yesno" role="group" aria-label="${escapeHtml(m.name)}"><button class="${on ? 'is-active' : ''}" data-diner-set="${escapeHtml(m.id)}:1" aria-pressed="${on}">${escapeHtml(t('是'))}</button><button class="${on ? '' : 'is-active'}" data-diner-set="${escapeHtml(m.id)}:0" aria-pressed="${!on}">${escapeHtml(t('否'))}</button></div></li>`; }).join('')}</ul>
      <footer class="home-card-foot"><span class="home-dinner-count">${escapeHtml(state.dinnerMembers.length ? t('{n} 人用餐', { n: state.dinnerMembers.length }) : t('尚未選擇用餐成員'))}</span><button class="text-button" data-action="open-family-settings">${escapeHtml(t('管理家人'))}${icon('arrow-right')}</button><button class="primary-button" data-action="plan-dinner" ${state.dinnerMembers.length ? '' : 'disabled'}>${escapeHtml(t('規劃晚餐'))}${icon('arrow-right')}</button></footer></section>`;
  }
  function votesMarkup() {
    const votes = Array.isArray(state.votes) ? state.votes : [];
    const top = Math.max(1, ...votes.map(v => v.n));
    return `<section class="home-card home-votes" aria-label="${escapeHtml(t('大家的投票'))}"><header class="home-card-head"><h2>${escapeHtml(t('大家的投票'))}</h2></header>
      ${votes.length ? `<div class="vote-list">${votes.map((v, i) => `<div class="vote-row"><div><strong>${escapeHtml(v.label)}</strong><span>${escapeHtml(t('{n} 票', { n: v.n }))}</span></div><div class="vote-bar"><i class="${i === 0 ? 'is-top' : ''}" style="width:${Math.round((v.n / top) * 100)}%"></i></div></div>`).join('')}</div>` : `<p class="empty-note">${escapeHtml(t('尚無投票'))}</p>`}
      <p class="muted vote-hint">${escapeHtml(t('在任一道菜的頁面都可以投票。'))}</p></section>`;
  }
  function agendaCardMarkup() {
    const events = dayEvents();
    return `<section class="home-card home-agenda-card" aria-label="${escapeHtml(t('今天的安排'))}"><header class="home-card-head"><h2>${escapeHtml(t('今天的安排'))}</h2><div class="button-row"><button class="secondary-button" data-action="voice-event">${icon('mic')}${escapeHtml(t('語音新增'))}</button><button class="primary-button" data-action="new-event">${icon('plus')}${escapeHtml(t('新增行程'))}</button></div></header>
      <div class="agenda-list">${events.length ? events.slice(0, 5).map(event => { const person = member(event.memberId || event.memberIds?.[0]); return `<a class="agenda-row" href="#calendar" data-event="${escapeHtml(event.id)}" style="--member-color:${person.color}"><time>${event.allDay || !event.time ? escapeHtml(t('全天')) : escapeHtml(event.time)}</time><i class="agenda-marker"></i><div><strong>${escapeHtml(t(event.title))}</strong><p>${escapeHtml(person.name)}</p></div></a>`; }).join('') : `<p class="empty-note">${escapeHtml(t('今天沒有行程'))}</p>`}</div>
      <footer class="home-card-foot"><a class="text-button" href="#calendar">${escapeHtml(t('全部 {n} 個行程', { n: events.length }))}${icon('arrow-right')}</a></footer></section>`;
  }
  function renderHome() {
    main.innerHTML = `<div class="lucky-home lucky-home-v2">${tonightDishesMarkup()}${familyJoiningMarkup()}${votesMarkup()}${agendaCardMarkup()}</div>`;
  }
  function renderSwitcher() {
    const switcher = document.getElementById('variantSwitcher');
    switcher.hidden = true;
  }
  const toggle = (key, label) => `<label class="toggle"><input type="checkbox" data-setting="${key}" aria-label="${escapeHtml(label)}" ${state.settings[key] ? 'checked' : ''}><span></span></label>`;
  const settingRow = (title, detail, control) => `<div class="settings-row"><div><h3>${title}</h3><p>${detail}</p></div>${control}</div>`;
  function deviceSettingsMarkup() {
    const settings = state.settings;
    return `<header class="settings-section-heading"><h2>${escapeHtml(t('裝置與資料'))}</h2><span class="settings-session">${escapeHtml(t('本次操作有效'))}</span></header><div class="device-settings-grid"><div class="device-settings-primary">
      <section class="settings-group"><h3 class="settings-group-title">${escapeHtml(t('網路與連結'))}</h3>
        ${settingRow('Wi-Fi', escapeHtml(settings.wifi ? t('已開啟') : t('已關閉')), toggle('wifi','Wi-Fi'))}
        ${settingRow(escapeHtml(t('目前網路')), settings.wifi ? escapeHtml(settings.network) : escapeHtml(t('尚未連線')), `<button class="secondary-button" data-action="network">${icon('wifi')}${escapeHtml(t('切換網路'))}</button>`)}
        ${settingRow(escapeHtml(t('IP 位址')), '192.168.1.108 · DHCP', `<div class="button-row"><button class="icon-button" data-action="copy-ip" title="${escapeHtml(t('複製 IP 位址'))}" aria-label="${escapeHtml(t('複製 IP 位址'))}">${icon('copy')}</button><button class="icon-button" data-action="check-network" title="${escapeHtml(t('檢查網路'))}" aria-label="${escapeHtml(t('檢查網路'))}">${icon('refresh-cw')}</button><button class="icon-button" data-action="reset-dhcp" title="${escapeHtml(t('恢復 DHCP'))}" aria-label="${escapeHtml(t('恢復 DHCP'))}">${icon('server-cog')}</button></div>`)}
        ${settingRow(escapeHtml(t('連結手機')), escapeHtml(settings.paired ? t('James 的手機 · 已連結') : t('尚未連結')), `<button class="secondary-button" data-action="pair-device">${icon('smartphone')}${escapeHtml(t('管理連結'))}</button>`)}
        ${settingRow(escapeHtml(t('家庭同步')), escapeHtml(t('{events} 個行程 · {tasks} 個家庭任務', { events: state.events.length, tasks: state.tasks.length })), `<button class="secondary-button" data-action="sync-device">${icon('cloud-check')}${escapeHtml(t('同步'))}</button>`)}
      </section><section class="settings-group"><h3 class="settings-group-title">${escapeHtml(t('資源與更新'))}</h3>
        ${settingRow(escapeHtml(t('離線食譜')), escapeHtml(settings.offlineDownloaded ? t('12 道食譜 · 已就緒') : t('12 道食譜 · 86 MB')), `<button class="secondary-button" data-action="download-recipes" ${!settings.wifi ? 'disabled' : ''}>${icon('download')}${escapeHtml(settings.offlineDownloaded ? t('重新下載') : t('下載'))}</button>`)}
        ${settingRow(escapeHtml(t('系統更新')), `${settings.version}${escapeHtml(settings.updateAvailable ? t(' · 可更新至 0.19.0') : t(' · 已是最新版本'))}`, `<div class="button-row"><button class="icon-button" data-action="system-update" title="${escapeHtml(t('檢查更新'))}" aria-label="${escapeHtml(t('檢查更新'))}">${icon('refresh-cw')}</button><button class="secondary-button" data-action="install-update" ${!settings.wifi || !settings.updateAvailable ? 'disabled' : ''}>${icon('download')}${escapeHtml(t('安裝'))}</button></div>`)}
      </section></div><aside class="device-information"><span class="device-information-icon">${icon('monitor')}</span><h3>Lucky Table LT-15</h3><p>${escapeHtml(t('阿發之家'))}</p><dl><div><dt>${escapeHtml(t('裝置編號'))}</dt><dd>LT-DEMO-001</dd></div><div><dt>${escapeHtml(t('螢幕解析度'))}</dt><dd>1920 × 1080</dd></div><div><dt>${escapeHtml(t('可用儲存空間'))}</dt><dd>18 GB / 19 GB</dd></div><div><dt>${escapeHtml(t('目前版本'))}</dt><dd>${settings.version}</dd></div></dl><div class="device-demo-status">${icon('flask-conical')}${escapeHtml(t('本機演示裝置'))}</div></aside></div>`;
  }
  function renderSettings() {
    const tabs = [['device','裝置與資料','monitor'],['display','顯示與語言','sun'],['family','家庭','users'],['reminders','家庭提醒','bell'],['frame','相框','images']];
    const section = tabs.some(tab => tab[0] === state.settings.section) ? state.settings.section : 'device';
    const settings = state.settings;
    let content;
    if (section === 'device') content = deviceSettingsMarkup();
    if (section === 'display') content = `<header class="settings-section-heading"><h2>${escapeHtml(t('顯示與語言'))}</h2><span class="settings-session">${escapeHtml(t('本次操作有效'))}</span></header><div class="settings-group">${settingRow(escapeHtml(t('畫面亮度')), escapeHtml(t('螢幕預覽')), `<div class="button-row"><input type="range" min="30" max="100" value="${settings.brightness}" data-setting="brightness" aria-label="${escapeHtml(t('畫面亮度'))}"><output id="brightnessOutput">${settings.brightness}%</output><button class="icon-button" data-action="reset-brightness" title="${escapeHtml(t('恢復亮度'))}" aria-label="${escapeHtml(t('恢復亮度'))}">${icon('rotate-ccw')}</button></div>`)}${settingRow(escapeHtml(t('語言')), escapeHtml(t('介面語言')), `<select data-setting="language" aria-label="${escapeHtml(t('語言'))}">${i18n.locales.map(item => `<option value="${item.code}" ${i18n.locale === item.code ? 'selected' : ''}>${escapeHtml(item.label)}</option>`).join('')}</select>`)}${settingRow(escapeHtml(t('度量單位')), escapeHtml(t(settings.units === 'imperial' ? '英制 · lb / oz' : '公制 · kg / ml')), `<select data-setting="units" aria-label="${escapeHtml(t('度量單位'))}"><option value="metric" ${settings.units !== 'imperial' ? 'selected' : ''}>${escapeHtml(t('公制 · kg / ml'))}</option><option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>${escapeHtml(t('英制 · lb / oz'))}</option></select>`)}${settingRow(escapeHtml(t('天氣地區')), escapeHtml(t(settings.city)), `<button class="secondary-button" data-action="weather-city">${icon('map-pin')}${escapeHtml(t('變更城市'))}</button>`)}</div>`;
    if (section === 'family') content = householdMarkup();
    if (section === 'reminders') content = `<header class="settings-section-heading"><h2>${escapeHtml(t('家庭提醒'))}</h2><span class="settings-session">${escapeHtml(t('本次操作有效'))}</span></header><div class="settings-group">${settingRow(escapeHtml(t('行程提醒')), escapeHtml(settings.reminders ? t('已開啟') : t('已關閉')), toggle('reminders', t('行程提醒')))}${settingRow(escapeHtml(t('提前提醒')), escapeHtml(t('家庭行程的預設提醒時間')), `<select data-setting="leadTime" aria-label="${escapeHtml(t('提前提醒'))}" ${!settings.reminders ? 'disabled' : ''}>${[0,5,15,30,60].map(n => `<option value="${n}" ${settings.leadTime === n ? 'selected' : ''}>${escapeHtml(n ? t('提前 {n} 分鐘', { n }) : t('準時'))}</option>`).join('')}</select>`)}${settingRow(escapeHtml(t('通知權限')), escapeHtml(settings.notificationPermission ? t('演示已允許') : t('尚未授權')), `<button class="secondary-button" data-action="notification-permission">${icon('bell')}${escapeHtml(settings.notificationPermission ? t('檢視權限') : t('設定權限'))}</button>`)}${settingRow(escapeHtml(t('提醒預覽')), escapeHtml(t('家庭行程')), `<button class="secondary-button" data-action="preview-reminder">${icon('eye')}${escapeHtml(t('預覽提醒'))}</button>`)}</div>`;
    if (section === 'frame') content = `<header class="settings-section-heading"><h2>${escapeHtml(t('相框'))}</h2><span class="settings-session">${escapeHtml(t('本次操作有效'))}</span></header><div class="settings-group">${settingRow(escapeHtml(t('照片管理')), escapeHtml(t('{photos} 張照片 · {motion} 張 AI 動態', { photos: state.photoCount ?? 7, motion: state.motionCount || 0 })), `<button class="secondary-button" data-action="photo-settings">${icon('images')}${escapeHtml(t('管理照片'))}</button>`)}${settingRow(escapeHtml(t('自動播放 AI 動態')), escapeHtml(t('同張照片內的 5 秒動作或天氣變化')), toggle('autoPlayMotion', t('自動播放 AI 動態')))}${settingRow(escapeHtml(t('預設動態方式')), escapeHtml(t('下次產生時使用')), `<select data-setting="effectType" aria-label="${escapeHtml(t('預設動態方式'))}"><option value="action-extension" ${settings.effectType === 'action-extension' ? 'selected' : ''}>${escapeHtml(t('動作延伸'))}</option><option value="weather-transition" ${settings.effectType === 'weather-transition' ? 'selected' : ''}>${escapeHtml(t('天氣變化'))}</option></select>`)}${settings.effectType === 'weather-transition' ? settingRow(escapeHtml(t('天氣效果')), escapeHtml(t('下次產生時使用')), `<select data-setting="weatherPreset" aria-label="${escapeHtml(t('天氣效果'))}">${[['sunlight','晴日暖光'],['clouds','流雲變化'],['rain','柔和細雨'],['snow','輕柔飄雪']].map(([value,label]) => `<option value="${value}" ${settings.weatherPreset === value ? 'selected' : ''}>${escapeHtml(t(label))}</option>`).join('')}</select>`) : ''}${settingRow(escapeHtml(t('全螢幕播放')), escapeHtml(t('家庭相框')), `<button class="secondary-button" data-action="photo-fullscreen">${icon('maximize')}${escapeHtml(t('播放'))}</button>`)}</div>`;
    main.innerHTML = `<div class="settings-layout"><nav class="settings-nav" aria-label="${escapeHtml(t('設定分類'))}"><h2>${escapeHtml(t('偏好設定'))}</h2>${tabs.map(([id,label,glyph]) => `<button class="${section === id ? 'active' : ''}" data-settings-tab="${id}" aria-current="${section === id ? 'page' : 'false'}">${icon(glyph)}<span>${escapeHtml(t(label))}</span>${icon('chevron-right')}</button>`).join('')}</nav><section class="settings-content">${content}</section></div>`;
  }
  function applyLocale(code) {
    i18n.setLocale(code);
    state.settings.language = i18n.locale;
    renderRoute();
    for (const page of Object.keys(frames)) send(page, 'context', { context: context() });
    toast(t('介面語言已切換為 {language}', { language: i18n.label }));
  }
  function networkDialog() {
    modal({ title: t('切換網路'), body: `<p class="demo-notice">${escapeHtml(t('網路連線演示，不會更改電腦或設備的 Wi-Fi。'))}</p><form id="networkForm"><label class="field">${escapeHtml(t('可用網路'))}<select name="network"><option>Family_WiFi</option><option>LuckyTable_Guest</option><option>Home_5G</option></select></label><label class="field">${escapeHtml(t('密碼'))}<input name="password" type="password" autocomplete="off" minlength="8" placeholder="${escapeHtml(t('至少 8 個字元'))}" required></label><button class="primary-button" type="submit">${escapeHtml(t('模擬連線'))}</button></form>`, onMount: el => el.querySelector('form').onsubmit = event => {
      event.preventDefault(); state.settings.network = new FormData(event.target).get('network'); state.settings.wifi = true; closeModal(); renderSettings(); renderHeader(); toast(t('演示網路已切換，未修改實際 Wi-Fi'));
    } });
  }
  function pairingDialog() {
    modal({ title: t('連結手機 · 演示'), body: `<p class="demo-notice">${escapeHtml(t('正式產品由手機 App 掃碼綁定。本原型沒有綁定服務，也不產生可掃描的假二維碼。'))}</p><div style="display:flex;align-items:center;gap:20px;padding:15px 0 25px">${icon('smartphone')}<div><h3>${escapeHtml(state.settings.paired ? t('James 的手機') : t('等待手機連結'))}</h3><p>${escapeHtml(state.settings.paired ? t('演示裝置 · 已連結') : t('演示配對碼：LT-0826'))}</p></div></div>`, footer: `<button class="secondary-button" data-close-dialog>${escapeHtml(t('取消'))}</button><button class="primary-button" id="pairConfirm">${escapeHtml(state.settings.paired ? t('模擬解除連結') : t('模擬手機已確認'))}</button>`, onMount: el => el.querySelector('#pairConfirm').onclick = () => { state.settings.paired = !state.settings.paired; closeModal(); renderSettings(); toast(state.settings.paired ? t('演示手機已連結') : t('演示手機已解除連結')); } });
  }
  function showReminder() {
    const event = dayEvents()[0];
    modal({ title: t('行程提醒'), body: `<p class="demo-notice">${escapeHtml(t('提醒樣式預覽'))}</p><h2>${escapeHtml(t(event?.title || '一起吃晚餐'))}</h2><p style="margin-top:12px">${escapeHtml(event ? (event.allDay || !event.time ? t('全天') : event.time) : '18:30')} · ${escapeHtml(member(event?.memberId).name)}</p>`, footer: `<button class="secondary-button" id="snoozeReminder">${escapeHtml(t('稍後提醒'))}</button><button class="primary-button" id="dismissReminder">${escapeHtml(t('知道了'))}</button>`, onMount: el => { el.querySelector('#snoozeReminder').onclick = () => { closeModal(); toast(t('已演示延後 5 分鐘，不會建立真實提醒')); }; el.querySelector('#dismissReminder').onclick = closeModal; } });
  }
  function accountDialog() {
    modal({ title: t('阿發家的成員'), body: state.members.map(person => `<div class="account-row">${avatar(person)}<div><h3>${escapeHtml(person.name)}</h3><p>${escapeHtml(t(person.role))}</p></div></div>`).join(''), footer: `<button class="primary-button" id="manageFamily">${escapeHtml(t('家庭管理'))}</button>`, onMount: el => el.querySelector('#manageFamily').onclick = () => { closeModal(); navigate('family'); } });
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button,a'); if (!target) return;
    if (target.dataset.openPhoto) { event.preventDefault(); navigate('photo-frame', { photoId: target.dataset.openPhoto }); return; }
    if (target.dataset.settingsTab) { state.settings.section = target.dataset.settingsTab; renderSettings(); return; }
    if (target.dataset.miniMonth) { miniMonth.setMonth(miniMonth.getMonth() + Number(target.dataset.miniMonth)); renderHome(); return; }
    if (target.dataset.photo) { photoIndex = Number(target.dataset.photo); renderHome(); return; }
    if (target.dataset.date && !target.dataset.action) { navigate('calendar', { date: target.dataset.date, view: 'day' }); return; }
    if (target.dataset.event) { event.preventDefault(); navigate('calendar', { date: todayKey, view: 'day', eventId: target.dataset.event }); return; }
    if (target.dataset.task) {
      const reopen = dialog.open && route === 'home';
      familyModule.click('fam-complete', { dataset: { id: target.dataset.task, date: todayKey } }, ctx);
      if (reopen) modal({ title: t('今日家庭任務'), body: taskMarkup() });
      return;
    }
    if (target.dataset.dinerSet) { const [id, on] = target.dataset.dinerSet.split(':'); state.dinnerMembers = on === '1' ? [...new Set([...state.dinnerMembers, id])] : state.dinnerMembers.filter(x => x !== id); persistHousehold(); send('make', 'context', { context: context() }); renderHome(); return; }
    if (target.dataset.openMakeDish) { event.preventDefault(); navigate('make', { screen: 'dish', dishId: target.dataset.openMakeDish }); return; }
    const action = target.dataset.action;
    if (!action) return;
    if (action.startsWith('household-')) { householdClick(action, target); return; }
    const actionModule = action.startsWith('cal-') ? calendarModule : action.startsWith('fam-') ? familyModule : action.startsWith('health-') ? healthModule : null;
    if (actionModule) { actionModule.click(action, target, ctx); return; }
    if (['open-cart','plan-dinner'].includes(action)) event.preventDefault();
    const actions = {
      'new-event': () => navigate('calendar', { action: 'new', date: todayKey }),
      'home-tasks': () => modal({ title: t('今日家庭任務'), body: taskMarkup() }),
      'sync-device': () => modal({ title: t('家庭同步'), body: `<p class="demo-notice">${escapeHtml(t('本地互動原型，尚未連接家庭服務。'))}</p><p>${escapeHtml(t('{events} 個行程 · {tasks} 個家庭任務 · {photos} 張照片', { events: state.events.length, tasks: state.tasks.length, photos: state.photoCount || photos.length }))}</p>`, footer: `<button class="primary-button" data-close-dialog>${escapeHtml(t('知道了'))}</button>` }),
      'voice-event': () => navigate('calendar', { action: 'voice', date: todayKey }),
      'plan-dinner': () => navigate('make', { screen: 'home' }),
      'start-cooking': () => navigate('make', { screen: 'cook' }),
      'open-recipes': () => navigate('make', { screen: 'recipes' }),
      'open-family-settings': () => navigate('settings', { section: 'family' }),
      'open-cart': () => navigate('make', { action: 'cart' }),
      'photo-settings': () => navigate('photo-frame', { action: 'settings' }),
      'photo-fullscreen': () => {
        navigate('photo-frame');
        renderRoute();
        if (frames['photo-frame'].requestFullscreen) frames['photo-frame'].requestFullscreen().catch(() => send('photo-frame', 'activate', { params: { action: 'fullscreen' }, context: context() }));
        else send('photo-frame', 'activate', { params: { action: 'fullscreen' }, context: context() });
      },
      'network': networkDialog,
      'pair-device': pairingDialog,
      'check-network': () => toast(state.settings.wifi ? t('演示檢查完成：{network} 可用', { network: state.settings.network }) : t('演示離線：請先開啟 Wi-Fi')),
      'reset-dhcp': () => modal({ title: t('恢復 DHCP'), body: `<p class="demo-notice">${escapeHtml(t('網路設定演示，不會修改實際設備。'))}</p><p>${escapeHtml(t('使用自動取得 IP 的方式重新連線？'))}</p>`, footer: `<button class="secondary-button" data-close-dialog>${escapeHtml(t('取消'))}</button><button class="primary-button" id="confirmDhcp">${escapeHtml(t('確認恢復'))}</button>`, onMount: el => el.querySelector('#confirmDhcp').onclick = () => { closeModal(); toast(t('已演示恢復 DHCP，自動配置 IP')); } }),
      'copy-ip': async () => { try { await navigator.clipboard.writeText('192.168.1.108'); toast(t('已複製示例 IP')); } catch { toast(t('示例 IP：192.168.1.108')); } },
      'reset-brightness': () => { state.settings.brightness = 85; document.documentElement.style.removeProperty('--preview-dim'); renderSettings(); },
      'download-recipes': () => { modal({ title: t('離線食譜包 · 演示'), body: `<p class="demo-notice">${escapeHtml(t('離線下載流程預覽，不會下載真實安裝包。'))}</p><p>${escapeHtml(t('12 道食譜 · 86 MB'))}</p>`, footer: `<button class="secondary-button" data-close-dialog>${escapeHtml(t('取消'))}</button><button class="primary-button" id="downloadConfirm">${escapeHtml(t('模擬下載完成'))}</button>`, onMount: el => el.querySelector('#downloadConfirm').onclick = () => { state.settings.offlineDownloaded = true; closeModal(); renderSettings(); toast(t('演示食譜包已就緒')); } }); },
      'system-update': () => { modal({ title: t('系統更新 · 演示'), body: `<p class="demo-notice">${escapeHtml(t('尚未接入 OTA 服務，不會修改設備系統。'))}</p><h3>${escapeHtml(t('目前版本 {version}', { version: state.settings.version }))}</h3><p style="margin-top:12px">${escapeHtml(state.settings.updateAvailable ? t('演示檢查結果：發現 0.19.0 新版本。') : t('演示檢查結果：已是最新版本。'))}</p>`, footer: `<button class="primary-button" data-close-dialog>${escapeHtml(t('完成'))}</button>` }); },
      'install-update': () => { modal({ title: t('安裝更新 · 演示'), body: `<p class="demo-notice">${escapeHtml(t('不會下載安裝包，也不會重新啟動或修改真實設備。'))}</p><h3>Lucky Table OS 0.19.0</h3><p style="margin-top:12px">${escapeHtml(t('更新介面與家庭同步穩定性。'))}</p>`, footer: `<button class="secondary-button" data-close-dialog>${escapeHtml(t('取消'))}</button><button class="primary-button" id="installConfirm">${escapeHtml(t('模擬更新完成'))}</button>`, onMount: el => el.querySelector('#installConfirm').onclick = () => { state.settings.version = '0.19.0'; state.settings.updateAvailable = false; closeModal(); renderSettings(); toast(t('已演示系統更新完成，未修改實際系統')); } }); },
      'weather-city': () => { modal({ title: t('天氣地區'), body: `<form id="cityForm"><label class="field">${escapeHtml(t('城市'))}<input name="city" value="${escapeHtml(t(state.settings.city))}" maxlength="20" required></label><button class="primary-button">${escapeHtml(t('儲存'))}</button></form>`, onMount: el => el.querySelector('form').onsubmit = event => { event.preventDefault(); const city = String(new FormData(event.target).get('city')).trim(); if (!city) return; state.settings.city = city; closeModal(); renderSettings(); renderHeader(); toast(t('顯示城市已更新，天氣數值仍為示例')); } }); },
      'notification-permission': () => { modal({ title: t('通知權限 · 演示'), body: `<p>${escapeHtml(t('正式設備需允許系統通知。本原型僅演示權限狀態，不申請瀏覽器通知。'))}</p>`, footer: `<button class="secondary-button" data-close-dialog>${escapeHtml(t('取消'))}</button><button class="primary-button" id="allowNotifications">${escapeHtml(t('模擬允許'))}</button>`, onMount: el => el.querySelector('#allowNotifications').onclick = () => { state.settings.notificationPermission = true; closeModal(); renderSettings(); toast(t('演示通知權限已允許')); } }); },
      'preview-reminder': showReminder,
      'inspect-state': () => modal({ title: t('原型狀態'), body: `<p class="demo-notice">${escapeHtml(t('資料僅保留在本次頁面，重新整理會重置。不會更改既有獨立頁面的服務設定。'))}</p><pre class="state-json">${escapeHtml(JSON.stringify(state, null, 2))}</pre>` }),
    };
    actions[action]?.();
  });
  document.addEventListener('change', event => {
    const target = event.target;
    if (route === 'calendar') calendarModule.change?.(target, ctx);
    if (route === 'family') familyModule.change?.(target, ctx);
    if (route === 'health') healthModule.change?.(target, ctx);
    if (target.dataset.diner) {
      state.dinnerMembers = target.checked ? [...new Set([...state.dinnerMembers, target.dataset.diner])] : state.dinnerMembers.filter(id => id !== target.dataset.diner);
      send('make', 'context', { context: context() }); renderHome();
    }
    const key = target.dataset.setting; if (!key) return;
    if (key === 'language') { applyLocale(target.value); return; }
    state.settings[key] = target.type === 'checkbox' ? target.checked : ['leadTime', 'brightness'].includes(key) ? Number(target.value) : target.value;
    if (['autoPlayMotion','effectType','weatherPreset'].includes(key)) send('photo-frame', 'context', { context: context() });
    if (key === 'units') send('make', 'context', { context: context() });
    if (key === 'brightness') return;
    renderHeader(); renderSettings(); toast(t('設定已更新 · 本次操作有效'));
  });
  document.addEventListener('input', event => {
    if (event.target.dataset.setting !== 'brightness') return;
    state.settings.brightness = Number(event.target.value);
    document.getElementById('brightnessOutput').textContent = `${event.target.value}%`;
    document.documentElement.style.setProperty('--preview-dim', `${(100 - state.settings.brightness) / 250}`);
  });
  window.addEventListener('message', event => {
    const sourcePage = Object.keys(frames).find(page => frames[page].contentWindow === event.source);
    const data = event.data;
    if (!sourcePage || data?.channel !== 'lumiq-device') return;
    if (data.type === 'navigate') { navigate(data.page, data.params || {}); return; }
    if (data.page !== sourcePage) return;
    if (data.type === 'ready') {
      ready.add(sourcePage);
      if (route === sourcePage) { send(sourcePage, 'activate', { params: pending[sourcePage] || {}, context: context() }); delete pending[sourcePage]; }
      else send(sourcePage, 'context', { context: context() });
    }
    if (data.type === 'snapshot') {
      if (sourcePage === 'make') {
        state.makeScreen = data.screen;
        state.tonightDishes = Array.isArray(data.tonight) ? data.tonight : [];
        if (route === 'make') document.getElementById('navigationTitle').textContent = data.screen === 'cook' ? t('料理中') : t('做菜');
        state.cartItems = Array.isArray(data.cartItems) ? data.cartItems : [];
        state.tonightDishes = Array.isArray(data.tonightDetail) ? data.tonightDetail : [];
        state.votes = Array.isArray(data.votes) ? data.votes : [];
      } else { state.photo = data.photo; state.photoCount = data.photoCount; state.motionCount = data.motionCount; if (ready.has(sourcePage) && data.settings) for (const key of ['autoPlayMotion','effectType','weatherPreset']) state.settings[key] = data.settings[key]; }
      if (route === 'home') renderHome();
    }
    if (data.type === 'meal') { state.dinner.recipeTitle = data.recipeTitle; state.dinner.recipeId = data.recipeId; toast(t('今晚菜單：{title}', { title: t(data.recipeTitle) })); }
  });
  document.getElementById('accountButton').onclick = accountDialog;
  document.addEventListener('submit', event => {
    const form = event.target;
    const formId = form.getAttribute('id') || '';
    if (formId.startsWith('household-')) { event.preventDefault(); householdSubmit(form); return; }
    const module = formId.startsWith('cal-') ? calendarModule : formId.startsWith('fam-') ? familyModule : formId.startsWith('health-') ? healthModule : null;
    if (module) { event.preventDefault(); module.submit(form, ctx); }
  });
  document.getElementById('connectionButton').onclick = () => navigate('settings', { section: 'device' });
  function fitCanvas() {
    const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    const canvas = document.getElementById('deviceCanvas');
    document.documentElement.style.setProperty('--device-scale', scale);
    canvas.style.transform = `scale(${scale})`;
    canvas.style.left = `${Math.max(0, (window.innerWidth - 1920 * scale) / 2)}px`;
    canvas.style.top = `${Math.max(0, (window.innerHeight - 1080 * scale) / 2)}px`;
  }
  window.addEventListener('resize', fitCanvas);
  window.addEventListener('hashchange', renderRoute);
  // Modules attach to this shared in-memory context; the shell owns navigation and cross-module summaries.
  function initializeModules() {
    calendarModule = window.DeviceModules.calendar;
    familyModule = window.DeviceModules.family;
    healthModule = window.DeviceModules.health;
    window.DevicePrototype.modules = { calendar: calendarModule, family: familyModule, health: healthModule };
  }
  initializeModules();
  fitCanvas();
  renderRoute();
  setInterval(renderClock, 30000);
  setInterval(() => {
    if (route !== 'home' || dialog.open || document.hidden) return;
    const photoArea = main.querySelector('.home-photo');
    if (photoArea?.contains(document.activeElement)) return;
    photoIndex = (photoIndex + 1) % photos.length;
    if (photoArea) photoArea.outerHTML = photoMarkup();
  }, 16000);
})();
