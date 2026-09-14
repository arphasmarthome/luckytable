/* renderMonth: 7-column grid. Full cells show up to 1–2 event chips plus "還有 n 個行程";
 * compact cells (phones) show colour dots and a count instead. */
import { Pressable, View } from "react-native";
import { Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { addDays, dateKey, todayKey, weekStart } from "@/lib/date";
import { memberById, useDeviceStore } from "@/store/device";
import { openDate } from "../actions";
import { EventChip } from "../EventChip";
import { cal, filterEvents, monthRows, type CalEvent } from "../helpers";

const HEADER_HEIGHT = 44;

export function MonthView({ date, events, compact, cellHeight }: { date: Date; events: CalEvent[]; compact: boolean; cellHeight: number }) {
  const { t, monthDay, weekday, monthYear } = useI18n();
  const members = useDeviceStore((s) => s.members);
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  const start = weekStart(first);
  const rows = monthRows(date);
  const visibleCount = rows > 5 ? 1 : 2;
  return (
    <View accessibilityLabel={monthYear(date)}>
      <View style={{ flexDirection: "row", height: HEADER_HEIGHT, backgroundColor: cal.soft }}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <View key={day} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Txt variant="meta" weight="500" color="#809084">
              {weekday(day, "short")}
            </Txt>
          </View>
        ))}
      </View>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {Array.from({ length: 7 }, (_, column) => {
            const day = addDays(start, row * 7 + column);
            const key = dateKey(day);
            const dayEvents = filterEvents(events, "all", key);
            const outside = day.getMonth() !== date.getMonth();
            const isToday = key === todayKey;
            const label = t("{date}，{n}個行程", { date: monthDay(day), n: dayEvents.length });
            const number = (
              <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? cal.orange : "transparent" }}>
                <Txt variant="card" weight={isToday ? "600" : "400"} color={isToday ? "#fff" : outside ? "#b7c0c1" : "#26342f"}>
                  {String(day.getDate())}
                </Txt>
              </View>
            );
            const cellStyle = {
              flex: 1,
              minWidth: 0,
              minHeight: cellHeight,
              paddingVertical: 6,
              paddingHorizontal: compact ? 2 : 8,
              borderTopWidth: 1,
              borderTopColor: cal.cellLine,
              borderRightWidth: column === 6 ? 0 : 1,
              borderRightColor: cal.cellLine,
              backgroundColor: isToday ? cal.todayCell : outside ? cal.outside : "#fff",
            } as const;
            if (compact) {
              return (
                <Pressable key={key} accessibilityRole="button" accessibilityLabel={label} onPress={() => openDate(key)} style={[cellStyle, { alignItems: "center", gap: 4 }]}>
                  {number}
                  {dayEvents.length ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                      {dayEvents.slice(0, 3).map((event) => (
                        <View key={event.id} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: memberById(event.memberId, members).color, opacity: event.done ? 0.5 : 1 }} />
                      ))}
                      {dayEvents.length > 3 ? (
                        <Txt variant="caption" color="#567762" style={{ fontSize: 11, lineHeight: 13 }}>
                          +{dayEvents.length - 3}
                        </Txt>
                      ) : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            }
            return (
              <View key={key} style={cellStyle}>
                <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => openDate(key)} hitSlop={4} style={{ alignSelf: "flex-end", marginBottom: 4 }}>
                  {number}
                </Pressable>
                <View style={{ gap: 5 }}>
                  {dayEvents.slice(0, visibleCount).map((event) => (
                    <EventChip key={event.id} event={event} compact />
                  ))}
                </View>
                {dayEvents.length > visibleCount ? (
                  <Pressable accessibilityRole="button" onPress={() => openDate(key)} style={{ minHeight: 32, justifyContent: "center", paddingHorizontal: 3 }}>
                    <Txt variant="meta" color="#567762">
                      {t("還有 {n} 個行程", { n: dayEvents.length - visibleCount })}
                    </Txt>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
