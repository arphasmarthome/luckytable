# Project context — Lucky Table

Shared reference for any agent working in this repo (Claude Code, Codex, or a human).
The user edits with both Claude Code and Codex, not simultaneously — this file is how
each tool picks up what the other one did. **Read this before making changes. Update it
whenever you change architecture, the dev workflow, a load-bearing convention, or overall
project status** — not for every commit, just things a fresh agent would otherwise have
to rediscover.

## What this is

A family-kitchen dashboard: what to cook tonight, a stock/pantry list, a shared calendar,
and family member profiles with likes/dislikes/allergies. Originally a static HTML
prototype (`Lucky Table.dc.html` + `support.js`, still in the repo as the design
reference — do not delete), now ported to a real Next.js app living at the repo root.

## Status (as of 2026-08-17)

The Next.js port is complete and deployed. All screens from the prototype exist as real
routes. The app is responsive from phone portrait through tablet landscape (the original
target). `DISHES` now has 134 dishes (6 hand-picked originals + 128 pulled from
TheMealDB across 14 categories) and the ingredient taxonomy covers ~1,100 fruit/
vegetable/condiment names. Recent work has mostly been mobile-layout bugfixes, a
data-consistency fix for match percentages, and this catalog expansion — see `git log`
for the detailed history, this file only tracks things future work needs to know, not a
changelog.

Not yet done / still simulated (unchanged from the original prototype, see `HANDOFF.md`):
camera capture, real image recognition, GPS fridge-vs-store detection, PX Go cart
handoff. Stock/family/calendar state is in-memory client state (`lib/AppState.tsx`), not
a database — see "State" below.

## Repo / deploy

- GitHub: `github.com/talo1019/luckytable` (transferred from `arphasmarthome/luckytable`
  on 2026-08-17 — same repo, same history, new owner). Remote `origin` on this machine
  already points at the new URL.
- Vercel project: was connected to the old `arphasmarthome/luckytable` repo. Whether it
  auto-followed the transfer or needs to be reconnected to `talo1019/luckytable` in the
  Vercel dashboard is **unverified** — check this before assuming deploys are live.
- Pushing requires a GitHub PAT with **Contents: Read and write** on this repo (a
  fine-grained token scoped read-only will authenticate fine but get a 403 on push —
  this bit us once already). Get a fresh token from whoever owns the current GitHub
  account if push starts failing with a 403.

## Architecture

Next.js 15 (App Router, TypeScript), React 19. No database yet — see "State" below.

```
app/
  layout.tsx            Rail (nav) + ContentFrame + NewEventModal, all wrapped in AppStateProvider
  globals.css            imports organic.css, defines --page, and all the responsive/mobile CSS classes
  organic.css             copy of the Organic design system stylesheet — don't hand-edit, re-copy from _ds/ if it changes
  page.tsx                Home dashboard
  recipes/page.tsx         Recipes — SERVER component, fetches ingredient data, renders RecipesClient
  calendar/page.tsx        Calendar (week/month), client component
  family/page.tsx          Family profiles, client component
  food/
    page.tsx                Food home (3 tiles: capture / browse / share)
    capture/page.tsx         Simulated camera capture
    review/page.tsx          "What we found" — review captured items
    results/page.tsx         SERVER component — "What can I make" / "Make using everything I have" (?mode=captured|stock)
    browse/page.tsx          SERVER component — "I want to make…", category filter
    stock/page.tsx            Stock list (swipe-to-delete rows)
    share/page.tsx            Share screen (static, no real sharing wired up)
    dish/[id]/page.tsx        SERVER component — fetches the real recipe, renders DishDetailClient

components/
  Rail.tsx                Left sidebar nav (desktop) / bottom tab bar (mobile, via CSS only)
  ContentFrame.tsx         Sets --disp (display font) based on language; wraps page content
  FoodHeader.tsx           Shared header for /food/* subpages (home/back buttons, title, stock button)
  NewEventModal.tsx        Calendar "+ New event" modal, mounted globally in layout.tsx (not per-page)
  DishDetailClient.tsx     Dish detail screen: ingredient checklist, vote, add-to-menu, recipe steps
  ResultsClient.tsx        Client half of results/page.tsx
  BrowseClient.tsx         Client half of browse/page.tsx
  RecipesClient.tsx        Client half of recipes/page.tsx

lib/
  AppState.tsx            Client React Context — the app's entire in-memory state + actions (see below)
  taxonomy.ts              CAT, TAXONOMY, categoryOf(), ALIAS, ING_ZH, STAPLES — ingredient categorization
  dishes.ts                DISHES (id/mealId/seed ingredients), STOCK seed, SHOTS (capture sim), dishImg()/ingImg()
  family.ts                FAMILY, WEEK_EVENTS, buildWeek(), day/month name tables
  i18n.ts                  STR.en / STR.zh — all UI copy. nm(lang, en, zh) picks the right string.
  mealdb.ts                fetchMealDbRecipe() (single dish), fetchDishIngredients() (all dishes, parallel)
  pantry.ts                makeHasIng(), computeChecks(), matchFromChecks() — shared ingredient-matching logic
  useCaptured.ts           Hook: derives the capture-flow's "detected items" list from AppState
```

