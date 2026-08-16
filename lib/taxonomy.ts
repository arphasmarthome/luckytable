/* Taxonomy mirrors data/food-categories.json
   (goodgoodgood.co fruit & vegetable list; listchallenges.com / Wikipedia condiments list). */

export type CategoryKey = "Vegetable" | "Fruit" | "Grain" | "Protein" | "Condiment" | "Herb" | "Dairy";

export const CAT: Record<CategoryKey, string> = {
  Vegetable: "蔬菜",
  Fruit: "水果",
  Grain: "穀類",
  Protein: "蛋白質",
  Condiment: "調味料",
  Herb: "香草",
  Dairy: "乳製品"
};

export const TAXONOMY: Record<CategoryKey, string[]> = {
  Vegetable: ["broccoli", "green onion", "scallion", "spring onion", "onion", "red onion", "garlic", "tomato", "potato", "carrot", "cabbage", "napa cabbage", "bok choy", "spinach", "lettuce", "cucumber", "eggplant", "bell pepper", "mushroom", "shiitake mushroom", "daikon", "radish", "pumpkin", "zucchini", "corn", "sweet potato", "taro", "leek", "ginger", "chive", "celery", "cauliflower", "asparagus", "green bean", "snow pea", "pea", "bean sprouts", "water spinach", "seaweed", "nori", "lotus root", "bamboo shoot", "winter melon", "bitter melon", "yam", "kale", "chard"],
  Fruit: ["avocado", "apple", "banana", "orange", "lemon", "lime", "mango", "papaya", "pineapple", "grape", "pear", "peach", "plum", "strawberry", "blueberry", "watermelon", "melon", "guava", "lychee", "longan", "persimmon", "pomelo", "kiwi", "dragon fruit", "wax apple", "yuzu", "coconut", "fig", "date"],
  Grain: ["rice", "white rice", "brown rice", "jasmine rice", "sticky rice", "glutinous rice", "noodles", "rice noodles", "udon", "pasta", "flour", "oats", "quinoa", "barley", "millet", "wheat", "couscous", "bread"],
  Protein: ["beef", "beef sirloin", "pork", "pork belly", "chicken", "chicken thigh", "chicken breast", "duck", "lamb", "egg", "eggs", "tofu", "firm tofu", "tempeh", "fish", "salmon", "tuna", "cod", "shrimp", "prawn", "squid", "octopus", "clams", "mussels", "scallops", "crab", "sausage", "bacon", "ham", "lentils"],
  Condiment: ["soy sauce", "oyster sauce", "fish sauce", "sesame oil", "rice wine", "shaoxing wine", "mirin", "rice vinegar", "black vinegar", "vinegar", "hoisin sauce", "chili oil", "chili sauce", "chili crisp", "sriracha", "gochujang", "doubanjiang", "miso", "ketchup", "mayonnaise", "mustard", "dijon mustard", "honey", "jam", "peanut butter", "tahini", "xo sauce", "ponzu", "teriyaki sauce", "worcestershire sauce", "tomato paste", "barbecue sauce", "hot sauce", "wasabi", "sweet chili sauce"],
  Herb: ["salt", "sugar", "black pepper", "white pepper", "salt & pepper", "basil", "thai basil", "cilantro", "coriander", "parsley", "mint", "rosemary", "thyme", "oregano", "bay leaf", "cinnamon", "star anise", "five spice", "cumin", "paprika", "turmeric", "chili flakes", "sesame seeds", "garlic powder"],
  Dairy: ["milk", "butter", "cheese", "cream", "yoghurt", "sour cream", "cream cheese", "parmesan", "mozzarella", "cheddar", "condensed milk", "ghee"]
};

export function categoryOf(name: string): CategoryKey {
  const n = String(name).toLowerCase();
  const keys = Object.keys(TAXONOMY) as CategoryKey[];
  for (let i = 0; i < keys.length; i++) {
    if (TAXONOMY[keys[i]].indexOf(n) !== -1) return keys[i];
  }
  for (let i = 0; i < keys.length; i++) {
    if (TAXONOMY[keys[i]].some((x) => n.indexOf(x) !== -1)) return keys[i];
  }
  return "Vegetable";
}

