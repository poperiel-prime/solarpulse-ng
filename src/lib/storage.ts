import type { Audience, EventType, PriceType } from "./types";

/** localStorage persistence for alert preferences + curator submissions. */

export const ALERTS_KEY = "solarpulse-alerts";
export const PENDING_KEY = "pendingSubmissions";

export interface AlertPrefs {
  cities: string[];
  types: EventType[];
  digest: boolean;
  notifications: boolean;
}

export const DEFAULT_ALERTS: AlertPrefs = {
  cities: [],
  types: [],
  digest: false,
  notifications: false,
};

export function loadAlerts(): AlertPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_ALERTS };
  try {
    const raw = window.localStorage.getItem(ALERTS_KEY);
    if (!raw) return { ...DEFAULT_ALERTS };
    const parsed = JSON.parse(raw) as Partial<AlertPrefs>;
    return {
      cities: Array.isArray(parsed.cities) ? parsed.cities.filter((c) => typeof c === "string") : [],
      types: Array.isArray(parsed.types) ? (parsed.types as EventType[]) : [],
      digest: Boolean(parsed.digest),
      notifications: Boolean(parsed.notifications),
    };
  } catch {
    return { ...DEFAULT_ALERTS };
  }
}

export function saveAlerts(prefs: AlertPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ALERTS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("solarpulse:alerts", { detail: prefs }));
}

export function toggleCity(city: string): AlertPrefs {
  const prefs = loadAlerts();
  const next = prefs.cities.includes(city)
    ? prefs.cities.filter((c) => c !== city)
    : [...prefs.cities, city];
  const updated = { ...prefs, cities: next };
  saveAlerts(updated);
  return updated;
}

export function toggleType(type: EventType): AlertPrefs {
  const prefs = loadAlerts();
  const next = prefs.types.includes(type)
    ? prefs.types.filter((t) => t !== type)
    : [...prefs.types, type];
  const updated = { ...prefs, types: next };
  saveAlerts(updated);
  return updated;
}

export function updateAlerts(patch: Partial<AlertPrefs>): AlertPrefs {
  const updated = { ...loadAlerts(), ...patch };
  saveAlerts(updated);
  return updated;
}

export interface PendingSubmission {
  id: string;
  title: string;
  type: EventType;
  startAt: string;
  endAt: string;
  city: string;
  venue: string;
  organizer: string;
  url: string;
  price: PriceType;
  priceNote?: string;
  audience: Audience[];
  whoShouldGo: string;
  contact: string;
  submittedAt: string;
}

export function loadPendingSubmissions(): PendingSubmission[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PendingSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPendingSubmission(
  s: Omit<PendingSubmission, "id" | "submittedAt">,
): PendingSubmission {
  const record: PendingSubmission = {
    ...s,
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `sub-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    const list = loadPendingSubmissions();
    list.push(record);
    window.localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  }
  return record;
}
