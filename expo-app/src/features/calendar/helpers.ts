/* Pure helpers for the calendar module (port of the top of prototype/device/calendar.js). */
import { addDays, dateKey, weekStart } from "@/lib/date";
import type { CalendarEvent, Member } from "@/store/device";

export type CalView = "year" | "month" | "week" | "day";
export type DayMode = "agenda" | "timeline";
/** The prototype stored a free-text note on events; the shared CalendarEvent type has no field for it yet. */
export type CalEvent = CalendarEvent & { note?: string };
/** Values pre-filling the event form (a stored event, a date/time from the grid, or a parsed voice draft). */
export type EventDraft = Partial<CalEvent> & { needsTime?: boolean };

export const VIEWS: { value: CalView; label: string }[] = [
  { value: "year", label: "年" },
  { value: "month", label: "月" },
  { value: "week", label: "週" },
  { value: "day", label: "日" },
];
export const PREVIOUS_LABELS: Record<CalView, string> = { year: "上一年", month: "上一月", week: "上一週", day: "上一日" };
export const NEXT_LABELS: Record<CalView, string> = { year: "下一年", month: "下一月", week: "下一週", day: "下一日" };

export const DATE_MIN = "1900-01-01";
export const DATE_MAX = "2100-12-31";
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/* calendar.css palette */
export const cal = {
  line: "#dee6e1",
  cellLine: "#e9eded",
  orange: "#d99651",
  green: "#276e58",
  family: "#2c7864",
  ink: "#263b32",
  muted: "#768279",
  soft: "#f7f9f6",
  outside: "#f8fafb",
  todayCell: "#fffaf3",
  activePerson: "#e4efe8",
  activePersonBorder: "#c7dccd",
  badgeBg: "#eef3ee",
  badgeFg: "#597766",
  error: "#b6463e",
  weather: "#ad8d54",
};

export const isView = (value: unknown): value is CalView => VIEWS.some((view) => view.value === value);
export const inRange = (date: Date) => date.getFullYear() >= 1900 && date.getFullYear() <= 2100;
export const inKeyRange = (key: string) => key >= DATE_MIN && key <= DATE_MAX;

const byDateTime = (a: CalendarEvent, b: CalendarEvent) => a.date.localeCompare(b.date) || (a.time || "").localeCompare(b.time || "");

/** Events visible under the member filter ("family" events show for everyone), optionally limited to one day. */
export function filterEvents(events: CalendarEvent[], member: string, key?: string): CalEvent[] {
  return events.filter((event) => (!key || event.date === key) && (member === "all" || event.memberId === member || event.memberId === "family")).sort(byDateTime);
}

/** First / last day (keys) of the period the current view shows around `date`. */
export function periodRange(view: CalView, date: Date): { start: string; end: string } {
  if (view === "week") return { start: dateKey(weekStart(date)), end: dateKey(addDays(weekStart(date), 6)) };
  if (view === "year") return { start: `${date.getFullYear()}-01-01`, end: `${date.getFullYear()}-12-31` };
  if (view === "month") return { start: dateKey(new Date(date.getFullYear(), date.getMonth(), 1)), end: dateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)) };
  const key = dateKey(date);
  return { start: key, end: key };
}

/** Events inside the current period; pass member "all" for the unfiltered count the member bar shows. */
export function periodEvents(events: CalendarEvent[], view: CalView, date: Date, member: string): CalEvent[] {
  const { start, end } = periodRange(view, date);
  return filterEvents(events, member).filter((event) => event.date >= start && event.date <= end);
}

/** Number of week rows the month grid needs. */
export function monthRows(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1, 12);
  return Math.ceil((first.getDay() + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) / 7);
}

export const memberInitial = (person: Pick<Member, "name" | "initial" | "initials">) => person.initial || person.initials || person.name.slice(0, 1);

/** "05-14" → "05 / 14" (the upcoming list's short date) */
export const shortDate = (key: string) => key.slice(5).replace("-", " / ");

export const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;
