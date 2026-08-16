# Lucky Table — project instructions

## What this repo is

A working HTML prototype of Lucky Table, plus the design system it was built on. The job is
to port it to **Next.js (App Router, TypeScript)** and deploy on Vercel.

- `Lucky Table.dc.html` + `support.js` — the prototype. Open the HTML directly in a browser
  to see the intended behaviour. Treat it as the spec: layout, copy, interactions, and the
  EN / 繁中 strings are all there.
- `_ds/organic-fbf72441-e2d6-4515-b78c-8db8041672fe/styles.css` — the Organic design system.
  Colour, type, spacing, radius and shadow all come from its CSS variables.
- `data/food-categories.json` — ingredient taxonomy.
- `HANDOFF.md` — the porting plan, external APIs, and the list of what's still simulated.

## Rules

- **Never hard-code colour, font, spacing or radius values.** Use the Organic CSS variables
  (`--color-accent`, `--color-neutral-300`, `--radius-lg`, `--font-body`, …). The one exception
  is `--page` (white page ground), declared once in the prototype — carry it over as a single
  variable, don't scatter `#fff`.
- The left rail is dark (`--color-neutral-900`) with an orange active pill; the content area is
  white; cards stay warm (`--color-neutral-100` / `--color-surface`).
- Target is **tablet landscape first** (roughly 1366×768 to 1920×1080), phone portrait second.
  Sizes in the prototype use `clamp()` against viewport width — keep that approach.
- **English is the primary language, Traditional Chinese secondary.** One language visible at
  a time; the switch lives at the bottom of the left rail.
- Touch targets never below 44px.
- Recipe and ingredient photos come from TheMealDB (free, no key). Don't swap in stock photos.

## Structure to build toward

```
app/
  layout.tsx        left rail (Home · Food · Calendar · Family) + language switch
  page.tsx          Home dashboard: tonight, this week's dishes, upcoming, family, votes
  food/             capture → scan review → results → dish detail → stock → share
  calendar/page.tsx week columns, member filter, next up
  family/page.tsx   member profiles, shared preferences, check-ins, staples
lib/
  taxonomy.ts       CAT, TAXONOMY, categoryOf(), ALIAS, ING_ZH
  dishes.ts         DISHES, DISH_IMG, ING_IMG, dishImg(), ingImg()
  family.ts         FAMILY (likes / dislikes / allergies), WEEK, VOTES, STAPLES_LIST
  i18n.ts           the STR object (en / zh)
  mealdb.ts         recipe fetch, server-side with revalidate: 86400
```

All of the above already exist as plain objects inside the prototype's `<script>` block —
lift them, don't rewrite them.

## State

Currently in-memory. For the real product:

- **Stock / inventory** — persist to a database (Supabase or Vercel Postgres). This is the
  core data; everything else reads from it.
- **Language** — cookie or URL segment.
- **Family, calendar** — database, same store as stock.

## Not yet real

Camera capture, image recognition, GPS fridge-vs-store detection, and the PX Go
(`shop.pxgo.com.tw`) cart handoff are all simulated in the prototype. Build them for real;
the prototype only shows the intended UX.

Calendar and Family screens are a first pass and were not copied from the lucky-table.com
demo — confirm their content with the owner before treating them as final.

## Deploy

`github.com/arphasmarthome/luckytable` → Vercel project `arpha-smart-home/luckytable`.
Vercel auto-detects Next.js.
