/* Pure health helpers from prototype/device/family-health.js: adult BMI / calorie estimate,
 * activity and goal labels, plate suggestions and the wearable demo samples. */
import { t } from "@/i18n";
import type { Health, Member } from "@/store/device";

/** Traditional Chinese labels keyed by the numeric activity factor (pass through t()). */
export const activityNames: Record<string, string> = { "1.2": "較少活動", "1.4": "輕度活動", "1.55": "中度活動", "1.725": "高活動量" };
export const activityOptions = Object.keys(activityNames);
export const goalNames: Record<Health["goal"], string> = { maintain: "保持體重", lose: "控制體重", gain: "增加體重" };
export const goalOptions = Object.keys(goalNames) as Health["goal"][];
export const activityLabel = (activity: number) => activityNames[String(activity)] || "輕度活動";
export const isGoal = (value: string): value is Health["goal"] => Object.prototype.hasOwnProperty.call(goalNames, value);

export type HealthEstimate = { bmi: number; bmr: number; maintenance: number; target: number; label: string; marker: number };

/** Mifflin-St Jeor estimate for adults (18-100). Children get null: no adult BMI / calorie target. */
export function healthEstimate(profile: Health | undefined): HealthEstimate | null {
  if (!profile || !profile.height || !profile.weight || profile.age < 18 || profile.age > 100) return null;
  const bmi = profile.weight / Math.pow(profile.height / 100, 2);
  const bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === "female" ? -161 : 5));
  const maintenance = Math.round(bmr * profile.activity);
  const target = Math.max(profile.sex === "female" ? 1200 : 1500, maintenance + (profile.goal === "lose" ? -300 : profile.goal === "gain" ? 250 : 0));
  return { bmi, bmr, maintenance, target, label: bmi < 18.5 ? t("偏低") : bmi < 25 ? t("正常範圍") : bmi < 30 ? t("偏高") : t("較高"), marker: Math.max(1, Math.min(99, ((bmi - 12) / 28) * 100)) };
}

export type FoodSuggestion = { name: string; group: string; amount: string };

/** renderFoodSuggestions: plate composition adjusted to allergies, vegetarian preference, age and goal (source strings; t() when shown). */
export function foodSuggestions(person: Member): FoodSuggestion[] {
  const profile = person.health;
  const child = profile.age < 18;
  const allergy = String(person.allergy || "");
  const vegetarian = /素|vegetarian|vegetarisch|vegan/i.test(String(person.preference || ""));
  const avoidsSoy = /豆|soy|soja|tofu/i.test(allergy);
  const avoidsPoultry = /雞|鸡|禽|肉|chicken|meat|poultry|huhn|hähnchen|fleisch|geflügel|pollo|carne|ave/i.test(allergy);
  const protein = !avoidsSoy && vegetarian ? "板豆腐" : !avoidsPoultry && !vegetarian ? "雞胸肉" : !avoidsSoy ? "板豆腐" : "合適的蛋白質食物";
  const vegetables = /青花菜|花椰菜|西蘭花|西兰花|broccoli|brokkoli|brócoli/i.test(allergy) ? "合適的時令蔬菜" : "青花菜";
  const grain = /米|稻|rice|reis|arroz/i.test(allergy) ? "合適的全穀主食" : "糙米飯";
  return [
    { name: vegetables, group: "蔬菜", amount: child ? "依年齡調整" : "約 1 碗" },
    { name: protein, group: "蛋白質", amount: child ? "依年齡調整" : "約 1 掌心" },
    { name: grain, group: "全穀主食", amount: child ? "依成長需求" : profile.goal === "lose" ? "約 1/2 碗" : profile.goal === "gain" ? "約 1.5 碗" : "約 1 碗" },
  ];
}

export type WearableSample = { steps: number; heartRate: number; minutes: number; distance: number; calories: number };
export const WEARABLE_SAMPLES: WearableSample[] = [
  { steps: 6429, heartRate: 76, minutes: 48, distance: 4.6, calories: 318 },
  { steps: 8250, heartRate: 82, minutes: 65, distance: 5.4, calories: 372 },
  { steps: 4310, heartRate: 72, minutes: 32, distance: 3.1, calories: 206 },
];
export const STEP_GOAL = 8000;

export function wearableFor(wearables: Record<string, unknown>, memberId: string): WearableSample | undefined {
  const data = wearables[memberId];
  return data && typeof data === "object" ? (data as WearableSample) : undefined;
}
