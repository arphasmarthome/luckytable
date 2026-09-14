/* Lucky Table · Make — static tables (port of the data section of prototype/make/app.js):
 * categories and cook-time estimates, ingredient taxonomy, the demo stock and capture frames,
 * ingredient aliases / Chinese names, curated step plans and the weekly meal seed. */
import { MAKE_DISHES, MAKE_DISH_IMG, type Dish } from "./dishes";

export const DISHES: Dish[] = MAKE_DISHES;
export const DISH_IMG = MAKE_DISH_IMG;
export const dishById = (id: string | null | undefined): Dish => DISHES.find((d) => d.id === id) || DISHES[0];
export const hasDish = (id: string | null | undefined) => DISHES.some((d) => d.id === id);

export const CATEGORIES = ["All", "Stir-fry", "Rice bowl", "Side", "Beef", "Chicken", "Pork", "Lamb", "Goat", "Seafood", "Pasta", "Dessert", "Breakfast", "Starter", "Vegetarian", "Vegan", "Miscellaneous"];
const CAT_MIN: Record<string, number> = { "Stir-fry": 15, "Rice bowl": 20, Side: 15, Starter: 20, Salad: 15, Chicken: 30, Seafood: 20, Pasta: 20, Vegetarian: 20, Vegan: 20, Beef: 35, Pork: 35, Lamb: 40, Goat: 45, Breakfast: 20, Dessert: 40, Miscellaneous: 25 };
export const cookMinutes = (d: Dish) => 5 * Math.round(((CAT_MIN[d.cat] ?? 25) + 2 * Math.max(0, d.ing.length - 4)) / 5);

export type IngredientCategory = "Vegetable" | "Fruit" | "Grain" | "Protein" | "Condiment" | "Herb" | "Dairy";
export const CAT: Record<IngredientCategory, string> = { Vegetable: "蔬菜", Fruit: "水果", Grain: "穀類", Protein: "蛋白質", Condiment: "調味料", Herb: "香草", Dairy: "乳製品" };
const TAXONOMY: Record<IngredientCategory, string[]> = {
  Vegetable: ["broccoli","green onion","scallion","spring onion","onion","red onion","garlic","tomato","potato","carrot","cabbage","napa cabbage","bok choy","spinach","lettuce","cucumber","eggplant","bell pepper","mushroom","shiitake mushroom","daikon","radish","pumpkin","zucchini","corn","sweet potato","taro","leek","ginger","chive","celery","cauliflower","asparagus","green bean","snow pea","pea","bean sprouts","water spinach","seaweed","nori","lotus root","bamboo shoot","winter melon","bitter melon","yam","kale","chard"],
  Fruit: ["avocado","apple","banana","orange","lemon","lime","mango","papaya","pineapple","grape","pear","peach","plum","strawberry","blueberry","watermelon","melon","guava","lychee","longan","persimmon","pomelo","kiwi","dragon fruit","wax apple","yuzu","coconut","fig","date"],
  Grain: ["rice","white rice","brown rice","jasmine rice","sticky rice","glutinous rice","noodles","rice noodles","udon","pasta","flour","oats","quinoa","barley","millet","wheat","couscous","bread"],
  Protein: ["beef","beef sirloin","pork","pork belly","chicken","chicken thigh","chicken breast","duck","lamb","egg","eggs","tofu","firm tofu","tempeh","fish","salmon","tuna","cod","shrimp","prawn","squid","octopus","clams","mussels","scallops","crab","sausage","bacon","ham","lentils"],
  Condiment: ["soy sauce","oyster sauce","fish sauce","sesame oil","rice wine","shaoxing wine","mirin","rice vinegar","black vinegar","vinegar","hoisin sauce","chili oil","chili sauce","chili crisp","sriracha","gochujang","doubanjiang","miso","ketchup","mayonnaise","mustard","dijon mustard","honey","jam","peanut butter","tahini","xo sauce","ponzu","teriyaki sauce","worcestershire sauce","tomato paste","barbecue sauce","hot sauce","wasabi","sweet chili sauce"],
  Herb: ["salt","sugar","black pepper","white pepper","salt & pepper","basil","thai basil","cilantro","coriander","parsley","mint","rosemary","thyme","oregano","bay leaf","cinnamon","star anise","five spice","cumin","paprika","turmeric","chili flakes","sesame seeds","garlic powder"],
  Dairy: ["milk","butter","cheese","cream","yoghurt","sour cream","cream cheese","parmesan","mozzarella","cheddar","condensed milk","ghee"],
};
export function categoryOf(name: string): IngredientCategory {
  const n = String(name).toLowerCase();
  const keys = Object.keys(TAXONOMY) as IngredientCategory[];
  for (const k of keys) if (TAXONOMY[k].includes(n)) return k;
  for (const k of keys) if (TAXONOMY[k].some((x) => n.includes(x))) return k;
  return "Vegetable";
}
export const categoryLabel = (name: string, zh: boolean) => (zh ? CAT[categoryOf(name)] : categoryOf(name));

