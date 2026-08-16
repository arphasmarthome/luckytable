import { ALIAS, STAPLES } from "./taxonomy";

export function makeHasIng(pantryNames: string[]) {
  const pantry = pantryNames.map((n) => n.toLowerCase());
  return function hasIng(name: string): boolean {
    const k = String(name).toLowerCase();
    const a = ALIAS[k];
    if (a === "*" || STAPLES.indexOf(k) !== -1) return true;
    const key = a || k;
    return pantry.indexOf(key) !== -1 || pantry.some((p) => key.indexOf(p) !== -1 || p.indexOf(key) !== -1);
  };
}

export function matchDish(ing: [string, string, string][], hasIng: (name: string) => boolean) {
  const short = ing.filter((x) => !hasIng(x[0]));
  const m = Math.round(((ing.length - short.length) / ing.length) * 100);
  return { short, m, full: short.length === 0 };
}
