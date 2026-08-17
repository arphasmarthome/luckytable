"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DISHES, dishImg } from "@/lib/dishes";
import { ING_ZH } from "@/lib/taxonomy";
import { makeHasIng, matchDish } from "@/lib/pantry";

export default function RecipesClient({ ingredientsByDish }: { ingredientsByDish: Record<string, [string, string, string][]> }) {
  const { lang, stock } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const hasIng = makeHasIng(stock.map((x) => x.name));

  const dishes = DISHES.map((d) => {
    const ing = ingredientsByDish[d.id] || d.ing;
    const { short, m, full } = matchDish(ing, hasIng);
    return {
      id: d.id,
      label: name(d.name, d.zh),
      img: dishImg(d.id),
      matchLabel: full ? str.ready : m + "%",
      pillBg: full ? "var(--color-accent-2)" : "var(--color-accent)",
      pillFg: full ? "var(--color-accent-2-100)" : "var(--color-accent-100)",
      note: full
        ? str.onHand
        : str.missing + " " + short.length + " · " + short.map((x) => name(x[0], x[1] || ING_ZH[String(x[0]).toLowerCase()] || x[0])).join(zh ? "、" : ", "),
      m
    };
  }).sort((a, b) => b.m - a.m);

  return (
    <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", gap: "clamp(14px,1.4vw,22px)", padding: "clamp(24px,2.4vw,42px) clamp(26px,2.6vw,48px)" }}>
      <header style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-accent-2-700)" }}>{str.recKicker}</span>
        <h1 style={{ margin: 0, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(26px,2.4vw,42px)", lineHeight: 1.05 }}>{str.navRec}</h1>
      </header>
      <div style={{ flex: "1 1 auto", minHeight: 0, overflow: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(240px,21vw,330px), 1fr))", gridAutoRows: "max-content", gap: "clamp(16px,1.5vw,26px)", alignContent: "start" }}>
        {dishes.map((dish) => (
          <Link
            key={dish.id}
            href={`/food/dish/${dish.id}`}
            style={{ textAlign: "left", fontFamily: "inherit", border: "none", padding: 0, background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", overflow: "hidden", cursor: "pointer", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}
          >
            <span className="ph" style={{ flex: "0 0 auto", height: "clamp(120px,10.5vw,168px)", position: "relative", display: "block", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="washed" src={dish.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              <span style={{ position: "absolute", top: 12, right: 12, background: dish.pillBg, color: dish.pillFg, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", padding: "7px 15px", borderRadius: "999px" }}>{dish.matchLabel}</span>
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: 5, padding: "clamp(14px,1.3vw,22px)" }}>
              <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,25px)", lineHeight: 1.18 }}>{dish.label}</span>
              <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{dish.note}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
