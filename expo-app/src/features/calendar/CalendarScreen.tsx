/* The 行事曆 screen: toolbar, member sidebar (chip row on phones), period navigation and the
 * year / month / week / day views (port of render() in prototype/device/calendar.js). */
import { useEffect, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { Button, Page, Segmented, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { addDays, dateKey, fromKey, today, weekStart } from "@/lib/date";
import { useDeviceStore } from "@/store/device";
import { radius } from "@/theme";
import { goToday, patchCalendar, setView, shiftPeriod } from "./actions";
import { openEventDetail, openEventForm, openJump, openVoiceMember } from "./dialogs";
import { NEXT_LABELS, PREVIOUS_LABELS, VIEWS, cal, filterEvents, isView, monthRows, periodEvents, type CalView } from "./helpers";
import { MemberBar, Upcoming, Weather } from "./Sidebar";
import { useCalendarUi } from "./store";
import { DayView } from "./views/DayView";
import { MonthView } from "./views/MonthView";
import { WeekView } from "./views/WeekView";
import { MiniMonth, YearView } from "./views/YearView";

/** Query parameters other modules link here with: /calendar?date=…&view=…&member=…&action=new|voice&eventId=… */
export type CalendarParams = { date?: string; view?: string; member?: string; action?: string; eventId?: string };

function useArrivalParams(params: CalendarParams) {
  const signature = [params.date, params.view, params.member, params.action, params.eventId].map((v) => v || "").join("|");
  const applied = useRef("");
  useEffect(() => {
    if (applied.current === signature) return;
    applied.current = signature;
    const s = useDeviceStore.getState();
    const patch: Partial<typeof s.calendar> = {};
    if (params.date && fromKey(params.date)) patch.date = params.date;
    if (isView(params.view)) patch.view = params.view;
    if (params.member && (params.member === "all" || s.members.some((m) => m.id === params.member))) patch.member = params.member;
    if (Object.keys(patch).length) patchCalendar(patch);
    const date = patch.date || s.calendar.date;
    if (params.eventId) openEventDetail(params.eventId);
    else if (params.action === "new") openEventForm({ date });
    else if (params.action === "voice") openVoiceMember();
  }, [signature, params.date, params.view, params.member, params.action, params.eventId]);
}

export function CalendarScreen({ params }: { params: CalendarParams }) {
  const { t, monthDay, monthYear, yearLabel, dayTitle } = useI18n();
  const { isPhone, isWide, isTablet } = useBreakpoint();
  const calendar = useDeviceStore((s) => s.calendar);
  const events = useDeviceStore((s) => s.events);
  const members = useDeviceStore((s) => s.members);
  useArrivalParams(params);

  const view: CalView = isView(calendar.view) ? calendar.view : "month";
  const date = fromKey(calendar.date) || today;
  const start = weekStart(date);
  const title = view === "year" ? yearLabel(date.getFullYear()) : view === "week" ? `${monthDay(start)} - ${monthDay(addDays(start, 6))}` : view === "day" ? dayTitle(date) : monthYear(date);
  const visible = filterEvents(events, calendar.member);
  const inPeriod = periodEvents(events, view, date, calendar.member);

  const scrollRef = useRef<ScrollView>(null);
  const [content, setContent] = useState({ width: 0, height: 0 });
  const scrollTo = (y: number) => scrollRef.current?.scrollTo({ y, animated: false });
  useEffect(() => {
    // the timeline scrolls itself to the first event; every other view starts at the top
    if (view !== "day" || useCalendarUi.getState().dayMode !== "timeline") scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [view, calendar.date]);

  const cellWidth = content.width / 7;
  const compactMonth = cellWidth > 0 && cellWidth < 96;
  const cellHeight = Math.max(compactMonth ? 64 : 80, Math.floor((content.height - 44) / monthRows(date)));

  const viewOptions = VIEWS.map((option) => ({ value: option.value, label: t(option.label) }));
  const body =
    view === "year" ? <YearView date={date} events={visible} /> : view === "month" ? <MonthView date={date} events={visible} compact={compactMonth} cellHeight={cellHeight} /> : view === "day" ? <DayView date={date} events={filterEvents(visible, "all", dateKey(date))} scrollTo={scrollTo} /> : <WeekView date={date} events={inPeriod} />;

  const actions = (
    <View style={{ flexDirection: "row", alignItems: "center", gap: isPhone ? 8 : 12 }}>
      <Button variant="primary" accent={cal.green} icon="plus" label={t("新增行程")} onPress={() => openEventForm({ date: calendar.date })} />
    </View>
  );

  const navigation = (
    <View style={{ flexDirection: isPhone ? "column" : "row", alignItems: isPhone ? "stretch" : "center", gap: 12, paddingBottom: 12 }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7, minWidth: 0 }}>
        <Button square variant="secondary" icon="chevron-left" accessibilityLabel={t(PREVIOUS_LABELS[view])} onPress={() => shiftPeriod(-1)} />
        <Button square variant="secondary" icon="chevron-right" accessibilityLabel={t(NEXT_LABELS[view])} onPress={() => shiftPeriod(1)} />
        <Button variant="ghost" iconRight="chevron-down" accessibilityLabel={t("跳轉日期")} onPress={openJump} style={{ flexShrink: 1, minWidth: 0, paddingHorizontal: 8, marginLeft: 4 }}>
          <Txt variant={isPhone ? "h3" : "h1"} numberOfLines={1} style={{ flexShrink: 1 }}>
            {title}
          </Txt>
        </Button>
        <View style={{ flex: 1 }} />
        <Button variant="secondary" label={t("今天")} onPress={goToday} />
      </View>
      <Segmented options={viewOptions} value={view} onChange={setView} accent={cal.green} accessibilityLabel={t("日曆檢視")} style={isPhone ? { alignSelf: "stretch" } : undefined} />
    </View>
  );

  return (
    <Page scroll={false} gap={0}>
      <View accessibilityLabel={t("行事曆")} style={{ flex: 1, minHeight: 0 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, paddingBottom: isPhone ? 12 : 10, marginBottom: isPhone ? 12 : 12, borderBottomWidth: 1, borderBottomColor: cal.line }}>
          {isPhone ? <View /> : <Txt variant="page">{t("家庭行事曆")}</Txt>}
          {actions}
        </View>
        <View style={{ flex: 1, minHeight: 0, flexDirection: "row", gap: 24 }}>
          {isWide ? (
            <View style={{ width: isTablet ? 220 : 248, borderRightWidth: 1, borderRightColor: cal.line, paddingRight: 20, minHeight: 0 }}>
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
                <MemberBar view={view} date={date} />
                {view === "week" ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: cal.line, paddingTop: 12 }}>
                    <MiniMonth date={date} month={date.getMonth()} events={visible} compact dayHeight={28} />
                    <Upcoming date={date} events={visible} />
                  </View>
                ) : (
                  <View style={{ borderTopWidth: 1, borderTopColor: cal.line }}>
                    <Upcoming date={date} events={visible} />
                  </View>
                )}
                <Weather />
              </ScrollView>
            </View>
          ) : null}
          <View style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            {navigation}
            {isWide ? null : (
              <View style={{ paddingBottom: 12 }}>
                <MemberBar view={view} date={date} horizontal />
              </View>
            )}
            <View onLayout={(e) => setContent({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })} style={{ flex: 1, minHeight: 0, backgroundColor: "#fff", borderWidth: 1, borderColor: cal.line, borderRadius: radius.md, overflow: "hidden" }}>
              <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                {body}
                {isWide ? null : (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, borderTopWidth: 1, borderTopColor: cal.line }}>
                    <Upcoming date={date} events={visible} />
                    {isPhone ? null : <Weather />}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </Page>
  );
}