### State

Everything lives in `lib/AppState.tsx` (`AppStateProvider`, `useAppState()`), a single
client Context holding: language, stock, calendar week/events, votes, family members +
their prefs/cook-days, capture-flow shots/qty, per-dish ingredient checks
(`checkedByDish`, see below), and the new-event modal's fields. This is **all
in-memory** — a refresh resets it, with two exceptions that persist to `localStorage` and
roll over on a time boundary: will-cook days (`"luckytable-cook"`, resets weekly, see
`cookWeekId()`) and `votes`/`myVotes` (`"luckytable-votes"`, resets daily at midnight, see
`dayId()` — both a load-time check and a live `setTimeout` scheduled for the next local
midnight, since the app might be left open across the boundary). Per `HANDOFF.md`, moving
this to a real database (Supabase / Vercel Postgres) is planned but not started.

**Votes reset daily, everywhere, because there's one shared source.** `votes` (the seeded
per-dish tally) and `myVotes` (dishes *you've* voted for) both live in `AppState`; every
screen that shows a vote count — Home's "Everyone's vote" and each dish page's "Family
vote" — derives it the same way (`votes[dishId] + (myVotes.includes(dishId) ? 1 : 0)`), so
there's nothing to separately keep in sync: reset the shared state once and every screen
reflects it. At each midnight boundary both are cleared to `{}`/`[]` — not reset back to
the `VOTE_SEED` starting numbers, since that seed was only ever a first-load demo baseline,
not a value to return to daily.

Because it's a single Context mounted once in the root `layout.tsx`, this state survives
client-side navigation (`<Link>`, `router.back()`) between any pages — it only resets on
a hard reload. Several bugs have come from forgetting this and putting per-dish or
per-screen state in local `useState` instead, which silently resets on every navigation.
When in doubt about whether something needs to live in AppState vs. local state: if the
user could reasonably navigate away and back and expect to see it unchanged, it belongs
in AppState.

**Estimated cook time.** TheMealDB's free API doesn't give a prep/cook time field, so
`estimateMinutes(ing, cat)` in `lib/dishes.ts` derives one from what we do have: a
per-category base (a stir-fry/side is fast, a braise/bake is slow — see
`CATEGORY_BASE_MINUTES`) plus 2 minutes per ingredient past the first four, rounded to the
nearest 5. It's a heuristic, not a measurement — don't present it as more precise than that.
Shown as a small "⏱ N min" pill under the match-% pill on every dish card (Browse, Recipes,
Results) and under the "Ready to cook" percentage on the dish page; `str.minLabel` is the
localized unit ("min" / "分鐘"). If a real time source shows up later (TheMealDB tags,
a different API), replace `estimateMinutes` — don't bolt a second, disagreeing number on
next to it.

### Recipe data — one fetch, one source of truth

`DISHES` in `lib/dishes.ts` has a short **seed** ingredient list per dish (used only as
a fallback). The real ingredient list comes from TheMealDB, fetched server-side via
`fetchMealDbRecipe()` / `fetchDishIngredients()` in `lib/mealdb.ts`, cached with
`next: { revalidate: 86400 }`.

**Every screen that shows a match % or ingredient list must use the same fetched data**,
or the numbers disagree between screens (this happened once — Recipes/results pages used
the seed list while the dish page used the live recipe, so match % changed the moment you
opened a dish; fixed 2026-08-17). The pattern: the route's `page.tsx` is an `async` Server
Component that calls `fetchDishIngredients(DISHES)` (or `fetchMealDbRecipe()` for a single
dish) and passes the result as a prop into a `"use client"` component that does the
interactive part. Follow this pattern for any new screen that matches ingredients against
stock — don't reach for `dish.ing` (the seed list) directly in a client component.

**TheMealDB sometimes lists the same ingredient in two slots** (e.g. cornstarch used once
in the marinade, again in the sauce) — `fetchMealDbRecipe()` merges those by name
(case-insensitive) while building `ing`, before anything downstream sees it (fixed
2026-08-17: dishes were showing e.g. "Cornstarch" twice as two separate checkable rows,
inflating the ingredient count and skewing %). When measures differ, both are kept, joined
with `" + "` (e.g. `"1/2 tsp + 1 tsp"`); when they match exactly, only one copy is kept.
Because this dedup happens inside `fetchMealDbRecipe()` itself, both call sites —
`fetchDishIngredients()` (Recipes/Browse/Results) and the dish page's own direct call —
get the same deduped list for free; don't add a second dedup pass downstream.

**Adding dishes:** `DISHES` has 134 entries (6 original + 128 pulled from TheMealDB across
its 14 categories on 2026-08-17). Every dish needs a real `mealId` from TheMealDB so the
live-fetch/seed-fallback pattern above works — **don't hand-write a dish without one**, and
don't source dish content (names are fine; ingredient lists/instructions are not) from
copyrighted recipe sites like AllRecipes. `id` is a slugified version of the English name;
`cat` is TheMealDB's own category string (`Beef`, `Chicken`, `Dessert`, `Lamb`,
`Miscellaneous`, `Pasta`, `Pork`, `Seafood`, `Side`, `Starter`, `Vegan`, `Vegetarian`,
`Breakfast`, `Goat`, plus the original `Stir-fry`/`Rice bowl`) — any new category needs a
matching entry in `STR.filters` (`lib/i18n.ts`, en *and* zh) and `DISH_FILTER_KEYS`
(`lib/dishes.ts`, shared by the category-filter row on both Browse and Recipes), or dishes
in that category are unreachable by filter.
`DISH_IMG[id]` needs the real thumbnail filename from TheMealDB's `strMealThumb` (the part
after the last `/`) or the dish falls back to a generic broccoli placeholder image.

