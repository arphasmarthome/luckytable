/* 家庭積分 (route /family) — port of modules.family in prototype/device/family-health.js. */
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, Page } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { asFamilyTab, setFamily, type FamilyTab } from "./actions";
import { scheduleHref, DietView } from "./diet";
import { openParentManagement } from "./dialogs";
import { GrowthView } from "./growth";
import { LogView } from "./log";
import { RewardsView } from "./rewards";
import { Board, FhTabs, MemberChips, PageHeading, type TabDef } from "./shared";
import { TasksView } from "./tasks";

const TABS: TabDef<FamilyTab>[] = [
  { id: "tasks", label: "任務與習慣", icon: "list-checks" },
  { id: "rewards", label: "獎勵目標", icon: "gift" },
  { id: "growth", label: "成長足跡", icon: "chart-no-axes-column" },
  { id: "history", label: "積分帳本", icon: "history" },
  { id: "diet", label: "飲食資訊", icon: "utensils" },
];

export function FamilyScreen() {
  const { t } = useI18n();
  const router = useRouter();
  const family = useDeviceStore((s) => s.family);
  const members = useDeviceStore((s) => s.members);
  const person = members.find((item) => item.id === family.member) || members[0];
  const tab = asFamilyTab(family.tab);
  useEffect(() => {
    if (person && person.id !== family.member) setFamily({ member: person.id });
  }, [person, family.member]);
  if (!person) return null;
  const content =
    tab === "tasks" ? <TasksView person={person} /> : tab === "rewards" ? <RewardsView person={person} /> : tab === "history" ? <LogView person={person} /> : tab === "growth" ? <GrowthView person={person} /> : <DietView person={person} />;
  return (
    <Page gap={16}>
      <PageHeading title={t("家庭積分")}>
        <Button icon="calendar-days" label={t("個人行程")} onPress={() => router.navigate(scheduleHref(person.id) as never)} />
        <Button icon="user-cog" label={t("家長管理")} onPress={() => openParentManagement(person.id)} />
      </PageHeading>
      <MemberChips selected={person.id} onSelect={(id) => setFamily({ member: id })} withPoints />
      <FhTabs tabs={TABS} value={tab} onChange={(id) => setFamily({ tab: id })} accessibilityLabel={t("積分視圖")} />
      <Board>{content}</Board>
    </Page>
  );
}
