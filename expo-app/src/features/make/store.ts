/* Lucky Table · Make — module state (port of the state / derived data / cooking session parts of
 * prototype/make/app.js). Tonight's table, the cooking session, stock, acquired ingredients, the
 * hand-off cart, votes and the TheMealDB cache persist under the prototype's localStorage keys;
 * screen-local bits (capture shots, filters, match mode, plan modal) live only in memory.
 * The timer engine is a module-level 500 ms interval that writes fresh `cook` objects into the
 * store, so every screen re-renders from store changes. */
import { Platform } from "react-native";
import { create } from "zustand";
import { t as appT, useI18nStore } from "@/i18n";
import { today, todayKey } from "@/lib/date";
import { loadJSON, loadJSONAsync, saveJSON } from "@/lib/storage";
import { useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { ALIAS, AMT, CAT, DAY_EN, DISHES, ING_ZH, ITEMS, SHOTS, STAPLES, STEPS, STOCK, UNIT, VOTE_SEED, WEEK_MEALS, categoryOf, cookMinutes, dishById, dishImg, hasDish, hasDishImg, ingImg, type StockRow } from "./data";
import type { Dish, DishIngredient } from "./dishes";
import { STR, dishNameIn, langOf, nameIn, sepIn, type Lang } from "./strings";
import type { VendorId } from "./vendors";

export type { Size, StockRow } from "./data";

/* ───────── types ───────── */
export type CartItem = { name: string; zh: string; amount: string; dishId: string };
export type Recipe = { ing: DishIngredient[]; steps: string[]; source: string; title: string };
export type StepState = { seconds: number; remaining: number; done: boolean; running: boolean; deadline: number };
export type TimelineEvent = { kind: "start" | "pause" | "resume"; at: number };
export type CookSession = { date: string; dishIds: string[]; active: string; split: boolean; paneB: string | null; steps: Record<string, StepState[]>; selected: Record<string, number>; timeline: TimelineEvent[] };
/** One finished cooking session, kept for the Summary page. */
export type CookRecord = { id: string; date: string; dishIds: string[]; timeline: TimelineEvent[]; startedAt: number; finishedAt: number; totalSeconds: number; photos: Record<string, string[]> };
export type MatchMode = "captured" | "stock";
export type PlannedMeal = { dishId: string; day: string; time: string };
export type Pane = "A" | "B" | "";
export type CapturedItem = { name: string; label: string; cat: string; unit: string; conf: number; img: string; qty: number; base: number };
export type IngredientRow = { name: string; label: string; amount: string; have: boolean; fromStock: boolean };
export type Readiness = { ings: IngredientRow[]; have: number; pct: number; missing: IngredientRow[] };
export type Decorated = { id: string; label: string; img: string; m: number; full: boolean; cat: string; minutes: number; matchLabel: string; note: string; shopNote: string };
export type StepPlanItem = { text: string; seconds: number };
export type VoteRow = { id: string; label: string; n: number };

export type MakeData = {
  /* persisted */
  tonight: string[];
  cook: CookSession | null;
  stock: StockRow[];
  acquired: Record<string, string[]>;
  cart: CartItem[];
  vendor: VendorId;
  history: CookRecord[];
  myVotes: string[];
  recipes: Record<string, Recipe>;
  /* in-memory */
  votes: Record<string, number>;
  shots: number;
  qty: Record<string, number>;
  matchMode: MatchMode;
  dishId: string;
  filter: string;
  recipeFilter: string;
  planned: PlannedMeal[];
  evDay: number;
  evTime: string;
  modalPane: Pane;
  fetching: string[];
  /** set by beginCook so the cook screen skips the entry gate for the navigation that follows */
  skipGate: boolean;
  hydrated: boolean;
};

export type CookStart = "ok" | "needAll" | "empty";

export type MakeActions = {
  setFilter: (value: string) => void;
  setRecipeFilter: (value: string) => void;
  setMatchMode: (mode: MatchMode) => void;
  openDish: (id: string) => void;
  resetCapture: () => void;
  snap: () => void;
  setQty: (name: string, delta: number, lang: Lang) => void;
  addCapturedToStock: (lang: Lang) => void;
  toggleVote: (id: string) => void;
  addTonight: (id: string) => void;
  removeTonight: (id: string) => void;
  toggleTonight: (id: string) => void;
  toggleAcquired: (dishId: string, name: string) => void;
  /** adds the missing ingredients of a dish to the hand-off cart; returns how many were missing */
  addMissingToCart: (dishId: string, lang: Lang) => number;
  removeFromCart: (dishId: string, name: string) => void;
  setVendor: (vendor: VendorId) => void;
  setEvDay: (day: number) => void;
  setEvTime: (time: string) => void;
  /** saves the plan (today → also added to tonight); returns the chosen date */
  savePlan: (dishId: string) => { day: Date; time: string };
  setModalPane: (pane: Pane) => void;
  /** add-dish modal pick: toggles tonight and, while cooking, assigns the dish to the pane; returns true when added */
  pickDish: (id: string) => boolean;
  stockQty: (name: string, delta: number) => void;
  stockRemove: (name: string) => void;
  /** the prototype's "cook" click: gate on readiness, start / merge the session, mirror the meal to the device */
  beginCook: (id: string | null) => CookStart;
  /** the prototype's activate({screen:"cook"}): true when the session is (now) running */
  enterCook: () => boolean;
  /** closes the session and returns its record (null when nothing was cooking) */
  finishCook: () => CookRecord | null;
  addHistoryPhoto: (recordId: string, dishId: string, uri: string) => void;
  toggleSplit: () => void;
  setActiveDish: (id: string) => void;
  setPaneDish: (pane: "A" | "B", id: string) => void;
  selectStep: (id: string, i: number) => void;
  toggleTimer: (id: string, i: number) => void;
  startAll: () => void;
  pauseAll: () => void;
  addMinute: (id: string, i: number) => void;
  resetStep: (id: string, i: number) => void;
  completeStep: (id: string, i: number) => void;
};
export type MakeState = MakeData & MakeActions;

/* ───────── storage keys (same as the prototype) ───────── */
export const KEYS = {
  tonight: "luckytable-make-tonight",
  cook: "luckytable-make-cook",
  stock: "luckytable-make-stock",
  cart: "luckytable-make-cart",
  vendor: "luckytable-make-vendor",
  history: "luckytable-make-history",
  acquired: "luckytable-make-acquired",
  votes: "luckytable-make-votes",
  mealdb: "luckytable-mealdb",
} as const;

type StoredTonight = { date: string; ids: string[] } | null;

const currentLang = (): Lang => langOf(useI18nStore.getState().locale);
const strings = () => STR[currentLang()];

function normalizeStock(rows: StockRow[] | null | undefined): StockRow[] {
  const base = Array.isArray(rows) && rows.length ? rows : STOCK;
  return base.map((x) => ({ ...x, size: x.size || STOCK.find((s) => s.name === x.name)?.size || { kind: "count" } }));
}
function normalizeTonight(stored: StoredTonight): string[] {
  const ids = stored && stored.date === todayKey ? stored.ids : (WEEK_MEALS[DAY_EN[today.getDay()]] || []).slice();
  return (Array.isArray(ids) ? ids : []).filter(hasDish);
}
function normalizeCook(stored: CookSession | null): CookSession | null {
  if (!stored || stored.date !== todayKey || !Array.isArray(stored.dishIds)) return null;
  return { ...stored, steps: stored.steps || {}, selected: stored.selected || {}, paneB: stored.paneB ?? null, split: Boolean(stored.split), timeline: Array.isArray(stored.timeline) ? stored.timeline : [] };
}
function normalizeHistory(rows: CookRecord[] | null | undefined): CookRecord[] {
  return (Array.isArray(rows) ? rows : []).map((r) => ({ ...r, photos: r.photos && !Array.isArray(r.photos) ? r.photos : {} }));
}
function readPersisted() {
  return {
    tonight: normalizeTonight(loadJSON<StoredTonight>(KEYS.tonight, null)),
    cook: normalizeCook(loadJSON<CookSession | null>(KEYS.cook, null)),
    stock: normalizeStock(loadJSON<StockRow[] | null>(KEYS.stock, null)),
    acquired: loadJSON<Record<string, string[]>>(KEYS.acquired, {}),
    cart: loadJSON<CartItem[]>(KEYS.cart, []),
    vendor: loadJSON<VendorId>(KEYS.vendor, "instacart"),
    history: normalizeHistory(loadJSON<CookRecord[]>(KEYS.history, [])),
    myVotes: loadJSON<string[]>(KEYS.votes, []),
    recipes: loadJSON<Record<string, Recipe>>(KEYS.mealdb, {}),
  };
}

/* ───────── pure helpers (usable from screens, the store and the summary) ───────── */
export const stockPantry = (s: Pick<MakeData, "stock">) => s.stock.map((x) => x.name.toLowerCase());

export function capturedItems(s: Pick<MakeData, "shots" | "qty">, lang: Lang): CapturedItem[] {
  const base: Record<string, number> = {};
  for (let i = 0; i < s.shots && i < SHOTS.length; i++) SHOTS[i].items.forEach(([n, q]) => { base[n] = (base[n] || 0) + q; });
  const zh = lang === "zh";
  return Object.keys(base).map((name) => {
    const meta = ITEMS[name];
    return { name, label: nameIn(name, meta.zh, lang), cat: zh ? CAT[categoryOf(name)] : categoryOf(name), unit: zh ? UNIT[meta.unit] || meta.unit : meta.unit, conf: meta.conf, img: ingImg(name), qty: s.qty[name] !== undefined ? s.qty[name] : base[name], base: base[name] };
  });
}

export function pantryNames(s: Pick<MakeData, "matchMode" | "shots" | "qty" | "stock">): string[] {
  return (s.matchMode === "captured" ? capturedItems(s, "en").map((c) => c.name) : s.stock.map((x) => x.name)).map((n) => n.toLowerCase());
}

export function hasIng(name: string, pantry: string[]) {
  const k = String(name).toLowerCase();
  const a = ALIAS[k];
  if (a === "*" || STAPLES.includes(k)) return true;
  const key = a || k;
  return pantry.includes(key) || pantry.some((p) => key.includes(p) || p.includes(key));
}

export const ingList = (s: Pick<MakeData, "recipes">, d: Dish): DishIngredient[] => (s.recipes[d.id]?.ing?.length ? s.recipes[d.id].ing : d.ing);

export function dishIngredients(s: Pick<MakeData, "recipes" | "acquired">, d: Dish, pantry: string[], lang: Lang): IngredientRow[] {
  const acquired = s.acquired[d.id] || [];
  return ingList(s, d).map(([name, zhName, amount]) => {
    const label = nameIn(name, zhName || ING_ZH[String(name).toLowerCase()] || name, lang);
    const fromStock = hasIng(name, pantry);
    const have = fromStock || acquired.includes(name);
    return { name, label, amount: lang === "zh" ? AMT[amount] || amount : amount, have, fromStock };
  });
}

export function readiness(s: Pick<MakeData, "recipes" | "acquired" | "stock">, d: Dish, lang: Lang, pantry?: string[]): Readiness {
  const ings = dishIngredients(s, d, pantry || stockPantry(s), lang);
  const have = ings.filter((i) => i.have).length;
  return { ings, have, pct: ings.length ? Math.round((have / ings.length) * 100) : 100, missing: ings.filter((i) => !i.have) };
}

export function decorate(s: Pick<MakeData, "recipes" | "acquired" | "stock">, d: Dish, lang: Lang, pantry: string[]): Decorated {
  const t = STR[lang];
  const r = readiness(s, d, lang, pantry);
  const full = r.missing.length === 0;
  const n = r.missing.length;
  return {
    id: d.id, label: dishNameIn(d, lang), img: dishImg(d.id), m: r.pct, full, cat: d.cat, minutes: cookMinutes(d),
    matchLabel: full ? t.ready : r.pct + "%",
    note: full ? t.onHand : `${t.missing} ${n} · ${r.missing.map((x) => x.label).join(sepIn(lang))}`,
    shopNote: full ? t.onHand : `${t.buy} ${n} ${lang === "zh" ? t.items : n === 1 ? t.item : t.items}`,
  };
}

export const rankDishes = (list: Decorated[]) => list.slice().sort((a, b) => b.m - a.m || a.minutes - b.minutes);

export const allTonightReady = (s: Pick<MakeData, "tonight" | "recipes" | "acquired" | "stock">) => s.tonight.every((id) => readiness(s, dishById(id), "en").pct === 100);

/* step plans: curated timers first, otherwise TheMealDB's method with the catalog cook time
   spread across the steps (explicit "N minutes" in a step wins). */
function parseSeconds(text: string) {
  const m = /(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(hour|hr|minute|min|second|sec)/i.exec(text);
  if (!m) return 0;
  const n = Number(m[2] || m[1]);
  const unit = m[3].toLowerCase();
  return unit.startsWith("h") ? n * 3600 : unit.startsWith("m") ? n * 60 : n;
}
export function planFor(s: Pick<MakeData, "recipes">, id: string, lang: Lang): StepPlanItem[] {
  const local = STEPS[id];
  if (local) return local[lang].map((text, i) => ({ text, seconds: local.seconds[i] || 120 }));
  const r = s.recipes[id];
  if (!r || !r.steps || !r.steps.length) return [];
  const d = dishById(id);
  const total = cookMinutes(d) * 60;
  const explicit = r.steps.map(parseSeconds);
  const fixed = explicit.reduce((a, x) => a + x, 0);
  const open = explicit.filter((x) => !x).length;
  const share = open ? Math.max(30, Math.round((total - fixed) / open / 10) * 10) : 0;
  return r.steps.map((text, i) => ({ text, seconds: explicit[i] || share }));
}
export function planSeconds(s: Pick<MakeData, "recipes">, id: string) {
  const p = planFor(s, id, "en");
  return p.length ? p.reduce((a, x) => a + x.seconds, 0) : cookMinutes(dishById(id)) * 60;
}

export const stepAt = (c: CookSession | null, id: string, i: number): StepState | undefined => c?.steps[id]?.[i];
export const anyRunning = (c: CookSession | null) => Boolean(c) && Object.values(c!.steps).some((steps) => steps.some((s) => s.running));
export const dishRunning = (c: CookSession | null, id: string) => (c?.steps[id] || []).some((s) => s.running);
export const totalRemaining = (c: CookSession | null) => (c ? c.dishIds.reduce((a, id) => a + (c.steps[id] || []).reduce((b, s) => b + (s.done ? 0 : s.remaining), 0), 0) : 0);
export const totalSeconds = (c: CookSession | null) => (c ? c.dishIds.reduce((a, id) => a + (c.steps[id] || []).reduce((b, s) => b + s.seconds, 0), 0) : 0);
export const dishDone = (c: CookSession | null, id: string) => Boolean(c) && (c!.steps[id] || []).length > 0 && c!.steps[id].every((s) => s.done);
export const allDone = (c: CookSession | null) => Boolean(c) && c!.dishIds.length > 0 && c!.dishIds.every((id) => dishDone(c, id));
export const totalPct = (c: CookSession | null) => Math.round((1 - totalRemaining(c) / Math.max(1, totalSeconds(c))) * 100);

export function voteRows(s: Pick<MakeData, "votes" | "myVotes">, lang: Lang): VoteRow[] {
  const ids = Object.keys(VOTE_SEED).concat(s.myVotes.filter((id) => !(id in VOTE_SEED)));
  return ids
    .map((id) => ({ id, label: dishNameIn(dishById(id), lang), n: (s.votes[id] || 0) + (s.myVotes.includes(id) ? 1 : 0) }))
    .filter((v) => v.n > 0)
    .sort((a, b) => b.n - a.n);
}

/** The prototype's `tonightDetail` snapshot rows (what Home shows). */
export const cookedToday = (history: CookRecord[], id: string) => history.some((r) => r.date === todayKey && r.dishIds.includes(id));
export function tonightDetail(s: Pick<MakeData, "tonight" | "recipes" | "acquired" | "stock" | "cook" | "history">, lang: Lang) {
  return s.tonight.map((id) => {
    const d = dishById(id);
    const r = readiness(s, d, lang);
    return { id, name: dishNameIn(d, lang), img: hasDishImg(id) ? dishImg(id) : "", minutes: cookMinutes(d), ready: r.pct === 100, missing: r.missing.length, cooked: dishDone(s.cook, id) || cookedToday(s.history, id) };
  });
}

/* ───────── session helpers (mutate a cloned session) ───────── */
const cloneCook = (c: CookSession): CookSession => ({
  ...c,
  dishIds: c.dishIds.slice(),
  steps: Object.fromEntries(Object.entries(c.steps).map(([id, steps]) => [id, steps.map((s) => ({ ...s }))])),
  selected: { ...c.selected },
  timeline: c.timeline.slice(),
});
/** Appends a start / pause / resume event whenever "any timer running" flips. */
function recordRunning(c: CookSession, wasRunning: boolean, now = Date.now()) {
  const running = anyRunning(c);
  if (running === wasRunning) return;
  c.timeline.push({ kind: running ? (c.timeline.length ? "resume" : "start") : "pause", at: now });
}
/** Running stretches of a timeline: each start / resume up to the following pause (or `end`). */
export function timelineSegments(timeline: TimelineEvent[], end: number): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let open: number | null = null;
  timeline.forEach((e) => {
    if (e.kind === "pause") {
      if (open != null) out.push({ from: open, to: e.at });
      open = null;
    } else if (open == null) open = e.at;
  });
  if (open != null) out.push({ from: open, to: end });
  return out;
}
export const cookingSeconds = (timeline: TimelineEvent[], end: number) => Math.round(timelineSegments(timeline, end).reduce((a, x) => a + Math.max(0, x.to - x.from), 0) / 1000);
function firstUndone(c: CookSession, id: string) {
  const steps = c.steps[id] || [];
  const i = steps.findIndex((s) => !s.done);
  return i === -1 ? Math.max(0, steps.length - 1) : i;
}
function syncSteps(c: CookSession, s: Pick<MakeData, "recipes">) {
  c.dishIds.forEach((id) => {
    const plan = planFor(s, id, "en");
    if (!c.steps[id] || c.steps[id].length !== plan.length) c.steps[id] = plan.map((p) => ({ seconds: p.seconds, remaining: p.seconds, done: false, running: false, deadline: 0 }));
    if (c.selected[id] == null || c.selected[id] >= c.steps[id].length) c.selected[id] = firstUndone(c, id);
  });
}
function startStep(c: CookSession, id: string, i: number, now = Date.now()) {
  const s = c.steps[id]?.[i];
  if (!s || s.done) return false;
  if (s.remaining <= 0) s.remaining = s.seconds;
  s.deadline = now + s.remaining * 1000;
  s.running = true;
  c.selected[id] = i;
  return true;
}
function pauseStep(s: StepState, now: number) {
  s.remaining = Math.max(0, Math.ceil((s.deadline - now) / 1000));
  s.running = false;
  s.deadline = 0;
}

/* ───────── store ───────── */
export const useMakeStore = create<MakeState>()((set, get) => {
  /** run `fn` on a clone of the current session (no-op without one) and store the result */
  const withCook = (fn: (c: CookSession, s: MakeState) => void) => {
    const s = get();
    if (!s.cook) return;
    const c = cloneCook(s.cook);
    const was = anyRunning(s.cook);
    fn(c, s);
    recordRunning(c, was);
    set({ cook: c });
  };
  const persisted = Platform.OS === "web" ? readPersisted() : { tonight: normalizeTonight(null), cook: null, stock: normalizeStock(null), acquired: {}, cart: [], vendor: "instacart" as VendorId, history: [] as CookRecord[], myVotes: [], recipes: {} };
  return {
    ...persisted,
    votes: { ...VOTE_SEED },
    shots: 0,
    qty: {},
    matchMode: "stock",
    dishId: DISHES[0]?.id || "",
    filter: "All",
    recipeFilter: "All",
    planned: [],
    evDay: 0,
    evTime: "18:30",
    modalPane: "",
    fetching: [],
    skipGate: false,
    hydrated: Platform.OS === "web",

    setFilter: (filter) => set({ filter }),
    setRecipeFilter: (recipeFilter) => set({ recipeFilter }),
    setMatchMode: (matchMode) => set({ matchMode }),
    openDish: (id) => {
      if (!hasDish(id)) return;
      ensureRecipe(id);
      set({ dishId: id });
    },
    resetCapture: () => set({ shots: 0, qty: {} }),
    snap: () => set((s) => ({ shots: Math.min(s.shots + 1, SHOTS.length) })),
    setQty: (name, delta, lang) => {
      const c = capturedItems(get(), lang).find((x) => x.name === name);
      if (c) set((s) => ({ qty: { ...s.qty, [name]: Math.max(0, c.qty + delta) } }));
    },
    addCapturedToStock: (lang) => {
      const stock = get().stock.map((x) => ({ ...x }));
      capturedItems(get(), lang).forEach((c) => {
        const row = stock.find((x) => x.name === c.name);
        if (row) {
          row.qty += c.qty;
          row.added = "Today";
        } else stock.push({ name: c.name, zh: ITEMS[c.name].zh, qty: c.qty, where: "Fridge", added: "Today", size: ITEMS[c.name].size || { kind: "count" } });
      });
      set({ stock });
    },
    toggleVote: (id) => set((s) => ({ myVotes: s.myVotes.includes(id) ? s.myVotes.filter((x) => x !== id) : s.myVotes.concat(id) })),
    addTonight: (id) => {
      const s = get();
      if (!hasDish(id)) return;
      if (!s.tonight.includes(id)) set({ tonight: s.tonight.concat(id) });
      ensureRecipe(id);
      withCook((c, cur) => {
        if (!c.dishIds.includes(id)) c.dishIds.push(id);
        syncSteps(c, cur);
      });
    },
    removeTonight: (id) => {
      const s = get();
      set({ tonight: s.tonight.filter((x) => x !== id) });
      if (!s.cook) return;
      const c = cloneCook(s.cook);
      c.dishIds = c.dishIds.filter((x) => x !== id);
      delete c.steps[id];
      delete c.selected[id];
      if (c.active === id) c.active = c.dishIds[0] || "";
      if (c.paneB === id) c.paneB = null;
      if (!c.dishIds.length) {
        stopInterval();
        set({ cook: null });
      } else set({ cook: c });
    },
    toggleTonight: (id) => (get().tonight.includes(id) ? get().removeTonight(id) : get().addTonight(id)),
    toggleAcquired: (dishId, name) =>
      set((s) => {
        const list = s.acquired[dishId] || [];
        const acquired = { ...s.acquired, [dishId]: list.includes(name) ? list.filter((x) => x !== name) : list.concat(name) };
        const carted = s.cart.some((c) => c.dishId === dishId);
        if (!carted || s.cart.some((c) => c.dishId === dishId && c.name === name)) return { acquired };
        // a dish that's already queued keeps every still-missing ingredient queued, so un-ticking shows "Added" too
        const row = readiness({ ...s, acquired }, dishById(dishId), currentLang(), pantryNames(s)).missing.find((m) => m.name === name);
        return row ? { acquired, cart: s.cart.concat({ name: row.name, zh: row.label, amount: row.amount, dishId }) } : { acquired };
      }),
    addMissingToCart: (dishId, lang) => {
      const s = get();
      const d = dishById(dishId);
      const missing = readiness(s, d, lang, pantryNames(s)).missing;
      const cart = s.cart.slice();
      missing.forEach((m) => {
        if (!cart.some((c) => c.dishId === d.id && c.name === m.name)) cart.push({ name: m.name, zh: m.label, amount: m.amount, dishId: d.id });
      });
      set({ cart });
      return missing.length;
    },
    removeFromCart: (dishId, name) => set((s) => ({ cart: s.cart.filter((c) => !(c.dishId === dishId && c.name === name)) })),
    setVendor: (vendor) => set({ vendor }),
    setEvDay: (evDay) => set({ evDay }),
    setEvTime: (evTime) => set({ evTime }),
    savePlan: (dishId) => {
      const s = get();
      const d = dishById(dishId);
      const day = new Date(today);
      day.setDate(today.getDate() + s.evDay);
      set({ planned: s.planned.concat({ dishId: d.id, day: day.toDateString(), time: s.evTime }) });
      if (s.evDay === 0) get().addTonight(d.id);
      return { day, time: s.evTime };
    },
    setModalPane: (modalPane) => set({ modalPane }),
    pickDish: (id) => {
      const s = get();
      if (s.tonight.includes(id)) {
        get().removeTonight(id);
        return false;
      }
      get().addTonight(id);
      withCook((c) => {
        if (s.modalPane === "B") c.paneB = id;
        else c.active = id;
      });
      return true;
    },
    stockQty: (name, delta) => set((s) => ({ stock: s.stock.map((x) => (x.name === name ? { ...x, qty: Math.max(0, x.qty + delta) } : x)) })),
    stockRemove: (name) => set((s) => ({ stock: s.stock.filter((x) => x.name !== name) })),
    beginCook: (id) => {
      const s = get();
      if (id && readiness(s, dishById(id), "en").pct < 100) return "needAll";
      if (!id && !allTonightReady(s)) return "needAll";
      if (!startSession(id)) return "empty";
      set({ skipGate: true });
      announceMeal();
      return "ok";
    },
    enterCook: () => {
      const s = get();
      if (s.skipGate) {
        set({ skipGate: false });
        return Boolean(get().cook && get().cook!.dishIds.length);
      }
      return allTonightReady(s) && startSession(null);
    },
    finishCook: () => {
      stopInterval();
      const c = get().cook;
      if (!c) return null;
      const now = Date.now();
      const timeline = c.timeline.slice();
      if (anyRunning(c)) timeline.push({ kind: "pause", at: now });
      const record: CookRecord = { id: `${c.date}-${now}`, date: c.date, dishIds: c.dishIds.slice(), timeline, startedAt: timeline[0]?.at ?? now, finishedAt: now, totalSeconds: cookingSeconds(timeline, now), photos: {} };
      set({ cook: null, history: [record, ...get().history] });
      return record;
    },
    addHistoryPhoto: (recordId, dishId, uri) => set((s) => ({ history: s.history.map((r) => (r.id === recordId ? { ...r, photos: { ...r.photos, [dishId]: (r.photos[dishId] || []).concat(uri) } } : r)) })),
    toggleSplit: () =>
      withCook((c) => {
        c.split = !c.split;
        if (c.split && (!c.paneB || c.paneB === c.active)) c.paneB = c.dishIds.find((x) => x !== c.active) || null;
      }),
    setActiveDish: (id) => withCook((c) => { c.active = id; }),
    setPaneDish: (pane, id) =>
      withCook((c) => {
        if (pane === "A") {
          c.active = id;
          if (c.paneB === id) c.paneB = c.dishIds.find((x) => x !== id) || null;
        } else {
          c.paneB = id;
          if (c.active === id) c.active = c.dishIds.find((x) => x !== id) || id;
        }
      }),
    selectStep: (id, i) => withCook((c) => { c.selected[id] = i; }),
    toggleTimer: (id, i) => {
      withCook((c) => {
        const s = c.steps[id]?.[i];
        if (!s || s.done) return;
        if (s.running) {
          pauseStep(s, Date.now());
          c.selected[id] = i;
        } else startStep(c, id, i);
      });
      ensureInterval();
    },
    startAll: () => {
      withCook((c) => {
        c.dishIds.forEach((id) => {
          const steps = c.steps[id] || [];
          if (!steps.length || steps.every((s) => s.done) || steps.some((s) => s.running)) return;
          const sel = c.selected[id];
          const i = steps[sel] && !steps[sel].done ? sel : firstUndone(c, id);
          startStep(c, id, i);
        });
      });
      ensureInterval();
    },
    pauseAll: () => {
      const now = Date.now();
      withCook((c) => c.dishIds.forEach((id) => (c.steps[id] || []).forEach((s) => { if (s.running) pauseStep(s, now); })));
      stopInterval();
    },
    addMinute: (id, i) =>
      withCook((c) => {
        const s = c.steps[id]?.[i];
        if (!s) return;
        s.remaining += 60;
        if (s.running) s.deadline += 60000;
        if (s.done) s.done = false;
      }),
    resetStep: (id, i) =>
      withCook((c) => {
        const s = c.steps[id]?.[i];
        if (!s) return;
        s.remaining = s.seconds;
        s.running = false;
        s.deadline = 0;
        s.done = false;
      }),
    completeStep: (id, i) =>
      withCook((c) => {
        const s = c.steps[id]?.[i];
        if (!s) return;
        s.done = !s.done;
        s.running = false;
        s.deadline = 0;
        s.remaining = s.done ? 0 : s.seconds;
        c.selected[id] = s.done ? firstUndone(c, id) : i;
      }),
  };
});

/* ───────── session start / meal mirror ───────── */
function startSession(activeId: string | null): boolean {
  const store = useMakeStore;
  if (activeId) store.getState().addTonight(activeId);
  const s = store.getState();
  const ids = s.tonight.slice();
  if (!ids.length) return false;
  ids.forEach(ensureRecipe);
  let c: CookSession;
  if (!s.cook) c = { date: todayKey, dishIds: ids, active: activeId || ids[0], split: false, paneB: null, steps: {}, selected: {}, timeline: [] };
  else {
    c = cloneCook(s.cook);
    ids.forEach((id) => { if (!c.dishIds.includes(id)) c.dishIds.push(id); });
    if (activeId) c.active = activeId;
    if (!c.dishIds.includes(c.active)) c.active = c.dishIds[0];
  }
  syncSteps(c, s);
  store.setState({ cook: c });
  ensureInterval();
  return true;
}

/** The prototype's `meal` message: tell the device what tonight's menu is. */
function announceMeal() {
  const s = useMakeStore.getState();
  if (!s.cook) return;
  const lang = currentLang();
  const recipeTitle = s.cook.dishIds.map((x) => dishNameIn(dishById(x), lang)).join(sepIn(lang));
  const recipeId = s.cook.active;
  useDeviceStore.setState((d) => ({ dinner: { ...d.dinner, recipeTitle, recipeId } }));
  toast(appT("今晚菜單：{title}", { title: recipeTitle }));
}

/* ───────── timer engine ───────── */
let interval: ReturnType<typeof setInterval> | null = null;
function ensureInterval() {
  if (!interval && anyRunning(useMakeStore.getState().cook)) interval = setInterval(tick, 500);
}
function stopInterval() {
  if (interval) clearInterval(interval);
  interval = null;
}
function tick() {
  const cur = useMakeStore.getState().cook;
  if (!cur) return stopInterval();
  const c = cloneCook(cur);
  const now = Date.now();
  const was = anyRunning(cur);
  let finished = false;
  let changed = false;
  c.dishIds.forEach((id) =>
    (c.steps[id] || []).forEach((s, i) => {
      if (!s.running) return;
      const remaining = Math.max(0, Math.ceil((s.deadline - now) / 1000));
      if (remaining !== s.remaining) changed = true;
      s.remaining = remaining;
      if (remaining === 0) {
        s.running = false;
        s.done = true;
        s.deadline = 0;
        finished = true;
        /* the dish keeps going: the next unfinished step starts on its own */
        const steps = c.steps[id];
        let next = steps.findIndex((x, j) => j > i && !x.done);
        if (next === -1) next = steps.findIndex((x) => !x.done);
        if (next !== -1) startStep(c, id, next, now);
        else c.selected[id] = i;
      }
    }),
  );
  recordRunning(c, was, now);
  if (changed || finished) useMakeStore.setState({ cook: c });
  if (finished) {
    beep();
    toast(strings().timerDone);
  }
  if (!anyRunning(c)) stopInterval();
}

/** Short 880 Hz beep through WebAudio (web only, guarded). */
function beep() {
  if (Platform.OS !== "web" || typeof window === "undefined") return;
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Ctx = w.AudioContext || w.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    o.stop(ctx.currentTime + 0.35);
    o.onended = () => { void ctx.close(); };
  } catch {
    /* audio unavailable */
  }
}