The dish page lets the user manually check/uncheck individual ingredients (independent of
whether they're actually in stock — this is a deliberate "tick it once you've bought it"
checklist, not just a stock mirror). Per the note above, that per-dish override array is
`checkedByDish[dishId]` in AppState (not local state), so it — and the match % derived
from it — is identical whether you're looking at the dish page, Recipes, or either Make
results mode, and survives navigating between them. The derivation always goes through
`lib/pantry.ts`: `computeChecks(ing, hasIng, checkedByDish[dishId])` layers the override
on top of the stock-based default, then `matchFromChecks(ing, checks)` turns that into
`{ short, m, full }` for the percentage/pill/missing-list. Toggling goes through
`toggleDishIngredient(dishId, ix, fallback)`, where `fallback` is the currently-computed
checks array (so the first toggle on a never-touched dish starts from the right stock-based
baseline instead of all-false). Don't reintroduce a local `useState` for this.
The rendered `ings` list is sorted alphabetically by label (`.sort((a, b) =>
a.label.localeCompare(b.label))`, added 2026-08-17) *after* being built from
`ingSource.map(...)` — each ingredient's `toggle` closure still captures its original
`ingSource`/`checked` index (`ix`) from before the sort, so re-ordering the display never
breaks which ingredient a click toggles. `haveCount`/`missing`/`pct` are all
order-independent derivations of `ings`, so sorting it first doesn't need any other
adjustment downstream.

