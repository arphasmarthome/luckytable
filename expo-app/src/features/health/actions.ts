/* Store mutations of the 健康 module (the prototype's health-* click / submit / change handlers). */
import { t } from "@/i18n";
import { todayKey } from "@/lib/date";
import { dialog } from "@/store/dialog";
import { useDeviceStore, type DeviceData, type Health, type Member } from "@/store/device";
import { toast } from "@/store/toast";
import { activityNames, isGoal, WEARABLE_SAMPLES } from "./estimate";
import { useHealthUiStore } from "./store";

export type HealthTab = "profile" | "family";
export const asHealthTab = (tab: string): HealthTab => (tab === "family" ? "family" : "profile");

const store = useDeviceStore;

export const setHealth = (patch: Partial<DeviceData["health"]>) => store.setState((s) => ({ health: { ...s.health, ...patch } }));

export function memberOr(id: string | null | undefined, members = store.getState().members): Member | undefined {
  return members.find((item) => item.id === id) || members[0];
}

export type HealthInput = { height: number; weight: number; age: number; sex: string; activity: number; goal: string };

/** health-profile-form submit. Returns a validation message, or null when saved. Today's weight is recorded (one record per day). */
export function saveHealthProfile(memberId: string, input: HealthInput): string | null {
  const { height, weight, age, sex, activity } = input;
  const goal = age < 18 ? "maintain" : input.goal;
  const numbersOk = Number.isFinite(height) && height >= 50 && height <= 250 && Number.isFinite(weight) && weight >= 5 && weight <= 300 && Number.isInteger(age) && age >= 1 && age <= 100;
  if (!numbersOk || (sex !== "male" && sex !== "female") || !activityNames[String(activity)] || !isGoal(goal)) return t("請檢查資料：身高 50-250 cm，體重 5-300 kg，年齡 1-100 歲。");
  store.setState((s) => ({
    members: s.members.map((m) => {
      if (m.id !== memberId) return m;
      const records = m.health.records.some((record) => record.date === todayKey) ? m.health.records.map((record) => (record.date === todayKey ? { ...record, weight } : record)) : [...m.health.records, { date: todayKey, weight }];
      const health: Health = { height, weight, age, sex, activity, goal, records };
      return { ...m, health };
    }),
  }));
  dialog.close();
  toast(t("健康資料已更新"));
  return null;
}

/** health-wearable-form submit: attach a fixed demo sample (by member index) and switch to the family tab. */
export function connectWearable(memberId: string) {
  const s = store.getState();
  const person = memberOr(memberId, s.members);
  if (!person) return;
  const index = Math.max(0, s.members.findIndex((item) => item.id === person.id));
  store.setState({ health: { ...s.health, tab: "family", wearables: { ...s.health.wearables, [person.id]: { ...WEARABLE_SAMPLES[index % WEARABLE_SAMPLES.length] } } } });
  dialog.close();
  toast(t("已連線示範設備，顯示範例數據"));
}

/** health-disconnect */
export function disconnectWearable(memberId: string) {
  store.setState((s) => {
    const wearables = { ...s.health.wearables };
    delete wearables[memberId];
    return { health: { ...s.health, wearables } };
  });
  toast(t("示範設備已中斷連線"));
}

/** data-fh-auto-connect change */
export function setAutoConnect(value: boolean) {
  useHealthUiStore.getState().setAutoConnect(value);
  toast(value ? t("已開啟示範設備自動連接") : t("已關閉示範設備自動連接"));
}
