import { useAppState } from "./AppState";
import { SHOTS, ITEMS, ingImg } from "./dishes";
import { nm } from "./i18n";

export function useCaptured() {
  const { shots, qty, lang, incCapturedQty, decCapturedQty } = useAppState();

  const base: Record<string, number> = {};
  for (let i = 0; i < shots && i < SHOTS.length; i++) {
    SHOTS[i].items.forEach(([n, q]) => {
      base[n] = (base[n] || 0) + q;
    });
  }

  const captured = Object.keys(base).map((name) => {
    const meta = ITEMS[name];
    const q = qty[name] !== undefined ? qty[name] : base[name];
    return {
      name,
      label: nm(lang, name, meta.zh),
      cat: lang === "zh" ? meta.cat : meta.cat,
      unit: meta.unit,
      confLabel: meta.conf + "% " + (lang === "zh" ? "把握" : "match"),
      img: ingImg(name),
      qty: q,
      inc: () => incCapturedQty(name, base[name]),
      dec: () => decCapturedQty(name, base[name])
    };
  });

  const lastShot = shots > 0 ? SHOTS[Math.min(shots, SHOTS.length) - 1] : null;
  const boxes = lastShot
    ? lastShot.boxes.map(([n, left, top, w, h, color]) => ({ label: nm(lang, n, ITEMS[n].zh), left, top, w, h, color }))
    : [];

  const totalUnits = captured.reduce((a, c) => a + c.qty, 0);

  return { captured, boxes, totalUnits };
}
