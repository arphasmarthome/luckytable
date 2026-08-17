import { ALIAS } from "./taxonomy";

/* Strips a trailing plural "s" so "green onions" == "green onion" without
   allowing broader substring matches — "granulated sugar" must stay distinct
   from "sugar", and "spring onion" from "green onion". */
function normalize(s: string): string {
  return s.length > 3 && s.endsWith("s") && !s.endsWith("ss") ? s.slice(0, -1) : s;
}

export function makeHasIng(pantryNames: string[]) {
  const pantry = pantryNames.map((n) => normalize(n.toLowerCase()));
  return function hasIng(name: string): boolean {
    const k = String(name).toLowerCase();
    const key = normalize(ALIAS[k] || k);
    return pantry.indexOf(key) !== -1;
  };
}

/* Per-ingredient checked state for one dish: stock match by default,
   overridden per-index by anything the user has manually toggled on
   the dish page (persisted in AppState so it survives navigation). */
export function computeChecks(
  ing: [string, string, string][],
  hasIng: (name: string) => boolean,
  override?: boolean[]
): boolean[] {
  return ing.map(([name], ix) => (override && override[ix] !== undefined ? override[ix] : hasIng(name)));
}

export function matchFromChecks(ing: [string, string, string][], checks: boolean[]) {
  const short = ing.filter((_, ix) => !checks[ix]);
  const m = Math.round(((ing.length - short.length) / ing.length) * 100);
  return { short, m, full: short.length === 0 };
}
