/* State transitions of the calendar module (the prototype's click / submit handlers that touch state).
 * Everything mutates the shared device store immutably; dialogs live in dialogs.tsx. */
import { t } from "@/i18n";
import { addDays, addMonths, dateKey, fromKey, today, todayKey, uid } from "@/lib/date";
import { memberById, useDeviceStore, type DeviceData } from "@/store/device";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { DATE_MAX, DATE_MIN, TIME_RE, inRange, type CalEvent, type CalView } from "./helpers";
import { useCalendarUi } from "./store";

type CalendarState = DeviceData["calendar"];

export const calendarState = () => useDeviceStore.getState().calendar;
export const currentDate = () => fromKey(calendarState().date) || today;

export function patchCalendar(patch: Partial<CalendarState>) {
  useDeviceStore.setState((s) => ({ calendar: { ...s.calendar, ...patch } }));
}

export const setView = (view: CalView) => patchCalendar({ view });
export const setMember = (member: string) => patchCalendar({ member });
export const goToday = () => patchCalendar({ date: todayKey });

function goTo(next: Date) {
  if (!inRange(next)) {
    toast(t("日期範圍為 1900 至 2100 年"));
    return;
  }
  patchCalendar({ date: dateKey(next) });
}

/** cal-prev / cal-next: move one period in the current view. */
export function shiftPeriod(direction: -1 | 1) {
  const { view } = calendarState();
  const date = currentDate();
  goTo(view === "year" ? addMonths(date, direction * 12) : view === "month" ? addMonths(date, direction) : addDays(date, direction * (view === "week" ? 7 : 1)));
}

/** cal-mini-prev / cal-mini-next: the week sidebar's mini month arrows. */
export const shiftMonth = (direction: -1 | 1) => goTo(addMonths(currentDate(), direction));

/** cal-date: open a day. cal-month: open a month (from the year view). */
export const openDate = (key: string) => patchCalendar({ date: key, view: "day" });
export const openMonth = (key: string) => patchCalendar({ date: key, view: "month" });

/** cal-jump-form submit */
export function jumpTo(key: string): string | null {
  if (!fromKey(key) || key < DATE_MIN || key > DATE_MAX) return t("請選擇有效日期。");
  patchCalendar({ date: key });
  dialog.close();
  return null;
}

export function toggleDone(id: string) {
  useDeviceStore.setState((s) => ({ events: s.events.map((event) => (event.id === id ? { ...event, done: !event.done } : event)) }));
}

export function deleteEvent(id: string) {
  useDeviceStore.setState((s) => ({ events: s.events.filter((event) => event.id !== id) }));
  dialog.close();
  toast(t("已刪除行程"));
}

export type SaveInput = {
  id: string;
  title: string;
  date: string;
  allDay: boolean;
  time: string;
  endTime: string;
  memberId: string;
  location: string;
  note: string;
  source: "manual" | "voice";
};

/** cal-event-form submit. Returns an error message to show, or null once saved (dialog closed, toast shown). */
export function saveEvent(input: SaveInput): string | null {
  const s = useDeviceStore.getState();
  const title = input.title.trim();
  const date = input.date.trim();
  const time = input.allDay ? "" : input.time.trim();
  const endTime = input.allDay ? "" : input.endTime.trim();
  const memberId = input.memberId;
  if (!title) return t("請填寫行程名稱。");
  if (title.length > 60) return t("行程名稱最多 60 個字，請精簡後儲存。");
  if (!fromKey(date) || date < DATE_MIN || date > DATE_MAX) return t("請選擇有效日期。");
  if (memberId !== "family" && !s.members.some((item) => item.id === memberId)) return t("請選擇有效的家庭成員。");
  if (!input.allDay && !TIME_RE.test(time)) return t("請選擇開始時間。");
  if (endTime && (!TIME_RE.test(endTime) || endTime <= time)) return t("結束時間需要晚於開始時間。");
  const previous = s.events.find((item) => item.id === input.id) as CalEvent | undefined;
  if (input.id && !previous) return t("此行程已不存在，請關閉後重新添加。");
  const event: CalEvent = {
    ...previous,
    id: input.id || uid("event"),
    title,
    date,
    time,
    endTime,
    memberId,
    location: input.location.trim(),
    note: input.note.trim(),
    source: input.source,
    done: previous?.done || false,
  };
  const events: CalEvent[] = previous ? s.events.map((item) => (item.id === event.id ? event : item)) : [...s.events, event];
  const calendar: CalendarState = { ...s.calendar, date, view: "day" };
  if (calendar.member !== "all" && calendar.member !== memberId && memberId !== "family") calendar.member = memberId;
  useDeviceStore.setState({ events, calendar });
  useCalendarUi.getState().setDayMode("agenda");
  dialog.close();
  toast(previous ? t("已更新行程") : t("已加入{name}的行程", { name: memberById(memberId, s.members).name }));
  return null;
}
