import type { EventDraft, SolarEvent } from "./types";

/** Dedup helpers shared by the browser and the server API routes. */

export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.toLowerCase();
  }
}

/** Dedup key: normalized title + start date + source host. */
export function draftDedupKey(
  d: Pick<EventDraft, "title" | "startAtGuess" | "sourceUrl">,
): string {
  const day = d.startAtGuess ? d.startAtGuess.slice(0, 10) : "";
  return `${normalizeTitle(d.title)}|${day}|${hostOf(d.sourceUrl)}`;
}

export function eventDedupKey(e: Pick<SolarEvent, "title" | "startAt" | "url">): string {
  return draftDedupKey({ title: e.title, startAtGuess: e.startAt, sourceUrl: e.url });
}
