"use client";

import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DISHES } from "@/lib/dishes";

export default function NewEventModal() {
  const {
    lang, modalOpen, closeModal, week, members,
    evDay, evTime, evWho, evDish, evCustom,
    setEvDay, setEvTime, setEvWho, setEvDish, setEvCustom, saveEvent
  } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  if (!modalOpen) return null;

  const times = ["17:00", "17:30", "18:00", "18:30", "19:00", "19:30"];
  const whoOptions: { key: string; label: string }[] = [
    { key: "all", label: str.everyone },
    ...members.map((p) => ({ key: p.key, label: name(p.name, p.zh) }))
  ];
  const canSave = !!(evDish || evCustom.trim());

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60, background: "rgba(43,31,22,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-body), 'Noto Sans TC', sans-serif", color: "var(--color-text)", padding: 24
      }}
    >
      <div style={{ width: "min(720px, 94vw)", maxHeight: "90vh", overflow: "auto", background: "var(--page)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "clamp(22px,2.2vw,36px)", display: "flex", flexDirection: "column", gap: "clamp(14px,1.3vw,22px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(22px,1.9vw,32px)" }}>{str.newEvent}</span>
          <button type="button" onClick={closeModal} aria-label="Close" style={{ marginLeft: "auto", width: 44, height: 44, flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", color: "var(--color-text)", fontSize: "1.2em", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.evDay}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {week.map((d, i) => {
              const active = evDay === i;
              return (
                <button key={i} type="button" onClick={() => setEvDay(i)} style={{ border: `2px solid ${active ? "var(--color-accent)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent)" : "var(--color-neutral-100)", color: active ? "var(--color-accent-100)" : "var(--color-text)", borderRadius: "999px", padding: "9px clamp(13px,1.1vw,18px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1vw,17px)", cursor: "pointer", minHeight: 44 }}>
                  {(zh ? d.zh : d.day) + " " + d.date}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.evTime}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {times.map((x) => {
              const active = evTime === x;
              return (
                <button key={x} type="button" onClick={() => setEvTime(x)} style={{ border: `2px solid ${active ? "var(--color-accent)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent)" : "var(--color-neutral-100)", color: active ? "var(--color-accent-100)" : "var(--color-text)", borderRadius: "999px", padding: "9px clamp(13px,1.1vw,18px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1vw,17px)", cursor: "pointer", minHeight: 44 }}>
                  {x}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.evWho}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {whoOptions.map((o) => {
              const active = evWho === o.key;
              return (
                <button key={o.key} type="button" onClick={() => setEvWho(o.key)} style={{ border: `2px solid ${active ? "var(--color-accent-2-800)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent-2-800)" : "var(--color-neutral-100)", color: active ? "var(--color-bg)" : "var(--color-text)", borderRadius: "999px", padding: "9px clamp(13px,1.1vw,18px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1vw,17px)", cursor: "pointer", minHeight: 44 }}>
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.evWhat}</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DISHES.map((d0) => {
              const active = evDish === d0.id;
              return (
                <button key={d0.id} type="button" onClick={() => { setEvDish(d0.id); setEvCustom(""); }} style={{ border: `2px solid ${active ? "var(--color-accent-2-600)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent-2-100)" : "var(--color-neutral-100)", color: active ? "var(--color-accent-2-800)" : "var(--color-text)", borderRadius: "999px", padding: "9px clamp(13px,1.1vw,18px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1vw,17px)", cursor: "pointer", minHeight: 44 }}>
                  {name(d0.name, d0.zh)}
                </button>
              );
            })}
          </div>
          <input
            value={evCustom}
            onChange={(e) => { setEvCustom(e.target.value); setEvDish(""); }}
            placeholder={str.evCustomPh}
            style={{ border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "9px clamp(14px,1.2vw,20px)", fontFamily: "inherit", fontSize: "clamp(14px,1.05vw,18px)", background: "var(--color-neutral-100)", color: "var(--color-text)", minHeight: 44 }}
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={closeModal} style={{ border: "2px solid var(--color-neutral-400)", background: "transparent", color: "var(--color-text)", borderRadius: "999px", padding: "clamp(11px,1vw,16px) clamp(20px,1.8vw,30px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", cursor: "pointer", minHeight: 44 }}>
            {str.cancel}
          </button>
          <button type="button" onClick={saveEvent} disabled={!canSave} style={{ border: "none", background: canSave ? "var(--color-accent)" : "var(--color-neutral-300)", color: canSave ? "var(--color-accent-100)" : "var(--color-neutral-600)", borderRadius: "999px", padding: "clamp(11px,1vw,16px) clamp(24px,2.2vw,38px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", cursor: "pointer", minHeight: 44 }}>
            {str.save}
          </button>
        </div>
      </div>
    </div>
  );
}
