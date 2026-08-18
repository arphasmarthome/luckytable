"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DISHES, dishImg, SERVINGS_PER_DISH } from "@/lib/dishes";
import { VOTE_SEED, DAY_FULL, MONTH_EN, cookDaysLabel } from "@/lib/family";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M4.8 20a7.2 7.2 0 0 1 14.4 0" />
    </svg>
  );
}

export default function HomePage() {
  const { lang, week, members, votes, myVotes, calWho, joining, setJoining, famPrefs } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const memberOf = (k: string) => members.find((p) => p.key === k);
  const today0 = week[0];

  const evOf = (d: typeof week[number]) =>
    d.items
      .filter(([, , , who]) => calWho === "all" || who === calWho || who === "all")
      .map(([time, title, titleZh, who, meal, dishId]) => {
        const p = memberOf(who);
        return {
          time, title: name(title, titleZh), meal, dishId,
          who: p ? name(p.name, p.zh) : str.everyone,
          dot: p ? p.dot : "var(--color-neutral-500)"
        };
      });

  const tonight = evOf(today0).filter((e) => e.meal).sort((a, b) => (a.time < b.time ? -1 : 1));

  const weekDishes = week.reduce<{ day: string; title: string; who: string; dot: string; isToday: boolean }[]>(
    (acc, d) =>
      acc.concat(
        d.items
          .filter((it) => it[4])
          .map(([, title, titleZh, who]) => {
            const p = memberOf(who);
            return {
              day: (zh ? d.zh : d.day) + " " + d.date,
              title: name(title, titleZh),
              who: p ? name(p.name, p.zh) : str.everyone,
              dot: p ? p.dot : "var(--color-neutral-500)",
              isToday: !!d.today
            };
          })
      ),
    []
  );

  const voteIds = Object.keys(VOTE_SEED).concat(myVotes.filter((id) => !(id in VOTE_SEED)));
  const voteRows = voteIds
    .map((id) => {
      const d0 = DISHES.find((x) => x.id === id);
      return { id, label: d0 ? name(d0.name, d0.zh) : id, n: (votes[id] || 0) + (myVotes.indexOf(id) !== -1 ? 1 : 0) };
    })
    .filter((v) => v.n > 0)
    .sort((a, b) => b.n - a.n);
  const voteTop = Math.max(...voteRows.map((v) => v.n), 1);

  /* Tonight's capacity vs. who's actually coming — dishes only need to cover
     the people who said "joining", so both halves come from live state. */
  const joiningCount = members.filter((p) => joining.indexOf(p.key) !== -1).length;
  const seats = tonight.length * SERVINGS_PER_DISH;
  const portionNote =
    joiningCount === 0
      ? str.noOneJoining
      : tonight.length === 0
      ? str.needMoreDishes
      : seats >= joiningCount
      ? str.enoughFor + " " + joiningCount
      : str.needMoreDishes;
  const portionOk = joiningCount > 0 && tonight.length > 0 && seats >= joiningCount;

  const now = new Date();
  const dashDate = zh
    ? now.getMonth() + 1 + "月" + now.getDate() + "日 星期" + "日一二三四五六"[now.getDay()]
    : DAY_FULL[now.getDay()] + " " + now.getDate() + " " + MONTH_EN[now.getMonth()];

  return (
    <div
      style={{
        flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column",
        gap: "clamp(18px,1.8vw,30px)", padding: "clamp(26px,2.6vw,46px) clamp(28px,2.8vw,52px)"
      }}
    >
      <header style={{ flex: "0 0 auto", display: "flex", alignItems: "baseline", gap: "clamp(14px,1.4vw,24px)" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(30px,2.8vw,48px)", lineHeight: 1 }}>{str.dashTitle}</h1>
        <span style={{ marginLeft: "auto", fontSize: "clamp(16px,1.35vw,23px)", color: "var(--color-neutral-600)" }}>{dashDate}</span>
      </header>

      <div className="stack-grid" style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", gridTemplateColumns: "1.15fr 1fr 1fr", gap: "clamp(16px,1.6vw,28px)" }}>
        <section className="grow-on-mobile" style={{ display: "flex", flexDirection: "column", gap: "clamp(10px,1vw,16px)", background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,1.7vw,30px)", overflow: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 12px" }}>
            <div style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.tonight}</div>
            <span
              style={{
                marginLeft: "auto", flex: "0 0 auto", borderRadius: "999px", padding: "5px 12px",
                fontSize: "clamp(11px,0.85vw,14px)", fontWeight: 700, whiteSpace: "nowrap",
                background: portionOk ? "var(--color-accent-2-100)" : "var(--color-neutral-200)",
                color: portionOk ? "var(--color-accent-2-800)" : "var(--color-neutral-700)"
              }}
            >
              {portionNote}
            </span>
          </div>

          {tonight.length === 0 && (
            <div style={{ fontSize: "clamp(14px,1.1vw,19px)", color: "var(--color-neutral-700)" }}>{str.nothingPlanned}</div>
          )}

          {tonight.map((m, i) => (
            <Link
              key={i}
              href={m.dishId ? `/food/dish/${m.dishId}` : "/food"}
              style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.7vw,12px)", background: "var(--color-surface)", borderRadius: "var(--radius-md)", padding: "clamp(10px,0.9vw,14px)", flex: "0 0 auto", color: "inherit" }}
            >
              <div
                className="ph"
                style={{
                  borderRadius: "var(--radius-md)", overflow: "hidden", height: "clamp(80px,7.5vw,130px)",
                  backgroundImage: m.dishId ? `url("${dishImg(m.dishId)}")` : "none",
                  backgroundSize: "cover", backgroundPosition: "center", flex: "0 0 auto",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                {!m.dishId && (
                  <span className="mono" style={{ fontSize: "clamp(11px,0.85vw,14px)", color: "var(--color-neutral-700)", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--color-neutral-100)", padding: "8px 14px", borderRadius: "999px" }}>
                    {str.dishPhoto}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "clamp(9px,0.85vw,14px)" }}>
                <span style={{ flex: "0 0 auto", width: 8, height: 8, borderRadius: "999px", background: m.dot }} />
                <span style={{ flex: "1 1 auto", minWidth: 0, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(16px,1.3vw,22px)", lineHeight: 1.2 }}>{m.title}</span>
              </div>
              <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-700)" }}>{m.time} · {m.who}</span>
            </Link>
          ))}

          <Link
            href="/food"
            style={{
              marginTop: "auto", alignSelf: "flex-start", border: "none", background: "var(--color-accent)",
              color: "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(11px,1vw,17px) clamp(20px,1.8vw,32px)",
              fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,21px)", cursor: "pointer", flex: "0 0 auto"
            }}
          >
            {str.openFood}
          </Link>
        </section>

        <section className="grow-on-mobile" style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.8vw,13px)", background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,1.7vw,30px)", overflow: "auto" }}>
          <div style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.weekDishes}</div>
          {weekDishes.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "clamp(9px,0.85vw,14px)", background: d.isToday ? "var(--color-accent-100)" : "transparent", borderRadius: "var(--radius-md)", padding: "clamp(7px,0.65vw,11px) clamp(9px,0.8vw,13px)", flex: "0 0 auto" }}>
              <span style={{ flex: "0 0 auto", width: 8, height: 8, borderRadius: "999px", background: d.dot }} />
              <span style={{ flex: "0 0 auto", width: "clamp(44px,3.6vw,58px)", fontWeight: 700, fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-700)" }}>{d.day}</span>
              <span style={{ flex: "1 1 auto", minWidth: 0, fontSize: "clamp(13px,1.05vw,18px)", fontWeight: 600, lineHeight: 1.3 }}>{d.title}</span>
              <span style={{ flex: "0 0 auto", fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)" }}>{d.who}</span>
            </div>
          ))}
        </section>

        <div className="grow-on-mobile" style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,1.4vw,22px)", overflow: "auto" }}>
          <section className="fam-card" style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "clamp(10px,1vw,16px)", background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,1.7vw,30px)" }}>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px 12px" }}>
              <div style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.navFam}</div>
              <span style={{ marginLeft: "auto", fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700, whiteSpace: "nowrap" }}>{str.tonightLabel}</span>
            </div>
            {members.map((p) => {
              const isIn = joining.indexOf(p.key) !== -1;
              return (
                <div key={p.key} style={{ display: "flex", alignItems: "center", gap: "clamp(8px,0.9vw,14px)" }}>
                  <span className="fam-avatar" style={{ flex: "0 0 auto", width: "clamp(40px,3.2vw,50px)", height: "clamp(40px,3.2vw,50px)", borderRadius: "999px", background: p.tint, color: p.ink, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <PersonIcon />
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0, flex: "1 1 auto" }}>
                    <span style={{ fontSize: "clamp(15px,1.15vw,20px)", fontWeight: 600 }}>{name(p.name, p.zh)}</span>
                    <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{cookDaysLabel(famPrefs[p.key]?.cook, zh) ?? name(p.role, p.roleZh)}</span>
                  </span>
                  <span style={{ flex: "0 0 auto", display: "flex", gap: 4, background: "var(--color-neutral-200)", borderRadius: "999px", padding: 3 }}>
                    <button
                      type="button"
                      onClick={() => setJoining(p.key, true)}
                      aria-pressed={isIn}
                      style={{ border: "none", cursor: "pointer", borderRadius: "999px", padding: "7px clamp(10px,0.9vw,14px)", fontFamily: "inherit", fontWeight: 700, fontSize: "clamp(11px,0.85vw,14px)", whiteSpace: "nowrap", background: isIn ? "var(--color-accent-2)" : "transparent", color: isIn ? "var(--color-accent-2-100)" : "var(--color-neutral-700)" }}
                    >
                      {str.joining}
                    </button>
                    <button
                      type="button"
                      onClick={() => setJoining(p.key, false)}
                      aria-pressed={!isIn}
                      style={{ border: "none", cursor: "pointer", borderRadius: "999px", padding: "7px clamp(10px,0.9vw,14px)", fontFamily: "inherit", fontWeight: 700, fontSize: "clamp(11px,0.85vw,14px)", whiteSpace: "nowrap", background: !isIn ? "var(--color-neutral-100)" : "transparent", color: !isIn ? "var(--color-text)" : "var(--color-neutral-700)" }}
                    >
                      {str.notJoining}
                    </button>
                  </span>
                </div>
              );
            })}
          </section>
          <section style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: "clamp(9px,0.9vw,15px)", background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,1.7vw,30px)" }}>
            <div style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.votesTitle}</div>
            {voteRows.map((v) => (
              <div key={v.id} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: "clamp(14px,1.1vw,19px)", fontWeight: 600 }}>{v.label}</span>
                  <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{v.n}{zh ? " 票" : v.n === 1 ? " vote" : " votes"}</span>
                </div>
                <div style={{ height: "clamp(8px,0.7vw,11px)", borderRadius: "999px", background: "var(--color-neutral-300)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: Math.round((v.n / voteTop) * 100) + "%", background: v.n === voteTop ? "var(--color-accent)" : "var(--color-accent-2-400)", borderRadius: "999px" }} />
                </div>
              </div>
            ))}
            <span style={{ fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)" }}>{str.voteHint}</span>
          </section>
        </div>
      </div>
    </div>
  );
}