export const WHEN: Record<string, string> = { Today: "今天", "3 days ago": "三天前", "1 week ago": "一週前", "1 month ago": "一個月前" };
export const UNIT: Record<string, string> = { heads: "顆", packs: "盒", stalks: "根", pieces: "個", bulbs: "球" };
export const AMT: Record<string, string> = { "300 g": "300 公克", "250 g": "250 公克", "200 g": "200 公克", "500 g": "500 公克", "1 head": "1 顆", "3 stalks": "3 根", "1 stalk": "1 根", "2 cloves": "2 瓣", "4 cloves": "4 瓣", "6 cloves": "6 瓣", "2 tbsp": "2 大匙", "1 tbsp": "1 大匙", "3 tbsp": "3 大匙", "1 tsp": "1 小匙", "to taste": "適量", "3": "3 顆", "4": "4 顆", "1": "1 顆", "2 bowls": "2 碗", "1 sheet": "1 片", "1 cup": "1 杯", "1 lb": "450 公克", "5": "5 顆", "8": "8 顆", "20": "20 隻", "2 cups": "2 杯", "450 g": "450 公克", handful: "一把", "3 oz": "85 公克", "2 oz": "60 公克", "2 tsp": "2 小匙" };

/** Size of one stock unit: weight in grams or volume in millilitres; display unit system comes from Settings. */
export type Size = { kind: "count" } | { kind: "weight"; g: number } | { kind: "volume"; ml: number };
export type StockRow = { name: string; zh: string; qty: number; where: string; added: string; size: Size };

export const STOCK: StockRow[] = [
  { name: "Broccoli", zh: "花椰菜", qty: 2, where: "Fridge", added: "Today", size: { kind: "weight", g: 500 } },
  { name: "Beef sirloin", zh: "牛肉", qty: 1, where: "Fridge", added: "Today", size: { kind: "weight", g: 450 } },
  { name: "Green onion", zh: "青蔥", qty: 4, where: "Fridge", added: "Today", size: { kind: "weight", g: 25 } },
  { name: "Tomato", zh: "番茄", qty: 3, where: "Fridge", added: "Today", size: { kind: "weight", g: 150 } },
  { name: "Avocado", zh: "酪梨", qty: 1, where: "Counter", added: "Today", size: { kind: "weight", g: 200 } },
  { name: "Garlic", zh: "蒜頭", qty: 1, where: "Pantry", added: "3 days ago", size: { kind: "weight", g: 50 } },
  { name: "Eggs", zh: "雞蛋", qty: 6, where: "Fridge", added: "3 days ago", size: { kind: "weight", g: 60 } },
  { name: "Onion", zh: "洋蔥", qty: 2, where: "Pantry", added: "1 week ago", size: { kind: "weight", g: 180 } },
  { name: "Soy sauce", zh: "醬油", qty: 1, where: "Pantry", added: "1 month ago", size: { kind: "volume", ml: 500 } },
  { name: "Rice", zh: "白米", qty: 1, where: "Pantry", added: "1 month ago", size: { kind: "weight", g: 2000 } },
];

