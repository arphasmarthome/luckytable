/* Dialogs of the 積分 module: task / reward / diet forms, parent management and the confirm prompts. */
import { useState } from "react";
import { View } from "react-native";
import { Button, TextField, Txt } from "@/components/ui";
import { t as tt, useI18n } from "@/i18n";
import { dialog } from "@/store/dialog";
import { useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { deleteTask, memberOr, redeemReward, removeReward, saveDiet, saveReward, saveTask } from "./actions";
import { FormActions, FormCell, FormGrid, MemberChoice, NumberField } from "./shared";

/* ───────── task form (taskForm) ───────── */

function TaskForm({ taskId }: { taskId?: string }) {
  const { t } = useI18n();
  const task = useDeviceStore((s) => s.tasks.find((item) => item.id === taskId));
  const familyMember = useDeviceStore((s) => s.family.member);
  const [title, setTitle] = useState(task ? t(task.title) : "");
  const [memberId, setMemberId] = useState(task ? task.memberId : familyMember);
  const [points, setPoints] = useState(task ? String(task.points) : "5");
  const [error, setError] = useState("");
  const submit = () => {
    const message = saveTask({ id: task?.id, title, points: points.trim() === "" ? NaN : Number(points), memberId });
    if (message) setError(message);
  };
  return (
    <View style={{ gap: 16 }}>
      <FormGrid>
        <FormCell full>
          <TextField label={t("任務名稱")} value={title} onChangeText={setTitle} maxLength={40} placeholder={t("例如：整理書包")} />
        </FormCell>
        <FormCell>
          <MemberChoice label={t("家庭成員")} value={memberId} onChange={setMemberId} disabled={Boolean(task)} />
        </FormCell>
        <FormCell>
          <NumberField label={t("每次積分")} value={points} onChange={setPoints} integer />
        </FormCell>
      </FormGrid>
      <Txt variant="meta" muted>
        {t("每天一次")}
        {task ? t(" · 已完成任務的積分保持不變") : ""}
      </Txt>
      <FormActions error={error} onCancel={dialog.close} onSubmit={submit} />
    </View>
  );
}

export function openTaskForm(taskId?: string) {
  const task = taskId ? useDeviceStore.getState().tasks.find((item) => item.id === taskId) : undefined;
  if (taskId && !task) return;
  dialog.show({ title: task ? tt("編輯任務") : tt("新增家庭任務"), body: () => <TaskForm taskId={task?.id} /> });
}

/* ───────── reward form (rewardForm) ───────── */

function RewardForm() {
  const { t } = useI18n();
  const familyMember = useDeviceStore((s) => s.family.member);
  const [title, setTitle] = useState("");
  const [memberId, setMemberId] = useState(familyMember);
  const [cost, setCost] = useState("50");
  const [error, setError] = useState("");
  const submit = () => {
    const message = saveReward({ title, cost: cost.trim() === "" ? NaN : Number(cost), memberId });
    if (message) setError(message);
  };
  return (
    <View style={{ gap: 16 }}>
      <FormGrid>
        <FormCell full>
          <TextField label={t("獎勵名稱")} value={title} onChangeText={setTitle} maxLength={40} placeholder={t("例如：週末去看電影")} />
        </FormCell>
        <FormCell>
          <MemberChoice label={t("家庭成員")} value={memberId} onChange={setMemberId} />
        </FormCell>
        <FormCell>
          <NumberField label={t("兌換積分")} value={cost} onChange={setCost} integer />
        </FormCell>
      </FormGrid>
      <FormActions error={error} onCancel={dialog.close} onSubmit={submit} submitLabel={t("建立目標")} />
    </View>
  );
}

export function openRewardForm() {
  dialog.show({ title: tt("新增獎勵目標"), body: () => <RewardForm /> });
}

/* ───────── diet form (fam-edit-diet) ───────── */

function DietForm({ memberId }: { memberId: string }) {
  const { t } = useI18n();
  const person = useDeviceStore((s) => s.members.find((m) => m.id === memberId));
  const [allergy, setAllergy] = useState(person?.allergy ? t(person.allergy) : "");
  const [preference, setPreference] = useState(person?.preference ? t(person.preference) : "");
  return (
    <View style={{ gap: 16 }}>
      <TextField label={t("過敏與忌口")} value={allergy} onChangeText={setAllergy} multiline maxLength={200} placeholder={t("例如：花生過敏、不吃香菜")} />
      <TextField label={t("飲食偏好")} value={preference} onChangeText={setPreference} multiline maxLength={200} placeholder={t("例如：清淡、喜歡蔬菜")} />
      <FormActions onCancel={dialog.close} onSubmit={() => saveDiet(memberId, allergy, preference)} />
    </View>
  );
}

export function openDietForm(memberId: string) {
  const person = memberOr(memberId);
  if (!person) return;
  dialog.show({ title: tt("編輯飲食資訊"), body: () => <DietForm memberId={person.id} /> });
}

/* ───────── parent management (parentManagement) ───────── */

function ParentManagement({ memberId }: { memberId: string }) {
  const { t } = useI18n();
  const tasks = useDeviceStore((s) => s.tasks.filter((task) => task.memberId === memberId));
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <Button variant="primary" icon="plus" label={t("新增任務")} onPress={() => openTaskForm()} />
        <Button variant="text" icon="gift" label={t("新增獎勵")} onPress={openRewardForm} />
        <Button variant="text" icon="utensils" label={t("餐食設定")} onPress={() => openDietForm(memberId)} />
      </View>
      {tasks.length ? (
        tasks.map((task) => (
          <View key={task.id} style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#dce5e5" }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="600">{t(task.title)}</Txt>
              <Txt variant="meta" color="#75817e">
                {t("每天 +{n} 積分", { n: task.points })}
              </Txt>
            </View>
            <Button square variant="ghost" icon="pencil" accessibilityLabel={t("編輯{title}", { title: t(task.title) })} onPress={() => openTaskForm(task.id)} />
            <Button square variant="ghost" icon="trash-2" accessibilityLabel={t("刪除{title}", { title: t(task.title) })} onPress={() => confirmDeleteTask(task.id)} />
          </View>
        ))
      ) : (
        <Txt muted>{t("尚無家庭任務")}</Txt>
      )}
    </View>
  );
}

