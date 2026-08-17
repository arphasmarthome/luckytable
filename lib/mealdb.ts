import { Dish } from "./dishes";

export type MealDbRecipe = {
  ing: [string, string, string][];
  steps: string[];
  source: string;
  title: string;
};

/* Server-side fetch, cached for a day so recipes aren't pulled per client. */
export async function fetchMealDbRecipe(mealId: string): Promise<MealDbRecipe | null> {
  if (!mealId) return null;
  try {
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/lookup.php?i=" + mealId, {
      next: { revalidate: 86400 }
    });
    const j = await res.json();
    const m = (j.meals || [])[0];
    if (!m) return null;

    const ing: [string, string, string][] = [];
    for (let i = 1; i <= 20; i++) {
      const n = m["strIngredient" + i];
      if (n && String(n).trim()) {
        ing.push([String(n).trim(), "", String(m["strMeasure" + i] || "").trim()]);
      }
    }

    const raw = String(m.strInstructions || "")
      .split(/\r?\n+/)
      .map((x: string) => x.trim().replace(/^\d+[.)]?\s*/, ""))
      .filter((x: string) => x.length > 2);
    const steps: string[] = [];
    raw.forEach((line: string) => {
      if (/:$/.test(line) && line.length < 60) {
        steps.push(line);
      } else if (steps.length && /:$/.test(steps[steps.length - 1]) && steps[steps.length - 1].length < 60) {
        steps[steps.length - 1] += " " + line;
      } else {
        steps.push(line);
      }
    });

    return {
      ing,
      steps,
      source: m.strSource || "https://www.themealdb.com/meal/" + mealId,
      title: m.strMeal
    };
  } catch {
    return null;
  }
}

/* Ingredient list per dish, using the live TheMealDB recipe when it's
   reachable and falling back to the seed list otherwise — the same
   source of truth the dish-detail page uses, so match percentages
   computed from this list line up with "Ready to cook" there. */
export async function fetchDishIngredients(dishes: Dish[]): Promise<Record<string, [string, string, string][]>> {
  const entries = await Promise.all(
    dishes.map(async (d) => {
      const recipe = d.mealId ? await fetchMealDbRecipe(d.mealId) : null;
      return [d.id, recipe && recipe.ing.length ? recipe.ing : d.ing] as const;
    })
  );
  return Object.fromEntries(entries);
}
