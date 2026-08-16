"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/AppState";
import { useCaptured } from "@/lib/useCaptured";
import { t } from "@/lib/i18n";
import FoodHeader from "@/components/FoodHeader";

export default function CapturePage() {
  const { lang, atStore, toggleLocation, snap } = useAppState();
  const { captured, boxes } = useCaptured();
  const str = t(lang);
  const router = useRouter();

  const reviewLabel = captured.length === 0 ? str.reviewNone : str.review + " " + captured.length + " " + str.items;

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.capture} />
      <div style={{ flex: "1 1 auto", display: "grid", gridTemplateColumns: "1fr clamp(280px,24vw,390px)", gap: "clamp(20px,2vw,36px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        <div className="ph" style={{ borderRadius: "var(--radius-lg)", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="mono" style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-700)", letterSpacing: "0.1em", textTransform: "uppercase", background: "var(--color-neutral-100)", padding: "10px 18px", borderRadius: "999px" }}>{str.cameraFeed}</span>
          {boxes.map((b, i) => (
            <span key={i} style={{ position: "absolute", left: b.left, top: b.top, width: b.w, height: b.h, border: `4px solid ${b.color}`, borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)" }}>
              <span style={{ position: "absolute", left: -4, top: -46, whiteSpace: "nowrap", background: b.color, color: "var(--color-neutral-100)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", padding: "8px 16px", borderRadius: "999px" }}>{b.label}</span>
            </span>
          ))}
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,1.3vw,22px)", minHeight: 0 }}>
          <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.detectedSoFar}</div>
            {captured.length === 0 && <p style={{ margin: 0, fontSize: "clamp(14px,1.1vw,19px)", color: "var(--color-neutral-600)", lineHeight: 1.45 }}>{str.nothingYet}</p>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {captured.map((d) => (
                <span key={d.name} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--color-neutral-100)", border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "8px 14px", fontSize: "clamp(14px,1.05vw,18px)", fontWeight: 600 }}>
                  {d.label}<span style={{ fontFamily: "var(--disp)", fontWeight: 700, color: "var(--color-accent-700)" }}>×{d.qty}</span>
                </span>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={snap}
            style={{ flex: "0 0 auto", alignSelf: "center", width: "clamp(116px,10.5vw,160px)", height: "clamp(116px,10.5vw,160px)", borderRadius: "999px", border: "8px solid var(--color-accent-200)", background: "var(--color-accent)", color: "var(--color-accent-100)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: "var(--shadow-lg)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,21px)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "32%", height: "32%" }}>
              <path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
              <circle cx="12" cy="13.5" r="3.4" />
            </svg>
            <span>{str.capture}</span>
          </button>

          <p style={{ margin: 0, textAlign: "center", fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-700)", lineHeight: 1.45 }}>
            {atStore ? str.hintStore : str.hintHome}
          </p>
          <button type="button" onClick={toggleLocation} style={{ alignSelf: "center", border: "none", background: "transparent", color: "var(--color-accent-700)", fontFamily: "inherit", fontSize: "clamp(12px,0.95vw,16px)", cursor: "pointer", textDecoration: "underline" }}>
            {atStore ? str.atHome : str.atStore}
          </button>

          <button
            type="button"
            disabled={captured.length === 0}
            onClick={() => router.push("/food/review")}
            style={{ flex: "0 0 auto", border: "none", background: captured.length === 0 ? "var(--color-neutral-300)" : "var(--color-accent-2)", color: captured.length === 0 ? "var(--color-neutral-600)" : "var(--color-accent-2-100)", borderRadius: "999px", padding: "clamp(14px,1.25vw,20px) clamp(20px,1.8vw,32px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: captured.length === 0 ? "default" : "pointer" }}
          >
            {reviewLabel}
          </button>
        </aside>
      </div>
    </div>
  );
}
