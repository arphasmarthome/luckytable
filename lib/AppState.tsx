"use client";

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { FAMILY, FamilyMember, STAPLES_LIST, VOTE_SEED, buildWeek, WeekDay, CalendarEvent } from "./family";
import { STOCK, StockItem, DISHES } from "./dishes";
import { Lang } from "./i18n";

export type FamPrefs = Record<string, { likes: [string, string][]; dislikes: [string, string][]; allergies: [string, string][]; cook: number[] }>;

type State = {
  lang: Lang;
  calWho: string;
  famWho: string;
  staples: string[];
  atStore: boolean;
  shots: number;
  qty: Record<string, number>;
  stock: StockItem[];
  week: WeekDay[];
  view: "week" | "month";
  votes: Record<string, number>;
  myVotes: string[];
  members: FamilyMember[];
  newMember: string;
  famPrefs: FamPrefs;
  modalOpen: boolean;
  evDay: number;
  evTime: string;
  evWho: string;
  evDish: string;
  evCustom: string;
  checkedByDish: Record<string, boolean[]>;
};

type Ctx = State & {
  setLang: (l: Lang) => void;
  setCalWho: (k: string) => void;
  setFamWho: (k: string) => void;
  setView: (v: "week" | "month") => void;
  toggleStaple: (en: string) => void;
  toggleLocation: () => void;
  snap: () => void;
  resetCapture: () => void;
  incCapturedQty: (name: string, base: number) => void;
  decCapturedQty: (name: string, base: number) => void;
  incStock: (name: string) => void;
  decStock: (name: string) => void;
  removeStock: (name: string) => void;
  addCapturedToStock: (captured: { name: string; qty: number }[]) => void;
  addMember: (name: string) => void;
  removeMember: (key: string) => void;
  setNewMember: (v: string) => void;
  toggleCookDay: (key: string, day: number) => void;
  addPref: (field: "likes" | "dislikes" | "allergies", en: string, zh?: string) => void;
  removePref: (field: "likes" | "dislikes" | "allergies", key: string, ix: number) => void;
  toggleVote: (dishId: string) => void;
  openNewEvent: (prefill?: Partial<Pick<State, "evDay" | "evDish" | "evWho" | "evTime">>) => void;
  closeModal: () => void;
  setEvDay: (i: number) => void;
  setEvTime: (v: string) => void;
  setEvWho: (v: string) => void;
  setEvDish: (v: string) => void;
  setEvCustom: (v: string) => void;
  saveEvent: () => void;
  toggleMenuTonight: (dish: { id: string; name: string; zh: string }) => void;
  toggleDishIngredient: (dishId: string, ix: number, fallback: boolean[]) => void;
};

const AppContext = createContext<Ctx | null>(null);

