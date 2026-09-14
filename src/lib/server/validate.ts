import {
  AUDIENCES,
  EVENT_TYPES,
  PRICE_TYPES,
  type Audience,
  type EventDraft,
  type EventType,
  type HunterSource,
  type PriceType,
  type SolarEvent,
} from "@/lib/types";

/** Whitelisting validators. Public input reaches /api/inbox, so nothing is trusted. */

const MAX_TEXT = 2000;

function str(v: unknown, max = 300): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function isIso(v: unknown): v is string {
  if (typeof v !== "string" || v.length < 10) return false;
  return Number.isFinite(new Date(v).getTime());
}

function isHttpUrl(v: unknown): v is string {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function eventType(v: unknown): EventType | null {
  return typeof v === "string" && (EVENT_TYPES as string[]).includes(v)
    ? (v as EventType)
    : null;
}

function priceType(v: unknown): PriceType {
  return typeof v === "string" && (PRICE_TYPES as string[]).includes(v)
    ? (v as PriceType)
    : "unknown";
}

function audiences(v: unknown): Audience[] {
  if (!Array.isArray(v)) return [];
  return v.filter((a): a is Audience => typeof a === "string" && (AUDIENCES as string[]).includes(a));
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

/** A published calendar entry. Requires the fields the public UI depends on. */
export function validateEvent(input: unknown): Validated<SolarEvent> {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Body must be an object." };
  const o = input as Record<string, unknown>;

  const title = str(o.title, 200);
  if (!title) return { ok: false, error: "title is required." };

  const type = eventType(o.type);
  if (!type) return { ok: false, error: "type must be a known event type." };

  if (!isIso(o.startAt)) return { ok: false, error: "startAt must be an ISO date." };
  const startAt = o.startAt as string;
  const endAt = isIso(o.endAt) ? (o.endAt as string) : startAt;

  const city = str(o.city, 80);
  if (!city) return { ok: false, error: "city is required." };

  if (!isHttpUrl(o.url)) return { ok: false, error: "url must be a public http(s) link." };

  const region = o.region === "africa" ? "africa" : "nigeria";
  const status =
    o.status === "tentative" || o.status === "unconfirmed" ? o.status : "confirmed";

  const slugBase = str(o.slug, 60) || slugify(title) || "event";
  const id = str(o.id, 60) || `pub-${slugBase.slice(0, 24)}`;

  const value: SolarEvent = {
    id,
    slug: slugify(slugBase) || "event",
    title,
    type,
    status,
    startAt,
    endAt,
    region,
    city,
    country: str(o.country, 80) || undefined,
    venue: str(o.venue, 200) || `${city} — see organizer page`,
    organizer: str(o.organizer, 200) || "See organizer page",
    url: o.url as string,
    price: priceType(o.price),
    priceNote: str(o.priceNote, 300) || undefined,
    audience: audiences(o.audience),
    whoShouldGo: str(o.whoShouldGo, MAX_TEXT) || "See the organizer page for details.",
    summary: str(o.summary, MAX_TEXT) || "Accepted from the curator review queue.",
    source: str(o.source, 300) || "Curated via review queue",
    addedAt: isIso(o.addedAt) ? (o.addedAt as string) : new Date().toISOString(),
    verifyNote: str(o.verifyNote, 300) || undefined,
  };
  return { ok: true, value };
}

/**
 * A review-queue draft. `status` is forced to "pending" — the public submit
 * endpoint must never be able to publish straight to the calendar.
 */
export function validateDraft(input: unknown, opts?: { sourceName?: string }): Validated<EventDraft> {
  if (typeof input !== "object" || input === null) return { ok: false, error: "Body must be an object." };
  const o = input as Record<string, unknown>;

  const title = str(o.title, 200);
  if (!title) return { ok: false, error: "title is required." };

  const rawSourceUrl = str(o.sourceUrl, 500);
  const sourceUrl = isHttpUrl(rawSourceUrl) ? rawSourceUrl : "manual://paste";

  const typeGuess = eventType(o.typeGuess) ?? "unknown";
  const confidence =
    o.confidence === "high" || o.confidence === "medium" ? o.confidence : "low";

  const value: EventDraft = {
    id: str(o.id, 80) || `draft-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    createdAt: isIso(o.createdAt) ? (o.createdAt as string) : new Date().toISOString(),
    sourceName: opts?.sourceName ?? (str(o.sourceName, 120) || "Paste dump"),
    sourceUrl,
    title,
    typeGuess,
    cityGuess: str(o.cityGuess, 80),
    startAtGuess: isIso(o.startAtGuess) ? (o.startAtGuess as string) : undefined,
    endAtGuess: isIso(o.endAtGuess) ? (o.endAtGuess as string) : undefined,
    organizerGuess: str(o.organizerGuess, 200) || undefined,
    rawSnippet: str(o.rawSnippet, MAX_TEXT),
    africaWatch: o.africaWatch === true,
    confidence,
    status: "pending",
  };
  return { ok: true, value };
}

export function validateSources(input: unknown): Validated<HunterSource[]> {
  if (!Array.isArray(input)) return { ok: false, error: "Body must be an array of sources." };
  if (input.length > 200) return { ok: false, error: "Too many sources." };

  const out: HunterSource[] = [];
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) continue;
    const o = raw as Record<string, unknown>;
    const name = str(o.name, 120);
    if (!name) continue;
    const url = str(o.url, 500);
    const type =
      o.type === "news" || o.type === "organizer" ? o.type : "events-page";
    out.push({
      id: str(o.id, 80) || `src-${slugify(name)}-${Math.floor(Math.random() * 1e5)}`,
      name,
      url: isHttpUrl(url) ? url : "",
      type,
      enabled: o.enabled !== false,
      lastChecked: isIso(o.lastChecked) ? (o.lastChecked as string) : undefined,
      manual: o.manual === true || !isHttpUrl(url),
      seed: o.seed === true,
    });
  }
  return { ok: true, value: out };
}
