/* 家庭健康 (route /health) — port of modules.health in prototype/device/family-health.js. */
import { useEffect } from "react";
import { View } from "react-native";
import { Button, Page, Select } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { Board, FhTabs, LocalLabel, PageHeading, type TabDef } from "@/features/family/shared";
import { asHealthTab, setHealth, type HealthTab } from "./actions";
import { HealthActivity } from "./activity";
import { openHealthForm, openWearableDialog } from "./dialogs";
import { HealthProfile } from "./profile";

const TABS: TabDef<HealthTab>[] = [
  { id: "profile", label: "個人健康", icon: "user" },
  { id: "family", label: "家庭活動", icon: "users" },
];

export function HealthScreen() {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const health = useDeviceStore((s) => s.health);
  const members = useDeviceStore((s) => s.members);
  const person = members.find((item) => item.id === health.member) || members[0];
  const tab = asHealthTab(health.tab);
  useEffect(() => {
    if (person && person.id !== health.member) setHealth({ member: person.id });
  }, [person, health.member]);
  if (!person) return null;
  const family = tab === "family";
  return (
    <Page gap={16}>
      <PageHeading title={t("家庭健康")}>
        <LocalLabel>{t("僅存本機")}</LocalLabel>
        <Button variant="primary" icon={family ? "watch" : "pencil"} label={family ? t("連線手環") : t("編輯資料")} onPress={() => (family ? openWearableDialog() : openHealthForm(person.id))} />
      </PageHeading>
      <View style={{ flexDirection: isPhone ? "column" : "row", alignItems: isPhone ? "stretch" : "center", justifyContent: "space-between", gap: 12, borderBottomWidth: 1, borderBottomColor: "#e1e6e3" }}>
        <FhTabs tabs={TABS} value={tab} onChange={(id) => setHealth({ tab: id })} accessibilityLabel={t("健康視圖")} style={{ borderBottomWidth: 0 }} />
        {!family ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: isPhone ? 12 : 4 }}>
            <Select accessibilityLabel={t("選擇健康資料成員")} title={t("家庭成員")} value={person.id} options={members.map((m) => ({ value: m.id, label: m.name }))} onChange={(id) => setHealth({ member: id })} style={{ minWidth: 170, flex: isPhone ? 1 : undefined }} />
          </View>
        ) : null}
      </View>
      <Board>{family ? <HealthActivity /> : <HealthProfile person={person} />}</Board>
    </Page>
  );
}
