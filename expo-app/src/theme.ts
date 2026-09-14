import { Platform } from "react-native";

/* Device shell (green) — from prototype/device/lucky-ui.css */
export const shell = {
  ink: "#26352f",
  muted: "#728078",
  line: "#dde5df",
  surface: "#ffffff",
  canvas: "#f5f7f5",
  surfaceMuted: "#f1f5f2",
  green: "#286e57",
  greenHover: "#205b47",
  greenSoft: "#e9f2ed",
  accent: "#286e57",
  coral: "#c58742",
  danger: "#b3413c",
  navText: "#66736b",
  outer: "#dce2de",
  focus: "#d89d32",
  inputBorder: "#ccd8d0",
  weather: "#bc9051",
  statusDot: "#79a18b",
};

/* Make module (orange reference theme) — from prototype/make/styles.css */
export const make = {
  background: "#ffffff",
  surface: "#ffffff",
  surface2: "#f6f6f5",
  sidebar: "#f5f5f5",
  foreground: "#363735",
  muted: "#777876",
  border: "#e4e4e2",
  borderStrong: "#c6c7c2",
  primary: "#f38347",
  primaryHover: "#e8763c",
  primaryPressed: "#db6b31",
  primarySoft: "#fff6ef",
  selectedBorder: "#f3b18d",
  surfacePressed: "#fff0e7",
  inputBorder: "#d4d5d1",
  warm: "#f38347",
  warmSoft: "#fff0e7",
  pink: "#ff4e97",
  violet: "#e855f0",
  green: "#549b83",
  greenSoft: "#e9f4ef",
  danger: "#c85353",
  yellow: "#fff3bf",
  yellowStrong: "#f0d264",
  yellowInk: "#6f5300",
};

/* Photo frame — from prototype/photo-frame/styles.css */
export const frame = {
  canvas: "#f4f7f6",
  surface: "#ffffff",
  surfaceMuted: "#eef3f1",
  ink: "#17201d",
  inkSoft: "#5c6863",
  line: "#d7e1dd",
  green: "#126b55",
  greenDeep: "#0c4438",
  greenSoft: "#e4f1ec",
  coral: "#e85d3f",
  coralSoft: "#fff0eb",
  amber: "#d39718",
  amberSoft: "#fff5d9",
  danger: "#b8403a",
  dangerSoft: "#fff0ef",
};

export const fontFamily = Platform.select<string | undefined>({
  web: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "Microsoft YaHei", system-ui, -apple-system, "Segoe UI", sans-serif',
  default: undefined,
});

export const radius = { sm: 6, md: 8, lg: 12, xl: 20, pill: 999 };
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40 } as const;

/* Base type scale at phone width; useBreakpoint().fs() multiplies it up on tablet / desktop.
   These match the on-screen sizes of the 1920x1080 prototype once its canvas was scaled to fit
   an ordinary window (the "40 % larger" type the web prototype settled on). */
export const typeBase = {
  hero: 40,
  page: 30,
  h1: 30,
  section: 24,
  h2: 22,
  h3: 19,
  card: 20,
  body: 17,
  control: 17,
  nav: 18,
  meta: 15,
  caption: 13,
  timer: 56,
} as const;

/** Blend a hex colour towards white, e.g. tint('#38829b', 0.13) → the light avatar background. */
export function tint(hex: string, ratio: number, base = "#ffffff") {
  const parse = (value: string) => {
    const clean = value.replace("#", "");
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const [r1, g1, b1] = parse(hex);
  const [r2, g2, b2] = parse(base);
  const mix = (a: number, b: number) => Math.round(a * ratio + b * (1 - ratio));
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}

export const shadow = Platform.select({
  web: { boxShadow: "0 3px 14px rgba(20, 44, 38, 0.10)" } as const,
  default: { shadowColor: "#142c26", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3 } as const,
});
