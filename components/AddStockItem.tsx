"use client";

import { useState } from "react";
import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";

export default function AddStockItem() {
  const { lang, addStockItem } = useAppState();
  const str = t(lang);
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (!v) return;
    addStockItem(v);
    setValue("");
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); submit(); }}
      style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={str.addItemPh}
        style={{ width: "clamp(140px,14vw,220px)", border: "2px solid var(--color-neutral-300)", borderRadius: "999px", padding: "clamp(9px,0.75vw,14px) clamp(14px,1.25vw,20px)", fontFamily: "inherit", fontSize: "clamp(13px,1vw,17px)", background: "var(--color-neutral-100)", color: "var(--color-text)", minHeight: 44, minWidth: 0 }}
      />
      <button
        type="submit"
        style={{ flex: "0 0 auto", whiteSpace: "nowrap", border: "none", background: "var(--color-accent)", color: "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(9px,0.75vw,14px) clamp(16px,1.4vw,24px)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(13px,1vw,17px)", cursor: "pointer", minHeight: 44 }}
      >
        {str.addItem}
      </button>
    </form>
  );
}
