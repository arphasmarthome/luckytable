/* Store mutations of the 積分 module (the prototype's fam-* click / submit handlers).
 * Everything here is non-component code, so it uses the plain `t` export. */
import { t } from "@/i18n";
import { dateKey, todayKey, uid } from "@/lib/date";
import { dialog } from "@/store/dialog";
import { useDeviceStore, type DeviceData, type Member, type PointsLogEntry } from "@/store/device";
import { toast } from "@/store/toast";

export type FamilyTab = "tasks" | "rewards" | "growth" | "history" | "diet";
export const FAMILY_TABS: FamilyTab[] = ["tasks", "rewards", "growth", "history", "diet"];
export const asFamilyTab = (tab: string): FamilyTab => (FAMILY_TABS.includes(tab as FamilyTab) ? (tab as FamilyTab) : "tasks");

const store = useDeviceStore;
const logEntry = (memberId: string, amount: number, title: string, type: string): PointsLogEntry => ({ id: uid("points"), memberId, amount, title, type, at: new Date().toISOString(), date: todayKey });

export const setFamily = (patch: Partial<DeviceData["family"]>) => store.setState((s) => ({ family: { ...s.family, ...patch } }));

/** member(ctx, id): the member with this id, else the first member. */
export function memberOr(id: string | null | undefined, members = store.getState().members): Member | undefined {
  return members.find((item) => item.id === id) || members[0];
}

/** fam-task-form submit. Returns a validation message, or null when saved. */
export function saveTask(input: { id?: string; title: string; points: number; memberId: string }): string | null {
  const title = input.title.trim();
  const points = input.points;
  if (!title || title.length > 40 || !Number.isInteger(points) || points < 1 || points > 100) return t("請填寫任務名稱，積分須為 1 至 100 的整數。");
  const existing = store.getState().tasks.find((item) => item.id === input.id);
  if (existing) {
    store.setState((s) => ({
      tasks: s.tasks.map((task) => {
        if (task.id !== existing.id) return task;
        // completed days keep the points they were credited with
        const completionPoints = { ...task.completionPoints };
        for (const day of task.completions) if (completionPoints[day] == null) completionPoints[day] = task.points;
        return { ...task, title, points, completionPoints };
      }),
    }));
  } else {
    const owner = memberOr(input.memberId);
    if (!owner) return t("請填寫任務名稱，積分須為 1 至 100 的整數。");
    store.setState((s) => ({ tasks: [...s.tasks, { id: uid("task"), title, points, memberId: owner.id, completions: [], completionPoints: {} }] }));
  }
  dialog.close();
  toast(existing ? t("任務已更新") : t("任務已新增"));
  return null;
}

/** fam-reward-form submit. */
export function saveReward(input: { title: string; cost: number; memberId: string }): string | null {
  const title = input.title.trim();
  const cost = input.cost;
  if (!title || title.length > 40 || !Number.isInteger(cost) || cost < 1 || cost > 10000) return t("請填寫獎勵名稱，積分須為 1 至 10000 的整數。");
  const owner = memberOr(input.memberId);
  if (!owner) return t("請填寫獎勵名稱，積分須為 1 至 10000 的整數。");
  store.setState((s) => ({
    rewards: [...s.rewards, { id: uid("reward"), title, memberId: owner.id, cost, redeemed: false }],
    family: { ...s.family, member: owner.id, tab: "rewards" },
  }));
  dialog.close();
  toast(t("獎勵目標已建立"));
  return null;
}

/** fam-diet-form submit. */
export function saveDiet(memberId: string, allergy: string, preference: string) {
  store.setState((s) => ({
    members: s.members.map((m) => (m.id === memberId ? { ...m, allergy: allergy.trim().slice(0, 200), preference: preference.trim().slice(0, 200) } : m)),
  }));
  dialog.close();
  toast(t("飲食資訊已更新"));
}

/** fam-confirm-delete-task: the task moves to archivedTasks so the growth record survives. */
export function deleteTask(id: string) {
  store.setState((s) => {
    const task = s.tasks.find((item) => item.id === id);
    return { tasks: s.tasks.filter((item) => item.id !== id), archivedTasks: task ? [...s.archivedTasks, { ...task, archived: true }] : s.archivedTasks };
  });
  dialog.close();
  toast(t("任務已刪除，成長足跡已保留"));
}

/** fam-confirm-redeem */
export function redeemReward(id: string) {
  const s = store.getState();
  const reward = s.rewards.find((item) => item.id === id);
  if (!reward || reward.redeemed) return;
  const owner = memberOr(reward.memberId, s.members);
  if (!owner) return;
  if (owner.points < reward.cost) {
    dialog.close();
    toast(t("積分不足，未兌換獎勵"));
    return;
  }
  store.setState({
    rewards: s.rewards.map((item) => (item.id === id ? { ...item, redeemed: true, redeemedAt: new Date().toISOString() } : item)),
    members: s.members.map((m) => (m.id === owner.id ? { ...m, points: m.points - reward.cost } : m)),
    pointsLog: [logEntry(owner.id, -reward.cost, t("兌換：{title}", { title: t(reward.title) }), "reward"), ...s.pointsLog],
  });
  dialog.close();
  toast(t("獎勵已兌換"));
}

/** fam-confirm-delete-reward (redeemed rewards are kept). */
export function removeReward(id: string) {
  store.setState((s) => ({ rewards: s.rewards.filter((item) => item.id !== id || item.redeemed) }));
  dialog.close();
  toast(t("獎勵已移除"));
}

/** fam-growth-period: step the month (or year) shown on the growth tab. */
export function stepGrowthPeriod(step: number) {
  const ui = store.getState().family;
  const [year, month] = (ui.growthMonth || todayKey.slice(0, 7)).split("-").map(Number);
  const yearly = ui.growthMode === "year";
  const next = new Date(year + (yearly ? step : 0), month - 1 + (yearly ? 0 : step), 1);
  setFamily({ growthMonth: dateKey(next).slice(0, 7) });
}
