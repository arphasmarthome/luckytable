/* Lucky Table localisation runtime (port of prototype/device/i18n.js).
 * Traditional Chinese source strings are the message ids; en / de / es dictionaries translate them.
 * Anything without a translation falls back to the source string (the part before a "|" hint). */
import { useMemo } from "react";
import { create } from "zustand";
import { getItem, getItemSync, setItem } from "@/lib/storage";
import de from "./dictionaries/de";
import en from "./dictionaries/en";
import es from "./dictionaries/es";
import type { Dictionary, LocaleCode } from "./types";

export type { Dictionary, LocaleCode } from "./types";

export const LOCALES: { code: LocaleCode; label: string; tag: string }[] = [
  { code: "zh-Hant", label: "繁體中文", tag: "zh-TW" },
  { code: "en", label: "English", tag: "en-US" },
  { code: "de", label: "Deutsch", tag: "de-DE" },
  { code: "es", label: "Español", tag: "es-ES" },
];

type Names = { weekdayLong: string[]; weekdayShort: string[]; monthLong: string[]; monthShort: string[]; listSeparator: string };
const NAMES: Record<LocaleCode, Names> = {
  "zh-Hant": {
    weekdayLong: ["週日", "週一", "週二", "週三", "週四", "週五", "週六"],
    weekdayShort: ["日", "一", "二", "三", "四", "五", "六"],
    monthLong: ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"],
    monthShort: ["1 月", "2 月", "3 月", "4 月", "5 月", "6 月", "7 月", "8 月", "9 月", "10 月", "11 月", "12 月"],
    listSeparator: "、",
  },
  en: {
    weekdayLong: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    weekdayShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    monthLong: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    listSeparator: ", ",
  },
  de: {
    weekdayLong: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
    weekdayShort: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
    monthLong: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
    monthShort: ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sept.", "Okt.", "Nov.", "Dez."],
    listSeparator: ", ",
  },
  es: {
    weekdayLong: ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"],
    weekdayShort: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"],
    monthLong: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    monthShort: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"],
    listSeparator: ", ",
  },
};

const dictionaries: Partial<Record<LocaleCode, Dictionary>> = { en, de, es };
const STORAGE_KEY = "lucky-table.locale";
const byCode = (code: string) => LOCALES.find((item) => item.code === code);

export function normalizeLocale(code: unknown): LocaleCode | "" {
  if (!code) return "";
  const value = String(code).trim();
  if (byCode(value)) return value as LocaleCode;
  const lower = value.toLowerCase();
  if (lower.startsWith("zh")) return "zh-Hant";
  const base = lower.split(/[-_]/)[0];
  return byCode(base) ? (base as LocaleCode) : "";
}

function urlLocale(): LocaleCode | "" {
  try {
    if (typeof window === "undefined" || !window.location) return "";
    return normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
  } catch {
    return "";
  }
}
const fromUrl = urlLocale();

type I18nStore = { locale: LocaleCode; setLocale: (code: string) => boolean };
export const useI18nStore = create<I18nStore>((set, get) => ({
  locale: fromUrl || normalizeLocale(getItemSync(STORAGE_KEY)) || "zh-Hant",
  setLocale(code) {
    const next = normalizeLocale(code);
    if (!next || next === get().locale) return false;
    set({ locale: next });
    void setItem(STORAGE_KEY, next);
    return true;
  },
}));
if (!fromUrl) {
  void getItem(STORAGE_KEY).then((stored) => {
    const next = normalizeLocale(stored);
    if (next && next !== useI18nStore.getState().locale) useI18nStore.setState({ locale: next });
  });
}

export type TParams = Record<string, string | number | null | undefined>;
const current = () => useI18nStore.getState().locale;
const isZhNow = () => current() === "zh-Hant";
const names = () => NAMES[current()] || NAMES["zh-Hant"];
const tag = () => byCode(current())?.tag || "zh-TW";
const pad = (value: number) => String(value).padStart(2, "0");

/** Translate a Traditional Chinese source string. Arrays pick singular / plural from params.n (or count). */
export function t(key: string | null | undefined, params?: TParams): string {
  const source = String(key ?? "");
  const dict = dictionaries[current()];
  let value: string | string[];
  if (dict && Object.prototype.hasOwnProperty.call(dict, source)) value = dict[source];
  else value = source.split("|")[0];
  if (Array.isArray(value)) {
    const count = params ? Number(params.n ?? params.count) : NaN;
    value = value[count === 1 ? 0 : 1] ?? value[0];
  }
  if (params) value = String(value).replace(/\{(\w+)\}/g, (match, name: string) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match));
  return value as string;
}

export const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions) => date.toLocaleDateString(tag(), options);
export const formatClock = (date: Date) => date.toLocaleTimeString(tag(), { hour: "numeric", minute: "2-digit" });
export function monthDay(date: Date) {
  const day = date.getDate();
  const short = names().monthShort[date.getMonth()];
  if (isZhNow()) return `${date.getMonth() + 1}月${day}日`;
  if (current() === "de") return `${day}. ${short}`;
  if (current() === "es") return `${day} ${short}`;
  return `${short} ${day}`;
}
export function monthYear(date: Date) {
  const year = date.getFullYear();
  const long = names().monthLong[date.getMonth()];
  if (isZhNow()) return `${year} 年 ${date.getMonth() + 1} 月`;
  if (current() === "es") return `${long} de ${year}`;
  return `${long} ${year}`;
}
export const monthName = (index: number, style?: "short" | "long") => (style === "short" ? names().monthShort : names().monthLong)[((index % 12) + 12) % 12];
export const yearLabel = (year: number) => (isZhNow() ? `${year} 年` : String(year));
export const weekday = (index: number, style?: "short" | "long") => (style === "short" ? names().weekdayShort : names().weekdayLong)[((index % 7) + 7) % 7];
export function dayTitle(date: Date) {
  if (isZhNow()) return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday(date.getDay())}`;
  return `${weekday(date.getDay(), "short")}, ${monthDay(date)}${current() === "de" ? " " : ", "}${date.getFullYear()}`;
}
export const formatNumber = (value: number | string | null | undefined) => Number(value || 0).toLocaleString(tag());
export const list = (items: string[]) => items.join(names().listSeparator);

/** Subscribes the component to locale changes and returns `t` plus the formatting helpers. */
export function useI18n() {
  const locale = useI18nStore((s) => s.locale);
  const setLocale = useI18nStore((s) => s.setLocale);
  return useMemo(
    () => ({
      locale,
      isZh: locale === "zh-Hant",
      label: byCode(locale)?.label || "",
      tag: byCode(locale)?.tag || "zh-TW",
      locales: LOCALES,
      setLocale,
      t,
      formatTime,
      formatDate,
      formatClock,
      monthDay,
      monthYear,
      monthName,
      yearLabel,
      weekday,
      dayTitle,
      number: formatNumber,
      list,
    }),
    [locale, setLocale],
  );
}
