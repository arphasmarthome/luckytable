/* Shared device state (port of the shell state in prototype/device/app.js).
 * Members, tonight's diners, events, tasks, rewards, points ledger and settings live here.
 * Household data (members + diners) and settings persist; the rest resets like the prototype.
 * Feature modules mutate through the actions below or `useDeviceStore.setState`. */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { t, weekday, list as joinList } from "@/i18n";
import { dateKey, today, todayKey, uid } from "@/lib/date";
import { zustandStorage } from "@/lib/storage";

export type Prefs = { likes: string[]; dislikes: string[]; allergies: string[]; cook: number[] };
export type HealthRecord = { date: string; weight: number };
export type Health = {
  height: number;
  weight: number;
  age: number;
  sex: "male" | "female";
  activity: number;
  goal: "maintain" | "lose" | "gain";
  records: HealthRecord[];
};
export type Member = {
  id: string;
  name: string;
  /** Traditional Chinese role string; pass through t() to display */
  role: string;
  color: string;
  initials: string;
  initial: string;
  age: number | null;
  points: number;
  allergy: string;
  preference: string;
  prefs: Prefs;
  health: Health;
};
export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  endTime: string;
  memberId: string;
  location?: string;
  source: "manual" | "voice";
  done: boolean;
};
export type Task = { id: string; title: string; memberId: string; points: number; completions: string[]; completionPoints: Record<string, number>; archived?: boolean };
export type Reward = { id: string; title: string; memberId: string; cost: number; redeemed: boolean; redeemedAt?: string };
export type PointsLogEntry = { id: string; memberId: string; amount: number; title: string; type: string; at: string; date: string };
export type SettingsSection = "device" | "display" | "family" | "reminders" | "frame";
export type Settings = {
  section: SettingsSection;
  wifi: boolean;
  network: string;
  brightness: number;
  city: string;
  units: "metric" | "imperial";
  reminders: boolean;
  leadTime: number;
  notificationPermission: boolean;
  offlineDownloaded: boolean;
  paired: boolean;
  autoPlayMotion: boolean;
  effectType: "action-extension" | "weather-transition";
  weatherPreset: "sunlight" | "clouds" | "rain" | "snow";
  version: string;
  updateAvailable: boolean;
  synced: boolean;
};

export type DeviceData = {
  members: Member[];
  dinnerMembers: string[];
  dinner: { time: string; recipeTitle: string; recipeId: string };
  events: CalendarEvent[];
  tasks: Task[];
  /** deleted tasks keep their growth record */
  archivedTasks: Task[];
  rewards: Reward[];
  pointsLog: PointsLogEntry[];
  settings: Settings;
  calendar: { view: "year" | "month" | "week" | "day"; date: string; member: string };
  family: { member: string; tab: string; growthMode: "month" | "year"; growthMonth: string };
  health: { member: string; tab: string; wearables: Record<string, any> };
  household: { selected: string; field: "likes" | "dislikes" | "allergies" };
  /** photo-frame summary for Settings → 相框 */
  photoCount: number;
  motionCount: number;
};

export type DeviceActions = {
  setSettings: (patch: Partial<Settings>) => void;
  setDinner: (memberId: string, joining: boolean) => void;
  setDinnerMembers: (ids: string[]) => void;
  addMember: (name: string) => Member;
  removeMember: (id: string) => void;
  toggleCookDay: (memberId: string, day: number) => void;
  addPref: (memberId: string, field: keyof Omit<Prefs, "cook">, value: string) => void;
  removePref: (memberId: string, field: keyof Omit<Prefs, "cook">, index: number) => void;
  setHousehold: (patch: Partial<DeviceData["household"]>) => void;
  /** Toggle today's completion of a task, moving points and writing the ledger (the prototype's fam-complete). */
  completeTask: (taskId: string) => { ok: boolean; message: string };
  addPointsLog: (memberId: string, amount: number, title: string, type: string) => void;
};
export type DeviceState = DeviceData & DeviceActions;

