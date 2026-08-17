import { DISHES } from "@/lib/dishes";
import { fetchDishIngredients } from "@/lib/mealdb";
import RecipesClient from "@/components/RecipesClient";

export default async function RecipesPage() {
  const ingredientsByDish = await fetchDishIngredients(DISHES);
  return <RecipesClient ingredientsByDish={ingredientsByDish} />;
}
