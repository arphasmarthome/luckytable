"use client";

import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DAY_EN, DAY_ZH, MONTH_EN } from "@/lib/family";
import Link from "next/link";

export default function CalendarPage() {
  const { lang, week, view, setView, calWho, setCalWho, members, openNewEvent } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const memberOf = (k: string) => members.find((p) => p.key === k);
  const evOf = (d: typeof week[number]) =>
    d.items
      .filter(([, , , who]) => calWho === "all" || who === calWho || who === "all")
      .map(([time, title, titleZh, who, meal]) => {
        const p = memberOf(who);
        return {
          time, title: name(title, titleZh), meal,
          who: p ? name(p.name, p.zh) : str.everyone,
          tint: p ? p.tint : "var(--color-neutral-100)",
          ink: p ? p.ink : "var(--color-neutral-800)",
          dot: p ? p.dot : "var(--color-neutral-500)"
        };
      });

  const today0 = week[0];
  const tonightMeals = evOf(today0).filter((e) => e.meal);
  const now = new Date();

  const calTitle =
    view === "month"
      ? zh
        ? now.getFullYear() + "年" + (now.getMonth() + 1) + "月"
        : MONTH_EN[now.getMonth()] + " " + now.getFullYear()
      : zh
      ? now.getMonth() + 1 + "月" + now.getDate() + "日 · 家庭行程"
      : MONTH_EN[now.getMonth()] + " " + now.getDate() + " · Family itinerary";

  const filters: { key: string; name: string; dot: string }[] = [
    { key: "all", name: str.everyone, dot: "var(--color-neutral-500)" },
    ...members.map((p) => ({ key: p.key, name: name(p.name, p.zh), dot: p.dot }))
  ];

  // month grid
  const mDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const blank = { date: "", bg: "transparent", border: "transparent", fg: "transparent", items: [] as { title: string; bg: string; ink: string }[] };
  const monthCells: typeof blank[] = [];
  for (let i = 0; i < lead; i++) monthCells.push(blank);
  for (let dd = 1; dd <= mDays; dd++) {
    const wd = week.find((w) => Number(w.date) === dd && w.m === now.getMonth());
    const isToday = dd === now.getDate();
    monthCells.push({
      date: String(dd),
      bg: isToday ? "var(--color-accent-100)" : "var(--color-surface)",
      border: isToday ? "var(--color-accent)" : "var(--color-surface)",
      fg: isToday ? "var(--color-accent-700)" : "var(--color-text)",
      items: wd ? evOf(wd).slice(0, 2).map((e) => ({ title: e.title, bg: e.tint, ink: e.ink })) : []
    });
  }
  while (monthCells.length % 7 !== 0) monthCells.push(blank);
  const monthHead = [0, 1, 2, 3, 4, 5, 6].map((i) => (zh ? DAY_ZH[(i + 1) % 7] : DAY_EN[(i + 1) % 7]));

  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "clamp(14px,1.4vw,22px)", padding: "clamp(24px,2.4vw,42px) clamp(26px,2.6vw,48px)" }}>
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "clamp(16px,1.6vw,28px)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-700)" }}>{str.calKicker}</span>
          <h1 style={{ margin: 0, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(26px,2.4vw,42px)", lineHeight: 1.05 }}>{calTitle}</h1>
        </div>
        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "clamp(10px,0.9vw,14px)" }}>
          <div style={{ display: "flex", gap: 4, background: "var(--color-neutral-100)", borderRadius: "999px", padding: 4 }}>
            {(["week", "month"] as const).map((k) => {
              const active = view === k;
              return (
                <button key={k} type="button" onClick={() => setView(k)} style={{ border: "none", background: active ? "var(--color-surface)" : "transparent", color: active ? "var(--color-text)" : "var(--color-neutral-600)", boxShadow: active ? "var(--shadow-sm)" : "none", borderRadius: "999px", padding: "clamp(9px,0.8vw,13px) clamp(16px,1.5vw,26px)", fontFamily: "inherit", fontWeight: 700, fontSize: "clamp(13px,1.05vw,18px)", cursor: "pointer", minHeight: 44 }}>
                  {k === "week" ? str.viewWeek : str.viewMonth}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => openNewEvent()} style={{ border: "none", background: "var(--color-accent-2-800)", color: "var(--color-bg)", borderRadius: "999px", padding: "clamp(12px,1.05vw,17px) clamp(20px,1.8vw,30px)", fontFamily: "inherit", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}>
            + {str.newEvent}
          </button>
        </div>
      </header>

      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "clamp(6px,0.6vw,10px)", background: "var(--color-neutral-100)", borderRadius: "999px", padding: "clamp(6px,0.5vw,9px) clamp(10px,0.9vw,16px)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)", marginRight: 4 }}>{str.showing}</span>
        {filters.map((f) => {
          const active = calWho === f.key;
          return (
            <button key={f.key} type="button" onClick={() => setCalWho(f.key)} style={{ display: "flex", alignItems: "center", gap: 8, border: "none", background: active ? "var(--color-surface)" : "transparent", boxShadow: active ? "var(--shadow-sm)" : "none", color: active ? "var(--color-text)" : "var(--color-neutral-600)", borderRadius: "999px", padding: "clamp(9px,0.8vw,14px) clamp(14px,1.2vw,20px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1.05vw,18px)", cursor: "pointer", minHeight: 44 }}>
              <span style={{ width: 10, height: 10, borderRadius: "999px", background: f.dot, flex: "0 0 auto" }} />
              {f.name}
            </button>
          );
        })}
      </div>

      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "clamp(10px,1vw,16px)", background: "var(--color-accent-2-800)", color: "var(--color-bg)", borderRadius: "var(--radius-lg)", padding: "clamp(11px,1vw,16px) clamp(16px,1.5vw,26px)", flexWrap: "wrap" }}>
        <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, opacity: 0.8 }}>{str.tonightEat}</span>
        {tonightMeals.map((m, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.14)", borderRadius: "999px", padding: "8px clamp(12px,1.1vw,18px)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "999px", background: m.dot, flex: "0 0 auto" }} />
            <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(14px,1.15vw,20px)" }}>{m.title}</span>
            <span style={{ fontSize: "clamp(12px,0.95vw,16px)", opacity: 0.8 }}>{m.time} · {m.who}</span>
          </span>
        ))}
        {tonightMeals.length === 0 && <span style={{ fontSize: "clamp(13px,1.05vw,18px)", opacity: 0.85 }}>{str.nothingPlanned}</span>}
        <Link href="/food" style={{ marginLeft: "auto", border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(9px,0.8vw,13px) clamp(16px,1.5vw,24px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(13px,1.05vw,18px)", cursor: "pointer", minHeight: 44 }}>
          {str.openFood}
        </Link>
      </div>

      {view === "week" && (
        <div style={{ flex: "1 1 auto", minHeight: 0, overflowX: "auto", display: "grid", gridTemplateColumns: "repeat(7, minmax(150px, 1fr))", gap: "clamp(8px,0.8vw,14px)" }}>
          {week.map((d, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.7vw,12px)", background: d.today ? "var(--color-accent-100)" : "var(--color-surface)", border: `2px solid ${d.today ? "var(--color-accent)" : "var(--color-surface)"}`, borderRadius: "var(--radius-lg)", padding: "clamp(11px,1vw,17px)", minHeight: 0, overflow: "auto" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, flex: "0 0 auto" }}>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.25vw,21px)", color: d.today ? "var(--color-accent-700)" : "var(--color-text)" }}>{d.date}</span>
                <span style={{ fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)" }}>{zh ? d.zh : d.day}</span>
              </div>
              {evOf(d).map((it, ix) => (
                <div key={ix} style={{ background: it.tint, borderRadius: "var(--radius-md)", padding: "clamp(9px,0.8vw,13px)", display: "flex", flexDirection: "column", gap: 3, flex: "0 0 auto" }}>
                  <span style={{ fontSize: "clamp(12px,0.95vw,16px)", fontWeight: 600, lineHeight: 1.3, color: it.ink }}>{it.title}</span>
                  <span style={{ fontSize: "clamp(11px,0.85vw,14px)", color: "var(--color-neutral-700)" }}>{it.time} · {it.who}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === "month" && (
        <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "clamp(6px,0.6vw,10px)" }}>
          <div style={{ flex: "0 0 auto", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "clamp(5px,0.5vw,8px)" }}>
            {monthHead.map((h, i) => (
              <span key={i} style={{ textAlign: "center", fontSize: "clamp(11px,0.9vw,15px)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-neutral-600)", padding: "4px 0" }}>{h}</span>
            ))}
          </div>
          <div className="grow-on-mobile" style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gridAutoRows: "minmax(clamp(96px,15vh,170px), auto)", gap: "clamp(6px,0.6vw,10px)" }}>
            {monthCells.map((c, i) => (
              <div key={i} style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: "var(--radius-md)", padding: "clamp(8px,0.7vw,12px)", display: "flex", flexDirection: "column", gap: 5, minHeight: 0, overflow: "hidden" }}>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", color: c.fg }}>{c.date}</span>
                {c.items.map((it, ix) => (
                  <span key={ix} style={{ fontSize: "clamp(12px,1vw,16px)", fontWeight: 600, background: it.bg, color: it.ink, borderRadius: 8, padding: "4px 8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.title}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
