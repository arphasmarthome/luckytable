"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";
import CartButton from "@/components/CartButton";

export default function FoodHeader({ title, extra }: { title: string; extra?: ReactNode }) {
  const { lang } = useAppState();
  const str = t(lang);
  const router = useRouter();

  return (
    <header style={{ flex: "0 0 auto", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "clamp(14px,1.4vw,24px)", padding: "clamp(18px,1.8vw,30px) clamp(24px,2.6vw,48px)" }}>
      <Link
        href="/food"
        aria-label="Home"
        style={{ width: "clamp(50px,4vw,64px)", height: "clamp(50px,4vw,64px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-accent-300)", background: "var(--color-accent-200)", color: "var(--color-accent-800)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "48%", height: "48%" }}>
          <path d="M4 11.2l8-6.4 8 6.4" />
          <path d="M6.4 10v8.4a1 1 0 0 0 1 1h9.2a1 1 0 0 0 1-1V10" />
        </svg>
      </Link>
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        style={{ width: "clamp(50px,4vw,64px)", height: "clamp(50px,4vw,64px)", flex: "0 0 auto", borderRadius: "999px", border: "2px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", color: "var(--color-text)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "46%", height: "46%" }}>
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1 style={{ margin: "0 auto 0 0", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(26px,2.4vw,42px)", lineHeight: 1.05 }}>{title}</h1>
      {extra}
      <CartButton />
      <Link
        href="/food/stock"
        style={{ display: "flex", alignItems: "center", gap: 9, flex: "0 0 auto", whiteSpace: "nowrap", border: "2px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", color: "var(--color-neutral-800)", borderRadius: "999px", padding: "0 clamp(14px,1.25vw,22px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(13px,1vw,18px)", cursor: "pointer", height: "clamp(50px,4vw,64px)" }}
      >
        {str.stockBtn}
      </Link>
    </header>
  );
}
