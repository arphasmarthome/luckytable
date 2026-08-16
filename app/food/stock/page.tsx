"use client";

import { useState } from "react";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { CAT, WHERE, WHEN, categoryOf } from "@/lib/taxonomy";
import { StockItem } from "@/lib/dishes";
import FoodHeader from "@/components/FoodHeader";

function StockRow({ row, label, cat, where, added, onInc, onDec, onRemove }: {
  row: StockItem;
  label: string;
  cat: string;
  where: string;
  added: string;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const [x0, setX0] = useState(0);

  return (
    <div className="stock-row-wrap" style={{ flex: "0 0 auto", position: "relative", borderRadius: "999px", overflow: "hidden", background: "var(--color-accent-600)" }}>
      <button
        type="button"
        onClick={onRemove}
        style={{ position: "absolute", inset: "0 0 0 auto", width: 190, border: "none", background: "var(--color-accent-600)", color: "var(--color-accent-100)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        Remove
      </button>
      <div
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          setDragging(true);
          setX0(e.clientX);
          setDx(0);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          setDx(Math.min(0, Math.max(-190, e.clientX - x0)));
        }}
        onPointerUp={() => {
          if (dragging && dx < -110) onRemove();
          setDragging(false);
          setDx(0);
        }}
        onPointerCancel={() => {
          setDragging(false);
          setDx(0);
        }}
        className="stock-row-grid"
        style={{
          position: "relative", display: "grid", gridTemplateColumns: "2fr 1fr 1.1fr 1fr", alignItems: "center",
          gap: "clamp(10px,1vw,18px)", padding: "clamp(13px,1.2vw,20px) clamp(18px,1.6vw,28px)", background: "var(--color-neutral-100)",
          borderRadius: "999px", fontSize: "clamp(15px,1.2vw,21px)", touchAction: "pan-y", cursor: "grab",
          transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 160ms ease"
        }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span><span style={{ background: "var(--color-accent-2-200)", color: "var(--color-accent-2-700)", fontSize: "0.75em", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", padding: "5px 12px", borderRadius: "999px" }}>{cat}</span></span>
        <span style={{ display: "flex", alignItems: "center", gap: "clamp(8px,0.7vw,12px)" }}>
          <button type="button" onClick={onDec} aria-label="−" style={{ width: "clamp(38px,3vw,46px)", height: "clamp(38px,3vw,46px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-neutral-400)", background: "var(--color-neutral-200)", color: "var(--color-text)", fontSize: "1.1em", fontWeight: 700, lineHeight: 1, cursor: "pointer" }}>−</button>
          <span style={{ fontFamily: "var(--disp)", fontWeight: 700, minWidth: "1.6ch", textAlign: "center" }}>{row.qty}</span>
          <button type="button" onClick={onInc} aria-label="+" style={{ width: "clamp(38px,3vw,46px)", height: "clamp(38px,3vw,46px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-accent-400)", background: "var(--color-accent-200)", color: "var(--color-accent-800)", fontSize: "1.1em", fontWeight: 700, lineHeight: 1, cursor: "pointer" }}>+</button>
        </span>
        <span style={{ color: "var(--color-neutral-700)" }}>{added}</span>
      </div>
    </div>
  );
}

export default function StockPage() {
  const { lang, stock, incStock, decStock, removeStock } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.stock} />
      <div style={{ flex: "1 1 auto", overflow: "auto", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0, display: "flex", flexDirection: "column", gap: "clamp(10px,1vw,16px)" }}>
        <div className="hide-mobile" style={{ flex: "0 0 auto", display: "grid", gridTemplateColumns: "2fr 1fr 1.1fr 1fr", gap: "clamp(10px,1vw,18px)", padding: "0 clamp(18px,1.6vw,28px)", fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>
          <span>{str.colItem}</span><span>{str.colCat}</span><span>{str.colCount}</span><span>{str.colAdded}</span>
        </div>
        {stock.map((row) => (
          <StockRow
            key={row.name}
            row={row}
            label={name(row.name, row.zh)}
            cat={zh ? CAT[categoryOf(row.name)] : categoryOf(row.name)}
            where={zh ? WHERE[row.where] || row.where : row.where}
            added={zh ? WHEN[row.added] || row.added : row.added}
            onInc={() => incStock(row.name)}
            onDec={() => decStock(row.name)}
            onRemove={() => removeStock(row.name)}
          />
        ))}
        <p style={{ flex: "0 0 auto", margin: "6px 0 0", padding: "0 clamp(18px,1.6vw,28px)", fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{str.swipeHint}</p>
      </div>
    </div>
  );
}