const HOUSEHOLD_SEED: Record<string, Prefs> = {
  james: { likes: ["牛肉", "蒜頭", "白米飯", "辣的菜", "湯品"], dislikes: ["香菜", "苦瓜"], allergies: [], cook: [1, 0, 0, 1, 0, 0, 0] },
  sophia: { likes: ["湯品", "豆腐", "白米飯", "番茄", "蒜頭"], dislikes: ["香菜", "內臟"], allergies: [], cook: [0, 1, 0, 0, 1, 0, 0] },
  emma: { likes: ["雞蛋", "白米飯", "花椰菜", "湯品"], dislikes: ["辣的菜", "香菜", "菇類"], allergies: ["花生"], cook: [0, 0, 0, 0, 1, 0, 0] },
  oliver: { likes: ["雞蛋", "咖哩", "白米飯"], dislikes: ["辣的菜", "炸物"], allergies: [], cook: [0, 0, 0, 0, 0, 0, 1] },
};
export const HOUSEHOLD_SUGGEST: Record<"likes" | "dislikes" | "allergies", string[]> = {
  likes: ["牛肉", "豆腐", "湯品", "海鮮", "雞蛋", "辣的菜"],
  dislikes: ["香菜", "菇類", "苦瓜", "內臟", "炸物", "辣的菜"],
  allergies: ["花生", "帶殼海鮮", "雞蛋", "牛奶", "麩質", "大豆"],
};
export const HOUSEHOLD_COLORS = ["#38829b", "#d47860", "#9d79ad", "#b28c37", "#3f8f6b", "#8a6bb8"];
/** prefs.cook runs Mon..Sun; index of today */
export const cookIndexToday = (today.getDay() + 6) % 7;

export const emptyPrefs = (): Prefs => ({ likes: [], dislikes: [], allergies: [], cook: [0, 0, 0, 0, 0, 0, 0] });
const defaultHealth = (age: number | null): Health => ({ height: 165, weight: 60, age: age || 30, sex: "female", activity: 1.4, goal: "maintain", records: [] });

/** Keeps the free-text diet summary (used by health / recipes) in step with the structured prefs. */
export function syncDiet(person: Member): Member {
  const p = person.prefs;
  person.allergy = p.allergies.length ? `${p.allergies.join("、")}過敏` : "無已知過敏";
  person.preference = p.likes.length ? p.likes.slice(0, 3).join("、") : person.preference || "";
  return person;
}

function seedMembers(): Member[] {
  const base = [
    { id: "james", name: "James", role: "爸爸", color: "#38829b", initials: "J", age: 38 },
    { id: "sophia", name: "Sophia", role: "媽媽", color: "#d47860", initials: "S", age: 36 },
    { id: "emma", name: "Emma", role: "女兒", color: "#9d79ad", initials: "E", age: 10 },
    { id: "oliver", name: "Oliver", role: "兒子", color: "#b28c37", initials: "O", age: 7 },
  ];
  const healthSamples: Omit<Health, "records">[] = [
    { height: 176, weight: 73, age: 38, sex: "male", activity: 1.4, goal: "maintain" },
    { height: 163, weight: 56, age: 36, sex: "female", activity: 1.55, goal: "maintain" },
    { height: 140, weight: 33, age: 10, sex: "female", activity: 1.4, goal: "maintain" },
    { height: 122, weight: 24, age: 7, sex: "male", activity: 1.4, goal: "maintain" },
  ];
  return base.map((person, i) =>
    syncDiet({
      ...person,
      initial: person.initials,
      points: [40, 35, 75, 50][i],
      allergy: i === 2 ? "花生過敏" : "無已知過敏",
      preference: i > 1 ? "口味清淡、少辣" : "蔬菜、家常料理",
      prefs: JSON.parse(JSON.stringify(HOUSEHOLD_SEED[person.id])),
      health: { ...healthSamples[i], records: [] },
    }),
  );
}

