/* Home → 今天的安排 (prototype agendaCardMarkup). */
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, EmptyNote, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { todayKey } from "@/lib/date";
import { memberById, todaysEvents, useDeviceStore } from "@/store/device";
import { shell } from "@/theme";
import { HomeCard } from "./HomeCard";

export function AgendaCard() {
  const router = useRouter();
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const events = useDeviceStore((s) => s.events);
  const members = useDeviceStore((s) => s.members);
  const todays = todaysEvents(events);
  return (
    <HomeCard
      title={t("今天的安排")}
      aside={
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          <Button size="sm" icon="mic" label={t("語音新增")} onPress={() => router.navigate(`/calendar?action=voice&date=${todayKey}` as never)} />
          <Button size="sm" variant="primary" icon="plus" label={t("新增行程")} onPress={() => router.navigate(`/calendar?action=new&date=${todayKey}` as never)} />
        </View>
      }
      style={{ flex: 1 }}
      footer={<Button variant="text" size={isPhone ? "sm" : "md"} label={t("全部 {n} 個行程", { n: todays.length })} iconRight="arrow-right" onPress={() => router.navigate("/calendar" as never)} style={{ marginLeft: "auto" }} />}>
      {todays.length ? (
        <View>
          {todays.slice(0, 5).map((event) => {
            const person = memberById(event.memberId, members);
            return (
              <Pressable
                key={event.id}
                accessibilityRole="button"
                accessibilityLabel={t(event.title)}
                onPress={() => router.navigate(`/calendar?view=day&date=${todayKey}&eventId=${event.id}` as never)}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 46, paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: shell.line, opacity: pressed ? 0.7 : 1 })}>
                <Txt variant="body" muted style={{ width: isPhone ? 52 : 60, fontVariant: ["tabular-nums"] }}>
                  {!event.time ? t("全天") : event.time}
                </Txt>
                <View style={{ width: 3, height: 30, borderRadius: 2, backgroundColor: person.color }} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="body" weight="600" numberOfLines={1}>
                    {t(event.title)}
                  </Txt>
                  <Txt variant="meta" muted>
                    {person.name}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <EmptyNote>{t("今天沒有行程")}</EmptyNote>
      )}
    </HomeCard>
  );
}