/* ───────── TheMealDB (lazy, cached) ───────── */
export function ensureRecipe(id: string) {
  const s = useMakeStore.getState();
  const d = DISHES.find((x) => x.id === id);
  if (!d || !d.mealId || s.recipes[id] || s.fetching.includes(id) || typeof fetch !== "function") return;
  useMakeStore.setState({ fetching: s.fetching.concat(id) });
  fetch("https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + d.mealId)
    .then((r) => r.json())
    .then((j: { meals?: Record<string, string | null>[] }) => {
      const m = (j.meals || [])[0];
      if (!m) return;
      const ing: DishIngredient[] = [];
      for (let i = 1; i <= 20; i++) {
        const n = m["strIngredient" + i];
        if (n && n.trim()) ing.push([n.trim(), "", (m["strMeasure" + i] || "").trim()]);
      }
      const raw = String(m.strInstructions || "").split(/\r?\n+/).map((x) => x.trim().replace(/^(step\s*)?\d+[.):]?\s*/i, "")).filter((x) => x.length > 2);
      const steps: string[] = [];
      raw.forEach((line) => {
        if (/:$/.test(line) && line.length < 60) steps.push(line);
        else if (steps.length && /:$/.test(steps[steps.length - 1]) && steps[steps.length - 1].length < 60) steps[steps.length - 1] += " " + line;
        else steps.push(line);
      });
      const recipe: Recipe = { ing, steps, source: m.strSource || "https://www.themealdb.com/meal/" + d.mealId, title: m.strMeal || d.name };
      const cur = useMakeStore.getState();
      const recipes = { ...cur.recipes, [id]: recipe };
      let cook = cur.cook;
      if (cook && cook.dishIds.includes(id)) {
        cook = cloneCook(cook);
        syncSteps(cook, { recipes });
      }
      useMakeStore.setState({ recipes, cook });
    })
    .catch(() => {})
    .finally(() => useMakeStore.setState((cur) => ({ fetching: cur.fetching.filter((x) => x !== id) })));
}

