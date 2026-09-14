/* renderYear + miniMonth: twelve small month grids (the compact variant with prev/next arrows
 * is the week view's sidebar calendar). */
import { Pressable, View } from "react-native";
import { Button, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { dateKey, today, todayKey } from "@/lib/date";
import { openDate, openMonth, shiftMonth } from "../actions";
import { cal, filterEvents, type CalEvent } from "../helpers";

export function MiniMonth({ date, month, events, compact = false, dayHeight = 30 }: { date: Date; month: number; events: CalEvent[]; compact?: boolean; dayHeight?: number }) {
  const { t, weekday, monthName, monthYear, monthDay } = useI18n();
  const first = new Date(date.getFullYear(), month, 1, 12);
  const count = new Date(date.getFullYear(), month + 1, 0).getDate();
  const offset = first.getDay();
  const isCurrent = month === today.getMonth() && date.getFullYear() === today.getFullYear();
  const cells = [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, index) => index + 1)];
  while (cells.length % 7) cells.push(null);
  return (
    <View style={{ minWidth: 0, padding: compact ? 0 : 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: compact ? 10 : 5 }}>
        {compact ? <Button square size="sm" variant="ghost" icon="chevron-left" accessibilityLabel={t("上一個月")} onPress={() => shiftMonth(-1)} style={{ width: 44, height: 44 }} /> : null}
        <Pressable accessibilityRole="button" accessibilityLabel={compact ? monthYear(first) : monthName(month)} onPress={() => openMonth(dateKey(first))} style={{ flex: 1, minHeight: 44, justifyContent: "center", alignItems: compact ? "center" : "flex-start" }}>
          <Txt variant={compact ? "h3" : "h2"} color={isCurrent ? "#b47c3c" : "#263934"}>
            {compact ? monthYear(first) : monthName(month)}
          </Txt>
        </Pressable>
        {compact ? <Button square size="sm" variant="ghost" icon="chevron-right" accessibilityLabel={t("下一個月")} onPress={() => shiftMonth(1)} style={{ width: 44, height: 44 }} /> : null}
      </View>
      <View style={{ flexDirection: "row" }}>
        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
          <View key={day} style={{ flex: 1, height: 22, alignItems: "center", justifyContent: "center" }}>
            <Txt variant="caption" color="#8c9693">
              {weekday(day, "short")}
            </Txt>
          </View>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: "row" }}>
          {cells.slice(row * 7, row * 7 + 7).map((dayNumber, column) => {
            if (!dayNumber) return <View key={`empty-${column}`} style={{ flex: 1, height: dayHeight }} />;
            const day = new Date(date.getFullYear(), month, dayNumber, 12);
            const key = dateKey(day);
            const n = filterEvents(events, "all", key).length;
            const isToday = key === todayKey;
            return (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityLabel={t("{date}，{n}個行程", { date: monthDay(day), n })}
                onPress={() => openDate(key)}
                hitSlop={{ top: Math.max(0, (44 - dayHeight) / 2), bottom: Math.max(0, (44 - dayHeight) / 2), left: 0, right: 0 }}
                style={({ pressed }) => ({ flex: 1, height: dayHeight, margin: 1, borderRadius: 4, alignItems: "center", justifyContent: "center", backgroundColor: isToday ? cal.orange : pressed ? "#eaf2f8" : "transparent" })}>
                <Txt variant="meta" color={isToday ? "#fff" : "#59635f"} style={{ lineHeight: 18 }}>
                  {String(dayNumber)}
                </Txt>
                <View style={{ position: "absolute", bottom: 2, width: 4, height: 4, borderRadius: 2, backgroundColor: n ? (isToday ? "#fff" : "#ec9b33") : "transparent" }} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function YearView({ date, events }: { date: Date; events: CalEvent[] }) {
  const { isPhone, isDesktop, isWide } = useBreakpoint();
  const columns = isDesktop ? 4 : isWide ? 3 : isPhone ? 1 : 2;
  const rows = Math.ceil(12 / columns);
  return (
    <View style={{ padding: isPhone ? 8 : 22, gap: 20 }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", gap: 24 }}>
          {Array.from({ length: columns }, (_, column) => {
            const month = row * columns + column;
            return (
              <View key={column} style={{ flex: 1, minWidth: 0 }}>
                {month < 12 ? <MiniMonth date={date} month={month} events={events} dayHeight={isPhone ? 40 : 30} /> : null}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
