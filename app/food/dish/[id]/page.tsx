import { notFound } from "next/navigation";
import { DISHES } from "@/lib/dishes";
import { fetchMealDbRecipe } from "@/lib/mealdb";
import DishDetailClient from "@/components/DishDetailClient";

export default async function DishDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = DISHES.find((d) => d.id === id);
  if (!dish) notFound();

  const recipe = dish.mealId ? await fetchMealDbRecipe(dish.mealId) : null;

  return <DishDetailClient dish={dish} recipe={recipe} />;
}

export function generateStaticParams() {
  return DISHES.map((d) => ({ id: d.id }));
}
