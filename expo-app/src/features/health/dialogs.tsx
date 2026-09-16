/* Dialogs of the 健康 module: the health profile form (with the child / adult goal switch) and the wearable demo pairing. */
import { useState } from "react";
import { View } from "react-native";
import { DemoNotice, Icon, TextField, Txt } from "@/components/ui";
import { t as tt, useI18n } from "@/i18n";
import { dialog } from "@/store/dialog";
import { useDeviceStore, type Health } from "@/store/device";
import { radius } from "@/theme";
import { ChoiceField, fh, FormActions, FormCell, FormGrid, MemberChoice, NumberField } from "@/features/family/shared";
import { connectWearable, memberOr, saveHealthProfile } from "./actions";
import { activityNames, activityOptions, goalNames, goalOptions } from "./estimate";

/* ───────── health profile form (healthForm + syncHealthGoal) ───────── */

function HealthForm({ memberId }: { memberId: string }) {
  const { t } = useI18n();
  const person = useDeviceStore((s) => s.members.find((m) => m.id === memberId));
  const renameMember = useDeviceStore((s) => s.renameMember);
  const p = person?.health;
  const [name, setName] = useState(person?.name || "");
  const [height, setHeight] = useState(p?.height ? String(p.height) : "");
  const [weight, setWeight] = useState(p?.weight ? String(p.weight) : "");
  const [age, setAge] = useState(p?.age ? String(p.age) : "");
  const [sex, setSex] = useState<Health["sex"]>(p?.sex === "female" ? "female" : "male");
  const [activity, setActivity] = useState(String(p?.activity || 1.4));
  const [goal, setGoal] = useState<Health["goal"]>(p?.goal && goalNames[p.goal] ? p.goal : "maintain");
  const [error, setError] = useState("");
  const ageValue = age.trim() === "" ? NaN : Number(age);
  const adult = Number.isInteger(ageValue) && ageValue >= 18 && ageValue <= 100;
  const ageNote = ageValue >= 1 && ageValue <= 100 ? t("未滿 18 歲僅記錄成長資料，不計算成人 BMI 與熱量目標。") : t("請先填寫 1 至 100 歲的有效年齡；未滿 18 歲僅記錄成長資料。");
  const submit = () => {
    if (!name.trim()) {
      setError(t("請輸入姓名。"));
      return;
    }
    const message = saveHealthProfile(memberId, {
      height: height.trim() === "" ? NaN : Number(height),
      weight: weight.trim() === "" ? NaN : Number(weight),
      age: ageValue,
      sex,
      activity: Number(activity),
      goal: adult ? goal : "maintain",
    });
    if (message) {
      setError(message);
      return;
    }
    renameMember(memberId, name);
  };
  return (
    <View style={{ gap: 16 }}>
      <TextField label={t("姓名")} value={name} onChangeText={setName} maxLength={20} autoComplete="off" />
      <FormGrid>
        <FormCell>
          <NumberField label={t("身高 · cm")} value={height} onChange={setHeight} />
        </FormCell>
        <FormCell>
          <NumberField label={t("體重 · kg")} value={weight} onChange={setWeight} />
        </FormCell>
        <FormCell>
          <NumberField label={t("年齡 · 歲")} value={age} onChange={setAge} integer />
        </FormCell>
        <FormCell>
          <ChoiceField
            label={t("生理性別")}
            value={sex}
            options={[
              { value: "male", label: t("男") },
              { value: "female", label: t("女") },
            ]}
            onChange={setSex}
          />
        </FormCell>
        <FormCell full>
          <ChoiceField label={t("活動程度")} value={activity} options={activityOptions.map((value) => ({ value, label: t(activityNames[value]) }))} onChange={setActivity} />
        </FormCell>
        <FormCell full>
          {adult ? (
            <ChoiceField label={t("健康目標")} value={goal} options={goalOptions.map((value) => ({ value, label: t(goalNames[value]) }))} onChange={setGoal} />
          ) : (
            <ChoiceField label={t("健康目標")} value="maintain" options={[{ value: "maintain", label: t("成長記錄") }]} onChange={() => undefined} disabled />
          )}
        </FormCell>
      </FormGrid>
      <Txt variant="meta" muted accessibilityLiveRegion="polite">
        {ageNote}
      </Txt>
      <FormActions error={error} onCancel={dialog.close} onSubmit={submit} submitLabel={t("儲存")} />
    </View>
  );
}

export function openHealthForm(memberId: string) {
  const person = memberOr(memberId);
  if (!person) return;
  dialog.show({ title: tt("編輯 {name} 的健康資料", { name: person.name }), body: () => <HealthForm memberId={person.id} /> });
}

/* ───────── wearable pairing (wearableDialog) ───────── */

function WearableForm({ memberId }: { memberId: string }) {
  const { t } = useI18n();
  const [selected, setSelected] = useState(memberId);
  return (
    <View style={{ gap: 16 }}>
      <DemoNotice>{t("原型示範：連線後展示固定的範例活動數據，不會訪問真實設備。")}</DemoNotice>
      <MemberChoice label={t("所屬成員")} value={selected} onChange={setSelected} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#dce5d8" }}>
        <Icon name="watch" size={30} color="#8ca573" />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt weight="600">{t("Lucky Band · 示範設備")}</Txt>
          <Txt variant="meta" muted>
            {t("步數、活動時長、心率")}
          </Txt>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: fh.soft }}>
          <Txt variant="caption" weight="600" color={fh.green}>
            {t("示範")}
          </Txt>
        </View>
      </View>
      <FormActions onCancel={dialog.close} onSubmit={() => connectWearable(selected)} submitLabel={t("連線示範設備")} />
    </View>
  );
}

export function openWearableDialog(memberId?: string) {
  const person = memberOr(memberId || useDeviceStore.getState().health.member);
  if (!person) return;
  dialog.show({ title: tt("連線穿戴設備"), body: () => <WearableForm memberId={person.id} /> });
}
