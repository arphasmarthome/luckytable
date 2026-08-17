# Lucky Table

Family kitchen app for tablet (landscape) and phone. Three ways in: **What can I make**,
**I want to make**, **Share** — sitting inside a four-section shell: Home, Food, Calendar,
Family.

## Run the app

The Next.js port lives at the repo root (`app/`, `lib/`, `components/`).

```bash
npm install
npm run dev
```

## Run the original prototype

Open `Lucky Table.dc.html` in a browser. No install, no build. `support.js` must stay
beside it. It remains in the repo as the design reference — see `CLAUDE.md` (working
rules) and `HANDOFF.md` (file map, external APIs, what's still simulated).

## Deploy

Push to `github.com/talo1019/luckytable`; Vercel builds from `main`.

## Security note

A GitHub token and account password were shared during the design session. Rotate both
before this repo goes public.
