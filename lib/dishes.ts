export type StockItem = {
  name: string;
  zh: string;
  cat: string;
  qty: number;
  where: string;
  added: string;
};

export const STOCK: StockItem[] = [
  { name: "Broccoli", zh: "花椰菜", cat: "Vegetable", qty: 2, where: "Fridge", added: "Today" },
  { name: "Beef sirloin", zh: "牛肉", cat: "Protein", qty: 1, where: "Fridge", added: "Today" },
  { name: "Green onion", zh: "青蔥", cat: "Vegetable", qty: 4, where: "Fridge", added: "Today" },
  { name: "Tomato", zh: "番茄", cat: "Vegetable", qty: 3, where: "Fridge", added: "Today" },
  { name: "Avocado", zh: "酪梨", cat: "Fruit", qty: 1, where: "Counter", added: "Today" },
  { name: "Garlic", zh: "蒜頭", cat: "Aromatic", qty: 1, where: "Pantry", added: "3 days ago" },
  { name: "Eggs", zh: "雞蛋", cat: "Protein", qty: 6, where: "Fridge", added: "3 days ago" },
  { name: "Onion", zh: "洋蔥", cat: "Vegetable", qty: 2, where: "Pantry", added: "1 week ago" },
  { name: "Soy sauce", zh: "醬油", cat: "Pantry", qty: 1, where: "Pantry", added: "1 month ago" },
  { name: "Rice", zh: "白米", cat: "Pantry", qty: 1, where: "Pantry", added: "1 month ago" }
];

/* Each press of Capture reveals the next frame: the items that shot picks up. */
export const SHOTS: { items: [string, number][]; boxes: [string, string, string, string, string, string][] }[] = [
  { items: [["Broccoli", 1], ["Beef sirloin", 1]], boxes: [["Broccoli", "14%", "22%", "26%", "34%", "var(--color-accent)"], ["Beef sirloin", "56%", "44%", "26%", "30%", "var(--color-accent-2)"]] },
  { items: [["Green onion", 3]], boxes: [["Green onion", "20%", "50%", "34%", "22%", "var(--color-accent)"]] },
  { items: [["Tomato", 2], ["Avocado", 1]], boxes: [["Tomato", "12%", "26%", "22%", "30%", "var(--color-accent)"], ["Avocado", "48%", "36%", "22%", "28%", "var(--color-accent-2)"]] },
  { items: [["Tomato", 1], ["Garlic", 1]], boxes: [["Garlic", "34%", "30%", "24%", "26%", "var(--color-accent-2)"]] }
];

export const ITEMS: Record<string, { zh: string; cat: string; conf: number; unit: string }> = {
  Broccoli: { zh: "花椰菜", cat: "Vegetable", conf: 98, unit: "heads" },
  "Beef sirloin": { zh: "牛肉", cat: "Protein", conf: 94, unit: "packs" },
  "Green onion": { zh: "青蔥", cat: "Vegetable", conf: 96, unit: "stalks" },
  Tomato: { zh: "番茄", cat: "Vegetable", conf: 99, unit: "pieces" },
  Avocado: { zh: "酪梨", cat: "Fruit", conf: 91, unit: "pieces" },
  Garlic: { zh: "蒜頭", cat: "Aromatic", conf: 88, unit: "bulbs" }
};

/* Stand-in photography from TheMealDB (themealdb.com) — ingredient cut-outs by name,
   dish shots by id. Swap for your own photography when you have it. */
export const ING_IMG: Record<string, string> = {
  Broccoli: "Broccoli", "Beef sirloin": "Beef", "Green onion": "Spring Onions",
  Tomato: "Tomato", Avocado: "Avocado", Garlic: "Garlic", Eggs: "Egg", Rice: "Rice"
};

export const DISH_IMG: Record<string, string> = {
  "beef-broccoli": "m0p0j81765568742.jpg",
  "tomato-egg": "rwvw8q1765660071.jpg",
  "egg-foo-young": "47y6ii1765658818.jpg",
  "basil-chicken": "el64dy1763483009.jpg",
  "banh-mi-bowl": "z0ageb1583189517.jpg",
  "garlic-broccoli": ""
};

export const ingImg = (name: string) =>
  "https://www.themealdb.com/images/ingredients/" + encodeURIComponent(ING_IMG[name] || name) + ".png";

export const dishImg = (id: string) =>
  DISH_IMG[id] ? "https://www.themealdb.com/images/media/meals/" + DISH_IMG[id] : ingImg("Broccoli");

export type Dish = {
  id: string;
  mealId: string;
  name: string;
  zh: string;
  cat: string;
  ing: [string, string, string][];
};

/* Real recipes from TheMealDB — mealId drives the live lookup; the seed ingredient
   list below is what shows until the fetch lands. */
