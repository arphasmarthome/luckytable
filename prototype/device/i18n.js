/* Lucky Table prototype localisation runtime.
 * The Traditional Chinese source strings are the message ids; other locales register dictionaries
 * with i18n.<locale>.js. Anything without a translation falls back to the source string. */
(() => {
  "use strict";

  const STORAGE_KEY = "lucky-table.locale";
  const LOCALES = [
    { code: "zh-Hant", label: "繁體中文", tag: "zh-TW" },
    { code: "en", label: "English", tag: "en-US" },
    { code: "de", label: "Deutsch", tag: "de-DE" },
    { code: "es", label: "Español", tag: "es-ES" },
  ];
  const NAMES = {
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

  const dictionaries = {};
  const listeners = new Set();
  const missing = new Set();
  const byCode = (code) => LOCALES.find((item) => item.code === code);

  function readStored() {
    try { return window.localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
  }
  function writeStored(code) {
    try { window.localStorage.setItem(STORAGE_KEY, code); } catch { /* storage unavailable in this context */ }
  }
  function normalize(code) {
    if (!code) return "";
    const value = String(code).trim();
    if (byCode(value)) return value;
    const lower = value.toLowerCase();
    if (lower.startsWith("zh")) return "zh-Hant";
    const base = lower.split(/[-_]/)[0];
    return byCode(base) ? base : "";
  }

  let locale = normalize(new URLSearchParams(window.location.search).get("lang")) || normalize(readStored()) || "zh-Hant";
  const isZh = () => locale === "zh-Hant";
  const names = () => NAMES[locale] || NAMES["zh-Hant"];

  function t(key, params) {
    const source = String(key ?? "");
    const dict = dictionaries[locale];
    let value;
    if (dict && Object.prototype.hasOwnProperty.call(dict, source)) value = dict[source];
    else {
      if (!isZh() && source) missing.add(source);
      value = source.split("|")[0];
    }
    if (Array.isArray(value)) {
      const count = params ? Number(params.n ?? params.count) : NaN;
      value = value[count === 1 ? 0 : 1] ?? value[0];
    }
    if (params) value = String(value).replace(/\{(\w+)\}/g, (match, name) => (Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match));
    return value;
  }

  function apply(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = t(element.dataset.i18n); });
    scope.querySelectorAll("[data-i18n-title]").forEach((element) => { element.title = t(element.dataset.i18nTitle); });
    scope.querySelectorAll("[data-i18n-aria]").forEach((element) => { element.setAttribute("aria-label", t(element.dataset.i18nAria)); });
    scope.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = t(element.dataset.i18nPlaceholder); });
    scope.querySelectorAll("[data-i18n-value]").forEach((element) => { element.value = t(element.dataset.i18nValue); });
    document.documentElement.lang = locale;
  }

  function setLocale(code) {
    const next = normalize(code);
    if (!next || next === locale) return false;
    locale = next;
    writeStored(locale);
    apply(document);
    listeners.forEach((listener) => { try { listener(locale); } catch (error) { console.error(error); } });
    return true;
  }

  const tag = () => byCode(locale).tag;
  const pad = (value) => String(value).padStart(2, "0");
  function formatTime(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  function formatDate(date, options) {
    return date.toLocaleDateString(tag(), options);
  }
  function monthDay(date) {
    const day = date.getDate();
    const short = names().monthShort[date.getMonth()];
    if (isZh()) return `${date.getMonth() + 1}月${day}日`;
    if (locale === "de") return `${day}. ${short}`;
    if (locale === "es") return `${day} ${short}`;
    return `${short} ${day}`;
  }
  function monthYear(date) {
    const year = date.getFullYear();
    const long = names().monthLong[date.getMonth()];
    if (isZh()) return `${year} 年 ${date.getMonth() + 1} 月`;
    if (locale === "es") return `${long} de ${year}`;
    return `${long} ${year}`;
  }
  function monthName(index, style) {
    return (style === "short" ? names().monthShort : names().monthLong)[((index % 12) + 12) % 12];
  }
  function yearLabel(year) {
    return isZh() ? `${year} 年` : String(year);
  }
  function weekday(index, style) {
    return (style === "short" ? names().weekdayShort : names().weekdayLong)[((index % 7) + 7) % 7];
  }
  function dayTitle(date) {
    if (isZh()) return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekday(date.getDay())}`;
    return `${weekday(date.getDay(), "short")}, ${monthDay(date)}${locale === "de" ? " " : ", "}${date.getFullYear()}`;
  }
  function number(value) {
    return Number(value || 0).toLocaleString(tag());
  }
  function list(items) {
    return items.join(names().listSeparator);
  }

  window.LuckyI18n = {
    locales: LOCALES.map((item) => ({ ...item })),
    get locale() { return locale; },
    get label() { return byCode(locale).label; },
    get tag() { return tag(); },
    get isZh() { return isZh(); },
    missing,
    register(code, dictionary) { dictionaries[code] = Object.assign(dictionaries[code] || {}, dictionary); },
    has(code) { return Boolean(byCode(normalize(code))); },
    normalize,
    setLocale,
    onChange(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    t,
    apply,
    formatTime,
    formatDate,
    monthDay,
    monthYear,
    monthName,
    yearLabel,
    weekday,
    dayTitle,
    number,
    list,
  };

  document.documentElement.lang = locale;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => apply(document));
  else apply(document);
})();
