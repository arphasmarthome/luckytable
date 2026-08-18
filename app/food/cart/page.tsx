"use client";

import { useState } from "react";
import { useAppState, CartItem } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import FoodHeader from "@/components/FoodHeader";

function CartRow({
  item, label, dishLabel, onInc, onDec, onRemove, delLabel
}: {
  item: CartItem;
  label: string;
  dishLabel: string;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
  delLabel: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [dx, setDx] = useState(0);
  const [x0, setX0] = useState(0);

  return (
    <div style={{ flex: "0 0 auto", position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", background: "var(--color-accent-600)" }}>
      <button
        type="button"
        onClick={onRemove}
        style={{ position: "absolute", inset: "0 0 0 auto", width: 190, border: "none", background: "var(--color-accent-600)", color: "var(--color-accent-100)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {delLabel}
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
        style={{
          position: "relative", display: "flex", alignItems: "center", gap: "clamp(12px,1.1vw,18px)",
          padding: "clamp(14px,1.3vw,22px) clamp(18px,1.6vw,28px)", background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)", touchAction: "pan-y", cursor: "grab",
          transform: `translateX(${dx}px)`, transition: dragging ? "none" : "transform 160ms ease"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: "1 1 auto" }}>
          <span style={{ fontWeight: 700, fontSize: "clamp(15px,1.2vw,20px)" }}>{label}</span>
          <span style={{ fontSize: "clamp(12px,0.95vw,15px)", color: "var(--color-neutral-600)" }}>
            {item.amount ? item.amount + " · " : ""}{dishLabel}
          </span>
        </div>
        <span style={{ display: "flex", alignItems: "center", gap: "clamp(8px,0.7vw,12px)", flex: "0 0 auto" }}>
          <button type="button" onClick={onDec} aria-label="−" style={{ width: "clamp(38px,3vw,46px)", height: "clamp(38px,3vw,46px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-neutral-400)", background: "var(--color-neutral-200)", color: "var(--color-text)", fontSize: "1.1em", fontWeight: 700, lineHeight: 1, cursor: "pointer" }}>−</button>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, minWidth: "1.6ch", textAlign: "center" }}>{item.qty}</span>
          <button type="button" onClick={onInc} aria-label="+" style={{ width: "clamp(38px,3vw,46px)", height: "clamp(38px,3vw,46px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-accent-400)", background: "var(--color-accent-200)", color: "var(--color-accent-800)", fontSize: "1.1em", fontWeight: 700, lineHeight: 1, cursor: "pointer" }}>+</button>
        </span>
      </div>
    </div>
  );
}

export default function CartPage() {
  const { lang, cart, incCartItem, decCartItem, removeCartItem } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  const groups: { dishId: string; dishName: string; dishZh: string; items: CartItem[] }[] = [];
  cart.forEach((item) => {
    let g = groups.find((x) => x.dishId === item.dishId);
    if (!g) {
      g = { dishId: item.dishId, dishName: item.dishName, dishZh: item.dishZh, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  });
  groups.sort((a, b) => name(a.dishName, a.dishZh).localeCompare(name(b.dishName, b.dishZh)));

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={str.titles.cart} />
      <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", gap: "clamp(16px,1.6vw,28px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        {cart.length === 0 ? (
          <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", padding: "clamp(30px,4vw,60px) 20px" }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(18px,1.5vw,26px)" }}>{str.cartEmpty}</span>
            <span style={{ fontSize: "clamp(14px,1.1vw,18px)", color: "var(--color-neutral-600)", maxWidth: "46ch" }}>{str.cartEmptyBody}</span>
          </div>
        ) : (
          <>
            <div style={{ flex: "1 1 auto", overflow: "auto", display: "flex", flexDirection: "column", gap: "clamp(18px,1.7vw,28px)", paddingBottom: 8 }}>
              {groups.map((g) => (
                <div key={g.dishId} style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.8vw,13px)" }}>
                  <div style={{ fontSize: "clamp(12px,0.9vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>
                    {name(g.dishName, g.dishZh)}
                  </div>
                  {g.items.map((item) => (
                    <CartRow
                      key={item.id}
                      item={item}
                      label={name(item.name, item.zh)}
                      dishLabel={name(g.dishName, g.dishZh)}
                      onInc={() => incCartItem(item.id)}
                      onDec={() => decCartItem(item.id)}
                      onRemove={() => removeCartItem(item.id)}
                      delLabel={str.del}
                    />
                  ))}
                </div>
              ))}
              <p style={{ flex: "0 0 auto", margin: 0, fontSize: "clamp(13px,1vw,17px)", color: "var(--color-neutral-600)" }}>{str.swipeHint}</p>
            </div>

            <div className="action-bar" style={{ flex: "0 0 auto", display: "flex", alignItems: "center", gap: "clamp(12px,1.2vw,20px)", background: "var(--color-neutral-100)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(18px,1.6vw,28px)", boxShadow: "var(--shadow-sm)", flexWrap: "wrap" }}>
              <span style={{ fontSize: "clamp(15px,1.15vw,20px)", color: "var(--color-neutral-700)" }}>
                {zh ? totalQty + str.items : totalQty + " " + (totalQty === 1 ? str.item : str.items)}
              </span>
              <a
                href="https://shop.pxgo.com.tw"
                target="_blank"
                rel="noopener"
                style={{ marginLeft: "auto", border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(12px,1.1vw,18px) clamp(24px,2.2vw,40px)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: "pointer" }}
              >
                {str.buyAt}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
