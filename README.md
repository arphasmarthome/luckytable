# Lucky Table

Family kitchen / calendar device app — home, 做菜 Cook, 健康 Health, 行事曆 Calendar, 積分 Points, 相框 Photo frame and Settings — built with Expo (React Native + Expo Router). It runs as a responsive web app (phone and tablet/desktop layouts) deployed to Vercel, and the same code base can be built for iOS and Android.

## Run locally

```bash
cd expo-app
npm install
npm run web
```

Opens on http://localhost:8081. `npx expo start` also offers iOS / Android targets.

## Deploy

The root `vercel.json` installs and builds `expo-app/` (`npx expo export --platform web`) and serves `expo-app/dist`; every push to `main` redeploys.

## Language

Settings → 顯示與語言, or open with `?lang=en`, `?lang=de` or `?lang=es`. Traditional Chinese source strings are the message ids; translations live in `expo-app/src/i18n/dictionaries/`.

See `expo-app/README.md` for the project structure.

## Phone RSVP (Settings › Link phone)

Family members answer "joining dinner tonight?" from their phone: Settings › Device & data › Manage link shows a QR code / link to `/phone?device=<Device ID>`. The page needs no app install. The device and the phones talk through the serverless relay in `api/rsvp.js`:

- On Vercel it deploys automatically next to the static export. State is kept in the function instance's memory unless `KV_REST_API_URL` and `KV_REST_API_TOKEN` are set (Vercel KV / Upstash Redis REST), in which case replies persist for 3 days.
- For local development run `npm run rsvp:dev` inside `expo-app/` (relay on http://localhost:8787); the Expo dev server on :8081 uses it automatically. `EXPO_PUBLIC_RSVP_API` overrides the relay URL.