function seedEvents(): CalendarEvent[] {
  const events: CalendarEvent[] = [
    { id: "event-1", title: "晨間散步", date: todayKey, time: "07:30", endTime: "08:00", memberId: "james", location: "社區公園", source: "manual", done: false },
    { id: "event-2", title: "鋼琴課", date: todayKey, time: "16:00", endTime: "17:00", memberId: "emma", location: "音樂教室", source: "manual", done: false },
    { id: "event-3", title: "接 Oliver 放學", date: todayKey, time: "17:15", endTime: "17:45", memberId: "sophia", location: "小學門口", source: "manual", done: false },
    { id: "event-4", title: "一起吃晚餐", date: todayKey, time: "18:30", endTime: "19:30", memberId: "family", location: "家裡", source: "manual", done: false },
  ];
  const relative: [number, string, string, string][] = [
    [1, "採買一週食材", "sophia", "10:00"],
    [2, "足球練習", "oliver", "16:00"],
    [3, "週末家庭野餐", "family", "11:00"],
    [-1, "牙齒定期檢查", "emma", "15:00"],
  ];
  for (const [offset, title, memberId, time] of relative) {
    const day = new Date(today);
    day.setDate(day.getDate() + offset);
    events.push({ id: `event-relative-${offset}`, title, memberId, date: dateKey(day), time, endTime: "", source: "manual", done: false });
  }
  return events;
}

export function seedData(): DeviceData {
  const members = seedMembers();
  return {
    members,
    dinnerMembers: members.map((m) => m.id),
    dinner: { time: "18:30", recipeTitle: "", recipeId: "" },
    events: seedEvents(),
    tasks: [
      { id: "task-1", title: "閱讀 20 分鐘", memberId: "emma", points: 10, completions: [], completionPoints: {} },
      { id: "task-2", title: "整理自己的書包", memberId: "oliver", points: 5, completions: [], completionPoints: {} },
      { id: "task-3", title: "晚餐後一起收拾", memberId: "james", points: 5, completions: [], completionPoints: {} },
      { id: "task-4", title: "睡前整理書桌", memberId: "emma", points: 5, completions: [], completionPoints: {} },
      { id: "task-5", title: "每天散步 30 分鐘", memberId: "sophia", points: 10, completions: [], completionPoints: {} },
    ],
    rewards: [
      { id: "reward-1", title: "週末一起看電影", memberId: "emma", cost: 80, redeemed: false },
      { id: "reward-2", title: "選一套喜歡的積木", memberId: "oliver", cost: 100, redeemed: false },
      { id: "reward-3", title: "週末野餐", memberId: "james", cost: 50, redeemed: false },
    ],
    archivedTasks: [],
    pointsLog: [],
    settings: {
      section: "device",
      wifi: true,
      network: "Family_WiFi",
      brightness: 85,
      city: "臺北市",
      units: "metric",
      reminders: true,
      leadTime: 15,
      notificationPermission: false,
      offlineDownloaded: false,
      paired: true,
      autoPlayMotion: true,
      effectType: "action-extension",
      weatherPreset: "clouds",
      version: "0.18.0",
      updateAvailable: true,
      synced: false,
    },
    calendar: { view: "month", date: todayKey, member: "all" },
    family: { member: "emma", tab: "tasks", growthMode: "month", growthMonth: "" },
    health: { member: "james", tab: "profile", wearables: {} },
    household: { selected: members[0]?.id || "", field: "likes" },
    photoCount: 4,
    motionCount: 2,
  };
}