/** Each press of Capture reveals the next frame: the items that shot picks up plus its detection boxes. */
export type DetBox = [name: string, left: string, top: string, width: string, height: string, alt: 0 | 1];
export type Shot = { items: [string, number][]; boxes: DetBox[] };
export const SHOTS: Shot[] = [
  { items: [["Broccoli", 1], ["Beef sirloin", 1]], boxes: [["Broccoli", "14%", "22%", "26%", "34%", 0], ["Beef sirloin", "56%", "44%", "26%", "30%", 1]] },
  { items: [["Green onion", 3]], boxes: [["Green onion", "20%", "50%", "34%", "22%", 0]] },
  { items: [["Tomato", 2], ["Avocado", 1]], boxes: [["Tomato", "12%", "26%", "22%", "30%", 0], ["Avocado", "48%", "36%", "22%", "28%", 1]] },
  { items: [["Tomato", 1], ["Garlic", 1]], boxes: [["Garlic", "34%", "30%", "24%", "26%", 1]] },
];
export const ITEMS: Record<string, { zh: string; conf: number; unit: string; size: Size }> = {
  Broccoli: { zh: "花椰菜", conf: 98, unit: "heads", size: { kind: "weight", g: 500 } },
  "Beef sirloin": { zh: "牛肉", conf: 94, unit: "packs", size: { kind: "weight", g: 450 } },
  "Green onion": { zh: "青蔥", conf: 96, unit: "stalks", size: { kind: "weight", g: 25 } },
  Tomato: { zh: "番茄", conf: 99, unit: "pieces", size: { kind: "weight", g: 150 } },
  Avocado: { zh: "酪梨", conf: 91, unit: "pieces", size: { kind: "weight", g: 200 } },
  Garlic: { zh: "蒜頭", conf: 88, unit: "bulbs", size: { kind: "weight", g: 50 } },
};
const ING_IMG: Record<string, string> = { Broccoli: "Broccoli", "Beef sirloin": "Beef", "Green onion": "Spring Onions", Tomato: "Tomato", Avocado: "Avocado", Garlic: "Garlic", Eggs: "Egg", Rice: "Rice" };
export const ingImg = (name: string) => "https://www.themealdb.com/images/ingredients/" + encodeURIComponent(ING_IMG[name] || name) + ".png";
export const dishImg = (id: string) => (DISH_IMG[id] ? "https://www.themealdb.com/images/media/meals/" + DISH_IMG[id] : ingImg("Broccoli"));
export const hasDishImg = (id: string) => Boolean(DISH_IMG[id]);

