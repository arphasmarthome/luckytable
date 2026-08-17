# Lucky Table — handoff

## What's in this package

- `Lucky Table.dc.html` — the working prototype. Open directly in a browser; no build step.
  Contains the whole app:
  - **Left rail** (dark) — Home / Make / Recipes / Calendar / Family, with the EN / 繁中 switch
    at the bottom.
  - **Home** — "Tonight's table" (full first column; lists every dish planned for tonight),
    "This week's dishes", family list + "Everyone's vote" (per-dish tallies, fed by votes cast
    on dish pages). Dates are computed from the real current date (today + 6 days).
  - **Make** (was Food) — capture → scan review → "What can I make" / "Make using everything
    I have" → dish detail → what's in stock → share. Dish detail combines Ready-to-cook +
    Ingredients in one card, and has **Family vote**, **Add to menu** (adds the dish to
    tonight's calendar — reflected on Home and in the Calendar banner) and **Plan for a day**
    (opens the New-event modal pre-filled).
  - **Recipes** — every dish ranked by match against current stock; opens dish detail.
  - **Calendar** — Week / Month toggle, per-member filtering, "What to eat tonight" banner
    (multiple dishes), **+ New event** modal (day / time / who's cooking / dish-or-custom).
    Events live in `state.week`, keyed off the real date.
  - **Family** — "Cooking together" banner, member cards with **Will cook this week** day
    toggles (M T W R F S S; overlapping days get an accent ring; persisted in
    `localStorage["luckytable-cook"]` and reset every Sunday at midnight), add / remove
    members, editable likes / dislikes / allergies (remove on tap; add via field picker +
    input + suggestions), shared-preference panel.

  The page ground is white via a single `--page` custom property declared in the file; every
  other colour comes from Organic tokens.
- `support.js` — runtime the prototype needs. Keep it beside the HTML file.
- `_ds/organic-.../` — the Organic design system (tokens + stylesheet). `styles.css` is the
  source of truth for colour, type, spacing, radius, shadow.
- `data/food-categories.json` — item taxonomy (Vegetable, Fruit, Grain, Protein, Condiment,
  Herb, Dairy) with source URLs.
- `github.md` — repo association record.

## External services already wired

- **TheMealDB** (`themealdb.com`) — free recipe + photo API, no key.
  - Ingredient photos: `/images/ingredients/<Name>.png`
  - Dish photos: `/images/media/meals/<file>.jpg`
  - Recipe lookup: `/api/json/v1/1/lookup.php?i=<mealId>`
  Dish `mealId`s are in the `DISHES` array in the prototype's script block.
- **PX Go** (`shop.pxgo.com.tw`) — referenced in the cart handoff, not yet integrated.

## Porting to Next.js (App Router)

1. `npx create-next-app@latest luckytable --ts --app`
2. Copy `_ds/organic-*/styles.css` to `app/organic.css` and import it in `app/layout.tsx`.
   Keep using its CSS variables; don't hard-code hexes.
3. One route per rail section:
   - `app/page.tsx` → dashboard
   - `app/food/...` → the Food flow (capture, review, results, dish, stock, share)
   - `app/calendar/page.tsx`, `app/family/page.tsx`
   The rail becomes a shared component in `app/layout.tsx`.
4. Lift the prototype's script block into modules:
   - `lib/taxonomy.ts` — `CAT`, `TAXONOMY`, `categoryOf()`, `ALIAS`, `ING_ZH`
   - `lib/dishes.ts` — `DISHES`, `DISH_IMG`, `ING_IMG`, `dishImg()`, `ingImg()`
   - `lib/i18n.ts` — the `STR` object (en / zh); swap for `next-intl` if you want routing by locale
   - `lib/mealdb.ts` — the recipe fetch, ideally as a server-side `fetch` with
     `next: { revalidate: 86400 }` so recipes are cached rather than pulled per client.
5. Add `images.remotePatterns` for `www.themealdb.com` in `next.config.js` if you use
   `next/image`.
6. State that is currently `this.state`: stock, captured items, language, section, week
   (calendar events), votes, family members + prefs, will-cook days.
   For a real product move stock + family + calendar + votes to a database (Supabase or
   Vercel Postgres); language belongs in a cookie or the URL segment. The weekly will-cook
   reset (currently a localStorage week-stamp, Sunday-midnight boundary) becomes a scheduled
   job or a computed week key in the DB.

## Still to build

- Real camera capture (the viewfinder is simulated; each press reveals a scripted frame).
- Real image recognition for itemising ingredients.
- Location detection for fridge vs. store (currently a fixed state).
- PX Go cart integration.
- Voting is single-user in the prototype (`myVotes` toggles on top of seed counts) — real
  multi-user voting needs per-member identity + shared storage.
- Removing a family member keeps their past calendar events (shown as "Everyone"); decide
  whether deletion should cascade.

## Deploy

Push to `github.com/talo1019/luckytable`, then import the repo in Vercel.
Vercel auto-detects Next.js; no build config needed.

Note: rotate the GitHub token and password that were shared in chat.
