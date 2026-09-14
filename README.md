# SolarPulse NG

**What is happening in Nigerian solar this month.**
The live calendar of solar energy events, tenders, trainings and industry news in Nigeria —
independent industry infrastructure, mobile-first and installable as a PWA.

## What it is

- `/` — Home: this week (computed from the system date in WAT), next 30 days, flagship spotlight, news strip, submit CTA.
- `/events` — Calendar: list grouped by month (soonest first) or month-grid view, with multi-select filters (city, type, price), a confirmed-only toggle (default ON), search across title/organizer/venue, and a separate collapsed **“Also in Africa (not Nigeria)”** section at the bottom.
- `/events/[slug]` — Event detail: WAT times with weekday, venue + map search links, who should go, price, source, plus **Register (external)**, **Add to calendar (.ics with `TZID=Africa/Lagos`)**, **Share** (Web Share API + copy fallback) and **Follow this type/city** (writes to localStorage alerts).
- `/submit` — Submit an event: no login, client-side validation, saves to localStorage `pendingSubmissions` and opens a pre-filled email to `events@solarpulse.ng`.
- `/alerts` — Alert preferences in localStorage (`solarpulse-alerts`): follow cities/types, Monday 07:00 WAT digest copy, Notification API opt-in with graceful fallback, and a copyable digest preview for the next 7 days.
- `/about` — What it is / is not, Nigeria-first rationale, sources, the 14-day unconfirmed rule, partners, contact.

## Stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- PWA: `app/manifest.ts` + hand-rolled `public/sw.js` (network-first navigations, cache-first static assets; offline shows “dates may be stale”)
- Local data only — no backend required to run
- `date-fns` + `date-fns-tz` for all date handling
- `lucide-react` icons
- No auth, no heavy UI libraries

