# Deploying SolarPulse NG

## Why the preview link dies

The `https://3000-…….e2b.app` URL is an ephemeral tunnel into the build sandbox. The
subdomain changes on every restart and the tunnel is not meant for sharing. To open the app
"outside here," deploy it to a real host. The app is fully static-friendly — every screen works
serverless (all mutable data lives in the browser's localStorage), so any of these works.

## Environment variables

| Variable       | Required | Notes |
| -------------- | -------- | ----- |
| `ADMIN_PIN`    | Recommended | PIN for `/admin`. If unset **or blank**, the demo fallback `2468` is used. Set your own in production. |
| `DATABASE_URL` | Build-time only | Only `/api/health` touches Postgres. If you don't run a database, set any placeholder (e.g. `postgresql://localhost:5432/placeholder`). Everything else ignores it. |

### Where approved events are stored

| Host | Driver | Shared between visitors? |
| --- | --- | --- |
| **Netlify** | Netlify Blobs (automatic) | Yes |
| **Docker / VPS / plain Node** | file under `/data` | Yes — mount `/data` as a volume so it survives redeploys |
| **Vercel** | filesystem is read-only at runtime → memory | **No.** Use Netlify, or point the store at a database/Blobs before relying on it |

`/about` always states which one is live, so you never have to guess.
| `PORT`         | No       | Hosts like Railway/Fly inject this automatically. |

## Option A — Netlify (recommended: shared notebook works out of the box)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Netlify → **Add new site → Import an existing project** → pick the repo. Next.js is detected
   automatically (build `npm run build`).
3. **Site configuration → Environment variables** → add `ADMIN_PIN` (your own PIN) and
   `DATABASE_URL` = `postgresql://localhost:5432/placeholder`.
4. Deploy. You get `https://your-site.netlify.app` — HTTPS, installable PWA, offline cache.

Netlify Blobs is picked up automatically, so events you approve are stored server-side and every
visitor sees them. Confirm on `/about`: it should read **“Storage: shared (Netlify Blobs)”**.

## Option A2 — Vercel (fine for a read-only calendar)

Same import flow as above, but note: Vercel's runtime filesystem is read-only and Blobs is not
present, so the shared store falls back to memory and `/about` will say **“Storage: local preview
only”**. Seed events, Submit and browsing all work; approvals will not reliably reach other
visitors. Use Netlify or a Docker host if you need the shared notebook.

## Option B — Docker (VPS, Railway, Render, Fly.io)

```bash
docker build -t solarpulse-ng .
# -v keeps the shared notebook (published/inbox/sources) across restarts
docker run -d -p 3000:3000 -e ADMIN_PIN=your-pin \
  -v solarpulse-data:/app/data --name solarpulse solarpulse-ng
```

Put it behind Caddy/Nginx/Traefik with an HTTPS certificate and the PWA + offline cache work.

Railway/Render-style hosts: point them at the repo or this `Dockerfile`; set `ADMIN_PIN` in their
env panel; leave the port to the platform.

## Option C — plain Node server

```bash
node --version        # need Node 20+
npm ci
DATABASE_URL=postgresql://localhost:5432/placeholder ADMIN_PIN=your-pin npm run build
npm start             # serves on PORT (default 3000)
```

## Getting it on your phone (the "app" part)

SolarPulse NG is a PWA: the deployed HTTPS site *is* the app. No APK download needed.

1. Deploy with any option above → you have a permanent `https://…` link.
2. **Android (Chrome):** open the link → ⋮ menu → **Install app** (or *Add to Home screen*).
3. **iPhone (Safari):** open the link → Share → **Add to Home Screen**.

The icon (gold sun ring) lands on your home screen and app drawer; it opens full-screen with no
browser bar, and the calendar keeps working offline after the first visit.

### Optional: a Play Store package (TWA)

If you later want a real Play Store listing, wrap the same HTTPS app — no code changes:

1. Easiest path: paste your HTTPS URL into **pwabuilder.com** — it generates a signed Android
   bundle for you. (CLI alternative: Google's `bubblewrap`.)
2. Play verification needs your domain to prove ownership of the app key: edit
   `public/.well-known/assetlinks.json` (already in this repo) and replace
   `REPLACE_WITH_YOUR_RELEASE_KEY_SHA256_FINGERPRINT` with the SHA-256 fingerprint of your release
   signing key. Bubblewrap prints the fingerprint for you when you build.
3. Deploy the updated site once, then upload the bundle to the Play Console.

## Option D — run it locally on your machine

```bash
npm install
npm run dev           # http://localhost:3000
```

`npm run dev` also works offline-first after the first production start registers the service
worker; install it from the browser menu ("Install app" / "Add to Home screen").

## Notes

- **Mobile install:** open the deployed HTTPS URL in Chrome on Android → menu → *Install app*.
- **Curator data is per-device:** the review inbox, published events, sources and alerts live in
  the browser's `localStorage`, not on the server — redeploying or migrating hosts never moves
  them. The README documents the localStorage → database migration path if you later want
  server-side storage.
- **Service worker:** only registers on HTTPS or `localhost`, in production builds.