export const DISHES: Dish[] = [
  { id: "beef-broccoli", mealId: "53366", name: "Beef and broccoli stir-fry", zh: "蔥爆牛肉花椰菜", cat: "Stir-fry",
    ing: [["Sirloin steak", "牛肉", "1 lb"], ["Broccoli", "花椰菜", "1 lb"], ["Soy Sauce", "醬油", "1 tbsp"], ["Oyster Sauce", "蠔油", "2 tbsp"], ["Garlic", "蒜頭", "2 cloves"]] },
  { id: "tomato-egg", mealId: "53372", name: "Chinese tomato egg stir-fry", zh: "番茄炒蛋", cat: "Stir-fry",
    ing: [["Plum Tomatoes", "番茄", "1 lb"], ["Eggs", "雞蛋", "5"], ["Spring Onions", "青蔥", "1"], ["Jasmine Rice", "白米", "2 cups"]] },
  { id: "egg-foo-young", mealId: "53370", name: "Egg foo young", zh: "芙蓉蛋", cat: "Stir-fry",
    ing: [["Egg", "雞蛋", "8"], ["Shrimp", "蝦仁", "20"], ["Spring Onions", "青蔥", "1"], ["Soy Sauce", "醬油", "1 tbsp"], ["Oyster Sauce", "蠔油", "1 tbsp"], ["Jasmine Rice", "白米", "2 cups"]] },
  { id: "basil-chicken", mealId: "53201", name: "Stir-fried chicken with chillies & basil", zh: "打拋雞", cat: "Stir-fry",
    ing: [["Chicken", "雞肉", "450 g"], ["Garlic", "蒜頭", "3 tbsp"], ["Shallots", "紅蔥頭", "3 tbsp"], ["Red Chilli", "紅辣椒", "3"], ["Fish Sauce", "魚露", "2 tbsp"], ["Soy Sauce", "醬油", "2 tsp"], ["Basil Leaves", "九層塔", "handful"]] },
  { id: "banh-mi-bowl", mealId: "52997", name: "Beef banh mi bowl", zh: "越式牛肉飯", cat: "Rice bowl",
    ing: [["Rice", "白米", "1 cup"], ["Ground Beef", "牛絞肉", "1 lb"], ["Cucumber", "小黃瓜", "1"], ["Carrots", "紅蘿蔔", "3 oz"], ["Garlic Clove", "蒜頭", "3"], ["Soy Sauce", "醬油", "2 oz"], ["Onion", "洋蔥", "1"], ["Lime", "萊姆", "1"]] },
  { id: "garlic-broccoli", mealId: "", name: "Garlic broccoli", zh: "蒜炒花椰菜", cat: "Side",
    ing: [["Broccoli", "花椰菜", "1 head"], ["Garlic", "蒜頭", "4 cloves"], ["Salt", "鹽", "to taste"]] }
];

export const STEPS: Record<string, { en: string[]; zh: string[] }> = {
  "garlic-broccoli": {
    en: ["Cut the broccoli into even florets.", "Fry the sliced garlic in oil over medium heat until pale gold.",
         "Add the broccoli and a splash of water; cover for 2 minutes.",
         "Uncover, raise the heat, and toss until the water has gone. Salt and serve."],
    zh: ["花椰菜切成大小一致的小朵。", "中火以油將蒜片煎至微金黃。",
         "下花椰菜與少許水，加蓋燜 2 分鐘。", "開蓋轉大火翻炒收乾，加鹽調味即可。"]
  },
  "beef-broccoli-egg": {
    en: ["Beat the eggs with a pinch of salt.", "Sear the marinated beef over high heat, then set aside.",
         "Stir-fry the broccoli with a splash of water until just tender.",
         "Pour in the eggs, let them set at the edges, then fold gently.",
         "Return the beef, season with soy sauce and sugar, and serve immediately."],
    zh: ["雞蛋加少許鹽打散。", "大火將醃好的牛肉煎香後盛起。", "花椰菜加少許水炒至熟脆。",
         "倒入蛋液，邊緣凝固後輕輕翻拌。", "牛肉回鍋，以醬油與糖調味，趁熱上桌。"]
  },
  "tomato-egg": {
    en: ["Cut the tomatoes into wedges; beat the eggs with a pinch of salt.",
         "Scramble the eggs in hot oil until just set, then lift out.",
         "Cook the tomatoes until they soften and release their juice.",
         "Season with sugar and salt, return the eggs, and toss briefly.",
         "Finish with the green onion and serve with rice."],
    zh: ["番茄切塊，雞蛋加少許鹽打散。", "熱油炒蛋至半凝固後盛起。", "下番茄炒至出汁軟化。",
         "以糖與鹽調味，蛋回鍋略拌。", "撒上青蔥，配飯食用。"]
  },
  "avocado-beef-bowl": {
    en: ["Cook the rice and keep it warm.", "Sear the sliced beef in a hot pan, seasoning with soy sauce.",
         "Slice the avocado thin and fan it over the rice.", "Lay the beef alongside and spoon over the pan juices.",
         "Top with torn nori and sesame seeds."],
    zh: ["白米煮熟保溫。", "熱鍋煎香牛肉片，以醬油調味。", "酪梨切薄片鋪在飯上。",
         "牛肉擺在一旁，淋上鍋中肉汁。", "撒上海苔碎與白芝麻。"]
  },
  "three-cup-chicken": {
    en: ["Brown the chicken skin-side down in sesame oil with the ginger.",
         "Add the garlic and cook until fragrant.",
         "Pour in equal parts soy sauce, rice wine and sesame oil; simmer until glossy.",
         "Reduce until the sauce clings to the chicken.",
         "Fold through the basil off the heat and serve in the hot pot."],
    zh: ["麻油下薑片，雞肉皮朝下煎至上色。", "加入蒜頭炒出香氣。",
         "倒入等量醬油、米酒與麻油，燒至醬色油亮。", "收汁至醬汁裹住雞肉。",
         "熄火拌入九層塔，連鍋上桌。"]
  }
};