## Run it

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build && npm start
```

Deploying for real (permanent URL, Vercel/Docker/VPS)? See **`DEPLOYMENT.md`** — the sandbox
preview link is temporary by design.

## Adding an event

Events live in **`src/lib/events.ts`** as typed `SolarEvent` records (see `src/lib/types.ts`).
Append a new object with:

- a unique `id` and a **stable kebab-case `slug`** (the slug is the URL — do not rename after publishing),
- `startAt` / `endAt` as ISO strings in WAT,
- `region: "nigeria"` (main calendar) or `"africa"` (renders only in the *Also in Africa* watch section),
- `status`: `"confirmed" | "tentative" | "unconfirmed"`. Confirmed records can additionally be flagged `stale: true`, which drops them to *Unconfirmed* in the UI (the 14-day rule).

News items live in `src/lib/news.ts`.

## WAT note

Every datetime is rendered in **Africa/Lagos (WAT, UTC+1, no DST)** via the helpers in
`src/lib/dates.ts` (`formatInTimeZone`, week ranges computed with a Monday start, `.ics` files
carry `VTIMEZONE`/`TZID=Africa/Lagos`). Never format event dates with the viewer's local zone.

## Status rule

`effectiveStatus()` in `src/lib/dates.ts`:
anything not `confirmed` renders as-is; confirmed records flagged `stale` render as
**Unconfirmed — verify with organizer**. Seed flagship events are never flagged stale.
Footer copy: *“Times in WAT. Curated for Nigeria. Data older than 14 days before an event is
marked Unconfirmed.”*

## Shared notebook (server store)

Approved events are **shared**, not per-browser. The curator approves once and every visitor sees
it.

- **Seed events stay in code** (`src/lib/events.ts`). The server store only holds *extra* events,
  and the two are merged by slug — publishing never replaces or hides a seed event.
- **Storage driver** (`src/lib/server/store.ts`) picks, in order:
  1. **Netlify Blobs** — used automatically once deployed to Netlify (`@netlify/blobs`).
  2. **Server file** under `/data` (`published.json`, `inbox.json`, `sources.json`) — used in this
     preview and on any normal Node/Docker host. Writes are atomic (temp file + rename) and
     serialised per collection so concurrent saves cannot clobber each other.
  3. **Memory** — last resort on a read-only filesystem; reported honestly as *not* shared.
  `/about` shows the result: **“Storage: shared …”** or **“Storage: local preview only”**.
- **localStorage is now only a mirror** for offline/PWA use. The server is the source of truth
  whenever it answers.

### API

| Route | Who | Purpose |
| --- | --- | --- |
| `GET /api/events` | public | extra published events + storage mode |
| `POST /api/events/publish` | **admin** | add/update one published event |
| `GET /api/inbox` | public | review queue |
| `POST /api/inbox` | public | create draft(s) — always forced to `status: "pending"` |
| `POST /api/inbox/:id/add` | **admin** | publish a draft + mark it added |
| `POST /api/inbox/:id/ignore` | **admin** | decline (or move back to waiting) |
| `GET /api/sources` | public | hunter watch list |
| `POST /api/sources` | **admin** | replace the watch list |
| `GET /api/storage` | public | storage mode for the /about badge |

### Who can write

`ADMIN_PIN` is read **only on the server** (`src/lib/server/auth.ts`) and is never bundled into
frontend code. Admin routes accept either the `solarpulse-admin` cookie set by `/api/admin/login`
or an `x-admin-pin` header. After sign-in the typed PIN is held **in memory for that tab only**
(never written to storage) so writes still work in embedded previews that block cookies; refresh
and the cookie takes over.

The public can only read and submit drafts. Everything posted to `/api/inbox` is force-set to
`status: "pending"` and validated/whitelisted server-side, so no submission can publish itself.

## Review queue (hunter + human)

SolarPulse NG has a private curator desk next to the public calendar. The rule that matters:
**the public app never auto-publishes raw hunter results.** A draft only goes live when a human
opens the source and taps Add.

- **Public users never see `/admin`.** It is not in the bottom nav, header, or footer — only a
  small "Curator" text link on `/about`. The desk is gated by a PIN stored in the `ADMIN_PIN`
  env var (default `2468` for local demo only), which sets a `solarpulse-admin=1` httpOnly cookie
  via `/api/admin/login`. The guarded admin layout validates that cookie; in embedded previews
  that block cookies, a same-origin local fallback is set only after the server has accepted the
  PIN, preventing a redirect loop. The fallback protects browser-local data only and is not a
  replacement for real authentication once the queue moves into a database.
- **The hunter is a watch list + parser, not magic.** It fetches the sources seeded in
  `src/lib/sources.ts` ("Run hunter now" on `/admin/inbox`), extracts titles/dates/cities,
  dedupes against the seed calendar, accepted events, *and* existing drafts
  (normalized title + start date + sourceUrl), and writes `EventDraft` records into localStorage
  `solarpulse-inbox`. `/admin/log` shows the last run; `/admin/sources` edits the watch list.
- **Scraping often fails from the browser because of CORS.** When a site refuses the fetch, the
  log says "Could not open this site from the browser. Paste the text instead." — and
  `/admin/paste` is a first-class input (block-of-text or JSON array), not a hack. Week one of
  curation is paste-driven by design.
- **Adding a source:** `/admin/sources` → name, URL (empty = manual source), type → "Add to watch
  list". Stored in localStorage `solarpulse-sources`.
- **How Add works:** the edit drawer requires title, type, start date, city and a source URL —
  plus the "I opened the source page and the date is real." checkbox. Add converts the draft to
  the same `SolarEvent` model as `src/lib/events.ts` and appends it to localStorage
  `solarpulse-published` (ids prefixed `pub-`). The public calendar, home sections and this-week
  bar merge **seed events from code + published events from localStorage** and merge-sort by
  date, so accepted items are visible immediately without a rebuild. Africa-watch drafts can only
  land in the "Also in Africa" section unless the human unchecks the box.
- **Replacing localStorage with a real database later:** swap the bodies of `loadInbox/saveInbox`,
  `loadPublished/savePublished`, `loadSources/saveSources` and `loadHunterLog/saveHunterLog` in
  `src/lib/review.ts` for API routes backed by your DB (the Drizzle/PostgreSQL wiring is already
  in the repo), and move `runHunter` (`src/lib/hunter.ts`) into a Node script or cron route that
  writes `data/inbox.json` / DB rows server-side — server-side fetch also removes the CORS
  limitation. The UI contract stays identical.
- **What it is meant to cost:** "You are the referee. The hunter is the intern." 15–30 minutes a
  day, not all afternoon. Honest limits are stated on `/admin` and `/about`: the hunter only
  watches the source list, cannot see most WhatsApp groups, will miss closed trainings and
  last-minute venue changes, and a human still accepts or declines.

## Out of scope (by design)

Sizing calculators, solar marketplace, IoT/device monitoring, payment/ticketing checkout,
user reviews, full CMS, continent-wide coverage (Africa is a clearly-marked watch section only),
social feed.