**`/food/results` ("Using everything I have") is one pantry, split into two sections by
relevance, not two different pantries.** Reached via a single "Let's cook" button on the
Review screen. Every dish's % and checkmarks always come from the *same* combined pantry —
`captured ∪ stock` (`hasIngCombined` in `ResultsClient`) — so an ingredient already in stock
checks off even on a dish that also needs something you just photographed (fixed
2026-08-17: Section 1 used to compute against captured-only, so e.g. "Grits" showed Salt as
missing even though Salt was in stock — the percentage a user sees should never omit stock
just because the dish happens to also touch something they photographed). What splits the
*same* ranking into two sections is `fromPhoto`: a separate captured-only `hasIng` check
(`hasIngPhotosOnly`) used only to test whether **any** of a dish's ingredients would be
satisfied by what was photographed, not to compute the displayed %. Section 1,
`str.fromPhotos` ("From your photos"), is dishes where `fromPhoto` is true — hidden entirely
if nothing's captured, since nothing can match. Section 2, `str.fromCombined` ("Photos +
everything in stock"), is everything else. Both sections are sorted with `sortDishes()`:
**% complete descending, then alphabetical, then least time to make** (alphabetical only
breaks a % tie; time only breaks an alphabetical tie, which almost never visibly fires since
dish names are unique). The page title stays `str.titleAll` regardless of section. The
"Matching from" aside mirrors the same two inputs: captured-photo chips (hidden if empty)
followed by a `str.titles.stock`-labeled section listing full `stock`. Recipes and Browse
are unaffected — they still match against `stock` only, with no captured items involved.

**The dish page has to match whichever pantry the list you clicked from used**, or the
percentage changes the moment you open the dish (this was a real bug, fixed 2026-08-17 —
the dish page used to always read `stock`, ignoring captured mode entirely). `matchMode` is
just `"captured" | "stock"` (a captured-only `"photos"` mode existed briefly earlier the
same day to back Section 1's old captured-only percentage, then was removed once Section 1
switched to the combined percentage — both results sections now correctly link
with `?match=captured`). The mechanism: `app/food/dish/[id]/page.tsx` reads `?match=` from
`searchParams` (so that page is dynamic, not static, despite `generateStaticParams`) and
passes `matchMode` into `DishDetailClient`, which builds `captured ∪ stock`
(`matchMode="captured"`) or plain `stock` (the default) before computing `hasIng`/`checks`.
Recipes/Browse links carry no `match` param and get the `"stock"` default. If you add
another entry point into the dish page that's meant to represent a specific pantry, it
needs to pass `?match=` too — don't assume the dish page's default is always correct.

