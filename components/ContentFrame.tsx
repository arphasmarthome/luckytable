"use client";

import { CSSProperties, ReactNode } from "react";
import { useAppState } from "@/lib/AppState";

export default function ContentFrame({ children }: { children: ReactNode }) {
  const { lang } = useAppState();
  const style = {
    "--disp": lang === "zh" ? '"Noto Sans TC", sans-serif' : "var(--font-heading)",
    flex: "1 1 auto",
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "var(--page)"
  } as CSSProperties;
  return <div style={style}>{children}</div>;
}