/* ───────── persistence & boot ───────── */
useMakeStore.subscribe((s, prev) => {
  if (!s.hydrated) return;
  if (s.tonight !== prev.tonight) saveJSON(KEYS.tonight, { date: todayKey, ids: s.tonight });
  if (s.cook !== prev.cook) saveJSON(KEYS.cook, s.cook);
  if (s.stock !== prev.stock) saveJSON(KEYS.stock, s.stock);
  if (s.cart !== prev.cart) saveJSON(KEYS.cart, s.cart);
  if (s.vendor !== prev.vendor) saveJSON(KEYS.vendor, s.vendor);
  if (s.history !== prev.history) saveJSON(KEYS.history, s.history);
  if (s.acquired !== prev.acquired) saveJSON(KEYS.acquired, s.acquired);
  if (s.myVotes !== prev.myVotes) saveJSON(KEYS.votes, s.myVotes);
  if (s.recipes !== prev.recipes) saveJSON(KEYS.mealdb, s.recipes);
});

function boot() {
  const s = useMakeStore.getState();
  if (s.cook) {
    const c = cloneCook(s.cook);
    syncSteps(c, s);
    useMakeStore.setState({ cook: c });
    ensureInterval();
    if (anyRunning(c)) tick();
  }
  s.tonight.forEach(ensureRecipe);
}

if (Platform.OS === "web") boot();
else {
  void Promise.all([
    loadJSONAsync<StoredTonight>(KEYS.tonight, null),
    loadJSONAsync<CookSession | null>(KEYS.cook, null),
    loadJSONAsync<StockRow[] | null>(KEYS.stock, null),
    loadJSONAsync<Record<string, string[]>>(KEYS.acquired, {}),
    loadJSONAsync<CartItem[]>(KEYS.cart, []),
    loadJSONAsync<VendorId>(KEYS.vendor, "instacart"),
    loadJSONAsync<CookRecord[]>(KEYS.history, []),
    loadJSONAsync<string[]>(KEYS.votes, []),
    loadJSONAsync<Record<string, Recipe>>(KEYS.mealdb, {}),
  ]).then(([tonight, cook, stock, acquired, cart, vendor, history, myVotes, recipes]) => {
    useMakeStore.setState({ tonight: normalizeTonight(tonight), cook: normalizeCook(cook), stock: normalizeStock(stock), acquired, cart, vendor, history: normalizeHistory(history), myVotes, recipes, hydrated: true });
    boot();
  });
}
