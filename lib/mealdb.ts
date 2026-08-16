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
