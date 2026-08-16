"use client";

import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/AppState";
import { useCaptured } from "@/lib/useCaptured";
import { t } from "@/lib/i18n";
import FoodHeader from "@/components/FoodHeader";

export default function ReviewPage() {
  const { lang, addCapturedToStock } = useAppState();
  const { captured, totalUnits } = useCaptured();
  const str = t(lang);
  const zh = lang === "zh";
  const router = useRouter();

  const reviewSummary = captured.length + " " + str.itemized + " · " + totalUnits + " " + str.units;

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.review} />
      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "clamp(16px,1.6vw,28px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        <div style={{ flex: "1 1 auto", overflow: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(220px,19vw,300px), 1fr))", gap: "clamp(14px,1.4vw,24px)", alignContent: "start", paddingBottom: 8 }}>
          {captured.map((d) => (
            <div key={d.name} style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)", display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="ph" style={{ position: "relative", overflow: "hidden", flex: "0 0 auto", height: "clamp(92px,8vw,124px)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-end", justifyContent: "flex-start", padding: 10 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: 8, background: "var(--color-neutral-100)" }} />
                <span style={{ position: "relative", background: "var(--color-accent-2-200)", color: "var(--color-accent-2-700)", fontSize: "clamp(11px,0.85vw,14px)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 12px", borderRadius: "999px" }}>{d.cat}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,26px)", lineHeight: 1.15 }}>{d.label}</div>
                <div style={{ fontSize: "clamp(13px,1.05vw,18px)", color: "var(--color-neutral-700)" }}>{d.confLabel}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button type="button" onClick={d.dec} aria-label="−" style={{ width: "clamp(44px,3.6vw,54px)", height: "clamp(44px,3.6vw,54px)", borderRadius: "999px", border: "2px solid var(--color-neutral-400)", background: "var(--color-neutral-100)", color: "var(--color-text)", fontSize: "1.3em", fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>−</button>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(22px,1.9vw,32px)", minWidth: "2ch", textAlign: "center" }}>{d.qty}</span>
                <button type="button" onClick={d.inc} aria-label="+" style={{ width: "clamp(44px,3.6vw,54px)", height: "clamp(44px,3.6vw,54px)", borderRadius: "999px", border: "2px solid var(--color-accent-400)", background: "var(--color-accent-200)", color: "var(--color-accent-800)", fontSize: "1.3em", fontWeight: 700, cursor: "pointer", lineHeight: 1 }}>+</button>
                <span style={{ marginLeft: "auto", fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-700)" }}>{zh ? d.unit : d.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "clamp(12px,1.2vw,20px)", background: "var(--color-neutral-100)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(18px,1.6vw,28px)", boxShadow: "var(--shadow-sm)", flexWrap: "wrap" }}>
          <span style={{ fontSize: "clamp(15px,1.15vw,20px)", color: "var(--color-neutral-700)" }}>{reviewSummary}</span>
          <button
            type="button"
            onClick={() => { addCapturedToStock(captured.map((c) => ({ name: c.name, qty: c.qty }))); router.push("/food/stock"); }}
            style={{ marginLeft: "auto", border: "2px solid var(--color-neutral-400)", background: "transparent", color: "var(--color-text)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(20px,1.8vw,32px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: "pointer" }}
          >
            {str.addToStock}
          </button>
          <button
            type="button"
            onClick={() => router.push("/food/results?mode=captured")}
            style={{ border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(24px,2.2vw,40px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: "pointer" }}
          >
            {str.seeWhatICanMake}
          </button>
          <button
            type="button"
            onClick={() => router.push("/food/results?mode=stock")}
            style={{ border: "none", background: "var(--color-accent-2)", color: "var(--color-accent-2-100)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(24px,2.2vw,40px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: "pointer" }}
          >
            {str.makeAll}
          </button>
        </div>
      </div>
    </div>
  );
}