export function openParentManagement(memberId: string) {
  const person = memberOr(memberId);
  if (!person) return;
  dialog.show({ title: tt("家長管理 · {name}", { name: person.name }), body: () => <ParentManagement memberId={person.id} /> });
}

/* ───────── confirm prompts ───────── */

export function confirmDeleteTask(id: string) {
  const task = useDeviceStore.getState().tasks.find((item) => item.id === id);
  if (!task) return;
  dialog.show({
    title: tt("刪除任務"),
    body: <Txt>{tt("刪除“{title}”？已獲得的積分與積分記錄會保留。", { title: tt(task.title) })}</Txt>,
    footer: (
      <>
        <Button variant="text" label={tt("取消")} onPress={dialog.close} />
        <Button variant="danger" icon="trash-2" label={tt("刪除任務")} onPress={() => deleteTask(id)} />
      </>
    ),
  });
}

/** fam-redeem: blocked with a toast when the balance is short, otherwise asks for confirmation. */
export function askRedeem(id: string) {
  const s = useDeviceStore.getState();
  const reward = s.rewards.find((item) => item.id === id);
  if (!reward || reward.redeemed) return;
  const owner = memberOr(reward.memberId, s.members);
  if (!owner) return;
  if (owner.points < reward.cost) {
    toast(tt("積分還差 {n}", { n: reward.cost - owner.points }));
    return;
  }
  dialog.show({
    title: tt("兌換獎勵"),
    body: (
      <View style={{ gap: 8 }}>
        <Txt>{tt("使用 {n} 積分兌換“{title}”。", { n: reward.cost, title: tt(reward.title) })}</Txt>
        <Txt muted>{tt("兌換後剩餘 {n} 積分", { n: owner.points - reward.cost })}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button variant="text" label={tt("取消")} onPress={dialog.close} />
        <Button variant="primary" icon="gift" label={tt("確認兌換")} onPress={() => redeemReward(id)} />
      </>
    ),
  });
}

export function confirmDeleteReward(id: string) {
  const reward = useDeviceStore.getState().rewards.find((item) => item.id === id);
  if (!reward || reward.redeemed) return;
  dialog.show({
    title: tt("移除獎勵"),
    body: <Txt>{tt("移除“{title}”？不會扣除積分。", { title: tt(reward.title) })}</Txt>,
    footer: (
      <>
        <Button variant="text" label={tt("取消")} onPress={dialog.close} />
        <Button variant="danger" label={tt("移除")} onPress={() => removeReward(id)} />
      </>
    ),
  });
}

