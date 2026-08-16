"use client";

import { useState } from "react";
import { useAppState } from "@/lib/AppState";
import { t, nm } from "@/lib/i18n";
import { Dish, dishImg, STEPS } from "@/lib/dishes";
import { MealDbRecipe } from "@/lib/mealdb";
import { ALIAS, ING_ZH, AMT, STAPLES } from "@/lib/taxonomy";
import FoodHeader from "@/components/FoodHeader";

export default function DishDetailClient({ dish, recipe }: { dish: Dish; recipe: MealDbRecipe | null }) {
  const { lang, stock, votes, myVotes, toggleVote, week, toggleMenuTonight, openNewEvent } = useAppState();
  const str = t(lang);
  const zh = lang === "zh";
  const name = (en: string, zhName: string) => nm(lang, en, zhName);

  const [carted, setCarted] = useState(false);

  const ingSource = recipe && recipe.ing.length ? recipe.ing : dish.ing;

  const [checked, setChecked] = useState<boolean[]>(() => {
    const pantry = stock.map((x) => x.name.toLowerCase());
    const hasIng = (n: string) => {
      const k = String(n).toLowerCase();
      const a = ALIAS[k];
      if (a === "*" || STAPLES.indexOf(k) !== -1) return true;
      const key = a || k;
      return pantry.indexOf(key) !== -1 || pantry.some((p) => key.indexOf(p) !== -1 || p.indexOf(key) !== -1);
    };
    return ingSource.map(([ingName]) => hasIng(ingName));
  });

  const toggleIngredient = (ix: number) =>
    setChecked((prev) => prev.map((v, i) => (i === ix ? !v : v)));

  const ings = ingSource.map(([ingName, zhName, amount], ix) => {
    const zhFallback = zhName || ING_ZH[String(ingName).toLowerCase()] || ingName;
    const have = checked[ix];
    return {
      name: ingName,
      label: name(ingName, zhFallback),
      amount: zh ? AMT[amount] || amount : amount,
      mark: have ? "✓" : "+",
      dot: have ? "var(--color-accent-2-600)" : "var(--color-accent)",
      bg: have ? "var(--color-accent-2-100)" : "var(--color-neutral-100)",
      border: have ? "var(--color-accent-2-300)" : "var(--color-accent-300)",
      fg: have ? "var(--color-accent-2-800)" : "var(--color-text)",
      have,
      toggle: () => toggleIngredient(ix)
    };
  });
  const haveCount = ings.filter((i) => i.have).length;
  const pct = Math.round((haveCount / ings.length) * 100);
  const missing = ings.filter((i) => !i.have);

  const voteCount = (votes[dish.id] || 0) + (myVotes.indexOf(dish.id) !== -1 ? 1 : 0);
  const voted = myVotes.indexOf(dish.id) !== -1;

  const menuAdded = week[0].items.some((x) => x[5] === dish.id);

  const dishSteps = (recipe && recipe.steps.length ? recipe.steps : (STEPS[dish.id] || {})[lang] || []).map((text, i) => ({ n: i + 1, text }));

  const missingLine =
    missing.length === 0
      ? str.nothingToBuy
      : str.stillNeed + " " + missing.length + ": " + missing.map((i) => i.label).join(zh ? "、" : ", ");

  const cartLabel =
    missing.length === 0
      ? str.nothingInCart
      : carted
      ? str.addedToCart + " " + missing.length + " " + str.toCart + " ✓"
      : str.addToCart + " " + missing.length + " " + str.toCart;

  return (
    <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FoodHeader title={name(dish.name, dish.zh)} />
      <div className="stack-grid" style={{ flex: "1 1 auto", overflow: "auto", gridTemplateColumns: "1fr clamp(320px,30vw,460px)", gap: "clamp(20px,2vw,36px)", padding: "0 clamp(24px,2.6vw,48px) clamp(24px,2.6vw,44px)", minHeight: 0 }}>
        <section style={{ display: "flex", flexDirection: "column", gap: "clamp(16px,1.5vw,26px)" }}>
          <div className="ph" style={{ position: "relative", overflow: "hidden", flex: "1 1 auto", borderRadius: "var(--radius-lg)", minHeight: "clamp(140px,15vw,260px)", backgroundImage: `url("${dishImg(dish.id)}")`, backgroundSize: "cover", backgroundPosition: "center" }} />

          <div className="stack-grid" style={{ flex: "0 0 auto", gridTemplateColumns: "1fr 1fr", gap: "clamp(12px,1.2vw,20px)" }}>
            <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.famVote}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(20px,1.7vw,28px)", color: "var(--color-accent-2-700)" }}>{voteCount}</span>
              </div>
              <button type="button" onClick={() => toggleVote(dish.id)} style={{ border: `2px solid ${voted ? "var(--color-accent-2)" : "var(--color-neutral-400)"}`, background: voted ? "var(--color-accent-2)" : "var(--color-neutral-100)", color: voted ? "var(--color-accent-2-100)" : "var(--color-text)", borderRadius: "999px", padding: "clamp(10px,0.9vw,15px) clamp(14px,1.2vw,20px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}>
                {voted ? "✓ " + str.voted : str.voteFor}
              </button>
              <span style={{ fontSize: "clamp(12px,0.9vw,15px)", color: "var(--color-neutral-600)" }}>{str.voteLine}</span>
            </div>

            <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", padding: "clamp(14px,1.3vw,22px)", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                <span style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.addMenuTitle}</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => toggleMenuTonight({ id: dish.id, name: dish.name, zh: dish.zh })}
                  style={{ flex: "1 1 auto", border: `2px solid ${menuAdded ? "var(--color-accent)" : "var(--color-neutral-400)"}`, background: menuAdded ? "var(--color-accent)" : "var(--color-neutral-100)", color: menuAdded ? "var(--color-accent-100)" : "var(--color-text)", borderRadius: "999px", padding: "clamp(10px,0.9vw,15px) clamp(14px,1.2vw,20px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}
                >
                  {menuAdded ? "✓ " + str.addedMenu : str.addMenu}
                </button>
                <button
                  type="button"
                  onClick={() => openNewEvent({ evDish: dish.id, evDay: 0, evWho: "dad", evTime: "18:30" })}
                  style={{ flex: "1 1 auto", border: "2px solid var(--color-accent-2-600)", background: "var(--color-accent-2-100)", color: "var(--color-accent-2-800)", borderRadius: "999px", padding: "clamp(10px,0.9vw,15px) clamp(14px,1.2vw,20px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(14px,1.1vw,19px)", cursor: "pointer", minHeight: 44 }}
                >
                  {str.planDay}
                </button>
              </div>
              <span style={{ fontSize: "clamp(12px,0.9vw,15px)", color: "var(--color-neutral-600)" }}>{str.menuNote}</span>
            </div>
          </div>

          {pct === 100 && (
            <div style={{ flex: "1 1 auto", overflow: "auto", background: "var(--color-accent-2-100)", border: "2px solid var(--color-accent-2-300)", borderRadius: "var(--radius-lg)", padding: "clamp(18px,1.7vw,30px)", display: "flex", flexDirection: "column", gap: "clamp(12px,1.1vw,18px)", minHeight: "clamp(200px,22vw,340px)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(20px,1.7vw,29px)", color: "var(--color-accent-2-800)" }}>{str.recipe}</span>
                <span style={{ fontSize: "clamp(14px,1.1vw,19px)", color: "var(--color-accent-2-700)" }}>{str.allSet}</span>
                <span style={{ marginLeft: "auto", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(20px,1.7vw,29px)", color: "var(--color-accent-2-700)" }}>100%</span>
              </div>
              {dishSteps.map((st) => (
                <div key={st.n} style={{ display: "flex", alignItems: "flex-start", gap: "clamp(12px,1.1vw,18px)" }}>
                  <span style={{ flex: "0 0 auto", width: "clamp(32px,2.6vw,40px)", height: "clamp(32px,2.6vw,40px)", borderRadius: "999px", background: "var(--color-accent-2)", color: "var(--color-accent-2-100)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(15px,1.15vw,20px)" }}>{st.n}</span>
                  <span style={{ fontSize: "clamp(15px,1.2vw,21px)", lineHeight: 1.5, color: "var(--color-accent-2-900)", paddingTop: 3 }}>{st.text}</span>
                </div>
              ))}
              {recipe?.source ? (
                <a href={recipe.source} target="_blank" rel="noopener" style={{ fontSize: "clamp(12px,0.9vw,15px)", color: "var(--color-accent-2-700)", marginTop: 4, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  {"Recipe: TheMealDB · " + (recipe.title || "")}
                </a>
              ) : (
                <div style={{ fontSize: "clamp(12px,0.9vw,15px)", color: "var(--color-accent-2-700)", marginTop: 4 }}>{str.stepsNote}</div>
              )}
            </div>
          )}
        </section>

        <aside style={{ display: "flex", flexDirection: "column", gap: "clamp(14px,1.3vw,22px)" }}>
          <div style={{ flex: "1 1 auto", overflow: "auto", background: "var(--color-neutral-100)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flex: "0 0 auto" }}>
              <span style={{ fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(17px,1.4vw,24px)" }}>{str.readyToCook}</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(24px,2.2vw,38px)", lineHeight: 1, color: "var(--color-accent-700)" }}>{pct}%</span>
            </div>
            <div style={{ height: "clamp(14px,1.2vw,20px)", borderRadius: "999px", background: "var(--color-neutral-300)", overflow: "hidden", flex: "0 0 auto" }}>
              <div style={{ height: "100%", width: pct + "%", background: "var(--color-accent-2)", borderRadius: "999px", transition: "width 240ms ease" }} />
            </div>
            <div style={{ fontSize: "clamp(13px,1.02vw,17px)", color: "var(--color-neutral-700)", flex: "0 0 auto" }}>
              {pct === 100 ? str.allReady : zh ? haveCount + "／" + ings.length + " " + str.ingReady : haveCount + " " + str.ofReady + " " + ings.length + " " + str.ingReady}
            </div>
            <div style={{ borderTop: "1px solid var(--color-neutral-300)", flex: "0 0 auto" }} />
            <div style={{ fontSize: "clamp(12px,0.95vw,15px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-neutral-700)", fontWeight: 700 }}>{str.ingredients}</div>
            {ings.map((ing, ix) => (
              <button
                key={ix}
                type="button"
                onClick={ing.toggle}
                style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", fontFamily: "inherit", width: "100%", border: `2px solid ${ing.border}`, background: ing.bg, borderRadius: "999px", padding: "clamp(10px,0.95vw,15px) clamp(14px,1.3vw,22px)", cursor: "pointer" }}
              >
                <span style={{ width: "clamp(28px,2.3vw,34px)", height: "clamp(28px,2.3vw,34px)", flex: "0 0 auto", borderRadius: "999px", background: ing.dot, color: "var(--color-neutral-100)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9em" }}>{ing.mark}</span>
                <span style={{ fontSize: "clamp(15px,1.2vw,20px)", fontWeight: 600, color: ing.fg }}>{ing.label}</span>
                <span style={{ marginLeft: "auto", fontSize: "clamp(14px,1.1vw,18px)", color: "var(--color-neutral-700)" }}>{ing.amount}</span>
              </button>
            ))}
          </div>
          <div style={{ flex: "0 0 auto", background: "var(--color-accent-100)", border: "2px solid var(--color-accent-300)", borderRadius: "var(--radius-lg)", padding: "clamp(16px,1.5vw,26px)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: "clamp(15px,1.2vw,20px)", color: "var(--color-accent-800)", fontWeight: 600 }}>{missingLine}</div>
            <button
              type="button"
              onClick={() => { if (missing.length) setCarted(true); }}
              style={{ border: missing.length === 0 ? "2px solid var(--color-neutral-400)" : "2px solid var(--color-accent)", background: missing.length === 0 ? "transparent" : "var(--color-accent)", color: missing.length === 0 ? "var(--color-neutral-600)" : "var(--color-accent-100)", borderRadius: "999px", padding: "clamp(13px,1.2vw,20px) clamp(20px,1.8vw,32px)", fontFamily: "var(--disp)", fontWeight: 700, fontSize: "clamp(16px,1.25vw,22px)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              {cartLabel}
            </button>
            <div className="mono" style={{ fontSize: "clamp(11px,0.85vw,14px)", color: "var(--color-accent-700)", textAlign: "center", letterSpacing: "0.04em" }}>shop.pxgo.com.tw</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
