/* renderWeek: seven day columns (horizontally scrollable on phones). */
import { Pressable, ScrollView, View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { addDays, dateKey, todayKey, weekStart } from "@/lib/date";
import { openEventForm } from "../dialogs";
import { EventChip } from "../EventChip";
import { cal, filterEvents, type CalEvent } from "../helpers";
import { openDate } from "../actions";

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

export function WeekView({ date, events }: { date: Date; events: CalEvent[] }) {
  const { isPhone } = useBreakpoint();
  const start = weekStart(date);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  const columns = (
    <View style={{ flexDirection: "row", minHeight: isPhone ? 320 : 440 }}>
      {days.map((day) => (
        <DayColumn key={dateKey(day)} day={day} events={filterEvents(events, "all", dateKey(day))} width={isPhone ? PHONE_COLUMN : undefined} />
      ))}
    </View>
  );
  if (isPhone) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
        {columns}
      </ScrollView>
    );
  }
  return columns;
}
