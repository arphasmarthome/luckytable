"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";

export default function CartButton({ size = "clamp(50px,4vw,64px)" }: { size?: string }) {
  const { lang, cart } = useAppState();
  const str = t(lang);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <Link
      href="/food/cart"
      aria-label={str.cartLabel}
      style={{
        position: "relative", width: size, height: size, flex: "0 0 auto", borderRadius: "999px",
        border: "2px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", color: "var(--color-neutral-800)",
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
        <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <path d="M2.5 3h2.4l2.6 12.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21.5 7H6" />
      </svg>
      {count > 0 && (
        <span
          style={{
            position: "absolute", top: -4, right: -4, minWidth: 20, height: 20, borderRadius: "999px",
            background: "var(--color-accent)", color: "var(--color-accent-100)", fontFamily: "var(--font-body)",
            fontWeight: 700, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 4px", lineHeight: 1
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
