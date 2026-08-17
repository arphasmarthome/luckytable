import { notFound } from "next/navigation";
import { DISHES } from "@/lib/dishes";
import { fetchMealDbRecipe } from "@/lib/mealdb";
import DishDetailClient from "@/components/DishDetailClient";

export default async function DishDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ match?: string }>;
}) {
  const { id } = await params;
  const { match } = await searchParams;
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) notFound();

  const recipe = dish.mealId ? await fetchMealDbRecipe(dish.mealId) : null;
  const matchMode = match === "photos" ? "photos" : match === "captured" ? "captured" : "stock";

  return <DishDetailClient dish={dish} recipe={recipe} matchMode={matchMode} />;
}

export function generateStaticParams() {
  return DISHES.map((d) => ({ id: d.id }));
}
