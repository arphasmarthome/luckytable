/* "Add dish" modal: the whole catalog ranked by match; tapping toggles the dish on tonight's
 * table (and, while cooking, assigns it to the pane that opened the modal). */
import { useMemo } from "react";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { DISHES, dishById } from "../data";
import { decorate, pantryNames, rankDishes, useMakeStore, type Pane } from "../store";
import { useMakeStrings } from "../strings";
import { DishGrid } from "./DishCard";

function AddDishBody() {
  const { t, lang, dishName } = useMakeStrings();
  const { isPhone, isDesktop } = useBreakpoint();
  const stock = useMakeStore((s) => s.stock);
  const recipes = useMakeStore((s) => s.recipes);
  const acquired = useMakeStore((s) => s.acquired);
  const matchMode = useMakeStore((s) => s.matchMode);
  const shots = useMakeStore((s) => s.shots);
  const qty = useMakeStore((s) => s.qty);
  const tonight = useMakeStore((s) => s.tonight);
  const pickDish = useMakeStore((s) => s.pickDish);
  const list = useMemo(() => {
    const slice = { stock, recipes, acquired, matchMode, shots, qty };
    const pantry = pantryNames(slice);
    return rankDishes(DISHES.map((d) => decorate(slice, d, lang, pantry)));
  }, [stock, recipes, acquired, matchMode, shots, qty, lang]);
  return (
    <DishGrid
      dishes={list}
      cols={isPhone ? 1 : isDesktop ? 3 : 2}
      photoHeight={150}
      highlightIds={tonight}
      noteOf={(d) => `${tonight.includes(d.id) ? "✓ " + t.addedMenu + " · " : ""}${d.note}`}
      onOpen={(id) => {
        if (pickDish(id)) toast(`${t.addedMenu}: ${dishName(dishById(id))}`);
      }}
    />
  );
}

export function openAddDishModal(title: string, pane: Pane = "") {
  useMakeStore.getState().setModalPane(pane);
  dialog.show({ title, wide: true, body: () => <AddDishBody />, onClose: () => useMakeStore.getState().setModalPane("") });
}