**Every ingredient must trace to a real `STOCK` row (or a captured item) — no
"always available" sentinel.** `lib/pantry.ts`'s `makeHasIng()` used to treat anything in
`ALIAS` mapped to `"*"`, plus a hard-coded `STAPLES` list, as available no matter what —
so dishes could show an ingredient as checked (Shaoxing Wine, Chicken Bouillon Powder) that
never appeared anywhere in "What's in stock". Removed 2026-08-17: there is no `"*"` sentinel
and no `STAPLES` bypass anymore. `hasIng(name)` only returns true if `name` (after `ALIAS`
lookup and light plural normalization — trailing "s" stripped, so "green onions" ==
"green onion") exactly matches an item actually in the pantry list passed in (`stock` or
`useCaptured()`'s captured items). Salt, sugar, black pepper, white pepper, cooking oil,
sesame oil, cornstarch, and rice wine are real `STOCK` rows for exactly this reason — add a
matching `STOCK` row (or capture the item) for anything that should count, don't add a
bypass.

**Water is the one deliberate exception.** `hasIng()` special-cases `"water"` to always
return true (2026-08-17), regardless of `stock`/`captured` — tap water is genuinely
inexhaustible, unlike a condiment that can run out, so it doesn't need a visible-in-stock
row to justify being always-checked the way salt/sugar do. It's still a real `STOCK` row
(`qty: Infinity`) purely so it's visible on the stock page; removing that row would not
affect matching. If you're ever tempted to add another `hasIng()` special case for a
different ingredient, don't — that's exactly the pattern that was removed above. Water is
the one legitimate exception, not a precedent.

**"What's in stock" (`app/food/stock/page.tsx`) pins Water last, exempt from the
alphabetical sort**, and renders its quantity as "∞" with no +/−/Remove controls
(`StockRow`'s `locked` prop) since adjusting or removing an unlimited resource that's
always-checked regardless is meaningless. `sortedStock` filters Water out before sorting,
then appends it.

**`ALIAS` is for same-product spelling variants only, never for different products.**
`"ground beef": "beef sirloin"` and `"corn starch": "cornstarch"` are fine — same thing,
different phrasing. `"spring onions": "green onion"` was removed because spring onion and
green onion are different ingredients; don't re-add aliases that quietly merge two distinct
things (e.g. don't alias "granulated sugar" to "sugar" — if a dish calls for a specific
variant, it should show as missing until that exact item is stocked). When in doubt, leave
it unaliased rather than folding it into an existing stock item.

"What's in stock" (`app/food/stock/page.tsx`) renders sorted alphabetically by display name
(`sortedStock`, derived from `stock`, not the underlying array order) — keep new stock rows
unsorted in `lib/dishes.ts`; the page does the sorting.

## Conventions (hard rules, from CLAUDE.md)

- **Never hard-code color, font, spacing, or radius.** Use the Organic CSS variables
  (`--color-accent`, `--color-neutral-300`, `--radius-lg`, `--font-body`, …). The one
  exception is `--page` (white page ground), declared once in `app/globals.css`.
- **`--disp` (Caprasimo, set in `ContentFrame.tsx`) is for page-level `<h1>` titles and
  single-character avatar initials only — nothing else.** Caprasimo is loaded at a single
  weight (400, see `app/organic.css`'s `@import`), so any smaller/functional text set in
  `--disp` with `fontWeight: 700` forces the browser to synthesize a fake bold, which reads
  as heavy and blurry at UI sizes — dish-card titles, %/time badges, and buttons were all
  reported illegible for exactly this reason and moved to `var(--font-body)` (Figtree, real
  400/600/700 weights) on 2026-08-17. When adding new UI text: if it's a page's main `<h1>`
  (the `FoodHeader` title, or a page's own `str.xxxTitle` heading) or a lone initial in an
  avatar circle, use `--disp`; anything else — card titles, list-item labels, buttons,
  numbers, pills — use `--font-body`, even if it needs to look bold/prominent.
- Tablet landscape (~1366×768–1920×1080) is the primary target; phone portrait is
  second. Sizes use `clamp()` against viewport width/height — keep that approach for new
  UI rather than fixed px or breakpoint-only values.
- English is the primary language, Traditional Chinese secondary — one visible at a time,
  switch lives at the bottom of the rail (`lib/i18n.ts`, `nm()` helper).
- Touch targets never below 44px.
- Recipe/ingredient photos come from TheMealDB — don't swap in stock photos.

## Mobile responsiveness — how it's built, and the CSS gotchas that bit us

Breakpoint is `860px` (`--bp-mobile` in `globals.css`), phone-specific tweaks nest
further at `400px`. Below 860px: the left rail (`Rail.tsx`) becomes a bottom tab bar
(icon-only below 400px) via the `.rail` / `.rail-link` classes; multi-column screens
collapse to one column via the shared `.stack-grid` class
(`grid-template-columns: 1fr !important` under the breakpoint — applied as a `className`
alongside inline `style`, since only `!important` in an external stylesheet can override
an inline style, and inlining every column value would mean duplicating every grid
container's responsive logic by hand).

Two non-obvious CSS behaviors caused real bugs during this work — know them before
touching layout again:

1. **A scrollable flex/grid item's automatic minimum size is 0**, per the CSS sizing
   spec — regardless of what `min-height` says — whenever that item's `overflow` is
   anything other than `visible`. Several cards used `overflow: auto` intentionally
   (so *that panel* scrolls internally on the tablet single-screen layout) but the
   *same element* also became a shrink-to-zero flex/grid item once the layout went to
   one column on mobile, squashing it into a tiny box that then needed an internal
   scrollbar to reveal content that would otherwise fit on one page. Fixed via the
   `.grow-on-mobile` class, which forces `overflow: visible !important` below 860px so
   the element sizes to its content and the *page* scrolls instead. Reuse this class
   (or the pattern) for any new card that has `overflow: auto` for desktop's benefit.
2. **`overflow-x` and `overflow-y` are coupled**: if you set one axis to something other
   than `visible` and leave the other unset (or explicitly `visible`), the browser
   computes the "visible" one as `auto` too — you cannot have horizontal-scroll-only on
   an element that also needs to report its true content height upward (e.g. so an
   ancestor's `overflow: auto` can scroll the whole page). This silently re-triggers
   gotcha #1 one level up. If you need horizontal scroll on mobile, either give it its
   own dedicated wrapper that isn't also relied on for vertical sizing, or (simpler,
   what we did for the calendar month grid) avoid needing horizontal scroll at all by
   letting columns divide evenly (`minmax(0, 1fr)`) instead of enforcing a min column
   width.
3. **Same-row grid items auto-equalize height; stacked-into-separate-rows items don't.**
   The Make hub's three tiles (`app/food/page.tsx`) sit in one `.stack-grid` row on
   desktop, so CSS Grid stretches all three to the tallest one's height automatically —
   but on mobile, `.stack-grid` collapses to `grid-template-columns: 1fr`, which makes
   each tile its *own* row, and separate grid rows size independently by content, not
   equally. Combined with `justifyContent: "space-between"` (bottom-pin the text block)
   and `margin: "auto"` on the icon (center it in the leftover space), each tile's icon
   ended up at a different vertical position and its title at a different Y depending on
   how many lines that tile's own body copy wrapped to on a narrow screen — even though
   all three tiles use identical code. Fixed 2026-08-17 by decoupling icon/text position
   from total tile height entirely: each icon now sits inside a fixed-height zone
   (`height: "clamp(150px,15vw,210px)"`, icon centered within *that*, not within the
   tile) with plain top-to-bottom flow (no `space-between`, no `margin: auto`) — so the
   icon and the text block that follows it land at the same offset for all three tiles
   regardless of each tile's own content length or total height. Reuse this pattern
   (fixed-height zone + plain flow, not space-between + auto-margin) for any new set of
   cards that must visually align with each other but can't share a grid row on mobile.

## Development workflow

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; also the fastest way to typecheck everything
```

- **Don't run `npm run build` while `next dev` is running against the same `.next`
  directory** — it corrupts the dev server's cache and produces `Cannot find module
  './NNN.js'` / stale-RSC-payload 500 errors that look like a real bug but aren't. If
  you see those, stop the dev server, `rm -rf .next`, and restart it.
- `next.config.mjs` allows images from `www.themealdb.com` — add any new external image
  host there before using `next/image` (currently the app uses plain `<img>` tags with
  `next/image`-style remote patterns configured but unused; either is fine, but if you
  switch to `next/image` the remotePatterns config is already there).
- `.claude/launch.json` and `.claude/` in general are gitignored — local tool config,
  not part of the app.

## Deploying changes

Push to `main`; Vercel (once correctly connected — see "Repo / deploy" above) builds
automatically. No build config needed, Next.js auto-detected.
