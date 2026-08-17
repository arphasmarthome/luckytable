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
target). Recent work has mostly been mobile-layout bugfixes and a data-consistency fix
for match percentages — see `git log` for the detailed history, this file only tracks
things future work needs to know, not a changelog.

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
in-memory** — a refresh resets it (except will-cook days, which persist to
`localStorage["luckytable-cook"]` and reset weekly). Per `HANDOFF.md`, moving this to a
real database (Supabase / Vercel Postgres) is planned but not started.

Because it's a single Context mounted once in the root `layout.tsx`, this state survives
client-side navigation (`<Link>`, `router.back()`) between any pages — it only resets on
a hard reload. Several bugs have come from forgetting this and putting per-dish or
per-screen state in local `useState` instead, which silently resets on every navigation.
When in doubt about whether something needs to live in AppState vs. local state: if the
user could reasonably navigate away and back and expect to see it unchanged, it belongs
in AppState.

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

## Conventions (hard rules, from CLAUDE.md)

- **Never hard-code color, font, spacing, or radius.** Use the Organic CSS variables
  (`--color-accent`, `--color-neutral-300`, `--radius-lg`, `--font-body`, …). The one
  exception is `--page` (white page ground), declared once in `app/globals.css`.
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