export const ALIAS: Record<string, string> = {
  "sirloin steak": "beef sirloin", "ground beef": "beef sirloin", beef: "beef sirloin", "spring onions": "green onion", "plum tomatoes": "tomato", tomatoes: "tomato",
  "jasmine rice": "rice", "white rice": "rice", egg: "eggs", "garlic clove": "garlic", "mung bean sprouts": "bean sprouts", "basil leaves": "thai basil", carrots: "carrot",
  water: "*", cornstarch: "*", "corn starch": "*", "dry sherry": "*", "shaoxing wine": "*", "vegetable oil": "*", "high heat cooking oil": "*", "sesame seed oil": "*", "olive oil": "*",
  "chicken stock": "*", "beef stock": "*", "unsalted beef stock": "*", "chicken bouillon powder": "*", "kosher salt": "*", pepper: "*", "black pepper": "*", "white pepper": "*", sugar: "*", salt: "*",
  "red chilli": "*", shallots: "*",
};
export const ING_ZH: Record<string, string> = {
  "sirloin steak": "沙朗牛排", beef: "牛肉", "ground beef": "牛絞肉", broccoli: "花椰菜", "soy sauce": "醬油", "oyster sauce": "蠔油", "fish sauce": "魚露", garlic: "蒜頭", "garlic clove": "蒜頭", "spring onions": "青蔥", "plum tomatoes": "番茄", tomato: "番茄", eggs: "雞蛋", egg: "雞蛋", "jasmine rice": "茉莉香米", rice: "白米", shrimp: "蝦仁", chicken: "雞肉", shallots: "紅蔥頭", "red chilli": "紅辣椒", "basil leaves": "九層塔", cucumber: "小黃瓜", carrots: "紅蘿蔔", onion: "洋蔥", lime: "萊姆", avocado: "酪梨", sugar: "糖", salt: "鹽", pepper: "胡椒", "black pepper": "黑胡椒", "white pepper": "白胡椒", "kosher salt": "鹽", water: "水", cornstarch: "太白粉", "vegetable oil": "沙拉油", "sesame seed oil": "香油", "dry sherry": "料理酒", "shaoxing wine": "紹興酒", "chicken stock": "雞高湯", "beef stock": "牛高湯", "unsalted beef stock": "牛高湯", "chicken bouillon powder": "雞粉", "mung bean sprouts": "豆芽菜", "high heat cooking oil": "食用油", "olive oil": "橄欖油", butter: "奶油", milk: "牛奶", flour: "麵粉", potatoes: "馬鈴薯", parsley: "巴西里", cumin: "孜然", paprika: "紅椒粉", "red pepper": "紅甜椒", "green pepper": "青椒", lemon: "檸檬", thyme: "百里香", bacon: "培根", cheese: "起司", bread: "麵包",
};
export const STAPLES = ["salt", "sugar", "salt & pepper", "black pepper", "white pepper", "cooking oil"];

/* Curated step-by-step plans with a timer per step (seconds). Other dishes use the TheMealDB
   method with the catalog's cook time spread across the steps. */
