"use client";

import Link from "next/link";
import { ReactElement } from "react";
import { usePathname } from "next/navigation";
import { useAppState } from "@/lib/AppState";
import { t } from "@/lib/i18n";

const ICONS: Record<string, ReactElement> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <path d="M4 11.2l8-6.4 8 6.4" />
      <path d="M6.4 10v8.4a1 1 0 0 0 1 1h9.2a1 1 0 0 0 1-1V10" />
    </svg>
  ),
  food: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <path d="M3 12h18" />
      <path d="M20 12a8 8 0 0 1-16 0" />
      <path d="M9 7.5c0-1.2 1-1.6 1-2.8" />
      <path d="M14 7.5c0-1.2 1-1.6 1-2.8" />
    </svg>
  ),
  rec: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5H7.5A2.5 2.5 0 0 1 5 17z" />
      <path d="M5 17a2.5 2.5 0 0 1 2.5-2.5h11" />
      <path d="M9 8.5h6" />
    </svg>
  ),
  cal: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17" />
      <path d="M8 3.5v3" />
      <path d="M16 3.5v3" />
    </svg>
  ),
  fam: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
      <circle cx="9" cy="8" r="3.2" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 14.2c2.4.2 4.5 2 4.5 4.8" />
    </svg>
  )
};

export default function Rail() {
  const { lang, setLang } = useAppState();
  const str = t(lang);
  const pathname = usePathname();

  const sections = [
    { key: "home", href: "/", label: str.navHome, active: pathname === "/" },
    { key: "food", href: "/food", label: str.navFood, active: pathname.startsWith("/food") },
    { key: "rec", href: "/recipes", label: str.navRec, active: pathname.startsWith("/recipes") },
    { key: "cal", href: "/calendar", label: str.navCal, active: pathname.startsWith("/calendar") },
    { key: "fam", href: "/family", label: str.navFam, active: pathname.startsWith("/family") }
  ];

  return (
    <nav className="rail">
      <div
        className="rail-brand"
        style={{
          width: "clamp(40px,3.4vw,54px)",
          height: "clamp(40px,3.4vw,54px)",
          flex: "0 0 auto",
          borderRadius: "999px",
          background: "var(--color-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "clamp(6px,0.6vw,12px)"
        }}
      >
        <div style={{ width: "44%", height: "44%", borderRadius: "999px", background: "var(--color-surface)" }} />
      </div>

      <div className="rail-links">
        {sections.map((n) => (
          <Link
            key={n.key}
            href={n.href}
            className="rail-link"
            style={{
              background: n.active ? "var(--color-accent)" : "transparent",
              color: n.active ? "var(--color-accent-100)" : "var(--color-neutral-400)"
            }}
          >
            <span style={{ width: "clamp(26px,2.1vw,32px)", height: "clamp(26px,2.1vw,32px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {ICONS[n.key]}
            </span>
            <span>{n.label}</span>
          </Link>
        ))}
      </div>

      <div className="rail-lang">
        <button
          type="button"
          onClick={() => setLang("en")}
          className="rail-lang-btn"
          style={{
            background: lang === "zh" ? "transparent" : "var(--color-accent)",
            color: lang === "zh" ? "var(--color-neutral-300)" : "var(--color-accent-100)"
          }}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang("zh")}
          className="rail-lang-btn"
          style={{
            background: lang === "zh" ? "var(--color-accent)" : "transparent",
            color: lang === "zh" ? "var(--color-accent-100)" : "var(--color-neutral-300)"
          }}
        >
          繁中
        </button>
      </div>
    </nav>
  );
}
