import { DISHES } from "@/lib/dishes";
import { fetchDishIngredients } from "@/lib/mealdb";
import ResultsClient from "@/components/ResultsClient";

export default async function ResultsPage() {
  const ingredientsByDish = await fetchDishIngredients(DISHES);
  return <ResultsClient ingredientsByDish={ingredientsByDish} />;
}