export type StepPlan = { seconds: number[]; en: string[]; zh: string[] };
export const STEPS: Record<string, StepPlan> = {
  "beef-broccoli": { seconds: [600, 120, 120, 90, 60],
    en: ["Slice the beef thin across the grain and toss with the soy sauce; rest 10 minutes.", "Blanch the broccoli in salted water for 2 minutes, then drain well.", "Heat the wok until smoking, add oil and garlic, then the beef. Stir-fry 2 minutes and lift out.", "Add the broccoli and the white of the green onion; splash in the sauce and cook until it thickens.", "Return the beef, toss to coat, finish with the green tops, salt and pepper. Serve over rice."],
    zh: ["牛肉逆紋切薄片，拌入醬油醃 10 分鐘。", "花椰菜以鹽水汆燙 2 分鐘後瀝乾。", "熱鍋下油爆香蒜末，放入牛肉快炒 2 分鐘後盛起。", "下花椰菜與蔥白，倒入醬汁炒至收稠。", "牛肉回鍋拌勻，撒上蔥綠、鹽與胡椒，配飯上桌。"] },
  "tomato-egg": { seconds: [180, 60, 180, 30, 30],
    en: ["Cut the tomatoes into wedges; beat the eggs with a pinch of salt.", "Scramble the eggs in hot oil until just set, then lift out.", "Cook the tomatoes until they soften and release their juice.", "Season with sugar and salt, return the eggs, and toss briefly.", "Finish with the green onion and serve with rice."],
    zh: ["番茄切塊，雞蛋加少許鹽打散。", "熱油炒蛋至半凝固後盛起。", "下番茄炒至出汁軟化。", "以糖與鹽調味，蛋回鍋略拌。", "撒上青蔥，配飯食用。"] },
  "egg-foo-young": { seconds: [120, 60, 120, 90, 60],
    en: ["Beat the eggs; fold in the shrimp, spring onion and a splash of soy sauce.", "Heat oil in a small pan until it shimmers.", "Ladle in the egg mix and fry until the base is golden, about 2 minutes.", "Flip and cook the other side until just set.", "Warm the oyster-sauce gravy and spoon it over; serve with rice."],
    zh: ["雞蛋打散，拌入蝦仁、青蔥與少許醬油。", "小鍋熱油至微微冒煙。", "舀入蛋液，煎約 2 分鐘至底部金黃。", "翻面煎至另一面剛好凝固。", "淋上溫熱的蠔油芡汁，配飯上桌。"] },
  "basil-chicken": { seconds: [120, 30, 240, 60, 30],
    en: ["Pound the garlic, shallots and chillies to a rough paste.", "Stir-fry the paste in hot oil until fragrant, about 30 seconds.", "Add the chicken and fry over high heat until cooked through.", "Season with fish sauce and soy sauce; toss for 1 minute.", "Turn off the heat, fold in the basil and serve."],
    zh: ["蒜頭、紅蔥頭與辣椒搗成粗泥。", "熱油下香料泥炒約 30 秒至香氣出來。", "放入雞肉，大火炒至全熟。", "以魚露與醬油調味，再翻炒 1 分鐘。", "熄火拌入九層塔即可上桌。"] },
  "banh-mi-bowl": { seconds: [600, 180, 300, 120, 60],
    en: ["Cook the rice and keep it warm.", "Slice the cucumber and carrot; toss with lime juice.", "Brown the ground beef with the onion and garlic.", "Season with soy sauce and cook until the juices reduce.", "Build the bowls: rice, beef, pickled vegetables and lime."],
    zh: ["白米煮熟保溫。", "小黃瓜與紅蘿蔔切絲，拌入萊姆汁。", "牛絞肉與洋蔥、蒜頭一起炒至上色。", "以醬油調味，煮至肉汁收乾。", "組合碗：白飯、牛肉、醃菜與萊姆。"] },
  "garlic-broccoli": { seconds: [120, 60, 120, 60],
    en: ["Cut the broccoli into even florets.", "Fry the sliced garlic in oil over medium heat until pale gold.", "Add the broccoli and a splash of water; cover for 2 minutes.", "Uncover, raise the heat, and toss until the water has gone. Salt and serve."],
    zh: ["花椰菜切成大小一致的小朵。", "中火以油將蒜片煎至微金黃。", "下花椰菜與少許水，加蓋燜 2 分鐘。", "開蓋轉大火翻炒收乾，加鹽調味即可。"] },
};

export const VOTE_SEED: Record<string, number> = { "banh-mi-bowl": 3, "beef-broccoli": 2, "tomato-egg": 1 };
export const DAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_ZH = ["日", "一", "二", "三", "四", "五", "六"];
/** Meals planned per weekday in the prototype package; today's entry seeds tonight's table. */
export const WEEK_MEALS: Record<string, string[]> = { Mon: ["beef-broccoli"], Tue: ["tomato-egg"], Wed: [], Thu: ["egg-foo-young"], Fri: ["banh-mi-bowl"], Sat: [], Sun: [] };
export const PLAN_TIMES = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];

const trimNum = (n: number) => String(Math.round(n * 10) / 10);
/** "500 g" / "1.1 lb" / "500 ml" / "16.9 fl oz" / "—" for count-only items. */
export function sizeLabel(size: Size | undefined, units: "metric" | "imperial") {
  if (!size || size.kind === "count") return "—";
  const imperial = units === "imperial";
  if (size.kind === "volume") {
    const ml = size.ml || 0;
    if (!imperial) return ml >= 1000 ? `${trimNum(ml / 1000)} L` : `${ml} ml`;
    return `${trimNum(ml / 29.5735)} fl oz`;
  }
  const g = size.g || 0;
  if (!imperial) return g >= 1000 ? `${trimNum(g / 1000)} kg` : `${g} g`;
  const oz = g / 28.3495;
  return oz >= 16 ? `${trimNum(g / 453.592)} lb` : `${trimNum(oz)} oz`;
}

/** "12 min" / "1 h 5 min" — the prototype kept this unit in English in both languages. */
export function fmtMin(seconds: number) {
  const m = Math.round(seconds / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