/** Fill in any fields a stored member might be missing (older saves / new members). */
function normalizeMember(stored: Partial<Member>, index: number): Member | null {
  if (!stored || typeof stored.id !== "string") return null;
  const seed = seedMembers().find((m) => m.id === stored.id);
  const name = String(stored.name || seed?.name || stored.id);
  const initials = stored.initials || seed?.initials || name.slice(0, 1).toUpperCase();
  const prefs: Prefs = { ...emptyPrefs(), ...(seed?.prefs || {}), ...(stored.prefs || {}) };
  if (!Array.isArray(prefs.cook) || prefs.cook.length !== 7) prefs.cook = [0, 0, 0, 0, 0, 0, 0];
  const member: Member = {
    id: stored.id,
    name,
    role: stored.role || seed?.role || "家人|role",
    color: stored.color || seed?.color || HOUSEHOLD_COLORS[index % HOUSEHOLD_COLORS.length],
    initials,
    initial: stored.initial || initials,
    age: stored.age ?? seed?.age ?? null,
    points: typeof stored.points === "number" ? stored.points : seed?.points ?? 0,
    allergy: stored.allergy || seed?.allergy || "無已知過敏",
    preference: stored.preference || seed?.preference || "",
    prefs,
    health: { ...defaultHealth(stored.age ?? null), ...(seed?.health || {}), ...(stored.health || {}), records: stored.health?.records || seed?.health?.records || [] },
  };
  return syncDiet(member);
}

export function newMember(name: string, index: number): Member {
  const id = `member-${Date.now().toString(36)}`;
  return syncDiet({
    id,
    name,
    role: "家人|role",
    color: HOUSEHOLD_COLORS[index % HOUSEHOLD_COLORS.length],
    initials: name.slice(0, 1).toUpperCase(),
    initial: name.slice(0, 1).toUpperCase(),
    age: null,
    points: 0,
    allergy: "",
    preference: "",
    prefs: emptyPrefs(),
    health: defaultHealth(null),
  });
}

