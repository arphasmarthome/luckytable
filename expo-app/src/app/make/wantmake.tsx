/* I want to make…: pick a dish by category; each card says how many ingredients to buy. */
import { useEffect, useMemo } from "react";
import { Page } from "@/components/ui";
import { make } from "@/theme";
import { DishGrid, FilterChips } from "@/features/make/components/DishCard";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { useDecoratedDishes } from "@/features/make/hooks";
import { useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function WantMakeScreen() {
  const { t } = useMakeStrings();
  const nav = useMakeNav();
  const setMatchMode = useMakeStore((s) => s.setMatchMode);
  useEffect(() => {
    setMatchMode("stock");
  }, [setMatchMode]);
  const filter = useMakeStore((s) => s.filter);
  const setFilter = useMakeStore((s) => s.setFilter);
  const openDish = useMakeStore((s) => s.openDish);
  const { dishes } = useDecoratedDishes();
  const list = useMemo(() => (filter === "All" ? dishes : dishes.filter((d) => d.cat === filter)), [dishes, filter]);
  return (
    <Page background={make.background} gap={20}>
      <MakeHeader title={t.titles.wantmake} />
      <FilterChips value={filter} onChange={setFilter} />
      <DishGrid
        dishes={list}
        noteOf={(d) => d.shopNote}
        onOpen={(id) => {
          openDish(id);
          nav.go(`/make/dish/${id}`);
        }}
      />
    </Page>
  );
}
