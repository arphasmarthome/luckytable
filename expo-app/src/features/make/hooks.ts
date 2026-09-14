/* Selector hooks shared by the Make screens: the pantry slice that readiness depends on and
 * the decorated (match-ranked) catalog. */
import { useMemo } from "react";
import { DISHES } from "./data";
import { decorate, pantryNames, useMakeStore, type Decorated } from "./store";
import { useMakeStrings } from "./strings";

export function usePantrySlice() {
  const stock = useMakeStore((s) => s.stock);
  const recipes = useMakeStore((s) => s.recipes);
  const acquired = useMakeStore((s) => s.acquired);
  const matchMode = useMakeStore((s) => s.matchMode);
  const shots = useMakeStore((s) => s.shots);
  const qty = useMakeStore((s) => s.qty);
  return useMemo(() => ({ stock, recipes, acquired, matchMode, shots, qty }), [stock, recipes, acquired, matchMode, shots, qty]);
}

/** Every dish decorated against the current match source (captured shots or the whole stock). */
export function useDecoratedDishes(): { dishes: Decorated[]; pantry: string[] } {
  const slice = usePantrySlice();
  const { lang } = useMakeStrings();
  return useMemo(() => {
    const pantry = pantryNames(slice);
    return { dishes: DISHES.map((d) => decorate(slice, d, lang, pantry)), pantry };
  }, [slice, lang]);
}
