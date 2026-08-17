"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { DISHES, dishImg, DISH_FILTER_KEYS, estimateMinutes } from "@/lib/dishes";
import { makeHasIng, computeChecks, matchFromChecks } from "@/lib/pantry";
import FoodHeader from "@/components/FoodHeader";

const FILTER_KEYS = DISH_FILTER_KEYS;

export default function BrowseClient({ ingredientsByDish }: { ingredientsByDish: Record<string, [string, string, string][]> }) {
  const { lang, stock, checkedByDish } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);
  const [filter, setFilter] = useState<(typeof FILTER_KEYS)[number]>("All");

  const hasIng = makeHasIng(stock.map((x) => x.name));

  const dishes = DISHES.map((d) => {
    const ing = ingredientsByDish[d.id] || d.ing;
    const checks = computeChecks(ing, hasIng, checkedByDish[d.id]);
    const { short, m, full } = matchFromChecks(ing, checks);
    return {
      id: d.id,
      cat: d.cat,
      label: name(d.name, d.zh),
      img: dishImg(d.id),
      matchLabel: full ? str.ready : m + "%",
      pillBg: full ? "var(--color-accent-2)" : "var(--color-accent)",
      pillFg: full ? "var(--color-accent-2-100)" : "var(--color-accent-100)",
      shopNote: full ? str.onHand : str.buy + " " + short.length + " " + (zh ? str.items : short.length === 1 ? str.item : str.items),
      minutes: estimateMinutes(ing, d.cat),
      m
    };
  });

  const wantDishes = (filter === "All" ? dishes : dishes.filter((d) => d.cat === filter)).slice().sort((a, b) => b.m - a.m);

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.wantmake} />
      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "clamp(16px,1.6vw,26px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        <div style={{ flex: "0 0 auto", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {FILTER_KEYS.map((key) => {
            const active = filter === key;
            return (
              <button key={key} type="button" onClick={() => setFilter(key)} style={{ border: `2px solid ${active ? "var(--color-accent)" : "var(--color-neutral-300)"}`, background: active ? "var(--color-accent)" : "var(--color-neutral-100)", color: active ? "var(--color-accent-100)" : "var(--color-text)", borderRadius: "999px", padding: "clamp(10px,0.9vw,15px) clamp(18px,1.6vw,28px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer" }}>
                {str.filters[key]}
              </button>
            );
          })}
        </div>
        <div style={{ flex: "1 1 auto", overflow: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(clamp(240px,21vw,330px), 1fr))", gridAutoRows: "max-content", gap: "clamp(16px,1.5vw,26px)", alignContent: "start" }}>
          {wantDishes.map((dish) => (
            <Link key={dish.id} href={`/food/dish/${dish.id}`} style={{ textAlign: "left", fontFamily: "inherit", border: "none", padding: 0, background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", overflow: "hidden", cursor: "pointer", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column" }}>
              <span className="ph" style={{ flex: "0 0 auto", height: "clamp(120px,10.5vw,168px)", position: "relative", display: "block", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="washed" src={dish.img} alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: 12, right: 12, background: dish.pillBg, color: dish.pillFg, fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", padding: "7px 15px", borderRadius: "999px" }}>{dish.matchLabel}</span>
                <span style={{ position: "absolute", top: "clamp(50px,4.6vw,68px)", right: 12, background: "rgba(30,22,18,0.72)", color: "#fff", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(12px,0.95vw,16px)", padding: "5px 12px", borderRadius: "999px" }}>⏱ {dish.minutes} {str.minLabel}</span>
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 5, padding: "clamp(14px,1.3vw,22px)" }}>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,25px)", lineHeight: 1.18 }}>{dish.label}</span>
                <span style={{ fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{dish.shopNote}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
