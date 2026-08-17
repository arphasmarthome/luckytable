"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { useCaptured } from "@/lib/useCaptured";
import { t, nm } from "@/lib/i18n";
import { DISHES, dishImg, estimateMinutes } from "@/lib/dishes";
import { makeHasIng, computeChecks, matchFromChecks } from "@/lib/pantry";
import FoodHeader from "@/components/FoodHeader";

export default function ResultsClient({ ingredientsByDish }: { ingredientsByDish: Record<string, [string, string, string][]> }) {
  const { lang, stock, checkedByDish } = useAppState();
  const { captured } = useCaptured();
  const str = t(lang);
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const capturedList = captured.map((c) => ({ label: c.label, qty: c.qty }));
  const stockList = stock.map((x) => ({ label: name(x.name, x.zh), qty: x.qty }));

  const pantryNames = captured.map((c) => c.name).concat(stock.map((x) => x.name));
  const hasIng = makeHasIng(pantryNames);

  const dishes = DISHES.map((d) => {
    const ing = ingredientsByDish[d.id] || d.ing;
    const checks = computeChecks(ing, hasIng, checkedByDish[d.id]);
    const { m, full, short } = matchFromChecks(ing, checks);
    return {
      id: d.id,
      label: name(d.name, d.zh),
      img: dishImg(d.id),
      matchLabel: full ? str.ready : m + "%",
      pillBg: full ? "var(--color-accent-2)" : "var(--color-accent)",
      pillFg: full ? "var(--color-accent-2-100)" : "var(--color-accent-100)",
      note: full ? str.onHand : str.missing + " " + short.length,
      minutes: estimateMinutes(ing, d.cat),
      m
    };
  }).sort((a, b) => b.m - a.m);

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titleAll} />
      <div className="stack-grid" style={{ flex: "1 1 auto", overflow: "auto", gridTemplateColumns: "clamp(220px,19vw,300px) 1fr", gap: "clamp(20px,2vw,36px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        <aside style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: 14, overflow: "auto" }}>
          {capturedList.length > 0 && (
            <>
              <div style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.matchingFrom}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {capturedList.map((s, i) => (
                  <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--color-neutral-100)", border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "7px 13px", fontSize: "clamp(13px,1vw,17px)", fontWeight: 600 }}>
                    {s.label}<span style={{ fontFamily: "var(--disp)", fontWeight: 700, color: "var(--color-accent-700)" }}>{s.qty}</span>
                  </span>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--color-neutral-300)", flex: "0 0 auto" }} />
            </>
          )}
          <div style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.titles.stock}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {stockList.map((s, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "var(--color-neutral-100)", border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "7px 13px", fontSize: "clamp(13px,1vw,17px)", fontWeight: 600 }}>
                {s.label}<span style={{ fontFamily: "var(--disp)", fontWeight: 700, color: "var(--color-accent-700)" }}>{s.qty}</span>
              </span>
            ))}
          </div>
        </aside>
        <div style={{ overflow: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(240px,21vw,330px), 1fr))", gridAutoRows: "max-content", gap: "clamp(16px,1.5vw,26px)", alignContent: "start" }}>
          {dishes.map((dish) => (
            <Link key={dish.id} href={`/food/dish/${dish.id}?match=captured`} style={{ textAlign: "left", fontFamily: "inherit", border: "none", padding: 0, background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", overflow: "hidden", cursor: "pointer", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
              <span className="ph" style={{ flex: "0 0 auto", height: "clamp(120px,10.5vw,168px)", position: "relative", display: "block", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="washed" src={dish.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: 12, right: 12, background: dish.pillBg, color: dish.pillFg, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", padding: "7px 15px", borderRadius: "999px" }}>{dish.matchLabel}</span>
                <span style={{ position: "absolute", top: "clamp(50px,4.6vw,68px)", right: 12, background: "rgba(30,22,18,0.72)", color: "#fff", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(12px,0.95vw,16px)", padding: "5px 12px", borderRadius: "999px" }}>⏱ {dish.minutes} {str.minLabel}</span>
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 5, padding: "clamp(14px,1.3vw,22px)" }}>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,25px)", lineHeight: 1.18 }}>{dish.label}</span>
                <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{dish.note}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
