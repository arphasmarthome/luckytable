# Lucky Table · Expo app

React Native / Expo port of the Lucky Table family device prototype (home, 做菜 Make, 健康 health, 行事曆 calendar, 積分 family points, 相框 photo frame, 設定 settings). It runs as a responsive web app (phone and tablet/desktop layouts) and is deployed to Vercel as a static export; the same code base can be built for iOS and Android.

## Run locally

```bash
npm install
npm run web          # Expo dev server on http://localhost:8081
```

`npx expo start` also offers iOS / Android targets (a development build or Expo Go).

## Static web build (what Vercel runs)

```bash
npx expo export --platform web   # writes dist/
```

The repo-root `vercel.json` installs and builds this folder and serves `expo-app/dist`.

## Structure

| Path | Role |
| --- | --- |
| `src/app/` | Expo Router routes: `index` (home), `make/*`, `calendar`, `family`, `health`, `photo-frame`, `settings`; `_layout.tsx` mounts the shell, dialog and toast hosts |
| `src/components/shell/` | Responsive device shell: side rail + status bar ≥ 900 px, compact bar + bottom tabs on phones |
| `src/components/ui/` | UI kit (`Txt`, `Button`, `Card`, `Chip`, `Select`, `Dialog`, `Toast`, …) |
| `src/features/<module>/` | Module logic and screens (Make store + screens, calendar views, family/health, photo frame, home, settings) |
| `src/store/device.ts` | Shared device state (members, diners, events, tasks, rewards, settings); members / diners / settings persist in localStorage |
| `src/i18n/` | Localisation runtime; Traditional Chinese source strings are the message ids, `dictionaries/{en,de,es}.ts` translate them (ported from the prototype) |
| `src/theme.ts`, `src/hooks/use-breakpoint.ts` | Colour tokens and the responsive type scale |

Language: Settings → 顯示與語言, or open with `?lang=en|de|es`. All data is demo data kept in the browser; TheMealDB recipe lookups are the only network calls.
