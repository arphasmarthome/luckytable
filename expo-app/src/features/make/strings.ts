/* Lucky Table · Make — bilingual string table (port of STR in prototype/make/app.js).
 * Traditional Chinese uses `zh`; every other device locale falls back to `en`. */
import { useMemo } from "react";
import { useI18n } from "@/i18n";
import type { Dish } from "./dishes";

export type Lang = "en" | "zh";

export type ShareOption = { num: string; title: string; body: string; cta: string };

const en = {
  brand: "Lucky Table", brandSub: "家味開運桌", navMake: "Make", navRec: "Recipes",
  recKicker: "Matched against what's in stock", stockBtn: "What's in stock", cartBtn: "Cart", inCart: "Added",
  tonight: "Tonight's table", tonightNone: "Nothing on tonight's menu yet — pick a dish from Recipes.",
  eating: "eating", dishesN: "dishes", dishN: "dish", left: "left", cookNow: "Start cooking", continueCook: "Continue cooking", addDish: "Add dish", removeDish: "Remove from tonight",
  notReady: "not ready", readyAll: "all ingredients on hand", needAll: "Buy the missing ingredients first — Start cooking unlocks at 100%.", stepsLater: "The step-by-step recipe with timers appears when you start cooking.",
  tile1: "What can I make?", tile1Body: "Snap what you have. We'll match it against your stock.",
  tile2: "I want to make…", tile2Body: "Pick a dish. We'll list what's missing.",
  tile3: "Summary", tile3Body: "See a summary of all the wonderful dishes made.",
  recipeBook: "Recipe", ingredientsTitle: "Ingredients", stepsTitle: "Steps", close: "Close", openRecipe: "Open recipe",
  summaryTitle: "Cooking summary", startedAt: "Started", pausedLabel: "Paused", resumedLabel: "Resumed", totalTime: "Total cooking time", cookedOn: "Cooked on",
  noHistory: "No dishes cooked yet. Finish a cooking session and it will show up here.", addPhotos: "Upload photos", photosLabel: "Your photos", uploadFail: "Photo upload isn't available here", dishesCooked: "dishes cooked", dishCooked: "dish cooked",
  capture: "Capture", cameraFeed: "live camera feed", detectedSoFar: "Detected so far",
  nothingYet: "Point and press Capture. Itemize and create your dish.",
  hintHome: "Snapshot is used immediately or added to your stock count.", reviewNone: "Nothing captured yet", review: "Review", addMorePhotos: "Add more photos", keptSoFar: "Earlier photos are kept — keep capturing to add to them.",
  items: "items", item: "item", units: "units", itemized: "itemized", match: "match", minShort: "min",
  addToStock: "Add to stock", seeWhatICanMake: "See what I can make", makeAll: "Make using everything I have", titleAll: "Using everything I have", modeCaptured: "Photographed only", modeStock: "All stock", tickToUnlock: "Bought something? Tick it in the list to unlock Start cooking.",
  matchingFrom: "Matching from", ingredients: "Ingredients", readyToCook: "Ready to cook", ready: "Ready", onHand: "Everything on hand", missing: "Missing", buy: "Buy",
  allReady: "All ingredients on hand — start cooking.", ofReady: "of", ingReady: "ingredients ready. Tick an item once you've bought it.",
  nothingToBuy: "Nothing to buy — you're set.", stillNeed: "Still need", nothingInCart: "Nothing in cart", addToCart: "Add", toCart: "to cart", addedToCart: "Added",
  colItem: "Item", colCat: "Category", colSize: "Weight/Unit", colCount: "Est. Qty", colAdded: "Updated", stockDisclaimer: "Based on added images and used for reference only", autoDeduct: "Automatically deduct ingredients from stock count", autoDeductHint: "As a reference after each cooking session", yes: "Yes", no: "No", swipeHint: "Swipe a row left to remove it.", del: "Remove",
  unitsLabel: "Units", metric: "Metric", imperial: "Imperial", unitsHint: "Chosen in Settings → Display & language",
  famVote: "Family vote", voteFor: "Vote for this dish", voted: "Voted", voteLine: "Votes show up on Home.",
  addMenuTitle: "Tonight's menu", addMenu: "Add to tonight", addedMenu: "On tonight's menu", menuNote: "Remembered for tonight and shown on Home.",
  planDay: "Plan for a day", planTitle: "Plan this dish", evDay: "Day", evTime: "Time", save: "Add to calendar", cancel: "Cancel", planned: "Planned:",
  titles: { capture: "Capture items", review: "What we found", canmake: "What can I make", wantmake: "I want to make", stock: "What's in stock", share: "Share", recipes: "Recipes", cook: "Cooking", cart: "Shopping cart", summary: "Summary" },
  checkoutOn: "Checkout on", checkoutSuffix: "", orderFrom: "Order from",
  filters: { All: "All", "Stir-fry": "Stir-fry", "Rice bowl": "Rice bowl", Side: "Side", Beef: "Beef", Chicken: "Chicken", Pork: "Pork", Lamb: "Lamb", Goat: "Goat", Seafood: "Seafood", Pasta: "Pasta", Dessert: "Dessert", Breakfast: "Breakfast", Starter: "Starter", Vegetarian: "Vegetarian", Vegan: "Vegan", Miscellaneous: "Other" } as Record<string, string>,
  share: [
    { num: "1", title: "Send a dish", body: "Send the recipe and its ingredient list to family, LINE or messages.", cta: "Pick a dish" },
    { num: "2", title: "Hand off the list", body: "Share what's missing so whoever's out can pick it up.", cta: "Copy list" },
    { num: "3", title: "Family table", body: "A shared calendar of who's cooking what, this week.", cta: "Open calendar" },
  ] as ShareOption[],
  handoffEmpty: "Nothing on the list yet. Add missing ingredients from a dish page.",
  splitScreen: "Split screen", singleScreen: "Single dish", exit: "Back", steps: "steps", step: "Step",
  play: "Start", pause: "Pause", resume: "Resume", reset: "Reset", done: "Done", next: "Finished", stepDone: "Done",
  minutesLabel: "Minutes", secondsLabel: "Seconds", stopAlarm: "Time's up — tap to stop",
  allDone: "All dishes are done — time to eat!", finish: "Finish cooking", cooked: "Cooked", pickDish: "Pick a dish", chooseSide: "Choose a dish for this side",
  est: "est.", loadingSteps: "Loading the recipe steps…", stepsOffline: "Steps come from TheMealDB and need an internet connection the first time.",
  copied: "List copied", copyFail: "Copy not available here", sent: "Shared (demo)", offlineSteps: "Recipe photos and source steps load from TheMealDB when online.",
  /* labels that were bare aria-labels in the prototype */
  homeBtn: "Home", backBtn: "Back", source: "Source recipe",
};

