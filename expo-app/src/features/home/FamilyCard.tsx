/* Home → 家人 · 今晚一起吃 (prototype familyJoiningMarkup). */
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Avatar, Button, Segmented, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { shell } from "@/theme";
import { HomeCard } from "./HomeCard";

export function FamilyCard() {
  const router = useRouter();
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  const dinnerMembers = useDeviceStore((s) => s.dinnerMembers);
  const setDinner = useDeviceStore((s) => s.setDinner);
  const count = dinnerMembers.length;
  return (
    <HomeCard
      title={t("家人")}
      accessibilityLabel={t("今晚一起吃")}
      aside={
        <Txt variant="meta" muted>
          {t("誰會來")}
        </Txt>
      }
      style={{ flex: 1 }}
      footer={
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, minWidth: 0 }}>
          <Button variant="text" size="sm" label={t("管理家人")} onPress={() => router.navigate("/settings?section=family" as never)} style={{ flexShrink: 1, paddingHorizontal: 6 }} />
          <Button variant="primary" size="sm" label={t("規劃晚餐")} iconRight="arrow-right" disabled={!count} onPress={() => router.navigate("/make" as never)} style={{ marginLeft: "auto" }} />
        </View>
      }>
      <View>
        {members.map((m) => {
          const on = dinnerMembers.includes(m.id);
          return (
            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 1, borderBottomWidth: 1, borderBottomColor: shell.line }}>
              <Avatar color={m.color} initials={m.initials || m.name.slice(0, 1)} size={24} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="meta" weight="600" numberOfLines={1}>
                  {m.name}
                </Txt>
              </View>
              <Segmented<"1" | "0"> size="sm" accessibilityLabel={m.name} value={on ? "1" : "0"} options={[{ value: "1", label: t("是") }, { value: "0", label: t("否") }]} onChange={(value) => setDinner(m.id, value === "1")} />
            </View>
          );
        })}
      </View>
    </HomeCard>
  );
}