export const WHERE: Record<string, string> = { Fridge: "冰箱", Counter: "檯面", Pantry: "儲藏櫃" };
export const WHEN: Record<string, string> = { Today: "今天", "3 days ago": "三天前", "1 week ago": "一週前", "1 month ago": "一個月前" };
export const UNIT: Record<string, string> = { heads: "顆", packs: "盒", stalks: "根", pieces: "個", bulbs: "球" };
export const AMT: Record<string, string> = {
  "300 g": "300 公克", "250 g": "250 公克", "200 g": "200 公克", "500 g": "500 公克",
  "1 head": "1 顆", "3 stalks": "3 根", "1 stalk": "1 根", "2 cloves": "2 瓣", "4 cloves": "4 瓣", "6 cloves": "6 瓣",
  "2 tbsp": "2 大匙", "1 tbsp": "1 大匙", "3 tbsp": "3 大匙", "1 tsp": "1 小匙",
  "to taste": "適量", "3": "3 顆", "4": "4 顆", "1": "1 顆", "2 bowls": "2 碗", "1 sheet": "1 片", "1 cup": "1 杯"
};

/* API ingredient names → what the pantry calls them; "*" = assumed always on hand. */
export const ALIAS: Record<string, string> = {
  "sirloin steak": "beef sirloin", "ground beef": "beef sirloin", "beef": "beef sirloin",
  "spring onions": "green onion", "plum tomatoes": "tomato", "tomatoes": "tomato",
  "jasmine rice": "rice", "white rice": "rice", "egg": "eggs", "garlic clove": "garlic",
  "mung bean sprouts": "bean sprouts", "basil leaves": "thai basil", "carrots": "carrot",
  "water": "*", "cornstarch": "*", "corn starch": "*", "dry sherry": "*", "shaoxing wine": "*",
  "vegetable oil": "*", "high heat cooking oil": "*", "sesame seed oil": "*", "olive oil": "*",
  "chicken stock": "*", "beef stock": "*", "unsalted beef stock": "*", "chicken bouillon powder": "*",
  "kosher salt": "*", "pepper": "*", "black pepper": "*", "white pepper": "*", "sugar": "*", "salt": "*",
  "red chilli": "*", "shallots": "*"
};

export const ING_ZH: Record<string, string> = {
  "sirloin steak": "沙朗牛排", "beef": "牛肉", "ground beef": "牛絞肉", "broccoli": "花椰菜",
  "soy sauce": "醬油", "oyster sauce": "蠔油", "fish sauce": "魚露", "garlic": "蒜頭",
  "garlic clove": "蒜頭", "spring onions": "青蔥", "plum tomatoes": "番茄", "tomato": "番茄",
  "eggs": "雞蛋", "egg": "雞蛋", "jasmine rice": "茉莉香米", "rice": "白米", "shrimp": "蝦仁",
  "chicken": "雞肉", "shallots": "紅蔥頭", "red chilli": "紅辣椒", "basil leaves": "九層塔",
  "cucumber": "小黃瓜", "carrots": "紅蘿蔔", "onion": "洋蔥", "lime": "萊姆", "avocado": "酪梨",
  "sugar": "糖", "salt": "鹽", "pepper": "胡椒", "black pepper": "黑胡椒", "white pepper": "白胡椒",
  "kosher salt": "鹽", "water": "水", "cornstarch": "太白粉", "vegetable oil": "沙拉油",
  "sesame seed oil": "香油", "dry sherry": "料理酒", "shaoxing wine": "紹興酒",
  "chicken stock": "雞高湯", "beef stock": "牛高湯", "unsalted beef stock": "牛高湯",
  "chicken bouillon powder": "雞粉", "mung bean sprouts": "豆芽菜", "high heat cooking oil": "食用油"
};

export const STAPLES = ["salt", "sugar", "salt & pepper", "black pepper", "white pepper", "cooking oil"];