function cookWeekId() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [calWho, setCalWho] = useState("all");
  const [famWho, setFamWho] = useState("dad");
  const [staples, setStaples] = useState<string[]>(STAPLES_LIST.filter((x) => x[2]).map((x) => x[0]));
  const [atStore, setAtStore] = useState(false);
  const [shots, setShots] = useState(0);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [stock, setStock] = useState<StockItem[]>(STOCK.slice());
  const [week, setWeek] = useState<WeekDay[]>(() => buildWeek());
  const [view, setView] = useState<"week" | "month">("week");
  const [votes] = useState<Record<string, number>>(Object.assign({}, VOTE_SEED));
  const [myVotes, setMyVotes] = useState<string[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>(FAMILY.slice());
  const [newMember, setNewMember] = useState("");
  const [famPrefs, setFamPrefs] = useState<FamPrefs>(() =>
    FAMILY.reduce((a, p) => {
      a[p.key] = { likes: p.likes.slice(), dislikes: p.dislikes.slice(), allergies: p.allergies.slice(), cook: p.stars.slice() };
      return a;
    }, {} as FamPrefs)
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [evDay, setEvDay] = useState(0);
  const [evTime, setEvTime] = useState("18:30");
  const [evWho, setEvWho] = useState("dad");
  const [evDish, setEvDish] = useState("");
  const [evCustom, setEvCustom] = useState("");
  const [checkedByDish, setCheckedByDish] = useState<Record<string, boolean[]>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("luckytable-cook");
      if (raw) {
        const j = JSON.parse(raw);
        setFamPrefs((prev) => {
          const fam = Object.assign({}, prev);
          Object.keys(fam).forEach((k) => {
            const cook = j.week === cookWeekId() && j.cook && j.cook[k] ? j.cook[k] : [0, 0, 0, 0, 0, 0, 0];
            fam[k] = Object.assign({}, fam[k], { cook });
          });
          return fam;
        });
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveCook(next: FamPrefs) {
    try {
      const cook: Record<string, number[]> = {};
      Object.keys(next).forEach((k) => {
        cook[k] = next[k].cook;
      });
      localStorage.setItem("luckytable-cook", JSON.stringify({ week: cookWeekId(), cook }));
    } catch {
      /* ignore */
    }
  }

  const value = useMemo<Ctx>(
    () => ({
      lang, calWho, famWho, staples, atStore, shots, qty, stock, week, view, votes, myVotes,
      members, newMember, famPrefs, modalOpen, evDay, evTime, evWho, evDish, evCustom, checkedByDish,

      setLang,
      setCalWho,
      setFamWho,
      setView,

      toggleStaple: (en) =>
        setStaples((prev) => (prev.indexOf(en) !== -1 ? prev.filter((x) => x !== en) : prev.concat([en]))),

      toggleLocation: () => setAtStore((prev) => !prev),

      snap: () => setShots((prev) => Math.min(prev + 1, 4)),
      resetCapture: () => {
        setShots(0);
        setQty({});
      },
      incCapturedQty: (name, base) =>
        setQty((prev) => Object.assign({}, prev, { [name]: (prev[name] !== undefined ? prev[name] : base) + 1 })),
      decCapturedQty: (name, base) =>
        setQty((prev) => Object.assign({}, prev, { [name]: Math.max(0, (prev[name] !== undefined ? prev[name] : base) - 1) })),

      incStock: (name) =>
        setStock((prev) => prev.map((r) => (r.name === name ? Object.assign({}, r, { qty: r.qty + 1 }) : r))),
      decStock: (name) =>
        setStock((prev) => prev.map((r) => (r.name === name ? Object.assign({}, r, { qty: Math.max(0, r.qty - 1) }) : r))),
      removeStock: (name) => setStock((prev) => prev.filter((r) => r.name !== name)),

      addCapturedToStock: (captured) =>
        setStock((prev) => {
          const next = prev.map((x) => Object.assign({}, x));
          captured.forEach((c) => {
            const row = next.find((x) => x.name === c.name);
            if (row) {
              row.qty += c.qty;
              row.added = "Today";
            }
          });
          return next;
        }),

      addMember: (name) => {
        const v = String(name || "").trim();
        if (!v) return;
        setMembers((prev) => {
          const pal = [
            { tint: "var(--color-accent-2-100)", ink: "var(--color-accent-2-800)", dot: "var(--color-accent-2-500)", fill: "var(--color-accent-2-700)" },
            { tint: "var(--color-accent-100)", ink: "var(--color-accent-800)", dot: "var(--color-accent-500)", fill: "var(--color-accent-700)" },
            { tint: "var(--color-neutral-200)", ink: "var(--color-neutral-800)", dot: "var(--color-neutral-600)", fill: "var(--color-neutral-800)" }
          ][prev.length % 3];
          const key = "m" + Date.now();
          const p: FamilyMember = Object.assign(
            { key, name: v, zh: v, initial: v.charAt(0).toUpperCase(), role: "", roleZh: "", note: "", noteZh: "", stars: [0, 0, 0, 0, 0, 0, 0], likes: [], dislikes: [], allergies: [] },
            pal
          );
          setFamPrefs((fp) => Object.assign({}, fp, { [key]: { likes: [], dislikes: [], allergies: [], cook: [0, 0, 0, 0, 0, 0, 0] } }));
          setFamWho(key);
          return prev.concat([p]);
        });
        setNewMember("");
      },

      removeMember: (key) =>
        setMembers((prev) => {
          const next = prev.filter((p) => p.key !== key);
          if (!next.length) return prev;
          setFamWho((cur) => (cur === key ? next[0].key : cur));
          setCalWho((cur) => (cur === key ? "all" : cur));
          setEvWho((cur) => (cur === key ? "all" : cur));
          return next;
        }),

      setNewMember,

      toggleCookDay: (key, day) =>
        setFamPrefs((prev) => {
          const fpp = prev[key];
          const cook = fpp.cook.slice();
          cook[day] = cook[day] ? 0 : 1;
          const next = Object.assign({}, prev, { [key]: Object.assign({}, fpp, { cook }) });
          saveCook(next);
          return next;
        }),

      addPref: (field, en, zh) => {
        const v = String(en || "").trim();
        if (!v) return;
        setFamPrefs((prev) => {
          const fpp = prev[famWho];
          if (fpp[field].some((x) => String(x[0]).toLowerCase() === v.toLowerCase())) return prev;
          const next = Object.assign({}, fpp);
          next[field] = fpp[field].concat([[v, zh || v]]);
          return Object.assign({}, prev, { [famWho]: next });
        });
      },
      removePref: (field, key, ix) =>
        setFamPrefs((prev) => {
          const fpp = prev[key];
          const next = Object.assign({}, fpp);
          next[field] = fpp[field].filter((_, i) => i !== ix);
          return Object.assign({}, prev, { [key]: next });
        }),

      toggleVote: (dishId) =>
        setMyVotes((prev) => (prev.indexOf(dishId) !== -1 ? prev.filter((x) => x !== dishId) : prev.concat([dishId]))),

      openNewEvent: (prefill) => {
        setEvDay(prefill?.evDay ?? 0);
        setEvDish(prefill?.evDish ?? "");
        setEvCustom("");
        setEvWho(prefill?.evWho ?? "dad");
        setEvTime(prefill?.evTime ?? "18:30");
        setModalOpen(true);
      },
      closeModal: () => setModalOpen(false),
      setEvDay,
      setEvTime,
      setEvWho,
      setEvDish,
      setEvCustom,

      saveEvent: () => {
        const d0 = DISHES.find((x) => x.id === evDish);
        const title = d0 ? d0.name : evCustom.trim();
        if (!title) return;
        setWeek((prev) => {
          const wk = prev.map((w) => Object.assign({}, w, { items: w.items.slice() }));
          const item: CalendarEvent = [evTime, title, d0 ? d0.zh : title, evWho, d0 ? 1 : 0, d0 ? d0.id : undefined];
          wk[evDay].items.push(item);
          wk[evDay].items.sort((a, b) => (a[0] < b[0] ? -1 : 1));
          return wk;
        });
        setModalOpen(false);
      },

      toggleMenuTonight: (dish) =>
        setWeek((prev) => {
          const wk = prev.map((w) => Object.assign({}, w, { items: w.items.slice() }));
          const ix = wk[0].items.findIndex((x) => x[5] === dish.id);
          if (ix !== -1) {
            wk[0].items.splice(ix, 1);
          } else {
            const item: CalendarEvent = ["18:30", dish.name, dish.zh, "all", 1, dish.id];
            wk[0].items.push(item);
            wk[0].items.sort((a, b) => (a[0] < b[0] ? -1 : 1));
          }
          return wk;
        }),

      toggleDishIngredient: (dishId, ix, fallback) =>
        setCheckedByDish((prev) => {
          const current = prev[dishId] || fallback;
          const next = current.map((v, i) => (i === ix ? !v : v));
          return Object.assign({}, prev, { [dishId]: next });
        })
    }),
    [lang, calWho, famWho, staples, atStore, shots, qty, stock, week, view, votes, myVotes, members, newMember, famPrefs, modalOpen, evDay, evTime, evWho, evDish, evCustom, checkedByDish]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
