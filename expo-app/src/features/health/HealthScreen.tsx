/* 家庭健康 (route /health) — port of modules.health in prototype/device/family-health.js. */
import { useEffect } from "react";
import { View } from "react-native";
import { Button, Page, Select, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { Board, FhTabs, type TabDef } from "@/features/family/shared";
import { asHealthTab, setHealth, type HealthTab } from "./actions";
import { HealthActivity } from "./activity";
import { openWearableDialog } from "./dialogs";
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
    <Page gap={12}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: isPhone ? 10 : 16, borderBottomWidth: 1, borderBottomColor: "#e1e6e3" }}>
        <Txt variant="h1" style={{ paddingBottom: 6 }}>
          {t("家庭健康")}
        </Txt>
        <FhTabs tabs={TABS} value={tab} onChange={(id) => setHealth({ tab: id })} accessibilityLabel={t("健康視圖")} style={{ borderBottomWidth: 0 }} />
        <View style={{ flex: 1 }} />
        {family ? (
          <Button variant="primary" icon="watch" label={t("連線手環")} onPress={() => openWearableDialog()} style={{ marginBottom: 6 }} />
        ) : (
          <Select accessibilityLabel={t("選擇健康資料成員")} title={t("家庭成員")} value={person.id} options={members.map((m) => ({ value: m.id, label: m.name }))} onChange={(id) => setHealth({ member: id })} style={{ minWidth: 170, marginBottom: 6 }} />
        )}
      </View>
      <Board>{family ? <HealthActivity /> : <HealthProfile person={person} />}</Board>
    </Page>
  );
}
