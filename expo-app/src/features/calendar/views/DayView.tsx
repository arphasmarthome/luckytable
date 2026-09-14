/* renderDay: the day's agenda list, or a 24-hour timeline; both share the same event row. */
import { useEffect, useRef } from "react";
import { Pressable, View } from "react-native";
import { Button, Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { dateKey, todayKey } from "@/lib/date";
import { memberById, useDeviceStore } from "@/store/device";
import { tint } from "@/theme";
import { toggleDone } from "../actions";
import { MemberDot, openEventDetail, openEventForm } from "../dialogs";
import { cal, hourLabel, type CalEvent, type DayMode } from "../helpers";
import { useCalendarUi } from "../store";

const HOUR_ROW = 84;

function AgendaRow({ event, roomy }: { event: CalEvent; roomy: boolean }) {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const members = useDeviceStore((s) => s.members);
  const owner = memberById(event.memberId, members);
  const doneLabel = event.done ? t("標記未完成") : t("標記完成");
  const open = () => openEventDetail(event.id);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: isPhone ? 10 : 16, minHeight: roomy ? 96 : 64, paddingVertical: roomy ? 16 : 10, paddingLeft: 12, paddingRight: 12, marginBottom: roomy ? 12 : 5, borderLeftWidth: roomy ? 3 : 4, borderLeftColor: owner.color, borderRadius: 5, backgroundColor: tint(owner.color, roomy ? 0.05 : 0.09) }}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("查看{title}", { title: t(event.title) })} onPress={open} style={{ width: isPhone ? 64 : 88, minHeight: 44, justifyContent: "center", gap: 4 }}>
        <Txt variant={roomy ? "section" : "h3"} weight="500" color="#45574c">
          {event.time || t("全天")}
        </Txt>
        {event.endTime ? (
          <Txt variant="meta" color="#899a8f">
            {event.endTime}
          </Txt>
        ) : null}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={open} style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: "center" }}>
        <Txt variant={roomy ? "h3" : "card"} weight="500" color={event.done ? "#7c847f" : "#36463c"} style={event.done ? { textDecorationLine: "line-through" } : undefined}>
          {t(event.title)}
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 5 }}>
          <MemberDot color={owner.color} />
          <Txt variant="meta" color="#74857a">
            {owner.name}
          </Txt>
          {event.location ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 8 }}>
              <Icon name="map-pin" size={14} color="#74857a" />
              <Txt variant="meta" color="#74857a">
                {t(event.location)}
              </Txt>
            </View>
          ) : null}
          {event.source === "voice" ? (
            <Txt variant="caption" color="#6d8e7c" style={{ borderLeftWidth: 1, borderLeftColor: "#d0ddd4", paddingLeft: 8, marginLeft: 5 }}>
              {t("語音")}
            </Txt>
          ) : null}
        </View>
        {event.note ? (
          <Txt variant="meta" color="#74857a" style={{ marginTop: 5 }}>
            {event.note}
          </Txt>
        ) : null}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${doneLabel}：${t(event.title)}`}
        accessibilityState={{ checked: Boolean(event.done) }}
        onPress={() => toggleDone(event.id)}
        style={{ width: 44, height: 44, borderRadius: 6, borderWidth: 1, borderColor: event.done ? "#aecfba" : "#d7e2da", backgroundColor: event.done ? "#e1eee5" : "#ffffff8c", alignItems: "center", justifyContent: "center" }}>
        <Icon name="check" size={20} color={event.done ? "#3f8261" : "#a3b4aa"} />
      </Pressable>
    </View>
  );
}

function ModeSwitch({ value, onChange }: { value: DayMode; onChange: (mode: DayMode) => void }) {
  const { t } = useI18n();
  const options: { value: DayMode; icon: string; label: string }[] = [
    { value: "agenda", icon: "list", label: t("清單") },
    { value: "timeline", icon: "clock", label: t("時間軸") },
  ];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t("當天安排顯示方式")} style={{ flexDirection: "row", backgroundColor: "#edf2ec", borderRadius: 6, padding: 3, alignSelf: "flex-start" }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={() => onChange(option.value)} style={{ flexDirection: "row", alignItems: "center", gap: 7, height: 40, paddingHorizontal: 14, borderRadius: 5, backgroundColor: active ? "#fff" : "transparent" }}>
            <Icon name={option.icon} size={18} color={active ? cal.green : "#7b8b7e"} />
            <Txt variant="meta" weight={active ? "600" : "500"} color={active ? cal.green : "#7b8b7e"}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

function Timeline({ dateKey: key, events, scrollTo }: { dateKey: string; events: CalEvent[]; scrollTo: (y: number) => void }) {
  const { t } = useI18n();
  const untimed = events.filter((event) => !event.time);
  const containerY = useRef(0);
  const rowY = useRef<Record<number, number>>({});
  useEffect(() => {
    const id = setTimeout(() => {
      if (untimed.length) {
        scrollTo(containerY.current);
        return;
      }
      const first = events.find((event) => event.time);
      const hour = first ? Number(first.time.slice(0, 2)) : 7;
      scrollTo(Math.max(0, containerY.current + (rowY.current[hour] ?? hour * HOUR_ROW) - 20));
    }, 60);
    return () => clearTimeout(id);
    // re-run when the day changes; events / scrollTo change identity every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <View onLayout={(e) => (containerY.current = e.nativeEvent.layout.y)} style={{ paddingHorizontal: 12 }}>
      {untimed.length ? (
        <View style={{ flexDirection: "row", minHeight: HOUR_ROW }}>
          <Txt variant="meta" weight="600" color="#6b7873" style={{ width: 64, paddingTop: 14 }}>
            {t("全天")}
          </Txt>
          <View style={{ flex: 1, paddingVertical: 6 }}>
            {untimed.map((event) => (
              <AgendaRow key={event.id} event={event} roomy={false} />
            ))}
          </View>
        </View>
      ) : null}
      {Array.from({ length: 24 }, (_, hour) => {
        const hourEvents = events.filter((event) => event.time && Number(event.time.slice(0, 2)) === hour);
        const label = t("新增{hour}點的行程", { hour });
        return (
          <View key={hour} onLayout={(e) => (rowY.current[hour] = e.nativeEvent.layout.y)} style={{ flexDirection: "row", minHeight: HOUR_ROW }}>
            <Txt variant="meta" weight="600" color="#6b7873" style={{ width: 64, paddingTop: 14 }}>
              {hourLabel(hour)}
            </Txt>
            <View style={{ flex: 1, minHeight: HOUR_ROW, borderTopWidth: hour === 0 && !untimed.length ? 0 : 1, borderTopColor: "#dce3e7", paddingVertical: 6 }}>
              {hourEvents.map((event) => (
                <AgendaRow key={event.id} event={event} roomy={false} />
              ))}
              {hourEvents.length ? null : (
                <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => openEventForm({ date: key, time: hourLabel(hour) })} style={({ pressed }) => ({ position: "absolute", top: 14, right: 2, width: 44, height: 44, borderRadius: 5, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "#f2f7fb" : "transparent" })}>
                  <Icon name="plus" size={20} color="#b9c6cd" />
                </Pressable>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function DayView({ date, events, scrollTo }: { date: Date; events: CalEvent[]; scrollTo: (y: number) => void }) {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const dayMode = useCalendarUi((s) => s.dayMode);
  const setDayMode = useCalendarUi((s) => s.setDayMode);
  const key = dateKey(date);
  const done = events.filter((event) => event.done).length;
  return (
    <View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12, minHeight: 72, paddingHorizontal: isPhone ? 14 : 24, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#e1e7e2" }}>
        <View style={{ flex: 1, minWidth: 160, flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
          <Txt variant="h2">{key === todayKey ? t("今天的安排") : t("當天安排")}</Txt>
          <Txt variant="meta" color="#859386">
            {t("{n} 件行程 · {done} 件完成", { n: events.length, done })}
          </Txt>
        </View>
        <ModeSwitch value={dayMode} onChange={setDayMode} />
      </View>
      {dayMode === "timeline" ? (
        <Timeline dateKey={key} events={events} scrollTo={scrollTo} />
      ) : events.length ? (
        <View style={{ paddingHorizontal: isPhone ? 12 : 24, paddingTop: 12, paddingBottom: 20 }}>
          {events.map((event) => (
            <AgendaRow key={event.id} event={event} roomy />
          ))}
        </View>
      ) : (
        <View style={{ minHeight: 320, alignItems: "center", justifyContent: "center", gap: 14, padding: 24 }}>
          <Icon name="calendar-days" size={46} color="#91a799" />
          <Txt variant="h3" weight="500" color="#6d8474" align="center">
            {t("這一天還沒有安排")}
          </Txt>
          <Button variant="primary" accent={cal.green} icon="plus" label={t("新增行程")} onPress={() => openEventForm({ date: key })} />
        </View>
      )}
    </View>
  );
}
