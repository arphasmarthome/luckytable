/* Recipes: the whole TheMealDB catalog ranked by match against what's in stock, with category filters. */
import { useMemo } from "react";
import { Page } from "@/components/ui";
import { make } from "@/theme";
import { DishGrid, FilterChips } from "@/features/make/components/DishCard";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { MTxt } from "@/features/make/components/ui";
import { useDecoratedDishes } from "@/features/make/hooks";
import { rankDishes, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function RecipesScreen() {
  const { t } = useMakeStrings();
  const nav = useMakeNav();
  const { dishes } = useDecoratedDishes();
  const recipeFilter = useMakeStore((s) => s.recipeFilter);
  const setRecipeFilter = useMakeStore((s) => s.setRecipeFilter);
  const openDish = useMakeStore((s) => s.openDish);
  const list = useMemo(() => {
    const ranked = rankDishes(dishes);
    return recipeFilter === "All" ? ranked : ranked.filter((d) => d.cat === recipeFilter);
  }, [dishes, recipeFilter]);
  return (
    <Page background={make.background} gap={14}>
      <MakeHeader title={t.titles.recipes} />
      <MTxt variant="meta" muted weight="600" style={{ textTransform: "uppercase", letterSpacing: 1 }}>
        {t.recKicker} · {list.length} {t.dishesN}
      </MTxt>
      <FilterChips value={recipeFilter} onChange={setRecipeFilter} />
      <DishGrid
        dishes={list}
        noteOf={(d) => d.note}
        onOpen={(id) => {
          openDish(id);
          nav.go(`/make/dish/${id}`);
        }}
      />
    </Page>
  );
}
