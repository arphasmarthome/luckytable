export type FamilyMember = {
  key: string;
  name: string;
  zh: string;
  initial: string;
  role: string;
  roleZh: string;
  note: string;
  noteZh: string;
  stars: number[];
  likes: [string, string][];
  dislikes: [string, string][];
  allergies: [string, string][];
  tint: string;
  ink: string;
  dot: string;
  fill: string;
};

export const FAMILY: FamilyMember[] = [
  { key: "dad", name: "Dad", zh: "爸爸", initial: "D", role: "Cooks Mon & Thu", roleZh: "週一、週四掌廚",
    note: "No coriander", noteZh: "不吃香菜", stars: [1, 0, 0, 1, 0, 0, 0],
    likes: [["Beef", "牛肉"], ["Garlic", "蒜頭"], ["Rice", "白米飯"], ["Spicy food", "辣的菜"], ["Soup", "湯品"]],
    dislikes: [["Coriander", "香菜"], ["Bitter melon", "苦瓜"]],
    allergies: [],
    tint: "var(--color-accent-2-100)", ink: "var(--color-accent-2-800)", dot: "var(--color-accent-2-500)", fill: "var(--color-accent-2-700)" },
  { key: "mom", name: "Mom", zh: "媽媽", initial: "M", role: "Cooks Tue & Fri", roleZh: "週二、週五掌廚",
    note: "Keeps the stock list", noteZh: "負責庫存清單", stars: [0, 1, 0, 0, 1, 0, 0],
    likes: [["Soup", "湯品"], ["Tofu", "豆腐"], ["Rice", "白米飯"], ["Tomato", "番茄"], ["Garlic", "蒜頭"]],
    dislikes: [["Coriander", "香菜"], ["Offal", "內臟"]],
    allergies: [],
    tint: "var(--color-accent-100)", ink: "var(--color-accent-800)", dot: "var(--color-accent-500)", fill: "var(--color-accent-700)" },
  { key: "ellie", name: "Ellie", zh: "小艾", initial: "E", role: "Sets the table", roleZh: "負責擺桌",
    note: "Mild food · peanut allergy", noteZh: "不辣・花生過敏", stars: [0, 0, 0, 0, 1, 0, 0],
    likes: [["Eggs", "雞蛋"], ["Rice", "白米飯"], ["Broccoli", "花椰菜"], ["Soup", "湯品"]],
    dislikes: [["Spicy food", "辣的菜"], ["Coriander", "香菜"], ["Mushrooms", "菇類"]],
    allergies: [["Peanuts", "花生"]],
    tint: "var(--color-neutral-200)", ink: "var(--color-neutral-800)", dot: "var(--color-neutral-600)", fill: "var(--color-neutral-800)" },
  { key: "gran", name: "Grandma", zh: "奶奶", initial: "G", role: "Sunday soup", roleZh: "週日煮湯",
    note: "Low salt · soft textures", noteZh: "少鹽・軟質食物", stars: [0, 0, 0, 0, 0, 0, 1],
    likes: [["Soup", "湯品"], ["Tofu", "豆腐"], ["Rice", "白米飯"], ["Ginger", "薑"]],
    dislikes: [["Spicy food", "辣的菜"], ["Fried food", "炸物"]],
    allergies: [["Shellfish", "帶殼海鮮"]],
    tint: "var(--color-accent-2-200)", ink: "var(--color-accent-2-900)", dot: "var(--color-accent-2-700)", fill: "var(--color-accent-2-700)" }
];

export const VOTE_SEED: Record<string, number> = { "banh-mi-bowl": 3, "beef-broccoli": 2, "tomato-egg": 1 };

