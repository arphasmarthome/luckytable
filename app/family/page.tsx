"use client";

import { useState } from "react";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DAY_ZH, DAY_FULL, DAY_LETTER, SUGGEST } from "@/lib/family";

export default function FamilyPage() {
  const {
    lang, members, famWho, setFamWho, famPrefs, newMember, setNewMember, addMember, removeMember,
    toggleCookDay, addPref, removePref
  } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const [prefField, setPrefField] = useState<"likes" | "dislikes" | "allergies">("likes");
  const [prefInput, setPrefInput] = useState("");

  const cookCount = (i: number) => members.filter((p) => famPrefs[p.key]?.cook[i]).length;
  const dayFull = (i: number) => (zh ? "星期" + DAY_ZH[(i + 1) % 7] : DAY_FULL[(i + 1) % 7]);
  const togetherDays = [0, 1, 2, 3, 4, 5, 6].filter((i) => cookCount(i) > 1);
  const togetherItems = togetherDays.map((i) => ({
    line: dayFull(i) + " — " + members.filter((q) => famPrefs[q.key]?.cook[i]).map((q) => name(q.name, q.zh)).join(zh ? "、" : " & ")
  }));

  const sel = members.find((p) => p.key === famWho) || members[0];
  const fp = famPrefs[sel.key] || { likes: [], dislikes: [], allergies: [], cook: [0, 0, 0, 0, 0, 0, 0] };

  const tally = (field: "likes" | "dislikes" | "allergies") => {
    const seen: Record<string, { en: string; zh: string; who: string[] }> = {};
    members.forEach((p) => {
      (famPrefs[p.key]?.[field] || []).forEach(([en, zhv]) => {
        seen[en] = seen[en] || { en, zh: zhv, who: [] };
        seen[en].who.push(name(p.name, p.zh));
      });
    });
    return Object.keys(seen).map((k) => seen[k]);
  };
  const shared = (field: "likes" | "dislikes" | "allergies") =>
    tally(field)
      .filter((x) => x.who.length > 1)
      .sort((a, b) => b.who.length - a.who.length)
      .map((x) => ({ label: name(x.en, x.zh), who: x.who.join(zh ? "、" : ", "), count: x.who.length + "/" + members.length }));
  const houseAllergies = tally("allergies").map((x) => ({ label: name(x.en, x.zh), who: x.who.join(zh ? "、" : ", ") }));

  const prefFields: ("likes" | "dislikes" | "allergies")[] = ["likes", "dislikes", "allergies"];
  const prefSuggestions = SUGGEST[prefField].filter(([a]) => !fp[prefField].some((x) => x[0] === a));

  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "clamp(14px,1.4vw,24px)", padding: "clamp(24px,2.4vw,42px) clamp(26px,2.6vw,48px)", overflow: "auto" }}>
      <header style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-700)" }}>{str.famKicker}</span>
        <h1 style={{ margin: 0, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(26px,2.4vw,42px)", lineHeight: 1.05 }}>{str.famTitle}</h1>
      </header>

      <div className="stack-grid" style={{ gridTemplateColumns: "1fr clamp(220px,20vw,300px)", gap: "clamp(14px,1.4vw,24px)", alignItems: "start" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(210px,18vw,280px), 1fr))", gap: "clamp(12px,1.2vw,20px)" }}>
          {members.map((p) => {
            const active = famWho === p.key;
            const cook = famPrefs[p.key]?.cook || [0, 0, 0, 0, 0, 0, 0];
            return (
              <div key={p.key} style={{ background: active ? "var(--color-accent-100)" : "var(--color-surface)", border: `2px solid ${active ? "var(--color-accent)" : "transparent"}`, borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)", display: "flex", flexDirection: "column", gap: "clamp(10px,1vw,16px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button type="button" onClick={() => setFamWho(p.key)} style={{ flex: "1 1 auto", minWidth: 0, display: "flex", alignItems: "center", gap: "clamp(10px,0.9vw,14px)", border: "none", background: "transparent", padding: 0, fontFamily: "inherit", color: "inherit", cursor: "pointer", textAlign: "left", minHeight: 44 }}>
                    <span style={{ flex: "0 0 auto", width: "clamp(44px,3.4vw,56px)", height: "clamp(44px,3.4vw,56px)", borderRadius: "999px", background: p.tint, color: p.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(18px,1.4vw,24px)" }}>{p.initial}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(17px,1.4vw,24px)", lineHeight: 1.15 }}>{name(p.name, p.zh)}</span>
                  </button>
                  <button type="button" onClick={() => removeMember(p.key)} aria-label="Remove member" style={{ flex: "0 0 auto", width: 34, height: 34, borderRadius: "999px", border: "none", background: "transparent", color: "var(--color-neutral-500)", fontSize: "1.1em", lineHeight: 1, cursor: "pointer" }}>×</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-neutral-600)", fontWeight: 700 }}>{str.famWeek}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {cook.map((on, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleCookDay(p.key, i)}
                        aria-label={dayFull(i)}
                        style={{
                          flex: "1 1 0", minWidth: 0, height: 44, borderRadius: "999px",
                          background: on ? p.fill || p.dot : "transparent",
                          border: `2px solid ${on ? (cookCount(i) > 1 ? "var(--color-accent)" : p.fill || p.dot) : "var(--color-neutral-300)"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "inherit", fontSize: "clamp(11px,0.85vw,14px)", fontWeight: 700,
                          color: on ? "var(--page)" : "var(--color-neutral-700)", cursor: "pointer", padding: 0
                        }}
                      >
                        {zh ? DAY_ZH[(i + 1) % 7] : DAY_LETTER[i]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px,1.2vw,20px)" }}>
          <div style={{ border: "2px dashed var(--color-neutral-400)", borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)", display: "flex", flexDirection: "column", gap: 10, justifyContent: "center" }}>
            <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-neutral-600)", fontWeight: 700 }}>{str.addMember}</span>
            <input
              value={newMember}
              onChange={(e) => setNewMember(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addMember(newMember); }}
              placeholder={str.memberPh}
              style={{ border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "8px clamp(14px,1.2vw,20px)", fontFamily: "inherit", fontSize: "clamp(14px,1.05vw,18px)", background: "var(--color-neutral-100)", color: "var(--color-text)", minHeight: 44, minWidth: 0 }}
            />
            <button type="button" onClick={() => addMember(newMember)} style={{ border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "8px clamp(16px,1.4vw,24px)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}>
              {str.addWord}
            </button>
          </div>

          {togetherItems.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "var(--color-accent-2-100)", border: "2px solid var(--color-accent-2-300)", borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)" }}>
              <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-800)" }}>{str.together}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {togetherItems.map((tg, i) => (
                  <span key={i} style={{ fontSize: "clamp(14px,1.1vw,19px)", fontWeight: 600, color: "var(--color-accent-2-800)", lineHeight: 1.3 }}>{tg.line}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="stack-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "clamp(14px,1.4vw,24px)", alignItems: "start" }}>
        <section style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: "clamp(12px,1.1vw,18px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "clamp(11px,1vw,16px)" }}>
            <span style={{ flex: "0 0 auto", width: "clamp(46px,3.6vw,58px)", height: "clamp(46px,3.6vw,58px)", borderRadius: "999px", background: sel.tint, color: sel.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(19px,1.5vw,26px)" }}>{sel.initial}</span>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(19px,1.6vw,27px)", lineHeight: 1.15 }}>{name(sel.name, sel.zh)}</span>
              <span style={{ fontSize: "clamp(13px,1.02vw,17px)", color: "var(--color-neutral-700)" }}>{name(sel.role, sel.roleZh)}</span>
            </span>
          </div>

          {(["likes", "dislikes", "allergies"] as const).map((field) => (
            <div key={field} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: field === "likes" ? "var(--color-accent-2-700)" : field === "dislikes" ? "var(--color-neutral-700)" : "var(--color-accent-700)" }}>
                {str[field]}
              </span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {fp[field].map(([a, b], ix) => (
                  <button
                    key={ix}
                    type="button"
                    onClick={() => removePref(field, sel.key, ix)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7, border: "none", fontFamily: "inherit", cursor: "pointer",
                      background: field === "likes" ? "var(--color-accent-2-100)" : field === "dislikes" ? "var(--color-neutral-200)" : "var(--color-accent-200)",
                      color: field === "likes" ? "var(--color-accent-2-800)" : field === "dislikes" ? "var(--color-neutral-800)" : "var(--color-accent-800)",
                      borderRadius: "999px", padding: "8px clamp(12px,1vw,16px)", fontSize: "clamp(13px,1vw,17px)", fontWeight: field === "allergies" ? 700 : 600, minHeight: 44
                    }}
                  >
                    {name(a, b || a)}<span style={{ opacity: 0.55 }}>×</span>
                  </button>
                ))}
                {field === "allergies" && fp.allergies.length === 0 && (
                  <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)", alignSelf: "center" }}>{str.noAllergy}</span>
                )}
              </div>
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--color-neutral-300)", paddingTop: "clamp(10px,1vw,16px)" }}>
            <div style={{ display: "flex", gap: 6 }}>
              {prefFields.map((f) => {
                const active = prefField === f;
                return (
                  <button key={f} type="button" onClick={() => setPrefField(f)} style={{ border: `2px solid ${active ? "var(--color-accent)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent)" : "var(--color-neutral-100)", color: active ? "var(--color-accent-100)" : "var(--color-neutral-700)", borderRadius: "999px", padding: "8px clamp(13px,1.1vw,18px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(12px,0.95vw,16px)", cursor: "pointer", minHeight: 44 }}>
                    {str[f]}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={prefInput}
                onChange={(e) => setPrefInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { addPref(prefField, prefInput); setPrefInput(""); } }}
                placeholder={str.prefPh}
                style={{ flex: "1 1 auto", minWidth: 0, border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "8px clamp(14px,1.2vw,20px)", fontFamily: "inherit", fontSize: "clamp(14px,1.05vw,18px)", background: "var(--color-neutral-100)", color: "var(--color-text)", minHeight: 44 }}
              />
              <button type="button" onClick={() => { addPref(prefField, prefInput); setPrefInput(""); }} style={{ border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "8px clamp(16px,1.4vw,24px)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}>
                {str.addWord}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {prefSuggestions.map(([a, b]) => (
                <button key={a} type="button" onClick={() => addPref(prefField, a, b)} style={{ border: "2px dashed var(--color-neutral-400)", background: "transparent", color: "var(--color-neutral-700)", borderRadius: "999px", padding: "8px clamp(12px,1vw,16px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(12px,0.95vw,16px)", cursor: "pointer", minHeight: 44 }}>
                  + {name(a, b)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "clamp(12px,1.2vw,20px)" }}>
          <section style={{ background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: "clamp(10px,1vw,15px)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,26px)" }}>{str.shared}</span>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-700)" }}>{str.sharedLikes}</span>
              {shared("likes").map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
                  <span style={{ fontSize: "clamp(13px,1.05vw,18px)", fontWeight: 600 }}>{x.label}</span>
                  <span style={{ fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)", textAlign: "right" }}>{x.who}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-neutral-700)" }}>{str.sharedDislikes}</span>
              {shared("dislikes").map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
                  <span style={{ fontSize: "clamp(13px,1.05vw,18px)", fontWeight: 600 }}>{x.label}</span>
                  <span style={{ fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)", textAlign: "right" }}>{x.who}</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: "clamp(11px,0.85vw,14px)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-700)" }}>{str.houseAllergies}</span>
              {houseAllergies.map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 10, padding: "5px 0", borderBottom: "1px solid var(--color-neutral-300)" }}>
                  <span style={{ fontSize: "clamp(13px,1.05vw,18px)", fontWeight: 700, color: "var(--color-accent-700)" }}>{x.label}</span>
                  <span style={{ fontSize: "clamp(12px,0.95vw,16px)", color: "var(--color-neutral-600)", textAlign: "right" }}>{x.who}</span>
                </div>
              ))}
            </div>
          </section>

          <section style={{ background: "var(--color-accent-2-100)", border: "2px solid var(--color-accent-2-300)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(16px,1.3vw,22px)", color: "var(--color-accent-2-800)" }}>{str.allergyTitle}</span>
            <span style={{ fontSize: "clamp(13px,1.02vw,17px)", color: "var(--color-accent-2-800)", lineHeight: 1.45 }}>{str.allergyBody}</span>
          </section>
        </div>
      </div>
    </div>
  );
}
