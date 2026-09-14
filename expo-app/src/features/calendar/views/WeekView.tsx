/* renderWeek: seven day columns (horizontally scrollable on phones) plus the week summary. */
import { Pressable, ScrollView, View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { addDays, dateKey, todayKey, weekStart } from "@/lib/date";
import { memberById, useDeviceStore } from "@/store/device";
import { tint } from "@/theme";
import { openDate, setMember } from "../actions";
import { openEventForm } from "../dialogs";
import { EventChip } from "../EventChip";
import { cal, filterEvents, memberInitial, type CalEvent } from "../helpers";

const PHONE_COLUMN = 168;

function DayColumn({ day, events, width }: { day: Date; events: CalEvent[]; width?: number }) {
  const { t, weekday, monthDay } = useI18n();
  const key = dateKey(day);
  const isToday = key === todayKey;
  return (
    <View style={{ width, flex: width ? undefined : 1, minWidth: 0, borderRightWidth: 1, borderRightColor: cal.line, paddingHorizontal: 10, paddingBottom: 12, backgroundColor: isToday ? "#fffcf9" : "transparent" }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("查看{date}行程", { date: monthDay(day) })} onPress={() => openDate(key)} style={{ alignItems: "center", gap: 6, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: cal.line, minHeight: 96 }}>
        <Txt variant="meta" color="#7b8b7e" numberOfLines={1}>
          {weekday(day.getDay())}
        </Txt>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? cal.orange : "transparent" }}>
          <Txt variant="section" color={isToday ? "#fff" : "#354b3b"}>
            {String(day.getDate())}
          </Txt>
        </View>
      </Pressable>
      <View style={{ gap: 10, paddingTop: 14 }}>
        {events.map((event) => (
          <EventChip key={event.id} event={event} />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("新增{date}行程", { date: monthDay(day) })}
        onPress={() => openEventForm({ date: key })}
        style={({ pressed }) => ({ height: 44, marginTop: 12, borderWidth: 1, borderStyle: "dashed", borderColor: "#dfe7e2", borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "#edf6fb" : "transparent" })}>
        <Icon name="plus" size={18} color="#819888" />
      </Pressable>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ minWidth: 72 }}>
      <Txt variant="h1">{value}</Txt>
      <Txt variant="meta" color="#75837b" style={{ marginTop: 6 }}>
        {label}
      </Txt>
    </View>
  );
}

export function WeekView({ date, events }: { date: Date; events: CalEvent[] }) {
  const { t } = useI18n();
  const { isPhone, isWide } = useBreakpoint();
  const members = useDeviceStore((s) => s.members);
  const member = useDeviceStore((s) => s.calendar.member);
  const start = weekStart(date);
  const total = events.length;
  const activeDays = new Set(events.map((event) => event.date)).size;
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const columns = (
    <View style={{ flexDirection: "row", minHeight: isPhone ? 320 : 440 }}>
      {days.map((day) => (
        <DayColumn key={dateKey(day)} day={day} events={filterEvents(events, "all", dateKey(day))} width={isPhone ? PHONE_COLUMN : undefined} />
      ))}
    </View>
  );
  return (
    <View>
      {isPhone ? (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
          {columns}
        </ScrollView>
      ) : (
        columns
      )}
      <View style={{ flexDirection: isWide ? "row" : "column", gap: 18, paddingHorizontal: isPhone ? 14 : 24, paddingVertical: 18, borderTopWidth: 1, borderTopColor: cal.line, backgroundColor: "#fafbf9" }}>
        <View style={{ flex: isWide ? 43 : undefined, gap: 14, borderRightWidth: isWide ? 1 : 0, borderRightColor: cal.line, paddingRight: isWide ? 24 : 0 }}>
          <Txt variant="h3" weight="500" color="#6e8374">
            {t("本週摘要")}
          </Txt>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 32 }}>
            <Metric value={String(total)} label={t("件家庭行程")} />
            <Metric value={t("{n} 天", { n: activeDays })} label={t("有安排")} />
            <Metric value={t("{n} 天", { n: 7 - activeDays })} label={t("可休息")} />
          </View>
        </View>
        <View style={{ flex: isWide ? 57 : undefined, gap: 8 }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Txt variant="h3" weight="500" color="#6e8374">
              {t("家庭成員")}
            </Txt>
            <Txt variant="meta" color="#8a9790">
              {t("目前顯示{name}行程", { name: member === "all" ? t("全家") : memberById(member, members).name })}
            </Txt>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-around", gap: 12 }}>
            {members.map((person) => (
              <Pressable key={person.id} accessibilityRole="button" accessibilityLabel={person.name} accessibilityState={{ selected: member === person.id }} onPress={() => setMember(person.id)} style={{ minWidth: 70, minHeight: 44, alignItems: "center", gap: 6, paddingHorizontal: 8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: member === person.id ? person.color : tint(person.color, 0.5), backgroundColor: tint(person.color, member === person.id ? 0.25 : 0.1), alignItems: "center", justifyContent: "center" }}>
                  <Txt variant="card" weight="600" color={person.color}>
                    {memberInitial(person)}
                  </Txt>
                </View>
                <Txt variant="meta" color="#4a5b50">
                  {person.name}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