export const DAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];
export const DAY_LETTER = ["M", "T", "W", "R", "F", "S", "S"]; /* Mon..Sun, R = Thursday */
export const MONTH_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const SUGGEST: Record<"likes" | "dislikes" | "allergies", [string, string][]> = {
  likes: [["Beef", "牛肉"], ["Tofu", "豆腐"], ["Soup", "湯品"], ["Seafood", "海鮮"], ["Eggs", "雞蛋"], ["Spicy food", "辣的菜"]],
  dislikes: [["Coriander", "香菜"], ["Mushrooms", "菇類"], ["Bitter melon", "苦瓜"], ["Offal", "內臟"], ["Fried food", "炸物"], ["Spicy food", "辣的菜"]],
  allergies: [["Peanuts", "花生"], ["Shellfish", "帶殼海鮮"], ["Eggs", "雞蛋"], ["Milk", "牛奶"], ["Gluten", "麩質"], ["Soy", "大豆"]]
};

export const STAPLES_LIST: [string, string, number][] = [
  ["Salt", "鹽", 1], ["Sugar", "糖", 1], ["Soy sauce", "醬油", 1], ["Vinegar", "醋", 1],
  ["Cooking oil", "食用油", 1], ["White pepper", "白胡椒", 1], ["Sesame oil", "香油", 1],
  ["Ginger", "薑", 1], ["Garlic", "蒜頭", 1], ["Green onions", "青蔥", 0], ["Oyster sauce", "蠔油", 0]
];

/* [time, title, titleZh, who, isMeal, dishId?] */
export type CalendarEvent = [string, string, string, string, number, string?];

/* Events keyed by weekday; the visible week is built from the real current date. */
export const WEEK_EVENTS: Record<string, CalendarEvent[]> = {
  Mon: [["07:30", "Ellie reads before school", "小艾晨讀", "ellie", 0],
        ["18:30", "Beef and broccoli stir-fry", "蔥爆牛肉花椰菜", "dad", 1, "beef-broccoli"]],
  Tue: [["16:30", "Art class", "美術課", "ellie", 0],
        ["18:30", "Chinese tomato egg stir-fry", "番茄炒蛋", "mom", 1, "tomato-egg"]],
  Wed: [["09:00", "Grandma's check-up", "奶奶回診", "gran", 0]],
  Thu: [["18:00", "Egg foo young", "芙蓉蛋", "dad", 1, "egg-foo-young"],
        ["19:30", "Reading together", "親子共讀", "all", 0]],
  Fri: [["12:00", "Mom's lunch out", "媽媽午餐聚會", "mom", 0],
        ["19:00", "Beef banh mi bowl", "越式牛肉飯", "mom", 1, "banh-mi-bowl"]],
  Sat: [["10:30", "Market run", "採買", "all", 0],
        ["15:00", "Piano practice", "鋼琴練習", "ellie", 0]],
  Sun: [["17:30", "Grandma's soup", "奶奶的湯", "gran", 1],
        ["19:30", "Ellie's birthday dinner", "小艾生日晚餐", "all", 1]]
};

export type WeekDay = {
  day: string;
  zh: string;
  dow: number;
  date: string;
  m: number;
  y: number;
  today: boolean;
  items: CalendarEvent[];
};

export function cookDaysLabel(cook: number[] | undefined, zh: boolean): string | null {
  const days: string[] = [];
  (cook || []).forEach((on, i) => {
    if (on) days.push(zh ? DAY_ZH[(i + 1) % 7] : DAY_EN[(i + 1) % 7]);
  });
  if (days.length === 0) return null;
  if (zh) return days.map((d) => "週" + d).join("、") + "掌廚";
  if (days.length === 1) return "Cooks " + days[0];
  if (days.length === 2) return "Cooks " + days[0] + " & " + days[1];
  return "Cooks " + days.slice(0, -1).join(", ") + " & " + days[days.length - 1];
}

export function buildWeek(): WeekDay[] {
  const out: WeekDay[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    out.push({
      day: DAY_EN[d.getDay()], zh: DAY_ZH[d.getDay()], dow: d.getDay(),
      date: String(d.getDate()), m: d.getMonth(), y: d.getFullYear(), today: i === 0,
      items: (WEEK_EVENTS[DAY_EN[d.getDay()]] || []).map((x) => x.slice() as CalendarEvent)
    });
  }
  return out;
}