export type MakeStrings = typeof en;

const zh: MakeStrings = {
  brand: "家味開運桌", brandSub: "LUCKY TABLE", navMake: "做菜", navRec: "食譜",
  recKicker: "依照庫存比對", stockBtn: "庫存清單", cartBtn: "購物車", inCart: "已加入",
  tonight: "今晚的餐桌", tonightNone: "今晚還沒有菜單，先從食譜選一道菜。",
  eating: "人用餐", dishesN: "道菜", dishN: "道菜", left: "剩餘", cookNow: "開始料理", continueCook: "繼續料理", addDish: "新增料理", removeDish: "從今晚移除",
  notReady: "道未備齊", readyAll: "食材全部齊全", needAll: "先補齊缺少的食材，備料 100% 才能開始料理。", stepsLater: "逐步作法與計時會在開始料理後顯示。",
  tile1: "我能做什麼？", tile1Body: "拍下現有食材，系統會比對你的庫存。",
  tile2: "我想做…", tile2Body: "選一道菜，我們列出還缺什麼。",
  recipeBook: "食譜", ingredientsTitle: "食材", stepsTitle: "步驟", close: "關閉", openRecipe: "開啟食譜",
  summaryTitle: "料理總結", startedAt: "開始", pausedLabel: "暫停", resumedLabel: "繼續", totalTime: "總料理時間", cookedOn: "料理日期",
  noHistory: "還沒有料理紀錄。完成一次料理後就會出現在這裡。", addPhotos: "上傳照片", photosLabel: "你的照片", uploadFail: "此環境無法上傳照片", dishesCooked: "道菜已完成", dishCooked: "道菜已完成",
  tile3: "總結", tile3Body: "看看所有做過的美味料理總結。",
  capture: "拍攝", cameraFeed: "相機畫面", detectedSoFar: "已辨識",
  nothingYet: "拍下、列出品項，開始做這道菜。",
  hintHome: "照片會立即使用，或加入你的庫存。", reviewNone: "尚未拍攝", review: "確認", addMorePhotos: "再拍幾張", keptSoFar: "先前拍到的食材已保留，繼續拍攝會累加。",
  items: "項", item: "項", units: "件", itemized: "項已辨識", match: "把握", minShort: "分鐘",
  addToStock: "加入庫存", seeWhatICanMake: "看看能做什麼", makeAll: "用我所有的食材", titleAll: "用現有全部食材", modeCaptured: "只看拍到的", modeStock: "全部庫存", tickToUnlock: "買到了嗎？在清單打勾即可開始料理。",
  matchingFrom: "比對來源", ingredients: "食材", readyToCook: "備料完成度", ready: "齊全", onHand: "食材齊全", missing: "缺", buy: "需購買",
  allReady: "食材全部齊全，可以開始下廚。", ofReady: "／", ingReady: "項食材已備妥。買齊後點一下即可打勾。",
  nothingToBuy: "不用再買了，食材齊全。", stillNeed: "還缺", nothingInCart: "購物車是空的", addToCart: "加入", toCart: "項到購物車", addedToCart: "已加入",
  colItem: "品項", colCat: "分類", colSize: "重量／單位", colCount: "預估數量", colAdded: "更新", stockDisclaimer: "依據新增的影像估算，僅供參考", autoDeduct: "料理後自動從庫存數量扣除食材", autoDeductHint: "每次料理完成後扣除，僅供參考", yes: "是", no: "否", swipeHint: "向左滑動可刪除。", del: "刪除",
  unitsLabel: "單位", metric: "公制", imperial: "英制", unitsHint: "於設定 → 顯示與語言中選擇",
  famVote: "家人投票", voteFor: "投這道菜一票", voted: "已投票", voteLine: "票數會顯示在首頁。",
  addMenuTitle: "今晚菜單", addMenu: "加入今晚", addedMenu: "已在今晚菜單", menuNote: "今晚的選擇會被記住，並顯示在首頁。",
  planDay: "安排到行事曆", planTitle: "安排這道菜", evDay: "日期", evTime: "時間", save: "加入行事曆", cancel: "取消", planned: "已安排：",
  titles: { capture: "拍攝食材", review: "辨識結果", canmake: "我能做什麼", wantmake: "我想做", stock: "庫存清單", share: "分享", recipes: "食譜", cook: "料理中", cart: "購物車", summary: "總結" },
  checkoutOn: "前往", checkoutSuffix: "結帳", orderFrom: "選擇商店",
  filters: { All: "全部", "Stir-fry": "快炒", "Rice bowl": "丼飯", Side: "小菜", Beef: "牛肉", Chicken: "雞肉", Pork: "豬肉", Lamb: "羊肉", Goat: "山羊肉", Seafood: "海鮮", Pasta: "義大利麵", Dessert: "甜點", Breakfast: "早餐", Starter: "前菜", Vegetarian: "蔬食", Vegan: "純素", Miscellaneous: "其他" },
  share: [
    { num: "1", title: "分享菜色", body: "把食譜和食材清單傳給家人、LINE 或訊息。", cta: "選一道菜" },
    { num: "2", title: "代買清單", body: "把缺的食材分享出去，讓在外面的人順手買回來。", cta: "複製清單" },
    { num: "3", title: "家庭餐桌", body: "共用行事曆，看這週誰負責做哪一餐。", cta: "開啟行事曆" },
  ],
  handoffEmpty: "清單還是空的，先在料理頁加入缺少的食材。",
  splitScreen: "分割畫面", singleScreen: "單一料理", exit: "返回", steps: "個步驟", step: "步驟",
  play: "開始", pause: "暫停", resume: "繼續", reset: "重設", done: "完成", next: "下一步", stepDone: "已完成",
  minutesLabel: "分鐘", secondsLabel: "秒", stopAlarm: "時間到，點按停止",
  allDone: "全部完成，可以開飯了！", finish: "完成料理", cooked: "已完成", pickDish: "選一道菜", chooseSide: "為這一側選一道菜",
  est: "約", loadingSteps: "正在載入食譜步驟…", stepsOffline: "步驟來自 TheMealDB，第一次載入需要連網。",
  copied: "已複製清單", copyFail: "此環境無法複製", sent: "已分享（演示）", offlineSteps: "料理照片與原始食譜在連網時由 TheMealDB 載入。",
  homeBtn: "首頁", backBtn: "返回", source: "原始食譜",
};

export const STR: Record<Lang, MakeStrings> = { en, zh };

/** The prototype's localeToLang: zh-* → "zh", everything else → "en". */
export const langOf = (locale: string): Lang => (String(locale || "").toLowerCase().startsWith("zh") ? "zh" : "en");

export const dishNameIn = (d: Dish, lang: Lang) => (lang === "zh" ? d.zh || d.name : d.name);
export const nameIn = (en: string, zh: string | undefined, lang: Lang) => (lang === "zh" ? zh || en : en);
export const sepIn = (lang: Lang) => (lang === "zh" ? "、" : ", ");

/** Subscribes to the device locale and returns the Make string table plus naming helpers. */
export function useMakeStrings() {
  const { isZh } = useI18n();
  const lang: Lang = isZh ? "zh" : "en";
  return useMemo(
    () => ({
      lang,
      zh: lang === "zh",
      t: STR[lang],
      nm: (en: string, zh?: string) => nameIn(en, zh, lang),
      dishName: (d: Dish) => dishNameIn(d, lang),
      sep: sepIn(lang),
    }),
    [lang],
  );
}