const logEntry = (memberId: string, amount: number, title: string, type: string): PointsLogEntry => ({ id: uid("points"), memberId, amount, title, type, at: new Date().toISOString(), date: todayKey });

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set, get) => ({
      ...seedData(),
      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setDinner: (memberId, joining) =>
        set((s) => ({ dinnerMembers: joining ? [...new Set([...s.dinnerMembers, memberId])] : s.dinnerMembers.filter((id) => id !== memberId) })),
      setDinnerMembers: (ids) => set({ dinnerMembers: ids }),
      addMember: (name) => {
        const person = newMember(name, get().members.length);
        set((s) => ({ members: [...s.members, person], household: { ...s.household, selected: person.id } }));
        return person;
      },
      removeMember: (id) =>
        set((s) => {
          if (s.members.length <= 1) return {};
          const members = s.members.filter((m) => m.id !== id);
          const first = members[0].id;
          return {
            members,
            dinnerMembers: s.dinnerMembers.filter((x) => x !== id),
            household: { ...s.household, selected: s.household.selected === id ? first : s.household.selected },
            family: { ...s.family, member: s.family.member === id ? first : s.family.member },
            health: { ...s.health, member: s.health.member === id ? first : s.health.member },
          };
        }),
      toggleCookDay: (memberId, day) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === memberId ? { ...m, prefs: { ...m.prefs, cook: m.prefs.cook.map((on, i) => (i === day ? (on ? 0 : 1) : on)) } } : m)),
        })),
      addPref: (memberId, field, value) => {
        const v = String(value || "").trim();
        if (!v) return;
        set((s) => ({
          members: s.members.map((m) => {
            if (m.id !== memberId) return m;
            if (m.prefs[field].some((x) => x.toLowerCase() === v.toLowerCase())) return m;
            return syncDiet({ ...m, prefs: { ...m.prefs, [field]: [...m.prefs[field], v] } });
          }),
        }));
      },
      removePref: (memberId, field, index) =>
        set((s) => ({
          members: s.members.map((m) => (m.id === memberId ? syncDiet({ ...m, prefs: { ...m.prefs, [field]: m.prefs[field].filter((_, i) => i !== index) } }) : m)),
        })),
      setHousehold: (patch) => set((s) => ({ household: { ...s.household, ...patch } })),
      addPointsLog: (memberId, amount, title, type) => set((s) => ({ pointsLog: [logEntry(memberId, amount, title, type), ...s.pointsLog] })),
      completeTask: (taskId) => {
        const s = get();
        const task = s.tasks.find((x) => x.id === taskId);
        const owner = task ? s.members.find((m) => m.id === task.memberId) : undefined;
        if (!task || !owner) return { ok: false, message: "" };
        const day = todayKey;
        if (task.completions.includes(day)) {
          const credit = task.completionPoints[day] ?? task.points;
          if (owner.points < credit) return { ok: false, message: t("積分已用於兌換，目前餘額不足以撤銷本次打卡") };
          const completionPoints = { ...task.completionPoints };
          delete completionPoints[day];
          set({
            tasks: s.tasks.map((x) => (x.id === taskId ? { ...x, completions: x.completions.filter((k) => k !== day), completionPoints } : x)),
            members: s.members.map((m) => (m.id === owner.id ? { ...m, points: m.points - credit } : m)),
            pointsLog: [logEntry(owner.id, -credit, t("取消完成：{title}", { title: t(task.title) }), "undo"), ...s.pointsLog],
          });
          return { ok: true, message: t("已取消完成，扣回 {n} 積分", { n: credit }) };
        }
        set({
          tasks: s.tasks.map((x) => (x.id === taskId ? { ...x, completions: [...x.completions, day], completionPoints: { ...x.completionPoints, [day]: x.points } } : x)),
          members: s.members.map((m) => (m.id === owner.id ? { ...m, points: m.points + task.points } : m)),
          pointsLog: [logEntry(owner.id, task.points, t("完成：{title}", { title: t(task.title) }), "task"), ...s.pointsLog],
        });
        return { ok: true, message: t("已完成，獲得 {n} 積分", { n: task.points }) };
      },
    }),
    {
      name: "lucky-table.device",
      version: 1,
      storage: zustandStorage,
      partialize: (s) => ({ members: s.members, dinnerMembers: s.dinnerMembers, settings: s.settings }),
      merge: (persisted, current) => {
        const stored = (persisted || {}) as Partial<Pick<DeviceData, "members" | "dinnerMembers" | "settings">>;
        const members = (stored.members || []).map(normalizeMember).filter((m): m is Member => Boolean(m));
        const next: DeviceState = { ...current, settings: { ...current.settings, ...(stored.settings || {}), section: current.settings.section } };
        if (members.length) {
          next.members = members;
          next.dinnerMembers = Array.isArray(stored.dinnerMembers) ? stored.dinnerMembers.filter((id) => members.some((m) => m.id === id)) : members.map((m) => m.id);
          next.household = { ...current.household, selected: members[0].id };
        }
        return next;
      },
    },
  ),
);

/* ───────── selectors / helpers shared by modules ───────── */

/** Member by id, or the "whole family" pseudo-member the prototype used for shared events. */
export function memberById(id: string | undefined | null, members = useDeviceStore.getState().members): Member {
  const found = members.find((item) => item.id === id);
  if (found) return found;
  return { id: "family", name: t("全家"), role: "", color: "#196b54", initials: t("家|family-initial"), initial: t("家|family-initial"), age: null, points: 0, allergy: "", preference: "", prefs: emptyPrefs(), health: defaultHealth(null) };
}

/** "本週掌廚：一、四" / "本週不掌廚" */
export function householdCookLabel(person: Member) {
  const days = person.prefs.cook.map((on, i) => (on ? weekday((i + 1) % 7, "short") : "")).filter(Boolean);
  return days.length ? t("本週掌廚：{days}", { days: joinList(days) }) : t("本週不掌廚");
}

/** Today's events sorted by time (used by Home and the reminder preview). */
export function todaysEvents(events = useDeviceStore.getState().events) {
  return events.filter((event) => event.date === todayKey).sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}
