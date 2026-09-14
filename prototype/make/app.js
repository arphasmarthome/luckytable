/* Lucky Table · Make
 * Architecture and data lifted from the "Lucky Table prototype setup" package and its
 * reference build (luckytablev1.vercel.app): Make (capture → scan review → what can I make /
 * I want to make → dish detail → stock → share) plus Recipes (the full TheMealDB catalog ranked
 * by match against stock), living inside one "Make" module. On top of that design:
 *   - reference theme (calendar-device): white surfaces, orange primary, large type
 *   - "Recipes" entry in the upper-right of every Make screen
 *   - cooking screen: photo left, dish switcher 1/2/3, numbered steps with a timer each,
 *     current step highlighted yellow, overall "time left for all food" on top; one Start
 *     runs a dish's steps back to back, "Start all" runs every dish
 *   - Start cooking unlocks only when a dish's ingredients are 100 % on hand
 *   - tonight's dish selection, acquired ingredients and cooking progress are remembered
 *   - split screen: two dishes side by side, timer overlaid on each photo
 *   - stock shows a size column in metric or imperial (chosen in the device Settings)
 * Business data lives in memory + localStorage; nothing is sent to a server except the
 * free TheMealDB recipe lookups the original prototype already used. */
(() => {
  "use strict";

  /* ───────────────────────── data ───────────────────────── */
  const DISHES = (window.MAKE_DISHES || []).map(d => ({ ...d }));
  const DISH_IMG = window.MAKE_DISH_IMG || {};
  const CATEGORIES = ["All", "Stir-fry", "Rice bowl", "Side", "Beef", "Chicken", "Pork", "Lamb", "Goat", "Seafood", "Pasta", "Dessert", "Breakfast", "Starter", "Vegetarian", "Vegan", "Miscellaneous"];
  const CAT_MIN = { "Stir-fry": 15, "Rice bowl": 20, Side: 15, Starter: 20, Salad: 15, Chicken: 30, Seafood: 20, Pasta: 20, Vegetarian: 20, Vegan: 20, Beef: 35, Pork: 35, Lamb: 40, Goat: 45, Breakfast: 20, Dessert: 40, Miscellaneous: 25 };
  const cookMinutes = d => 5 * Math.round(((CAT_MIN[d.cat] ?? 25) + 2 * Math.max(0, d.ing.length - 4)) / 5);

  const CAT = { Vegetable: "蔬菜", Fruit: "水果", Grain: "穀類", Protein: "蛋白質", Condiment: "調味料", Herb: "香草", Dairy: "乳製品" };
  const TAXONOMY = {
    Vegetable: ["broccoli","green onion","scallion","spring onion","onion","red onion","garlic","tomato","potato","carrot","cabbage","napa cabbage","bok choy","spinach","lettuce","cucumber","eggplant","bell pepper","mushroom","shiitake mushroom","daikon","radish","pumpkin","zucchini","corn","sweet potato","taro","leek","ginger","chive","celery","cauliflower","asparagus","green bean","snow pea","pea","bean sprouts","water spinach","seaweed","nori","lotus root","bamboo shoot","winter melon","bitter melon","yam","kale","chard"],
    Fruit: ["avocado","apple","banana","orange","lemon","lime","mango","papaya","pineapple","grape","pear","peach","plum","strawberry","blueberry","watermelon","melon","guava","lychee","longan","persimmon","pomelo","kiwi","dragon fruit","wax apple","yuzu","coconut","fig","date"],
    Grain: ["rice","white rice","brown rice","jasmine rice","sticky rice","glutinous rice","noodles","rice noodles","udon","pasta","flour","oats","quinoa","barley","millet","wheat","couscous","bread"],
    Protein: ["beef","beef sirloin","pork","pork belly","chicken","chicken thigh","chicken breast","duck","lamb","egg","eggs","tofu","firm tofu","tempeh","fish","salmon","tuna","cod","shrimp","prawn","squid","octopus","clams","mussels","scallops","crab","sausage","bacon","ham","lentils"],
    Condiment: ["soy sauce","oyster sauce","fish sauce","sesame oil","rice wine","shaoxing wine","mirin","rice vinegar","black vinegar","vinegar","hoisin sauce","chili oil","chili sauce","chili crisp","sriracha","gochujang","doubanjiang","miso","ketchup","mayonnaise","mustard","dijon mustard","honey","jam","peanut butter","tahini","xo sauce","ponzu","teriyaki sauce","worcestershire sauce","tomato paste","barbecue sauce","hot sauce","wasabi","sweet chili sauce"],
    Herb: ["salt","sugar","black pepper","white pepper","salt & pepper","basil","thai basil","cilantro","coriander","parsley","mint","rosemary","thyme","oregano","bay leaf","cinnamon","star anise","five spice","cumin","paprika","turmeric","chili flakes","sesame seeds","garlic powder"],
    Dairy: ["milk","butter","cheese","cream","yoghurt","sour cream","cream cheese","parmesan","mozzarella","cheddar","condensed milk","ghee"]
  };
  function categoryOf(name) {
    const n = String(name).toLowerCase();
    const keys = Object.keys(TAXONOMY);
    for (const k of keys) if (TAXONOMY[k].includes(n)) return k;
    for (const k of keys) if (TAXONOMY[k].some(x => n.includes(x))) return k;
    return "Vegetable";
  }
  const WHEN = { Today: "今天", "3 days ago": "三天前", "1 week ago": "一週前", "1 month ago": "一個月前" };
  const UNIT = { heads: "顆", packs: "盒", stalks: "根", pieces: "個", bulbs: "球" };
  const AMT = { "300 g": "300 公克", "250 g": "250 公克", "200 g": "200 公克", "500 g": "500 公克", "1 head": "1 顆", "3 stalks": "3 根", "1 stalk": "1 根", "2 cloves": "2 瓣", "4 cloves": "4 瓣", "6 cloves": "6 瓣", "2 tbsp": "2 大匙", "1 tbsp": "1 大匙", "3 tbsp": "3 大匙", "1 tsp": "1 小匙", "to taste": "適量", "3": "3 顆", "4": "4 顆", "1": "1 顆", "2 bowls": "2 碗", "1 sheet": "1 片", "1 cup": "1 杯", "1 lb": "450 公克", "5": "5 顆", "8": "8 顆", "20": "20 隻", "2 cups": "2 杯", "450 g": "450 公克", "handful": "一把", "3 oz": "85 公克", "2 oz": "60 公克", "2 tsp": "2 小匙" };

  /* Stock: `size` is the size of one unit (weight in grams or volume in millilitres);
     the display unit system (metric / imperial) comes from the device Settings. */
  const STOCK = [
    { name: "Broccoli", zh: "花椰菜", qty: 2, where: "Fridge", added: "Today", size: { kind: "weight", g: 500 } },
    { name: "Beef sirloin", zh: "牛肉", qty: 1, where: "Fridge", added: "Today", size: { kind: "weight", g: 450 } },
    { name: "Green onion", zh: "青蔥", qty: 4, where: "Fridge", added: "Today", size: { kind: "weight", g: 25 } },
    { name: "Tomato", zh: "番茄", qty: 3, where: "Fridge", added: "Today", size: { kind: "weight", g: 150 } },
    { name: "Avocado", zh: "酪梨", qty: 1, where: "Counter", added: "Today", size: { kind: "weight", g: 200 } },
    { name: "Garlic", zh: "蒜頭", qty: 1, where: "Pantry", added: "3 days ago", size: { kind: "weight", g: 50 } },
    { name: "Eggs", zh: "雞蛋", qty: 6, where: "Fridge", added: "3 days ago", size: { kind: "weight", g: 60 } },
    { name: "Onion", zh: "洋蔥", qty: 2, where: "Pantry", added: "1 week ago", size: { kind: "weight", g: 180 } },
    { name: "Soy sauce", zh: "醬油", qty: 1, where: "Pantry", added: "1 month ago", size: { kind: "volume", ml: 500 } },
    { name: "Rice", zh: "白米", qty: 1, where: "Pantry", added: "1 month ago", size: { kind: "weight", g: 2000 } }
  ];
  /* Each press of Capture reveals the next frame: the items that shot picks up. */
  const SHOTS = [
    { items: [["Broccoli", 1], ["Beef sirloin", 1]], boxes: [["Broccoli", "14%", "22%", "26%", "34%", 0], ["Beef sirloin", "56%", "44%", "26%", "30%", 1]] },
    { items: [["Green onion", 3]], boxes: [["Green onion", "20%", "50%", "34%", "22%", 0]] },
    { items: [["Tomato", 2], ["Avocado", 1]], boxes: [["Tomato", "12%", "26%", "22%", "30%", 0], ["Avocado", "48%", "36%", "22%", "28%", 1]] },
    { items: [["Tomato", 1], ["Garlic", 1]], boxes: [["Garlic", "34%", "30%", "24%", "26%", 1]] }
  ];
  const ITEMS = {
    Broccoli: { zh: "花椰菜", conf: 98, unit: "heads", size: { kind: "weight", g: 500 } },
    "Beef sirloin": { zh: "牛肉", conf: 94, unit: "packs", size: { kind: "weight", g: 450 } },
    "Green onion": { zh: "青蔥", conf: 96, unit: "stalks", size: { kind: "weight", g: 25 } },
    Tomato: { zh: "番茄", conf: 99, unit: "pieces", size: { kind: "weight", g: 150 } },
    Avocado: { zh: "酪梨", conf: 91, unit: "pieces", size: { kind: "weight", g: 200 } },
    Garlic: { zh: "蒜頭", conf: 88, unit: "bulbs", size: { kind: "weight", g: 50 } }
  };
  const ING_IMG = { "Broccoli": "Broccoli", "Beef sirloin": "Beef", "Green onion": "Spring Onions", "Tomato": "Tomato", "Avocado": "Avocado", "Garlic": "Garlic", "Eggs": "Egg", "Rice": "Rice" };
  const ingImg = name => "https://www.themealdb.com/images/ingredients/" + encodeURIComponent(ING_IMG[name] || name) + ".png";
  const dishImg = id => DISH_IMG[id] ? "https://www.themealdb.com/images/media/meals/" + DISH_IMG[id] : ingImg("Broccoli");

  const ALIAS = {
    "sirloin steak": "beef sirloin", "ground beef": "beef sirloin", "beef": "beef sirloin", "spring onions": "green onion", "plum tomatoes": "tomato", "tomatoes": "tomato",
    "jasmine rice": "rice", "white rice": "rice", "egg": "eggs", "garlic clove": "garlic", "mung bean sprouts": "bean sprouts", "basil leaves": "thai basil", "carrots": "carrot",
    "water": "*", "cornstarch": "*", "corn starch": "*", "dry sherry": "*", "shaoxing wine": "*", "vegetable oil": "*", "high heat cooking oil": "*", "sesame seed oil": "*", "olive oil": "*",
    "chicken stock": "*", "beef stock": "*", "unsalted beef stock": "*", "chicken bouillon powder": "*", "kosher salt": "*", "pepper": "*", "black pepper": "*", "white pepper": "*", "sugar": "*", "salt": "*",
    "red chilli": "*", "shallots": "*"
  };
  const ING_ZH = {
    "sirloin steak": "沙朗牛排", "beef": "牛肉", "ground beef": "牛絞肉", "broccoli": "花椰菜", "soy sauce": "醬油", "oyster sauce": "蠔油", "fish sauce": "魚露", "garlic": "蒜頭", "garlic clove": "蒜頭", "spring onions": "青蔥", "plum tomatoes": "番茄", "tomato": "番茄", "eggs": "雞蛋", "egg": "雞蛋", "jasmine rice": "茉莉香米", "rice": "白米", "shrimp": "蝦仁", "chicken": "雞肉", "shallots": "紅蔥頭", "red chilli": "紅辣椒", "basil leaves": "九層塔", "cucumber": "小黃瓜", "carrots": "紅蘿蔔", "onion": "洋蔥", "lime": "萊姆", "avocado": "酪梨", "sugar": "糖", "salt": "鹽", "pepper": "胡椒", "black pepper": "黑胡椒", "white pepper": "白胡椒", "kosher salt": "鹽", "water": "水", "cornstarch": "太白粉", "vegetable oil": "沙拉油", "sesame seed oil": "香油", "dry sherry": "料理酒", "shaoxing wine": "紹興酒", "chicken stock": "雞高湯", "beef stock": "牛高湯", "unsalted beef stock": "牛高湯", "chicken bouillon powder": "雞粉", "mung bean sprouts": "豆芽菜", "high heat cooking oil": "食用油", "olive oil": "橄欖油", "butter": "奶油", "milk": "牛奶", "flour": "麵粉", "potatoes": "馬鈴薯", "parsley": "巴西里", "cumin": "孜然", "paprika": "紅椒粉", "red pepper": "紅甜椒", "green pepper": "青椒", "lemon": "檸檬", "thyme": "百里香", "bacon": "培根", "cheese": "起司", "bread": "麵包"
  };

  /* Curated step-by-step plans with a timer per step (seconds). Other dishes use the TheMealDB
     method with the catalog's cook time spread across the steps. */
  const STEPS = {
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
      zh: ["花椰菜切成大小一致的小朵。", "中火以油將蒜片煎至微金黃。", "下花椰菜與少許水，加蓋燜 2 分鐘。", "開蓋轉大火翻炒收乾，加鹽調味即可。"] }
  };

  const FAMILY = [
    { id: "dad", name: "Dad", zh: "爸爸" }, { id: "mom", name: "Mom", zh: "媽媽" }, { id: "ellie", name: "Ellie", zh: "小艾" }, { id: "gran", name: "Grandma", zh: "奶奶" }
  ];
  const VOTE_SEED = { "banh-mi-bowl": 3, "beef-broccoli": 2, "tomato-egg": 1 };
  const DAY_EN = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const DAY_ZH = ["日","一","二","三","四","五","六"];
  /* Meals planned per weekday in the prototype package; today's entry seeds tonight's table. */
  const WEEK_MEALS = { Mon: ["beef-broccoli"], Tue: ["tomato-egg"], Wed: [], Thu: ["egg-foo-young"], Fri: ["banh-mi-bowl"], Sat: [], Sun: [] };

  const STR = {
    en: {
      brand: "Lucky Table", brandSub: "家味開運桌", navMake: "Make", navRec: "Recipes",
      recKicker: "Matched against what's in stock", stockBtn: "What's in stock",
      tonight: "Tonight's table", tonightNone: "Nothing on tonight's menu yet — pick a dish from Recipes.",
      eating: "eating", dishesN: "dishes", dishN: "dish", left: "left", cookNow: "Start cooking", continueCook: "Continue cooking", addDish: "Add dish", removeDish: "Remove from tonight",
      notReady: "not ready", readyAll: "all ingredients on hand", needAll: "Buy the missing ingredients first — Start cooking unlocks at 100%.", stepsLater: "The step-by-step recipe with timers appears when you start cooking.",
      tile1: "What can I make?", tile1Body: "Snap what you have. We'll match it against your stock.",
      tile2: "I want to make…", tile2Body: "Pick a dish. We'll list what's missing.",
      tile3: "Share", tile3Body: "Send a dish, hand off your list, or set the family table.",
      capture: "Capture", cameraFeed: "live camera feed", detectedSoFar: "Detected so far",
      nothingYet: "Point at your ingredients and press Capture. Each shot itemizes what it sees.",
      hintHome: "At home — captures are added to your stock count.", reviewNone: "Nothing captured yet", review: "Review",
      items: "items", item: "item", units: "units", itemized: "itemized", match: "match", minShort: "min",
      addToStock: "Add to stock", seeWhatICanMake: "See what I can make", makeAll: "Make using everything I have", titleAll: "Using everything I have",
      matchingFrom: "Matching from", ingredients: "Ingredients", readyToCook: "Ready to cook", ready: "Ready", onHand: "Everything on hand", missing: "Missing", buy: "Buy",
      allReady: "All ingredients on hand — start cooking.", ofReady: "of", ingReady: "ingredients ready. Tick an item once you've bought it.",
      nothingToBuy: "Nothing to buy — you're set.", stillNeed: "Still need", nothingInCart: "Nothing in cart", addToCart: "Add", toCart: "to cart", addedToCart: "Added",
      colItem: "Item", colCat: "Category", colSize: "Size", colCount: "Count", colAdded: "Updated", swipeHint: "Swipe a row left to remove it.", del: "Remove",
      unitsLabel: "Units", metric: "Metric", imperial: "Imperial", unitsHint: "Chosen in Settings → Display & language",
      famVote: "Family vote", voteFor: "Vote for this dish", voted: "Voted", voteLine: "Votes show up on Home.",
      addMenuTitle: "Tonight's menu", addMenu: "Add to tonight", addedMenu: "On tonight's menu", menuNote: "Remembered for tonight and shown on Home.",
      planDay: "Plan for a day", planTitle: "Plan this dish", evDay: "Day", evTime: "Time", save: "Add to calendar", cancel: "Cancel", planned: "Planned:",
      titles: { capture: "Capture items", review: "What we found", canmake: "What can I make", wantmake: "I want to make", stock: "What's in stock", share: "Share", recipes: "Recipes", cook: "Cooking" },
      filters: { All: "All", "Stir-fry": "Stir-fry", "Rice bowl": "Rice bowl", Side: "Side", Beef: "Beef", Chicken: "Chicken", Pork: "Pork", Lamb: "Lamb", Goat: "Goat", Seafood: "Seafood", Pasta: "Pasta", Dessert: "Dessert", Breakfast: "Breakfast", Starter: "Starter", Vegetarian: "Vegetarian", Vegan: "Vegan", Miscellaneous: "Other" },
      share: [
        { num: "1", title: "Send a dish", body: "Send the recipe and its ingredient list to family, LINE or messages.", cta: "Pick a dish" },
        { num: "2", title: "Hand off the list", body: "Share what's missing so whoever's out can pick it up.", cta: "Copy list" },
        { num: "3", title: "Family table", body: "A shared calendar of who's cooking what, this week.", cta: "Open calendar" }
      ],
      handoffEmpty: "Nothing on the list yet. Add missing ingredients from a dish page.",
      timeLeftAll: "Time left for all food", splitScreen: "Split screen", singleScreen: "Single dish", exit: "Exit", steps: "steps", step: "Step",
      play: "Start", pause: "Pause", resume: "Resume", plusMin: "+1 min", reset: "Reset", done: "Done", stepDone: "Done", startAll: "Start all", pauseAll: "Pause all",
      allDone: "All dishes are done — time to eat!", finish: "Finish cooking", cooked: "Cooked", pickDish: "Pick a dish", chooseSide: "Choose a dish for this side",
      est: "est.", loadingSteps: "Loading the recipe steps…", stepsOffline: "Steps come from TheMealDB and need an internet connection the first time.",
      copied: "List copied", copyFail: "Copy not available here", sent: "Shared (demo)", timerDone: "Timer finished", offlineSteps: "Recipe photos and source steps load from TheMealDB when online."
    },
    zh: {
      brand: "家味開運桌", brandSub: "LUCKY TABLE", navMake: "做菜", navRec: "食譜",
      recKicker: "依照庫存比對", stockBtn: "庫存清單",
      tonight: "今晚的餐桌", tonightNone: "今晚還沒有菜單，先從食譜選一道菜。",
      eating: "人用餐", dishesN: "道菜", dishN: "道菜", left: "剩餘", cookNow: "開始料理", continueCook: "繼續料理", addDish: "新增料理", removeDish: "從今晚移除",
      notReady: "道未備齊", readyAll: "食材全部齊全", needAll: "先補齊缺少的食材，備料 100% 才能開始料理。", stepsLater: "逐步作法與計時會在開始料理後顯示。",
      tile1: "我能做什麼？", tile1Body: "拍下現有食材，系統會比對你的庫存。",
      tile2: "我想做…", tile2Body: "選一道菜，我們列出還缺什麼。",
      tile3: "分享", tile3Body: "分享菜色、代買清單，或安排家庭餐桌。",
      capture: "拍攝", cameraFeed: "相機畫面", detectedSoFar: "已辨識",
      nothingYet: "對準食材後按下拍攝，每張照片都會自動列出品項。",
      hintHome: "居家模式：拍到的食材會加入庫存。", reviewNone: "尚未拍攝", review: "確認",
      items: "項", item: "項", units: "件", itemized: "項已辨識", match: "把握", minShort: "分鐘",
      addToStock: "加入庫存", seeWhatICanMake: "看看能做什麼", makeAll: "用我所有的食材", titleAll: "用現有全部食材",
      matchingFrom: "比對來源", ingredients: "食材", readyToCook: "備料完成度", ready: "齊全", onHand: "食材齊全", missing: "缺", buy: "需購買",
      allReady: "食材全部齊全，可以開始下廚。", ofReady: "／", ingReady: "項食材已備妥。買齊後點一下即可打勾。",
      nothingToBuy: "不用再買了，食材齊全。", stillNeed: "還缺", nothingInCart: "購物車是空的", addToCart: "加入", toCart: "項到購物車", addedToCart: "已加入",
      colItem: "品項", colCat: "分類", colSize: "份量", colCount: "數量", colAdded: "更新", swipeHint: "向左滑動可刪除。", del: "刪除",
      unitsLabel: "單位", metric: "公制", imperial: "英制", unitsHint: "於設定 → 顯示與語言中選擇",
      famVote: "家人投票", voteFor: "投這道菜一票", voted: "已投票", voteLine: "票數會顯示在首頁。",
      addMenuTitle: "今晚菜單", addMenu: "加入今晚", addedMenu: "已在今晚菜單", menuNote: "今晚的選擇會被記住，並顯示在首頁。",
      planDay: "安排到行事曆", planTitle: "安排這道菜", evDay: "日期", evTime: "時間", save: "加入行事曆", cancel: "取消", planned: "已安排：",
      titles: { capture: "拍攝食材", review: "辨識結果", canmake: "我能做什麼", wantmake: "我想做", stock: "庫存清單", share: "分享", recipes: "食譜", cook: "料理中" },
      filters: { All: "全部", "Stir-fry": "快炒", "Rice bowl": "丼飯", Side: "小菜", Beef: "牛肉", Chicken: "雞肉", Pork: "豬肉", Lamb: "羊肉", Goat: "山羊肉", Seafood: "海鮮", Pasta: "義大利麵", Dessert: "甜點", Breakfast: "早餐", Starter: "前菜", Vegetarian: "蔬食", Vegan: "純素", Miscellaneous: "其他" },
      share: [
        { num: "1", title: "分享菜色", body: "把食譜和食材清單傳給家人、LINE 或訊息。", cta: "選一道菜" },
        { num: "2", title: "代買清單", body: "把缺的食材分享出去，讓在外面的人順手買回來。", cta: "複製清單" },
        { num: "3", title: "家庭餐桌", body: "共用行事曆，看這週誰負責做哪一餐。", cta: "開啟行事曆" }
      ],
      handoffEmpty: "清單還是空的，先在料理頁加入缺少的食材。",
      timeLeftAll: "所有料理剩餘時間", splitScreen: "分割畫面", singleScreen: "單一料理", exit: "離開", steps: "個步驟", step: "步驟",
      play: "開始", pause: "暫停", resume: "繼續", plusMin: "+1 分鐘", reset: "重設", done: "完成", stepDone: "已完成", startAll: "全部開始", pauseAll: "全部暫停",
      allDone: "全部完成，可以開飯了！", finish: "完成料理", cooked: "已完成", pickDish: "選一道菜", chooseSide: "為這一側選一道菜",
      est: "約", loadingSteps: "正在載入食譜步驟…", stepsOffline: "步驟來自 TheMealDB，第一次載入需要連網。",
      copied: "已複製清單", copyFail: "此環境無法複製", sent: "已分享（演示）", timerDone: "計時完成", offlineSteps: "料理照片與原始食譜在連網時由 TheMealDB 載入。"
    }
  };

  /* ───────────────────────── runtime helpers ───────────────────────── */
  const params = new URLSearchParams(window.location.search);
  const embedded = window.parent !== window && params.get("device") === "1";
  const root = document.documentElement;
  if (embedded) { root.classList.add("device-embedded"); root.dataset.devicePage = "make"; }
  const app = document.getElementById("app");
  const toastEl = document.getElementById("toast");
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const icon = (name, cls = "") => {
    const key = name.split("-").map(s => s[0].toUpperCase() + s.slice(1)).join("");
    const nodes = window.lucide?.[key] || window.lucide?.Circle || [];
    return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true">${nodes.map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(" ")}></${tag}>`).join("")}</svg>`;
  };
  const load = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ } };
  const fmt = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`; };
  const fmtMin = s => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`; };
  const trimNum = n => String(Math.round(n * 10) / 10);
  let toastTimer = 0;
  function toast(msg) { clearTimeout(toastTimer); toastEl.textContent = msg; toastEl.classList.add("is-visible"); toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600); }
  function localeToLang(code) { return String(code || "").toLowerCase().startsWith("zh") ? "zh" : "en"; }
  const storedLocale = (() => { try { return localStorage.getItem("lucky-table.locale") || ""; } catch { return ""; } })();

  /* ───────────────────────── state ───────────────────────── */
  const storedTonight = load("luckytable-make-tonight", null);
  const storedCook = load("luckytable-make-cook", null);
  const storedStock = load("luckytable-make-stock", null);
  const state = {
    lang: localeToLang(params.get("lang") || storedLocale || "zh-Hant"),
    units: load("luckytable-units", "metric"),
    screen: "home", stack: [],
    members: FAMILY.map(p => ({ id: p.id, name: p.name, zh: p.zh })), diners: FAMILY.map(p => p.id),
    shots: 0, qty: {},
    stock: (storedStock || STOCK.map(x => ({ ...x }))).map(x => ({ ...x, size: x.size || (STOCK.find(s => s.name === x.name) || {}).size || { kind: "count" } })),
    matchMode: "stock", dishId: DISHES[0] ? DISHES[0].id : "", acquired: load("luckytable-make-acquired", {}), filter: "All", recipeFilter: "All", carted: false,
    swipeIdx: -1, swipeDx: 0, swipeX0: 0,
    recipes: load("luckytable-mealdb", {}),
    votes: { ...VOTE_SEED }, myVotes: load("luckytable-make-votes", []),
    cart: load("luckytable-make-cart", []),
    planned: [],
    tonight: storedTonight && storedTonight.date === todayKey ? storedTonight.ids : (WEEK_MEALS[DAY_EN[today.getDay()]] || []).slice(),
    cook: storedCook && storedCook.date === todayKey ? storedCook : null,
    modal: null, modalPane: "", evDay: 0, evTime: "18:30"
  };
  if (!Array.isArray(state.tonight)) state.tonight = [];
  state.tonight = state.tonight.filter(id => DISHES.some(d => d.id === id));
  const persistTonight = () => save("luckytable-make-tonight", { date: todayKey, ids: state.tonight });
  const persistCook = () => save("luckytable-make-cook", state.cook);
  const persistStock = () => save("luckytable-make-stock", state.stock);
  const persistCart = () => save("luckytable-make-cart", state.cart);
  const persistAcquired = () => save("luckytable-make-acquired", state.acquired);

  const T = () => STR[state.lang];
  const zh = () => state.lang === "zh";
  const nm = (en, z) => (zh() ? (z || en) : en);
  const dishById = id => DISHES.find(d => d.id === id) || DISHES[0];
  const dishName = d => nm(d.name, d.zh);
  const memberName = m => (zh() && m.zh ? m.zh : m.name);
  const sep = () => (zh() ? "、" : ", ");

  /* ───────────────────────── derived data ───────────────────────── */
  function capturedItems() {
    const base = {};
    for (let i = 0; i < state.shots && i < SHOTS.length; i++) SHOTS[i].items.forEach(([n, q]) => { base[n] = (base[n] || 0) + q; });
    return Object.keys(base).map(name => {
      const meta = ITEMS[name];
      return { name, label: nm(name, meta.zh), cat: zh() ? CAT[categoryOf(name)] : categoryOf(name), unit: zh() ? UNIT[meta.unit] : meta.unit, conf: meta.conf, img: ingImg(name), qty: state.qty[name] !== undefined ? state.qty[name] : base[name], base: base[name] };
    });
  }
  const STAPLES = ["salt", "sugar", "salt & pepper", "black pepper", "white pepper", "cooking oil"];
  function pantryNames() {
    return (state.matchMode === "captured" ? capturedItems().map(c => c.name) : state.stock.map(x => x.name)).map(n => n.toLowerCase());
  }
  function hasIng(name, pantry) {
    const k = String(name).toLowerCase();
    const a = ALIAS[k];
    if (a === "*" || STAPLES.includes(k)) return true;
    const key = a || k;
    return pantry.includes(key) || pantry.some(p => key.includes(p) || p.includes(key));
  }
  const ingList = d => (state.recipes[d.id] && state.recipes[d.id].ing && state.recipes[d.id].ing.length) ? state.recipes[d.id].ing : d.ing;
  const acquiredFor = id => state.acquired[id] || [];
  function dishIngredients(d, pantry) {
    const acquired = acquiredFor(d.id);
    return ingList(d).map(([name, zhName, amount]) => {
      const label = nm(name, zhName || ING_ZH[String(name).toLowerCase()] || name);
      const have = hasIng(name, pantry) || acquired.includes(name);
      return { name, label, amount: zh() ? (AMT[amount] || amount) : amount, have };
    });
  }
  function readiness(d, pantry) {
    const ings = dishIngredients(d, pantry || state.stock.map(x => x.name.toLowerCase()));
    const have = ings.filter(i => i.have).length;
    return { ings, have, pct: ings.length ? Math.round((have / ings.length) * 100) : 100, missing: ings.filter(i => !i.have) };
  }
  function decorate(d, pantry) {
    const t = T();
    const r = readiness(d, pantry);
    const full = r.missing.length === 0;
    return { id: d.id, label: dishName(d), img: dishImg(d.id), m: r.pct, full, cat: d.cat, minutes: cookMinutes(d),
      matchLabel: full ? t.ready : r.pct + "%",
      note: full ? t.onHand : `${t.missing} ${r.missing.length} · ${r.missing.map(x => x.label).join(sep())}`,
      shopNote: full ? t.onHand : `${t.buy} ${r.missing.length} ${zh() ? t.items : (r.missing.length === 1 ? t.item : t.items)}` };
  }
  const allTonightReady = () => state.tonight.every(id => readiness(dishById(id)).pct === 100);

  /* step plans: curated timers first, otherwise TheMealDB's method with the catalog cook time
     spread across the steps (explicit "N minutes" in a step wins). */
  function parseSeconds(text) {
    const m = /(\d+)(?:\s*(?:-|–|to)\s*(\d+))?\s*(hour|hr|minute|min|second|sec)/i.exec(text);
    if (!m) return 0;
    const n = Number(m[2] || m[1]);
    const unit = m[3].toLowerCase();
    return unit.startsWith("h") ? n * 3600 : unit.startsWith("m") ? n * 60 : n;
  }
  function planFor(id) {
    const local = STEPS[id];
    if (local) return local[zh() ? "zh" : "en"].map((text, i) => ({ text, seconds: local.seconds[i] || 120 }));
    const r = state.recipes[id];
    if (!r || !r.steps || !r.steps.length) return [];
    const d = dishById(id);
    const total = cookMinutes(d) * 60;
    const explicit = r.steps.map(parseSeconds);
    const fixed = explicit.reduce((a, s) => a + s, 0);
    const open = explicit.filter(s => !s).length;
    const share = open ? Math.max(30, Math.round((total - fixed) / open / 10) * 10) : 0;
    return r.steps.map((text, i) => ({ text, seconds: explicit[i] || share }));
  }
  const planSeconds = id => { const p = planFor(id); return p.length ? p.reduce((a, s) => a + s.seconds, 0) : cookMinutes(dishById(id)) * 60; };

  /* ───────────────────────── TheMealDB (lazy, cached) ───────────────────────── */
  const fetching = new Set();
  function ensureRecipe(id) {
    const d = dishById(id);
    if (!d || !d.mealId || state.recipes[id] || fetching.has(id) || typeof fetch !== "function") return;
    fetching.add(id);
    fetch("https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + d.mealId).then(r => r.json()).then(j => {
      const m = (j.meals || [])[0]; if (!m) return;
      const ing = [];
      for (let i = 1; i <= 20; i++) { const n = m["strIngredient" + i]; if (n && n.trim()) ing.push([n.trim(), "", (m["strMeasure" + i] || "").trim()]); }
      const raw = String(m.strInstructions || "").split(/\r?\n+/).map(x => x.trim().replace(/^(step\s*)?\d+[.):]?\s*/i, "")).filter(x => x.length > 2);
      const steps = [];
      raw.forEach(line => { if (/:$/.test(line) && line.length < 60) steps.push(line); else if (steps.length && /:$/.test(steps[steps.length - 1]) && steps[steps.length - 1].length < 60) steps[steps.length - 1] += " " + line; else steps.push(line); });
      state.recipes[id] = { ing, steps, source: m.strSource || ("https://www.themealdb.com/meal/" + d.mealId), title: m.strMeal };
      save("luckytable-mealdb", state.recipes);
      if (state.cook && state.cook.dishIds.includes(id)) syncSteps();
      render();
    }).catch(() => {}).finally(() => fetching.delete(id));
  }

  /* ───────────────────────── tonight & cooking session ───────────────────────── */
  function addTonight(id) {
    if (!state.tonight.includes(id)) { state.tonight.push(id); persistTonight(); }
    ensureRecipe(id);
    if (state.cook) { if (!state.cook.dishIds.includes(id)) state.cook.dishIds.push(id); syncSteps(); persistCook(); }
  }
  function removeTonight(id) {
    state.tonight = state.tonight.filter(x => x !== id); persistTonight();
    if (state.cook) {
      state.cook.dishIds = state.cook.dishIds.filter(x => x !== id); delete state.cook.steps[id]; delete state.cook.selected[id];
      if (state.cook.active === id) state.cook.active = state.cook.dishIds[0] || null;
      if (state.cook.paneB === id) state.cook.paneB = null;
      if (!state.cook.dishIds.length) { stopInterval(); state.cook = null; }
      persistCook();
    }
  }
  function syncSteps() {
    const c = state.cook; if (!c) return;
    c.dishIds.forEach(id => {
      const plan = planFor(id);
      if (!c.steps[id] || c.steps[id].length !== plan.length) c.steps[id] = plan.map(p => ({ seconds: p.seconds, remaining: p.seconds, done: false, running: false, deadline: 0 }));
      if (c.selected[id] == null || c.selected[id] >= c.steps[id].length) c.selected[id] = firstUndone(id);
    });
  }
  function firstUndone(id) { const steps = state.cook.steps[id] || []; const i = steps.findIndex(s => !s.done); return i === -1 ? Math.max(0, steps.length - 1) : i; }
  function startSession(activeId) {
    if (activeId) addTonight(activeId);
    const ids = state.tonight.slice();
    if (!ids.length) return false;
    ids.forEach(ensureRecipe);
    if (!state.cook) state.cook = { date: todayKey, dishIds: ids, active: activeId || ids[0], split: false, paneB: null, steps: {}, selected: {} };
    else { ids.forEach(id => { if (!state.cook.dishIds.includes(id)) state.cook.dishIds.push(id); }); if (activeId) state.cook.active = activeId; if (!state.cook.dishIds.includes(state.cook.active)) state.cook.active = state.cook.dishIds[0]; }
    syncSteps(); persistCook(); ensureInterval();
    return true;
  }
  function endSession() { stopInterval(); state.cook = null; persistCook(); }
  let interval = 0;
  const anyRunning = () => Boolean(state.cook) && Object.values(state.cook.steps).some(steps => steps.some(s => s.running));
  function ensureInterval() { if (!interval && anyRunning()) interval = setInterval(tick, 500); }
  function stopInterval() { clearInterval(interval); interval = 0; }
  function startStep(id, i, now = Date.now()) {
    const s = stepAt(id, i); if (!s || s.done) return false;
    if (s.remaining <= 0) s.remaining = s.seconds;
    s.deadline = now + s.remaining * 1000; s.running = true; state.cook.selected[id] = i;
    return true;
  }
  function tick() {
    const c = state.cook; if (!c) return stopInterval();
    const now = Date.now(); let finished = false;
    c.dishIds.forEach(id => (c.steps[id] || []).forEach((s, i) => {
      if (!s.running) return;
      s.remaining = Math.max(0, Math.ceil((s.deadline - now) / 1000));
      if (s.remaining === 0) {
        s.running = false; s.done = true; s.deadline = 0; finished = true;
        /* the dish keeps going: the next unfinished step starts on its own */
        const steps = c.steps[id];
        let next = steps.findIndex((x, j) => j > i && !x.done);
        if (next === -1) next = steps.findIndex(x => !x.done);
        if (next !== -1) startStep(id, next, now); else c.selected[id] = i;
      }
    }));
    if (finished) { persistCook(); beep(); toast(T().timerDone); if (state.screen === "cook") render(); }
    else if (state.screen === "cook") updateTimerDom();
    if (!anyRunning()) { persistCook(); stopInterval(); }
  }
  function stepAt(id, i) { return state.cook && state.cook.steps[id] && state.cook.steps[id][i]; }
  function toggleTimer(id, i) {
    const s = stepAt(id, i); if (!s || s.done) return;
    if (s.running) { s.remaining = Math.max(0, Math.ceil((s.deadline - Date.now()) / 1000)); s.running = false; s.deadline = 0; state.cook.selected[id] = i; }
    else startStep(id, i);
    persistCook(); ensureInterval(); render();
  }
  function startAll() {
    const c = state.cook; if (!c) return;
    c.dishIds.forEach(id => {
      const steps = c.steps[id] || []; if (!steps.length || steps.every(s => s.done) || steps.some(s => s.running)) return;
      const i = steps[c.selected[id]] && !steps[c.selected[id]].done ? c.selected[id] : firstUndone(id);
      startStep(id, i);
    });
    persistCook(); ensureInterval(); render();
  }
  function pauseAll() {
    const c = state.cook; if (!c) return;
    const now = Date.now();
    c.dishIds.forEach(id => (c.steps[id] || []).forEach(s => { if (s.running) { s.remaining = Math.max(0, Math.ceil((s.deadline - now) / 1000)); s.running = false; s.deadline = 0; } }));
    persistCook(); stopInterval(); render();
  }
  function addMinute(id, i) { const s = stepAt(id, i); if (!s) return; s.remaining += 60; if (s.running) s.deadline += 60000; if (s.done) s.done = false; persistCook(); render(); }
  function resetStep(id, i) { const s = stepAt(id, i); if (!s) return; s.remaining = s.seconds; s.running = false; s.deadline = 0; s.done = false; persistCook(); render(); }
  function completeStep(id, i) {
    const s = stepAt(id, i); if (!s) return;
    s.done = !s.done; s.running = false; s.deadline = 0; s.remaining = s.done ? 0 : s.seconds;
    state.cook.selected[id] = s.done ? firstUndone(id) : i; persistCook(); render();
  }
  function selectStep(id, i) { if (!state.cook) return; state.cook.selected[id] = i; persistCook(); render(); }
  const totalRemaining = () => state.cook ? state.cook.dishIds.reduce((a, id) => a + (state.cook.steps[id] || []).reduce((b, s) => b + (s.done ? 0 : s.remaining), 0), 0) : 0;
  const totalSeconds = () => state.cook ? state.cook.dishIds.reduce((a, id) => a + (state.cook.steps[id] || []).reduce((b, s) => b + s.seconds, 0), 0) : 0;
  const dishDone = id => Boolean(state.cook) && (state.cook.steps[id] || []).length > 0 && state.cook.steps[id].every(s => s.done);
  const allDone = () => Boolean(state.cook) && state.cook.dishIds.length > 0 && state.cook.dishIds.every(dishDone);
  function beep() {
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 880; g.gain.value = 0.08; o.start(); o.stop(ctx.currentTime + 0.35); o.onended = () => ctx.close(); } catch { /* audio unavailable */ }
  }
  function updateTimerDom() {
    const c = state.cook; if (!c) return;
    document.querySelectorAll("[data-step-time]").forEach(el => { const [id, i] = el.dataset.stepTime.split(":"); const s = stepAt(id, Number(i)); if (s && !s.done) el.textContent = fmt(s.remaining); });
    document.querySelectorAll("[data-overlay]").forEach(el => { const id = el.dataset.overlay; const s = stepAt(id, c.selected[id]); if (s && !s.done) el.textContent = fmt(s.remaining); });
    const total = document.querySelector("[data-total]"); if (total) total.textContent = fmt(totalRemaining());
    const bar = document.querySelector("[data-total-bar]"); if (bar) bar.style.width = `${Math.round((1 - totalRemaining() / Math.max(1, totalSeconds())) * 100)}%`;
  }

  /* ───────────────────────── stock sizes ───────────────────────── */
  function sizeLabel(size) {
    if (!size || size.kind === "count") return "—";
    const imperial = state.units === "imperial";
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

  /* ───────────────────────── navigation ───────────────────────── */
  function go(screen, extra) { state.stack.push(state.screen); state.screen = screen; Object.assign(state, extra || {}); render(); }
  function back() { state.screen = state.stack.length ? state.stack.pop() : "home"; render(); }
  function home() { state.screen = "home"; state.stack = []; render(); }

  /* ───────────────────────── views ───────────────────────── */
  const photoBox = (cls, src, inner = "") => `<div class="${cls}"><img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.classList.add('is-missing')" />${inner}</div>`;
  function headerActions() {
    const t = T();
    return `<div class="header-actions">
      <button class="btn ${state.screen === "recipes" ? "btn-soft" : ""}" data-act="recipes">${icon("book-open")}${esc(t.navRec)}</button>
      <button class="btn" data-act="stock">${icon("boxes")}${esc(t.stockBtn)}</button>
      ${embedded ? "" : `<div class="lang-switch"><button class="${zh() ? "" : "is-on"}" data-act="lang" data-lang="en">EN</button><button class="${zh() ? "is-on" : ""}" data-act="lang" data-lang="zh">繁中</button></div>`}
    </div>`;
  }
  function screenHeader(title) {
    return `<header class="screen-header">
      <button class="btn btn-icon btn-soft" data-act="home" aria-label="Home">${icon("house")}</button>
      <button class="btn btn-icon" data-act="back" aria-label="Back">${icon("chevron-left")}</button>
      <h1>${esc(title)}</h1>${headerActions()}</header>`;
  }
  function dishCard(d, note, extraCls = "", act = "open-dish") {
    const t = T();
    return `<button class="dish-card ${extraCls}" data-act="${act}" data-id="${d.id}">
      ${photoBox("dish-photo", d.img, `<span class="badge ${d.full ? "is-ready" : ""}">${esc(d.matchLabel)}</span><span class="time-badge">${icon("timer")}${d.minutes} ${esc(t.minShort)}</span>`)}
      <span class="dish-copy"><strong>${esc(d.label)}</strong><span>${esc(note)}</span></span></button>`;
  }
  function filterChips(current, act) {
    const t = T();
    return `<div class="filters">${CATEGORIES.map(k => `<button class="chip ${current === k ? "is-on" : ""}" data-act="${act}" data-value="${k}">${esc(t.filters[k] || k)}</button>`).join("")}</div>`;
  }

  function viewHome() {
    const t = T();
    const dinerNames = state.members.filter(m => state.diners.includes(m.id)).map(memberName);
    const tonight = state.tonight.map(dishById);
    const notReady = tonight.filter(d => readiness(d).pct < 100);
    const est = state.cook ? totalRemaining() : tonight.reduce((a, d) => a + planSeconds(d.id), 0);
    const canCook = tonight.length > 0 && notReady.length === 0;
    return `<div class="screen home">
      <header class="screen-header">
        <div class="brand"><span class="brand-mark">${icon("chef-hat")}</span><div><h1>${esc(t.brand)}</h1><p>${esc(t.brandSub)} · ${esc(t.navMake)}</p></div></div>
        ${headerActions()}
      </header>
      <section class="tonight-strip" aria-label="${esc(t.tonight)}">
        <div><h2>${esc(t.tonight)}</h2><span class="tonight-meta">${dinerNames.length ? `${dinerNames.length} ${esc(t.eating)} · ${esc(dinerNames.join(sep()))}` : ""}${tonight.length ? ` · ${tonight.length} ${esc(tonight.length === 1 ? t.dishN : t.dishesN)} · ${esc(t.est)} ${esc(fmtMin(est))} ${esc(t.left)}` : ""}${notReady.length ? ` · <b class="warn">${notReady.length} ${esc(t.notReady)}</b>` : tonight.length ? ` · <b class="ok">${esc(t.readyAll)}</b>` : ""}</span></div>
        <div class="tonight-dishes">${tonight.length ? tonight.map((d, i) => { const r = readiness(d); return `<span class="tonight-dish ${r.pct < 100 ? "is-short" : ""}"><button class="tonight-open" data-act="open-dish" data-id="${d.id}"><i>${DISH_IMG[d.id] ? `<img src="${esc(dishImg(d.id))}" alt="" onerror="this.remove()">` : i + 1}</i><span>${esc(dishName(d))}</span><em>${state.cook && dishDone(d.id) ? esc(t.cooked) : r.pct < 100 ? `${esc(t.missing)} ${r.missing.length}` : esc(t.ready)}</em></button><button class="tonight-remove" data-act="remove-tonight" data-id="${d.id}" aria-label="${esc(t.removeDish)}" title="${esc(t.removeDish)}">${icon("x")}</button></span>`; }).join("") : `<span class="tonight-empty">${esc(t.tonightNone)}</span>`}
          <button class="btn btn-icon" data-act="modal-add" aria-label="${esc(t.addDish)}" title="${esc(t.addDish)}">${icon("plus")}</button></div>
        <div class="tonight-actions"><button class="btn btn-primary btn-lg" data-act="cook" ${canCook ? "" : "disabled"} title="${esc(canCook ? "" : t.needAll)}">${icon("flame")}${esc(state.cook ? t.continueCook : t.cookNow)}</button></div>
      </section>
      <main class="tiles">
        <button class="tile tile-primary" data-act="capture"><span class="tile-ring">${icon("camera")}</span><span><span class="tile-title">${esc(t.tile1)}</span><span class="tile-body">${esc(t.tile1Body)}</span></span></button>
        <button class="tile tile-green" data-act="wantmake"><span class="tile-ring">${icon("cooking-pot")}</span><span><span class="tile-title">${esc(t.tile2)}</span><span class="tile-body">${esc(t.tile2Body)}</span></span></button>
        <button class="tile" data-act="share"><span class="tile-ring">${icon("share-2")}</span><span><span class="tile-title">${esc(t.tile3)}</span><span class="tile-body">${esc(t.tile3Body)}</span></span></button>
      </main>
    </div>`;
  }
  function viewRecipes() {
    const t = T(); const pantry = pantryNames();
    let all = DISHES.map(d => decorate(d, pantry)).sort((a, b) => b.m - a.m || a.minutes - b.minutes);
    if (state.recipeFilter !== "All") all = all.filter(d => d.cat === state.recipeFilter);
    return `<div class="screen">${screenHeader(t.titles.recipes)}
      <div class="list-header"><span class="eyebrow">${esc(t.recKicker)} · ${all.length} ${esc(t.dishesN)}</span></div>
      ${filterChips(state.recipeFilter, "recipe-filter")}
      <div class="dish-grid">${all.map(d => dishCard(d, d.note)).join("")}</div></div>`;
  }
  function viewCapture() {
    const t = T(); const captured = capturedItems();
    const last = state.shots > 0 ? SHOTS[Math.min(state.shots, SHOTS.length) - 1] : null;
    return `<div class="screen">${screenHeader(t.titles.capture)}
      <div class="capture">
        <div class="viewfinder"><span class="feed-label">${esc(t.cameraFeed)}</span>
          ${last ? last.boxes.map(([n, l, tp, w, h, alt]) => `<span class="det-box ${alt ? "alt" : ""}" style="left:${l};top:${tp};width:${w};height:${h}"><span>${esc(nm(n, ITEMS[n].zh))}</span></span>`).join("") : ""}</div>
        <aside class="capture-aside">
          <div class="card"><span class="card-kicker">${esc(t.detectedSoFar)}</span>
            ${captured.length ? `<div class="chips">${captured.map(c => `<span class="chip is-soft">${esc(c.label)}<b>×${c.qty}</b></span>`).join("")}</div>` : `<p class="muted">${esc(t.nothingYet)}</p>`}</div>
          <button class="shutter" data-act="snap">${icon("camera")}<span>${esc(t.capture)}</span></button>
          <p class="muted" style="text-align:center">${esc(t.hintHome)}</p>
          <button class="btn btn-green btn-lg" data-act="review" ${captured.length ? "" : "disabled"}>${esc(captured.length ? `${t.review} ${captured.length} ${t.items}` : t.reviewNone)}</button>
        </aside></div></div>`;
  }
  function viewReview() {
    const t = T(); const captured = capturedItems();
    const units = captured.reduce((a, c) => a + c.qty, 0);
    return `<div class="screen">${screenHeader(t.titles.review)}
      <div class="review-grid">${captured.map(c => `<div class="card review-card">
        <div class="ing-photo"><img src="${esc(c.img)}" alt="" onerror="this.remove()"><span class="tag tag-green">${esc(c.cat)}</span></div>
        <div><strong>${esc(c.label)}</strong><p class="muted">${c.conf}% ${esc(t.match)}</p></div>
        <div class="stepper"><button data-act="qty" data-name="${esc(c.name)}" data-delta="-1" aria-label="−">−</button><b>${c.qty}</b><button class="plus" data-act="qty" data-name="${esc(c.name)}" data-delta="1" aria-label="+">+</button><span class="muted" style="margin-left:auto">${esc(c.unit)}</span></div></div>`).join("")}</div>
      <div class="footer-bar"><span>${captured.length} ${esc(t.itemized)} · ${units} ${esc(t.units)}</span>
        <button class="btn btn-lg" data-act="add-stock">${esc(t.addToStock)}</button>
        <button class="btn btn-primary btn-lg" data-act="canmake" data-mode="captured">${esc(t.seeWhatICanMake)}</button>
        <button class="btn btn-green btn-lg" data-act="canmake" data-mode="stock">${esc(t.makeAll)}</button></div></div>`;
  }
  function viewCanMake() {
    const t = T(); const pantry = pantryNames();
    const list = state.matchMode === "captured" ? capturedItems().map(c => ({ label: c.label, qty: c.qty })) : state.stock.map(x => ({ label: nm(x.name, x.zh), qty: x.qty }));
    const dishes = DISHES.map(d => decorate(d, pantry)).sort((a, b) => b.m - a.m || a.minutes - b.minutes);
    return `<div class="screen">${screenHeader(state.matchMode === "stock" ? t.titleAll : t.titles.canmake)}
      <div class="canmake"><aside class="card"><span class="card-kicker">${esc(t.matchingFrom)}</span><div class="chips">${list.map(s => `<span class="chip is-soft">${esc(s.label)}<b>${s.qty}</b></span>`).join("")}</div></aside>
        <div class="dish-grid">${dishes.map(d => dishCard(d, d.note)).join("")}</div></div></div>`;
  }
  function viewWantMake() {
    const t = T(); const pantry = pantryNames();
    let all = DISHES.map(d => decorate(d, pantry));
    if (state.filter !== "All") all = all.filter(d => d.cat === state.filter);
    return `<div class="screen">${screenHeader(t.titles.wantmake)}
      ${filterChips(state.filter, "filter")}
      <div class="dish-grid">${all.map(d => dishCard(d, d.shopNote)).join("")}</div></div>`;
  }
  function viewDish() {
    const t = T(); const pantry = pantryNames(); const d = dishById(state.dishId);
    const r = readiness(d, pantry); const { ings, have, pct, missing } = r;
    const voted = state.myVotes.includes(d.id); const votes = (state.votes[d.id] || 0) + (voted ? 1 : 0);
    const inTonight = state.tonight.includes(d.id);
    const rec = state.recipes[d.id];
    const carted = state.cart.some(c => c.dishId === d.id);
    const canCook = pct === 100;
    return `<div class="screen">${screenHeader(dishName(d))}
      <div class="dish">
        <section class="dish-main">
          ${photoBox("hero", dishImg(d.id), `<span class="hero-title">${esc(dishName(d))}</span><span class="hero-meta">${icon("timer")}${cookMinutes(d)} ${esc(t.minShort)} · ${esc(t.filters[d.cat] || d.cat)}</span>`)}
          <div class="dish-actions">
            <div class="card"><div class="row"><span class="card-kicker">${esc(t.famVote)}</span><span class="vote-count">${votes}</span></div>
              <button class="btn ${voted ? "btn-green" : ""}" data-act="vote">${icon(voted ? "check" : "thumbs-up")}${esc(voted ? t.voted : t.voteFor)}</button><span class="muted" style="font-size:var(--font-caption)">${esc(t.voteLine)}</span></div>
            <div class="card"><span class="card-kicker">${esc(t.addMenuTitle)}</span>
              <div class="row" style="flex-wrap:wrap"><button class="btn ${inTonight ? "btn-soft" : ""}" data-act="toggle-tonight">${icon(inTonight ? "check" : "calendar-plus")}${esc(inTonight ? t.addedMenu : t.addMenu)}</button><button class="btn" data-act="modal-plan">${icon("calendar-days")}${esc(t.planDay)}</button><button class="btn btn-primary" data-act="cook" data-id="${d.id}" ${canCook ? "" : "disabled"} title="${esc(canCook ? "" : t.needAll)}">${icon("flame")}${esc(t.cookNow)}</button></div>
              <span class="muted" style="font-size:var(--font-caption)">${esc(canCook ? t.stepsLater : t.needAll)}${rec && rec.source ? ` · <a href="${esc(rec.source)}" target="_blank" rel="noopener">TheMealDB</a>` : ""}</span></div>
          </div>
        </section>
        <aside class="dish-aside">
          <div class="card ready"><div class="row"><h3>${esc(t.readyToCook)}</h3><span class="ready-pct ${pct === 100 ? "is-full" : ""}">${pct}%</span></div>
            <div class="bar"><i style="width:${pct}%"></i></div>
            <p class="muted">${pct === 100 ? esc(t.allReady) : zh() ? `${have}／${ings.length} ${esc(t.ingReady)}` : `${have} ${esc(t.ofReady)} ${ings.length} ${esc(t.ingReady)}`}</p>
            <span class="card-kicker">${esc(t.ingredients)}</span>
            ${ings.map(i => `<button class="ing-row ${i.have ? "is-have" : ""}" data-act="toggle-ing" data-name="${esc(i.name)}"><i>${i.have ? "✓" : "+"}</i><strong>${esc(i.label)}</strong><span>${esc(i.amount)}</span></button>`).join("")}</div>
          <div class="card cart-card"><strong>${missing.length ? `${esc(t.stillNeed)} ${missing.length}: ${esc(missing.map(i => i.label).join(sep()))}` : esc(t.nothingToBuy)}</strong>
            <button class="btn ${missing.length && !carted ? "btn-primary" : ""} btn-lg" data-act="add-cart" ${missing.length ? "" : "disabled"}>${icon("shopping-cart")}${esc(missing.length ? (carted ? `${t.addedToCart} ${missing.length} ${t.toCart} ✓` : `${t.addToCart} ${missing.length} ${t.toCart}`) : t.nothingInCart)}</button>
            <span class="mono">shop.pxgo.com.tw</span></div>
        </aside></div></div>`;
  }
  function viewStock() {
    const t = T();
    return `<div class="screen">${screenHeader(t.titles.stock)}
      <div class="stock-toolbar"><span class="muted">${esc(t.unitsLabel)}: <strong>${esc(state.units === "imperial" ? t.imperial : t.metric)}</strong>${embedded ? ` · ${esc(t.unitsHint)}` : ""}</span>
        ${embedded ? "" : `<div class="lang-switch"><button class="${state.units === "metric" ? "is-on" : ""}" data-act="units" data-value="metric">${esc(t.metric)}</button><button class="${state.units === "imperial" ? "is-on" : ""}" data-act="units" data-value="imperial">${esc(t.imperial)}</button></div>`}</div>
      <div class="stock"><div class="stock-head"><span>${esc(t.colItem)}</span><span>${esc(t.colCat)}</span><span>${esc(t.colSize)}</span><span>${esc(t.colCount)}</span><span>${esc(t.colAdded)}</span></div>
      ${state.stock.map((x, i) => `<div class="stock-row"><button class="remove" data-act="stock-remove" data-name="${esc(x.name)}">${esc(t.del)}</button>
        <div class="stock-row-inner" data-swipe="${i}" style="transform:translateX(${state.swipeIdx === i ? state.swipeDx : 0}px);transition:${state.swipeIdx === i ? "none" : "transform 160ms ease"}">
          <strong>${esc(nm(x.name, x.zh))}</strong><span><span class="tag tag-green">${esc(zh() ? CAT[categoryOf(x.name)] : categoryOf(x.name))}</span></span>
          <span class="size">${esc(sizeLabel(x.size))}</span>
          <span class="stepper"><button data-act="stock-qty" data-name="${esc(x.name)}" data-delta="-1" aria-label="−">−</button><b>${x.qty}</b><button class="plus" data-act="stock-qty" data-name="${esc(x.name)}" data-delta="1" aria-label="+">+</button></span>
          <span class="muted">${esc(zh() ? WHEN[x.added] || x.added : x.added)}</span></div></div>`).join("")}
      <p class="muted">${esc(t.swipeHint)}</p></div></div>`;
  }
  function viewShare() {
    const t = T();
    const acts = ["share-dish", "share-copy", "share-calendar"];
    return `<div class="screen">${screenHeader(t.titles.share)}
      <div class="share">${t.share.map((o, i) => `<div class="card"><span class="num">${o.num}</span><h2>${esc(o.title)}</h2><p>${esc(o.body)}</p>
        ${i === 1 ? (state.cart.length ? `<ul class="handoff">${state.cart.map(c => `<li><strong>${esc(nm(c.name, c.zh))}</strong><span>${esc(c.amount)} · ${esc(dishName(dishById(c.dishId)))}</span></li>`).join("")}</ul>` : `<p class="muted">${esc(t.handoffEmpty)}</p>`) : ""}
        ${i === 0 && state.tonight.length ? `<div class="chips">${state.tonight.map(id => `<span class="chip is-soft">${esc(dishName(dishById(id)))}</span>`).join("")}</div>` : ""}
        <button class="btn btn-lg" data-act="${acts[i]}">${esc(o.cta)}</button></div>`).join("")}</div></div>`;
  }

  /* cooking screen */
  function stepRow(id, i, s, text, current) {
    const t = T();
    return `<li><button class="step ${current ? "is-current" : ""} ${s.running ? "is-running" : ""} ${s.done ? "is-done" : ""}" data-act="select-step" data-id="${id}" data-i="${i}" aria-pressed="${current}">
      <span class="num">${s.done ? icon("check") : i + 1}</span><p>${esc(text)}</p><span class="step-timer" data-step-time="${id}:${i}">${s.done ? esc(t.stepDone) : fmt(s.remaining)}</span></button></li>`;
  }
  function stepList(id) {
    const t = T(); const c = state.cook; const plan = planFor(id); const steps = c.steps[id] || [];
    if (!steps.length) { ensureRecipe(id); return `<div class="steps-empty">${icon("hourglass")}<p>${esc(fetching.has(id) || navigator.onLine ? t.loadingSteps : t.stepsOffline)}</p><small>${esc(t.stepsOffline)}</small></div>`; }
    return `<ol class="step-list">${steps.map((s, i) => stepRow(id, i, s, (plan[i] || {}).text || "", c.selected[id] === i)).join("")}</ol>`;
  }
  function viewCook() {
    const t = T(); const c = state.cook;
    if (!c || !c.dishIds.length) return viewHome();
    syncSteps();
    const total = totalRemaining(); const pct = Math.round((1 - total / Math.max(1, totalSeconds())) * 100);
    const running = anyRunning();
    const top = `<header class="cook-top">
      <button class="btn btn-icon ${c.split ? "is-on" : ""}" data-act="toggle-split" title="${esc(c.split ? t.singleScreen : t.splitScreen)}" aria-label="${esc(c.split ? t.singleScreen : t.splitScreen)}" aria-pressed="${c.split}">${icon("columns-2")}</button>
      <div class="total"><span class="total-label">${esc(t.timeLeftAll)}</span><span class="total-time ${running ? "is-running" : ""}" data-total>${fmt(total)}</span><div class="bar"><i data-total-bar style="width:${pct}%"></i></div></div>
      <button class="btn ${running ? "" : "btn-primary"}" data-act="${running ? "pause-all" : "start-all"}" ${allDone() ? "disabled" : ""}>${icon(running ? "pause" : "play")}${esc(running ? t.pauseAll : t.startAll)}</button>
      <span class="cook-count">${c.dishIds.length} ${esc(c.dishIds.length === 1 ? t.dishN : t.dishesN)} · ${c.dishIds.filter(dishDone).length} ${esc(t.cooked)}</span>
      <button class="btn" data-act="exit-cook">${icon("chevron-left")}${esc(t.exit)}</button></header>`;
    const finish = allDone() ? `<div class="cook-finish">${icon("circle-check")}${esc(t.allDone)}<button class="btn btn-green btn-lg" data-act="finish-cook">${esc(t.finish)}</button></div>` : "";
    if (c.split) return `<div class="screen cook">${top}<div class="cook-split">${pane("A", c.active)}${pane("B", c.paneB)}</div>${finish}</div>`;
    const id = c.active; const d = dishById(id); const sel = c.selected[id]; const s = stepAt(id, sel);
    const dishRunning = (c.steps[id] || []).some(x => x.running);
    return `<div class="screen cook">${top}
      <div class="cook-body">
        <nav class="dish-rail" aria-label="${esc(t.dishesN)}">${c.dishIds.map((x, i) => `<button class="dish-num ${x === id ? "is-on" : ""} ${dishDone(x) ? "is-done" : ""}" data-act="active-dish" data-id="${x}" title="${esc(dishName(dishById(x)))}" aria-pressed="${x === id}">${i + 1}${dishDone(x) ? `<span class="dot">${icon("check")}</span>` : ""}</button>`).join("")}
          <button class="dish-num add" data-act="modal-add" title="${esc(t.addDish)}" aria-label="${esc(t.addDish)}">+</button></nav>
        <section class="cook-photo-col">
          ${photoBox("cook-photo", dishImg(id), `<div class="photo-cap"><i>${c.dishIds.indexOf(id) + 1}</i><span>${esc(dishName(d))}</span></div>`)}
          <div class="cook-controls">
            <button class="btn btn-primary" data-act="toggle-timer" data-id="${id}" data-i="${sel}" ${!s || s.done ? "disabled" : ""}>${icon(s && s.running ? "pause" : "play")}${esc(s && s.running ? t.pause : (dishRunning || (s && s.remaining < s.seconds) ? t.resume : t.play))}</button>
            <button class="btn" data-act="add-minute" data-id="${id}" data-i="${sel}" ${s ? "" : "disabled"}>${icon("plus")}${esc(t.plusMin)}</button>
            <button class="btn" data-act="reset-step" data-id="${id}" data-i="${sel}" ${s ? "" : "disabled"}>${icon("rotate-ccw")}${esc(t.reset)}</button>
            <button class="btn btn-green" data-act="complete-step" data-id="${id}" data-i="${sel}" ${s ? "" : "disabled"}>${icon("check")}${esc(s && s.done ? t.reset : t.done)}</button>
          </div>
        </section>
        <section class="cook-steps"><header><h2>${esc(dishName(d))}</h2><span>${(c.steps[id] || []).length} ${esc(t.steps)} · ${esc(t.est)} ${esc(fmtMin(planSeconds(id)))}</span></header>${stepList(id)}</section>
      </div>${finish}</div>`;
  }
  function pane(tag, id) {
    const t = T(); const c = state.cook;
    const chips = c.dishIds.map((x, i) => `<button class="pane-chip ${x === id ? "is-on" : ""}" data-act="pane-dish" data-pane="${tag}" data-id="${x}" title="${esc(dishName(dishById(x)))}" aria-pressed="${x === id}">${i + 1}</button>`).join("");
    if (!id || !c.dishIds.includes(id)) return `<section class="pane"><div class="pane-head"><span class="pane-tag">${tag}</span><div class="pane-chips">${chips}<button class="pane-chip add" data-act="modal-add" data-pane="${tag}" aria-label="${esc(t.addDish)}">+</button></div></div>
      <div class="pane-empty" style="grid-row: 2 / span 2"><span>${icon("cooking-pot")}</span><p>${esc(t.chooseSide)}</p></div></section>`;
    const d = dishById(id); const sel = c.selected[id]; const s = stepAt(id, sel);
    return `<section class="pane" data-pane="${tag}"><div class="pane-head"><span class="pane-tag">${tag}</span><div class="pane-chips">${chips}<button class="pane-chip add" data-act="modal-add" data-pane="${tag}" aria-label="${esc(t.addDish)}">+</button></div><strong>${esc(dishName(d))}</strong></div>
      ${photoBox("pane-photo", dishImg(id), `<div class="overlay ${s && s.running ? "is-running" : ""}"><div><span class="ov-label">${esc(t.step)} ${(sel || 0) + 1}</span><span class="ov-time" data-overlay="${id}">${s ? (s.done ? esc(t.stepDone) : fmt(s.remaining)) : "--"}</span></div>
        <button class="btn btn-icon" data-act="toggle-timer" data-id="${id}" data-i="${sel}" ${!s || s.done ? "disabled" : ""} aria-label="${esc(s && s.running ? t.pause : t.play)}">${icon(s && s.running ? "pause" : "play")}</button>
        <button class="btn btn-icon" data-act="complete-step" data-id="${id}" data-i="${sel}" ${s ? "" : "disabled"} aria-label="${esc(t.done)}" style="background:var(--green);border-color:var(--green)">${icon("check")}</button></div>
        <span class="pane-cap">${c.dishIds.indexOf(id) + 1} · ${esc(dishName(d))}</span>`)}
      ${stepList(id)}</section>`;
  }

  /* modals */
  function modalAddDish() {
    const t = T(); const pantry = pantryNames();
    const list = DISHES.map(d => decorate(d, pantry)).sort((a, b) => b.m - a.m || a.minutes - b.minutes);
    return `<div class="modal-backdrop" data-act="modal-close"><div class="modal" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-head"><h2>${esc(t.addDish)}</h2><button class="btn btn-icon" data-act="modal-close" aria-label="${esc(t.cancel)}">${icon("x")}</button></div>
      <div class="modal-grid">${list.map(d => { const inT = state.tonight.includes(d.id); return dishCard(d, `${inT ? "✓ " + t.addedMenu + " · " : ""}${d.note}`, inT ? "is-in" : "", "pick-dish"); }).join("")}</div></div></div>`;
  }
  function modalPlan() {
    const t = T(); const d = dishById(state.dishId);
    const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(today); x.setDate(today.getDate() + i); return { i, label: `${zh() ? DAY_ZH[x.getDay()] : DAY_EN[x.getDay()]} ${x.getDate()}` }; });
    return `<div class="modal-backdrop" data-act="modal-close"><div class="modal" style="width:min(760px,96vw)" role="dialog" aria-modal="true" onclick="event.stopPropagation()">
      <div class="modal-head"><h2>${esc(t.planTitle)} · ${esc(dishName(d))}</h2><button class="btn btn-icon" data-act="modal-close" aria-label="${esc(t.cancel)}">${icon("x")}</button></div>
      <div class="field"><span>${esc(t.evDay)}</span><div class="chips">${days.map(x => `<button class="chip ${state.evDay === x.i ? "is-on" : ""}" data-act="ev-day" data-i="${x.i}">${esc(x.label)}</button>`).join("")}</div></div>
      <div class="field"><span>${esc(t.evTime)}</span><div class="chips">${["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"].map(x => `<button class="chip ${state.evTime === x ? "is-on" : ""}" data-act="ev-time" data-value="${x}">${x}</button>`).join("")}</div></div>
      <div class="modal-actions"><button class="btn btn-lg" data-act="modal-close">${esc(t.cancel)}</button><button class="btn btn-primary btn-lg" data-act="save-plan">${esc(t.save)}</button></div></div></div>`;
  }

  /* ───────────────────────── render ───────────────────────── */
  const VIEWS = { home: viewHome, recipes: viewRecipes, capture: viewCapture, review: viewReview, canmake: viewCanMake, wantmake: viewWantMake, dish: viewDish, stock: viewStock, share: viewShare, cook: viewCook };
  function render() {
    const scroll = app.querySelector(".dish-grid, .step-list, .stock, .dish-aside .card.ready, .modal-grid");
    const scrollTop = scroll ? scroll.scrollTop : 0;
    const view = VIEWS[state.screen] || viewHome;
    app.innerHTML = view() + (state.modal === "add" ? modalAddDish() : state.modal === "plan" ? modalPlan() : "");
    const again = app.querySelector(".dish-grid, .step-list, .stock, .dish-aside .card.ready, .modal-grid");
    if (again && scrollTop) again.scrollTop = scrollTop;
    document.documentElement.lang = zh() ? "zh-Hant" : "en";
    scheduleSnapshot();
  }

  /* ───────────────────────── events ───────────────────────── */
  app.addEventListener("click", event => {
    const el = event.target.closest("[data-act]"); if (!el) return;
    const act = el.dataset.act; const id = el.dataset.id; const i = Number(el.dataset.i); const t = T();
    const actions = {
      "home": home, "back": back,
      "recipes": () => { if (state.screen !== "recipes") go("recipes"); },
      "stock": () => { if (state.screen !== "stock") go("stock"); },
      "lang": () => { state.lang = el.dataset.lang; try { localStorage.setItem("lucky-table.locale", state.lang === "zh" ? "zh-Hant" : "en"); } catch { /* ignore */ } render(); },
      "units": () => { state.units = el.dataset.value; save("luckytable-units", state.units); render(); },
      "capture": () => go("capture", { shots: 0, qty: {} }),
      "snap": () => { state.shots = Math.min(state.shots + 1, SHOTS.length); render(); },
      "review": () => go("review"),
      "qty": () => { const c = capturedItems().find(x => x.name === el.dataset.name); if (c) { state.qty[c.name] = Math.max(0, c.qty + Number(el.dataset.delta)); render(); } },
      "add-stock": () => { capturedItems().forEach(c => { const row = state.stock.find(x => x.name === c.name); if (row) { row.qty += c.qty; row.added = "Today"; } else state.stock.push({ name: c.name, zh: ITEMS[c.name].zh, qty: c.qty, where: "Fridge", added: "Today", size: ITEMS[c.name].size || { kind: "count" } }); }); persistStock(); go("stock"); },
      "canmake": () => go("canmake", { matchMode: el.dataset.mode }),
      "wantmake": () => go("wantmake", { matchMode: "stock" }),
      "share": () => go("share"),
      "filter": () => { state.filter = el.dataset.value; render(); },
      "recipe-filter": () => { state.recipeFilter = el.dataset.value; render(); },
      "open-dish": () => { ensureRecipe(id); go("dish", { dishId: id, carted: false }); },
      "vote": () => { const d = state.dishId; state.myVotes = state.myVotes.includes(d) ? state.myVotes.filter(x => x !== d) : state.myVotes.concat(d); save("luckytable-make-votes", state.myVotes); render(); },
      "toggle-tonight": () => { if (state.tonight.includes(state.dishId)) removeTonight(state.dishId); else addTonight(state.dishId); render(); },
      "remove-tonight": () => { removeTonight(id); render(); toast(`${t.removeDish}: ${dishName(dishById(id))}`); },
      "toggle-ing": () => { const n = el.dataset.name; const list = acquiredFor(state.dishId); state.acquired[state.dishId] = list.includes(n) ? list.filter(x => x !== n) : list.concat(n); persistAcquired(); render(); },
      "add-cart": () => { const d = dishById(state.dishId); const missing = readiness(d, pantryNames()).missing; missing.forEach(m => { if (!state.cart.some(c => c.dishId === d.id && c.name === m.name)) state.cart.push({ name: m.name, zh: m.label, amount: m.amount, dishId: d.id }); }); persistCart(); render(); toast(`${t.addedToCart} ${missing.length} ${t.toCart}`); },
      "modal-plan": () => { state.modal = "plan"; state.evDay = 0; render(); },
      "modal-add": () => { state.modal = "add"; state.modalPane = el.dataset.pane || ""; render(); },
      "modal-close": () => { state.modal = null; render(); },
      "ev-day": () => { state.evDay = i; render(); },
      "ev-time": () => { state.evTime = el.dataset.value; render(); },
      "save-plan": () => { const d = dishById(state.dishId); const day = new Date(today); day.setDate(today.getDate() + state.evDay); state.planned.push({ dishId: d.id, day: day.toDateString(), time: state.evTime }); if (state.evDay === 0) addTonight(d.id); state.modal = null; render(); toast(`${t.planned} ${dishName(d)} · ${zh() ? DAY_ZH[day.getDay()] : DAY_EN[day.getDay()]} ${day.getDate()} ${state.evTime}`); },
      "pick-dish": () => {
        if (state.tonight.includes(id)) { removeTonight(id); render(); return; }
        addTonight(id);
        if (state.cook) { if (state.modalPane === "B") state.cook.paneB = id; else if (state.modalPane === "A" || state.screen === "cook") state.cook.active = id; persistCook(); }
        render(); toast(`${t.addedMenu}: ${dishName(dishById(id))}`);
      },
      "stock-qty": () => { const row = state.stock.find(x => x.name === el.dataset.name); if (row) { row.qty = Math.max(0, row.qty + Number(el.dataset.delta)); persistStock(); render(); } },
      "stock-remove": () => { state.stock = state.stock.filter(x => x.name !== el.dataset.name); state.swipeIdx = -1; persistStock(); render(); },
      "share-dish": () => { if (state.tonight.length) toast(`${t.sent} · ${state.tonight.map(x => dishName(dishById(x))).join(sep())}`); else go("recipes"); },
      "share-copy": async () => { const text = state.cart.map(c => `${nm(c.name, c.zh)} · ${c.amount}`).join("\n"); if (!text) return toast(t.handoffEmpty); try { await navigator.clipboard.writeText(text); toast(t.copied); } catch { toast(t.copyFail); } },
      "share-calendar": () => { if (embedded) send("navigate", { page: "calendar", params: {} }); else toast(t.sent); },
      /* cooking */
      "cook": () => {
        if (id && readiness(dishById(id)).pct < 100) return toast(t.needAll);
        if (!id && !allTonightReady()) return toast(t.needAll);
        if (startSession(id || null)) { state.stack.push(state.screen); state.screen = "cook"; render(); if (embedded) send("meal", { recipeTitle: state.cook.dishIds.map(x => dishName(dishById(x))).join(sep()), recipeId: state.cook.active, servings: state.diners.length }); }
      },
      "exit-cook": () => home(),
      "finish-cook": () => { endSession(); home(); toast(t.allDone); },
      "toggle-split": () => { state.cook.split = !state.cook.split; if (state.cook.split && (!state.cook.paneB || state.cook.paneB === state.cook.active)) state.cook.paneB = state.cook.dishIds.find(x => x !== state.cook.active) || null; persistCook(); render(); },
      "active-dish": () => { state.cook.active = id; persistCook(); render(); },
      "pane-dish": () => { if (el.dataset.pane === "A") { state.cook.active = id; if (state.cook.paneB === id) state.cook.paneB = state.cook.dishIds.find(x => x !== id) || null; } else { state.cook.paneB = id; if (state.cook.active === id) state.cook.active = state.cook.dishIds.find(x => x !== id) || id; } persistCook(); render(); },
      "select-step": () => selectStep(id, i),
      "toggle-timer": () => toggleTimer(id, i),
      "start-all": startAll,
      "pause-all": pauseAll,
      "add-minute": () => addMinute(id, i),
      "reset-step": () => resetStep(id, i),
      "complete-step": () => completeStep(id, i)
    };
    if (actions[act]) { event.preventDefault(); actions[act](); }
  });
  /* swipe-to-remove on stock rows */
  app.addEventListener("pointerdown", e => { const row = e.target.closest("[data-swipe]"); if (!row || e.target.closest("button")) return; state.swipeIdx = Number(row.dataset.swipe); state.swipeX0 = e.clientX; state.swipeDx = 0; row.setPointerCapture?.(e.pointerId); });
  app.addEventListener("pointermove", e => { const row = e.target.closest("[data-swipe]"); if (!row || state.swipeIdx !== Number(row.dataset.swipe)) return; state.swipeDx = Math.min(0, Math.max(-190, e.clientX - state.swipeX0)); row.style.transition = "none"; row.style.transform = `translateX(${state.swipeDx}px)`; });
  app.addEventListener("pointerup", e => { const row = e.target.closest("[data-swipe]"); if (!row || state.swipeIdx !== Number(row.dataset.swipe)) return; const i = state.swipeIdx; if (state.swipeDx < -110) { state.stock.splice(i, 1); persistStock(); } state.swipeIdx = -1; state.swipeDx = 0; render(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && state.modal) { state.modal = null; render(); } });

  /* ───────────────────────── device bridge ───────────────────────── */
  let snapshotTimer = 0, lastSnapshot = "";
  function send(type, payload = {}) { if (embedded) window.parent.postMessage({ channel: "lumiq-device", type, page: "make", ...payload }, "*"); }
  function voteRows() {
    const ids = Object.keys(VOTE_SEED).concat(state.myVotes.filter(id => !(id in VOTE_SEED)));
    return ids.map(id => ({ id, label: dishName(dishById(id)), n: (state.votes[id] || 0) + (state.myVotes.includes(id) ? 1 : 0) })).filter(v => v.n > 0).sort((a, b) => b.n - a.n);
  }
  function snapshot(force) {
    if (!embedded) return;
    const payload = { screen: state.screen, cooking: Boolean(state.cook), split: Boolean(state.cook && state.cook.split), timeLeft: totalRemaining(),
      cartItems: state.cart.map(c => ({ name: c.name, zh: c.zh, amount: c.amount, quantity: 1, dishId: c.dishId })),
      tonight: state.tonight.map(id => dishName(dishById(id))),
      tonightDetail: state.tonight.map(id => { const d = dishById(id); const r = readiness(d); return { id, name: dishName(d), img: DISH_IMG[id] ? dishImg(id) : "", minutes: cookMinutes(d), ready: r.pct === 100, missing: r.missing.length, cooked: dishDone(id) }; }),
      votes: voteRows(), units: state.units,
      inventoryCount: state.stock.length, servings: state.diners.length,
      dinnerNames: state.members.filter(m => state.diners.includes(m.id)).map(memberName) };
    const sig = JSON.stringify(payload);
    if (force || sig !== lastSnapshot) { lastSnapshot = sig; send("snapshot", payload); }
  }
  function scheduleSnapshot() { clearTimeout(snapshotTimer); snapshotTimer = setTimeout(snapshot, 60); }
  function applyContext(ctx = {}) {
    let changed = false;
    const lang = localeToLang(ctx.locale || ctx.settings?.language);
    if ((ctx.locale || ctx.settings?.language) && lang !== state.lang) { state.lang = lang; changed = true; }
    if (ctx.settings && ctx.settings.units && ctx.settings.units !== state.units) { state.units = ctx.settings.units; changed = true; }
    if (Array.isArray(ctx.members) && ctx.members.length) { state.members = ctx.members.filter(m => m && typeof m.id === "string").map(m => ({ id: m.id, name: String(m.name || m.id) })); changed = true; }
    if (Array.isArray(ctx.dinnerMembers)) { state.diners = ctx.dinnerMembers.slice(); changed = true; }
    return changed;
  }
  function activate(p = {}, ctx = {}) {
    applyContext(ctx);
    if (p.screen === "recipes" || p.screen === "catalog") { state.screen = "recipes"; state.stack = ["home"]; }
    else if (p.screen === "cook") { if (allTonightReady() && startSession(null)) { state.screen = "cook"; state.stack = ["home"]; } else { state.screen = "home"; state.stack = []; if (state.tonight.length) toast(T().needAll); } }
    else if (p.screen === "dish" && p.dishId && DISHES.some(d => d.id === p.dishId)) { ensureRecipe(p.dishId); state.screen = "dish"; state.dishId = p.dishId; state.carted = false; state.stack = ["home"]; }
    else if (p.action === "cart") { state.screen = "share"; state.stack = ["home"]; }
    else if (p.screen === "home" || p.screen === "hub") { state.screen = "home"; state.stack = []; }
    render(); snapshot(true);
  }
  if (embedded) {
    window.addEventListener("message", event => {
      if (event.source !== window.parent || event.data?.channel !== "lumiq-device") return;
      if (event.data.page && event.data.page !== "make") return;
      if (event.data.type === "activate") activate(event.data.params || {}, event.data.context || {});
      if (event.data.type === "deactivate") { if (state.modal) { state.modal = null; render(); } snapshot(); }
      if (event.data.type === "context") { if (applyContext(event.data.context || {})) render(); snapshot(true); }
      if (event.data.type === "snapshot-request") snapshot(true);
    });
  }

  /* ───────────────────────── boot ───────────────────────── */
  if (state.cook) { syncSteps(); ensureInterval(); if (anyRunning()) tick(); }
  state.tonight.forEach(ensureRecipe);
  const hash = window.location.hash.slice(1);
  if (VIEWS[hash] && hash !== "cook") state.screen = hash;
  render();
  if (embedded) send("ready", { storageScope: "local-storage", serviceMode: "demo" });
  window.MakePrototype = { state, render, startSession, DISHES };
})();
