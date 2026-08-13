# Elsewedy Journey

A mobile-first GPS journey guide from your current location to **Elsewedy
Electric Industries** (the Elsewedy Electric East Africa factory in
Kigamboni, Dar es Salaam).

## Quick start (test on your phone)

Geolocation only works over a **secure context** (HTTPS or `localhost`).
Plain `http://<lan-ip>:5173` on your phone will usually be blocked by the
browser, so pick one of these:

### Option A — easiest: local tunnel (recommended for the morning test)

```bash
npm install
npm run dev
```

In a second terminal:

```bash
npx localtunnel --port 5173
```

(or use `ngrok http 5173` if you have ngrok installed). Open the
`https://...` URL it gives you on your phone.

### Option B — same Wi-Fi, self-signed HTTPS (built in)

```bash
npm install
npm run dev:https
```

Find your computer's LAN IP (e.g. `ifconfig` / `ipconfig`) and visit
`https://<your-computer-lan-ip>:5173` on your phone (same Wi-Fi). Your
phone's browser will warn about the self-signed certificate — tap
through "Advanced" → "Proceed" (wording varies by browser). This only
needs to be accepted once per device.

On Windows (PowerShell), set the env var separately if `HTTPS=true vite`
doesn't work in your shell: `$env:HTTPS="true"; npx vite --host`.

### Option C — deploy

Run `npm run build`, then deploy the `dist/` folder to any static host
(Vercel, Netlify, GitHub Pages, etc.) — those are HTTPS by default, so
this is the most reliable option once you're past local testing.

## What the prototype does

1. Requests location permission on load.
2. Uses your current GPS position as the starting point — no typing required.
3. Uses **Elsewedy Electric Industries** as a fixed destination (see
   `src/data/destination.js`).
4. Fetches a route from the free OSRM routing service for the first
   prototype (`src/services/routeTracking.js`) — see "Switching to a
   predefined route" below to replace this later.
5. Tracks your position continuously with `navigator.geolocation.watchPosition`.
6. Shows distance remaining, ETA, and current speed, updating live.
7. Detects arrival within a configurable radius and shows a full-screen
   "🎉 YOU HAVE ARRIVED" message automatically.

## Project structure

```
src/
├── components/     # UI only — no GPS/route logic
│   ├── Map.jsx
│   ├── NavigationStatus.jsx
│   ├── JourneyInfo.jsx
│   ├── CheckpointCard.jsx
│   └── ArrivalScreen.jsx
├── data/
│   ├── destination.js      # ELSEWEDY_ELECTRIC — edit coordinates here
│   ├── checkpoints.js      # static checkpoint list (empty for now)
│   ├── route.js            # loads public/route.json if present
│   └── navigationStates.js # NAV_STATE enum
├── services/
│   ├── gps.js               # Geolocation API wrapper + error handling
│   ├── distance.js          # Haversine + point-to-route projection
│   ├── eta.js                # ETA calculation, speed smoothing
│   ├── routeTracking.js      # route source selection + deviation check
│   └── checkpointTracking.js # checkpoint state machine
├── App.jsx           # wires everything together
└── index.css
```

## Switching to your predefined route

Once you've traced the real route in a mapping tool:

1. Export it as ordered `latitude`/`longitude` points.
2. Save it as `public/route.json` (see `public/route.json.example` for
   the exact shape).
3. Reload the app — `src/data/route.js` automatically prefers this file
   over the auto-generated OSRM route. Nothing else needs to change.

## Adding checkpoints

Edit `src/data/checkpoints.js` and add objects in journey order:

```js
{
  id: 'checkpoint-1',
  name: 'Kigamboni Ferry Terminal',
  latitude: -6.8283,
  longitude: 39.2925,
  radius: 100,       // meters
  message: '📍 You have reached Kigamboni Ferry Terminal.',
  order: 1
}
```

The tracking logic in `services/checkpointTracking.js` handles detection,
completion, and auto-advancing to the next checkpoint — no UI changes
needed.

## Install to home screen (optional but recommended)

The app includes a manifest and icon, so once it's open in a mobile
browser you can add it to the home screen (Safari: Share → "Add to Home
Screen"; Chrome: menu → "Add to Home screen/Install app"). It then
launches full-screen without browser chrome, which is nicer for
glancing at while walking or driving.

## Notes

- No database, no accounts, no backend — everything is static/local.
- Tile provider is OpenStreetMap's standard tile server; fine for
  testing, but for production use consider a provider with a usage
  policy suited to expected traffic (e.g. MapTiler, Stadia Maps).
- Route deviation tolerance and destination arrival/approach radii are
  each tunable in `src/data/destination.js` and `src/data/route.js`.

## Deploying to Netlify (continuous deploy from GitHub)

1. Commit and push your changes to the GitHub repository.
2. In Netlify, click "New site from Git" and connect your GitHub account.
3. Select the `Rol-py/Elsewedy-journey-` repository and pick the branch to deploy.
4. Set the build command to `npm run build` and the publish directory to `dist`.
5. Enable automatic deploys (Netlify does this by default) so every push keeps the live site updated.

Note: Add your logo file to `public/elsewedy-logo.png` (the app references `/elsewedy-logo.png`). If you want a PNG and an SVG, add both and update `index.html` accordingly.
