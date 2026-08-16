"use client";

import { CSSProperties, ReactNode } from "react";
import { useAppState } from "@/lib/AppState";

export default function ContentFrame({ children }: { children: ReactNode }) {
  const { lang } = useAppState();
  const style = {
    "--disp": lang === "zh" ? '"Noto Sans TC", sans-serif' : "var(--font-heading)"
  } as CSSProperties;
  return (
    <div className="content-frame" style={style}>
      {children}
    </div>
  );
}
