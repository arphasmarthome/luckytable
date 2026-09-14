import { useWindowDimensions } from "react-native";
import { typeBase } from "@/theme";

export type Breakpoint = "phone" | "tablet" | "desktop";
export type TypeKey = keyof typeof typeBase;

/** phone < 768 ≤ tablet < 1200 ≤ desktop. `isWide` (≥ 900) switches the shell to the side rail layout. */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const bp: Breakpoint = width < 768 ? "phone" : width < 1200 ? "tablet" : "desktop";
  const mult = bp === "phone" ? 1 : bp === "tablet" ? 1.08 : 1.2;
  const fs = (key: TypeKey) => Math.round(typeBase[key] * mult);
  return {
    width,
    height,
    bp,
    isPhone: bp === "phone",
    isTablet: bp === "tablet",
    isDesktop: bp === "desktop",
    isWide: width >= 900,
    isLandscape: width > height,
    mult,
    fs,
    /** page inset used by local modules */
    inset: bp === "phone" ? 16 : bp === "tablet" ? 24 : 32,
  };
}
