import { byStartAt } from "./dates";
import { draftDedupKey, eventDedupKey, normalizeTitle } from "./dedup";
import { africaWatchEvents, events, nigeriaEvents } from "./events";
import { seedSources } from "./sources";
import { reconcileSources } from "./sourcesCore";
import { loadPendingSubmissions, type PendingSubmission } from "./storage";
import type { EventDraft, HunterLog, HunterSource, SolarEvent } from "./types";

/**
 * Review-queue storage (localStorage MVP).
 * The hunter + public submit form write DRAFTS here; a human publishes
 * approved drafts into "solarpulse-published"; the public calendar merges
 * code-seeded events with that published list.
 */

export const INBOX_KEY = "solarpulse-inbox";
export const PUBLISHED_KEY = "solarpulse-published";
export const SOURCES_KEY = "solarpulse-sources";
export const HUNTER_LOG_KEY = "solarpulse-hunter-log";
export const REVIEW_EVENT = "solarpulse:review";
export const PUBLISHED_ID_PREFIX = "pub-";

const isBrowser = (): boolean => typeof window !== "undefined";

/**
 * Stable empty snapshots. useSyncExternalStore compares snapshots with
 * Object.is, so server/fallback values must be the same reference every call.
 */
export const EMPTY_EVENTS: SolarEvent[] = [];
export const EMPTY_DRAFTS: EventDraft[] = [];
export const EMPTY_SOURCES: HunterSource[] = [];

/**
 * Snapshot-stable parsing: useSyncExternalStore compares getSnapshot results
 * with Object.is, so raw localStorage values are parsed once per raw string
 * change and the parsed reference is reused until the underlying value changes.
 */
const parseCache = new Map<string, { raw: string | null; value: unknown }>();

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const hit = parseCache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: unknown = fallback;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      value = fallback;
    }
  }
  parseCache.set(key, { raw, value });
  return value as T;
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent(REVIEW_EVENT));
}

// ——— Inbox ———

export function loadInbox(): EventDraft[] {
  const list = readJson<EventDraft[]>(INBOX_KEY, []);
  return Array.isArray(list) ? list : [];
}

export function saveInbox(list: EventDraft[]): void {
  writeJson(INBOX_KEY, list);
}

export function updateDraft(id: string, patch: Partial<EventDraft>): EventDraft[] {
  const next = loadInbox().map((d) => (d.id === id ? { ...d, ...patch } : d));
  saveInbox(next);
  return next;
}

// ——— Published ———

export function loadPublished(): SolarEvent[] {
  const list = readJson<SolarEvent[]>(PUBLISHED_KEY, []);
  return (Array.isArray(list) ? list : []).sort(byStartAt);
}

export function savePublished(list: SolarEvent[]): void {
  writeJson(PUBLISHED_KEY, list);
}

export function addPublished(e: SolarEvent): SolarEvent[] {
  const stamped: SolarEvent = { ...e, addedAt: e.addedAt ?? new Date().toISOString() };
  const list = loadPublished().filter((x) => x.slug !== stamped.slug);
  list.push(stamped);
  savePublished([...list].sort(byStartAt));
  return list;
}

/** Newest-first by publish time — powers the "Recently added" block on Home. */
let recentlyAddedCache: { published: SolarEvent[]; value: SolarEvent[] } | null = null;

export function loadRecentlyAdded(): SolarEvent[] {
  const published = loadPublished();
  if (published.length === 0) return EMPTY_EVENTS;
  if (recentlyAddedCache && recentlyAddedCache.published === published) {
    return recentlyAddedCache.value;
  }
  const value = [...published].sort((a, b) =>
    (b.addedAt ?? "").localeCompare(a.addedAt ?? ""),
  );
  recentlyAddedCache = { published, value };
  return value;
}

export interface ReviewCounts {
  published: number;
  draftsTotal: number;
  draftsPending: number;
  draftsAdded: number;
  draftsIgnored: number;
}

let countsCache: { published: SolarEvent[]; inbox: EventDraft[]; value: ReviewCounts } | null = null;

/** Diagnostics for the /about debug line. */
export function loadReviewCounts(): ReviewCounts {
  const published = loadPublished();
  const inbox = loadInbox();
  if (countsCache && countsCache.published === published && countsCache.inbox === inbox) {
    return countsCache.value;
  }
  const value: ReviewCounts = {
    published: published.length,
    draftsTotal: inbox.length,
    draftsPending: inbox.filter((d) => d.status === "pending").length,
    draftsAdded: inbox.filter((d) => d.status === "added").length,
    draftsIgnored: inbox.filter((d) => d.status === "ignored").length,
  };
  countsCache = { published, inbox, value };
  return value;
}

export const EMPTY_COUNTS: ReviewCounts = {
  published: 0,
  draftsTotal: 0,
  draftsPending: 0,
  draftsAdded: 0,
  draftsIgnored: 0,
};

export function findMergedBySlug(slug: string): SolarEvent | undefined {
  const seed = events.find((e) => e.slug === slug);
  if (seed) return seed;
  return loadPublished().find((e) => e.slug === slug);
}

export function getPublishedBySlug(slug: string): SolarEvent | undefined {
  return loadPublished().find((e) => e.slug === slug);
}

