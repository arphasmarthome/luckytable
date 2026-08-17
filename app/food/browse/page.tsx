import { DISHES } from "@/lib/dishes";
import { fetchDishIngredients } from "@/lib/mealdb";
import BrowseClient from "@/components/BrowseClient";

export default async function BrowsePage() {
  const ingredientsByDish = await fetchDishIngredients(DISHES);
  return <BrowseClient ingredientsByDish={ingredientsByDish} />;
}
