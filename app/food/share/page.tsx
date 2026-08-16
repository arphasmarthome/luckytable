"use client";

import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";
import FoodHeader from "@/components/FoodHeader";

export default function SharePage() {
  const { lang } = useAppState();
  const str = t(lang);

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.share} />
      <div className="stack-grid" style={{ flex: "1 1 auto", overflow: "auto", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(18px,1.8vw,32px)", padding: "0 clamp(24px,2.6vw,48px) clamp(28px,2.8vw,52px)", minHeight: 0 }}>
        {str.share.map((o) => (
          <div key={o.num} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(24px,2.4vw,42px)", display: "flex", flexDirection: "column", gap: "clamp(14px,1.3vw,22px)" }}>
            <span style={{ width: "clamp(64px,5.4vw,92px)", height: "clamp(64px,5.4vw,92px)", borderRadius: "999px", background: "var(--color-accent-200)", color: "var(--color-accent-700)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(24px,2.2vw,38px)" }}>{o.num}</span>
            <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(23px,2vw,34px)", lineHeight: 1.15 }}>{o.title}</div>
            <p style={{ margin: 0, fontSize: "clamp(14px,1.1vw,19px)", color: "var(--color-neutral-700)", lineHeight: 1.5 }}>{o.body}</p>
            <button type="button" style={{ marginTop: "auto", alignSelf: "flex-start", border: "2px solid var(--color-neutral-400)", background: "var(--color-neutral-100)", color: "var(--color-text)", borderRadius: "999px", padding: "clamp(11px,1vw,17px) clamp(20px,1.8vw,30px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,21px)", cursor: "pointer" }}>
              {o.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
