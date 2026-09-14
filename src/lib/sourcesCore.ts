import { seedSources } from "./sources";
import type { HunterSource } from "./types";

/** Seed ids shipped before sources carried a `seed` flag. */
const LEGACY_SEED_IDS = new Set([
  "src-rean",
  "src-rean-events",
  "src-afsia",
  "src-app",
  "src-terrapinn",
  "src-eventhive",
  "src-gogla",
  "src-thecable",
  "src-businessday",
  "src-whatsapp",
]);

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/\/+$/, "");
}

function isSeedManaged(s: HunterSource): boolean {
  return s.seed === true || LEGACY_SEED_IDS.has(s.id);
}

/**
 * Fold the current seed watch list into a saved one:
 * curator-added rows are kept, enable/disable + lastChecked are preserved for
 * seeds that still exist, and superseded seed rows drop away.
 * Pure + isomorphic: used by the browser and by /api/sources.
 */
export function reconcileSources(stored: HunterSource[]): HunterSource[] {
  const byId = new Map(stored.map((s) => [s.id, s]));
  const byUrl = new Map(stored.filter((s) => s.url).map((s) => [normalizeUrl(s.url), s]));

  const merged: HunterSource[] = seedSources.map((seed) => {
    const prev = byId.get(seed.id) ?? (seed.url ? byUrl.get(normalizeUrl(seed.url)) : undefined);
    return prev ? { ...seed, enabled: prev.enabled, lastChecked: prev.lastChecked } : { ...seed };
  });

  const seedUrls = new Set(seedSources.map((s) => normalizeUrl(s.url)));
  const seedIds = new Set(seedSources.map((s) => s.id));
  for (const s of stored) {
    if (isSeedManaged(s) && !seedIds.has(s.id)) continue; // superseded seed row
    if (seedIds.has(s.id)) continue; // already merged above
    if (s.url && seedUrls.has(normalizeUrl(s.url))) continue; // duplicate of a seed
    merged.push(s); // curator-added row — always kept
  }
  return merged;
}