function mergeBySlug(seed: SolarEvent[], extra: SolarEvent[]): SolarEvent[] {
  const map = new Map<string, SolarEvent>();
  for (const e of [...seed, ...extra]) map.set(e.slug, e);
  return Array.from(map.values()).sort(byStartAt);
}

let nigeriaMergedCache: { published: SolarEvent[]; value: SolarEvent[] } | null = null;
let africaMergedCache: { published: SolarEvent[]; value: SolarEvent[] } | null = null;

/** Client-only getters — pass a seed fallback for SSR via useClientSignal. */
export function getMergedNigeriaEvents(): SolarEvent[] {
  if (!isBrowser()) return nigeriaEvents;
  const published = loadPublished();
  if (nigeriaMergedCache && nigeriaMergedCache.published === published) {
    return nigeriaMergedCache.value;
  }
  const value = mergeBySlug(nigeriaEvents, published.filter((e) => e.region === "nigeria"));
  nigeriaMergedCache = { published, value };
  return value;
}

export function getMergedAfricaEvents(): SolarEvent[] {
  if (!isBrowser()) return africaWatchEvents;
  const published = loadPublished();
  if (africaMergedCache && africaMergedCache.published === published) {
    return africaMergedCache.value;
  }
  const value = mergeBySlug(africaWatchEvents, published.filter((e) => e.region === "africa"));
  africaMergedCache = { published, value };
  return value;
}

// ——— Sources ———

let sourcesCache: { stored: HunterSource[] | null; value: HunterSource[] } | null = null;

export function loadSources(): HunterSource[] {
  const stored = readJson<HunterSource[] | null>(SOURCES_KEY, null);
  if (sourcesCache && sourcesCache.stored === stored) return sourcesCache.value;
  const value =
    Array.isArray(stored) && stored.length > 0
      ? reconcileSources(stored)
      : seedSources.map((s) => ({ ...s }));
  sourcesCache = { stored, value };
  return value;
}

/** Enabled sources that the hunter can actually fetch, for "Open all sources". */
export function openableSources(): HunterSource[] {
  return loadSources().filter((s) => s.enabled && s.url.startsWith("http"));
}

export function saveSources(list: HunterSource[]): void {
  writeJson(SOURCES_KEY, list);
}

// ——— Hunter log ———

export function loadHunterLog(): HunterLog | null {
  return readJson<HunterLog | null>(HUNTER_LOG_KEY, null);
}

export function saveHunterLog(log: HunterLog): void {
  writeJson(HUNTER_LOG_KEY, log);
}

// ——— Dedup (shared with the server via lib/dedup) ———

export { draftDedupKey, eventDedupKey, normalizeTitle };



export function addDrafts(drafts: EventDraft[]): { added: EventDraft[]; skipped: number } {
  const inbox = loadInbox();
  const keys = new Set<string>([
    ...inbox.map(draftDedupKey),
    ...loadPublished().map(eventDedupKey),
    ...events.map(eventDedupKey),
  ]);
  const added: EventDraft[] = [];
  let skipped = 0;
  for (const d of drafts) {
    const key = draftDedupKey(d);
    if (keys.has(key) || !d.title.trim()) {
      skipped += 1;
      continue;
    }
    keys.add(key);
    added.push(d);
  }
  if (added.length > 0) saveInbox([...inbox, ...added]);
  return { added, skipped };
}

// ——— Helpers ———

export function subscribeReview(cb: () => void): () => void {
  window.addEventListener(REVIEW_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(REVIEW_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function publicEventPath(e: { id: string; slug: string }): string {
  return e.id.startsWith(PUBLISHED_ID_PREFIX) ? `/events/published/${e.slug}` : `/events/${e.slug}`;
}

/** Public submit form → same review queue, marked as a submission. */
export function buildSubmissionDraft(
  s: Omit<PendingSubmission, "id" | "submittedAt">,
): EventDraft {
  return {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `draft-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceName: "Public submission",
    sourceUrl: s.url,
    title: s.title,
    typeGuess: s.type,
    cityGuess: s.city,
    startAtGuess: s.startAt,
    endAtGuess: s.endAt,
    organizerGuess: s.organizer || undefined,
    rawSnippet: [
      `Venue: ${s.venue || "—"}`,
      `Price: ${s.price}${s.priceNote ? ` (${s.priceNote})` : ""}`,
      s.audience.length > 0 ? `Audience: ${s.audience.join(", ")}` : "",
      s.whoShouldGo ? `Who should go: ${s.whoShouldGo}` : "",
      `Contact (private): ${s.contact}`,
    ]
      .filter(Boolean)
      .join("\n"),
    africaWatch: false,
    confidence: "medium",
    status: "pending",
  };
}

/**
 * Recover submissions created by older preview builds that saved only to the
 * legacy `pendingSubmissions` key. Dedup makes this safe to run on every admin
 * panel mount; current submissions already exist in both stores.
 */
export function migratePendingSubmissionsToInbox(): {
  migrated: number;
  skipped: number;
} {
  if (!isBrowser()) return { migrated: 0, skipped: 0 };
  const legacy = loadPendingSubmissions();
  if (legacy.length === 0) return { migrated: 0, skipped: 0 };
  const drafts = legacy.map(({ id, submittedAt, ...payload }) => ({
    ...buildSubmissionDraft(payload),
    id: `submission-${id}`,
    createdAt: submittedAt,
  }));
  const result = addDrafts(drafts);
  return { migrated: result.added.length, skipped: result.skipped };
}
