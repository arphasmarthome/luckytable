"use client";

import Link from "next/link";
import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";

export default function FoodHomePage() {
  const { lang, resetCapture } = useAppState();
  const str = t(lang);

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", padding: "clamp(26px,3vw,52px) clamp(32px,3.6vw,64px) clamp(32px,3.6vw,60px)", gap: "clamp(22px,2.4vw,40px)", minHeight: 0 }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24, flex: "0 0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "clamp(14px,1.2vw,22px)" }}>
          <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(20px,1.9vw,30px)", lineHeight: 1.25, letterSpacing: "-0.005em", maxWidth: "18ch" }}>{str.tagline}</div>
        </div>
        <Link href="/food/stock" style={{ display: "flex", alignItems: "center", gap: 10, border: "2px solid var(--color-neutral-300)", background: "var(--color-neutral-100)", color: "var(--color-neutral-800)", borderRadius: "999px", padding: "clamp(10px,0.85vw,15px) clamp(16px,1.4vw,24px)", fontFamily: "inherit", fontWeight: 600, fontSize: "clamp(14px,1.05vw,19px)", cursor: "pointer" }}>
          <span>{str.stockBtn}</span>
        </Link>
      </header>

      <main className="stack-grid" style={{ flex: "1 1 auto", overflow: "auto", gridTemplateColumns: "repeat(3, 1fr)", gap: "clamp(20px,2vw,36px)", minHeight: 0 }}>
        <Link
          href="/food/capture"
          onClick={() => resetCapture()}
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: "clamp(20px,2vw,32px)", padding: "clamp(30px,3vw,52px)", border: "none", borderRadius: "var(--radius-lg)", background: "var(--color-accent)", color: "var(--color-accent-100)", cursor: "pointer", boxShadow: "var(--shadow-lg)", fontFamily: "inherit", minHeight: "clamp(220px,32vh,380px)" }}
        >
          <span style={{ width: "100%", height: "clamp(150px,15vw,210px)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <span style={{ width: "clamp(84px,7.2vw,126px)", height: "clamp(84px,7.2vw,126px)", borderRadius: "999px", background: "rgba(255,242,235,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
                <path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1z" />
                <circle cx="12" cy="13.5" r="3.4" />
              </svg>
            </span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.8vw,14px)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(32px,3.2vw,58px)", lineHeight: 1.02, letterSpacing: "-0.015em" }}>{str.tile1}</span>
            <span style={{ display: "block", fontSize: "clamp(15px,1.2vw,22px)", color: "var(--color-accent-200)", lineHeight: 1.4, maxWidth: "22ch" }}>{str.tile1Body}</span>
          </span>
        </Link>

        <Link
          href="/food/browse"
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: "clamp(20px,2vw,32px)", padding: "clamp(30px,3vw,52px)", border: "none", borderRadius: "var(--radius-lg)", background: "var(--color-accent-2)", color: "var(--color-accent-2-100)", cursor: "pointer", boxShadow: "var(--shadow-lg)", fontFamily: "inherit", minHeight: "clamp(220px,32vh,380px)" }}
        >
          <span style={{ width: "100%", height: "clamp(150px,15vw,210px)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <span style={{ width: "clamp(84px,7.2vw,126px)", height: "clamp(84px,7.2vw,126px)", borderRadius: "999px", background: "rgba(240,250,225,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
                <path d="M3 12h18" />
                <path d="M20 12a8 8 0 0 1-16 0" />
                <path d="M9 7.5c0-1.2 1-1.6 1-2.8" />
                <path d="M14 7.5c0-1.2 1-1.6 1-2.8" />
              </svg>
            </span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.8vw,14px)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(32px,3.2vw,58px)", lineHeight: 1.02, letterSpacing: "-0.015em" }}>{str.tile2}</span>
            <span style={{ display: "block", fontSize: "clamp(15px,1.2vw,22px)", color: "var(--color-accent-2-200)", lineHeight: 1.4, maxWidth: "22ch" }}>{str.tile2Body}</span>
          </span>
        </Link>

        <Link
          href="/food/share"
          style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", textAlign: "left", gap: "clamp(20px,2vw,32px)", padding: "clamp(30px,3vw,52px)", border: "3px solid var(--color-neutral-300)", borderRadius: "var(--radius-lg)", background: "var(--color-neutral-100)", color: "var(--color-text)", cursor: "pointer", boxShadow: "var(--shadow-md)", fontFamily: "inherit", minHeight: "clamp(220px,32vh,380px)" }}
        >
          <span style={{ width: "100%", height: "clamp(150px,15vw,210px)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
            <span style={{ width: "clamp(84px,7.2vw,126px)", height: "clamp(84px,7.2vw,126px)", borderRadius: "999px", background: "var(--color-accent-200)", color: "var(--color-accent-700)", display: "flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" style={{ width: "52%", height: "52%" }}>
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <path d="M8.6 13.5l6.8 4" />
                <path d="M15.4 6.5l-6.8 4" />
              </svg>
            </span>
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: "clamp(8px,0.8vw,14px)" }}>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "clamp(32px,3.2vw,58px)", lineHeight: 1.02, letterSpacing: "-0.015em" }}>{str.tile3}</span>
            <span style={{ display: "block", fontSize: "clamp(15px,1.2vw,22px)", color: "var(--color-neutral-700)", lineHeight: 1.4, maxWidth: "22ch" }}>{str.tile3Body}</span>
          </span>
        </Link>
      </main>
    </div>
  );
}
