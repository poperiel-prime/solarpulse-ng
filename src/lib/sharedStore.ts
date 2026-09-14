"use client";

import { useEffect, useSyncExternalStore } from "react";
import { byStartAt } from "./dates";
import { africaWatchEvents, nigeriaEvents } from "./events";
import {
  EMPTY_DRAFTS,
  EMPTY_EVENTS,
  EMPTY_SOURCES,
  loadInbox as loadLocalInbox,
  loadPublished as loadLocalPublished,
  loadSources as loadLocalSources,
  saveInbox as saveLocalInbox,
  savePublished as saveLocalPublished,
  saveSources as saveLocalSources,
} from "./review";
import type { EventDraft, HunterSource, SolarEvent } from "./types";

/**
 * Client mirror of the shared server notebook.
 *
 * Reads come from the API so every visitor sees the same calendar. The
 * localStorage copy is kept only as an offline/preview fallback for the PWA —
 * it is never the source of truth when the server answers.
 */

export type StorageMode = "netlify-blobs" | "file" | "memory" | "local" | "unknown";

interface State {
  published: SolarEvent[];
  inbox: EventDraft[];
  sources: HunterSource[];
  mode: StorageMode;
  shared: boolean;
  label: string;
  ready: boolean;
}

let state: State = {
  published: EMPTY_EVENTS,
  inbox: EMPTY_DRAFTS,
  sources: EMPTY_SOURCES,
  mode: "unknown",
  shared: false,
  label: "Storage: checking…",
  ready: false,
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribeShared(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSharedState(): State {
  return state;
}

// ——— Loading ———

let publishedPromise: Promise<void> | null = null;
let inboxPromise: Promise<void> | null = null;
let sourcesPromise: Promise<void> | null = null;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
  if (!res.ok) throw new Error(`${res.status}`);
  return (await res.json()) as T;
}

export function loadPublishedShared(force = false): Promise<void> {
  if (force) publishedPromise = null;
  publishedPromise ??= (async () => {
    try {
      const data = await getJson<{
        events: SolarEvent[];
        mode: StorageMode;
        shared: boolean;
        label: string;
      }>("/api/events");
      const events = Array.isArray(data.events) ? [...data.events].sort(byStartAt) : [];
      setState({
        published: events.length > 0 ? events : EMPTY_EVENTS,
        mode: data.mode,
        shared: data.shared,
        label: data.label,
        ready: true,
      });
      saveLocalPublished(events); // offline mirror for the PWA
    } catch {
      // Server unreachable (offline, or static export): fall back to this
      // device's copy and say so plainly.
      const local = loadLocalPublished();
      setState({
        published: local.length > 0 ? local : EMPTY_EVENTS,
        mode: "local",
        shared: false,
        label: "Storage: local preview only",
        ready: true,
      });
    }
  })();
  return publishedPromise;
}

export function loadInboxShared(force = false): Promise<void> {
  if (force) inboxPromise = null;
  inboxPromise ??= (async () => {
    try {
      const data = await getJson<{ drafts: EventDraft[] }>("/api/inbox");
      const drafts = Array.isArray(data.drafts) ? data.drafts : [];
      setState({ inbox: drafts.length > 0 ? drafts : EMPTY_DRAFTS });
      saveLocalInbox(drafts);
    } catch {
      const local = loadLocalInbox();
      setState({ inbox: local.length > 0 ? local : EMPTY_DRAFTS });
    }
  })();
  return inboxPromise;
}

export function loadSourcesShared(force = false): Promise<void> {
  if (force) sourcesPromise = null;
  sourcesPromise ??= (async () => {
    try {
      const data = await getJson<{ sources: HunterSource[] }>("/api/sources");
      const sources = Array.isArray(data.sources) ? data.sources : [];
      setState({ sources: sources.length > 0 ? sources : EMPTY_SOURCES });
      saveLocalSources(sources);
    } catch {
      const local = loadLocalSources();
      setState({ sources: local.length > 0 ? local : EMPTY_SOURCES });
    }
  })();
  return sourcesPromise;
}

export async function refreshShared(): Promise<void> {
  await Promise.all([
    loadPublishedShared(true),
    loadInboxShared(true),
    loadSourcesShared(true),
  ]);
}

// ——— Merged views (seed events + shared published) ———

function mergeBySlug(seed: SolarEvent[], extra: SolarEvent[]): SolarEvent[] {
  const map = new Map<string, SolarEvent>();
  for (const e of [...seed, ...extra]) map.set(e.slug, e);
  return Array.from(map.values()).sort(byStartAt);
}

let nigeriaCache: { src: SolarEvent[]; value: SolarEvent[] } | null = null;
let africaCache: { src: SolarEvent[]; value: SolarEvent[] } | null = null;
let recentCache: { src: SolarEvent[]; value: SolarEvent[] } | null = null;

function mergedNigeria(): SolarEvent[] {
  const published = state.published;
  if (nigeriaCache && nigeriaCache.src === published) return nigeriaCache.value;
  const value = mergeBySlug(
    nigeriaEvents,
    published.filter((e) => e.region !== "africa"),
  );
  nigeriaCache = { src: published, value };
  return value;
}

function mergedAfrica(): SolarEvent[] {
  const published = state.published;
  if (africaCache && africaCache.src === published) return africaCache.value;
  const value = mergeBySlug(
    africaWatchEvents,
    published.filter((e) => e.region === "africa"),
  );
  africaCache = { src: published, value };
  return value;
}

function recentlyAdded(): SolarEvent[] {
  const published = state.published;
  if (published.length === 0) return EMPTY_EVENTS;
  if (recentCache && recentCache.src === published) return recentCache.value;
  const value = [...published].sort((a, b) => (b.addedAt ?? "").localeCompare(a.addedAt ?? ""));
  recentCache = { src: published, value };
  return value;
}

// ——— Hooks ———

function useShared<T>(selector: () => T, serverValue: T, load: () => Promise<void>): T {
  useEffect(() => {
    void load();
  }, [load]);
  return useSyncExternalStore(subscribeShared, selector, () => serverValue);
}

export function useMergedNigeriaEvents(): SolarEvent[] {
  return useShared(mergedNigeria, nigeriaEvents, loadPublishedShared);
}

export function useMergedAfricaEvents(): SolarEvent[] {
  return useShared(mergedAfrica, africaWatchEvents, loadPublishedShared);
}

export function useRecentlyAdded(): SolarEvent[] {
  return useShared(recentlyAdded, EMPTY_EVENTS, loadPublishedShared);
}

export function usePublishedEvents(): SolarEvent[] {
  return useShared(() => state.published, EMPTY_EVENTS, loadPublishedShared);
}

export function useSharedInbox(): EventDraft[] {
  return useShared(() => state.inbox, EMPTY_DRAFTS, loadInboxShared);
}

export function useSharedSources(): HunterSource[] {
  return useShared(() => state.sources, EMPTY_SOURCES, loadSourcesShared);
}

export interface StorageBadge {
  mode: StorageMode;
  shared: boolean;
  label: string;
  ready: boolean;
}

let badgeCache: { src: State; value: StorageBadge } | null = null;

function storageBadge(): StorageBadge {
  if (badgeCache && badgeCache.src === state) return badgeCache.value;
  const value: StorageBadge = {
    mode: state.mode,
    shared: state.shared,
    label: state.label,
    ready: state.ready,
  };
  badgeCache = { src: state, value };
  return value;
}

const SERVER_BADGE: StorageBadge = {
  mode: "unknown",
  shared: false,
  label: "Storage: checking…",
  ready: false,
};

export function useStorageBadge(): StorageBadge {
  return useShared(storageBadge, SERVER_BADGE, loadPublishedShared);
}

// ——— Optimistic local updates after a successful write ———

export function applyPublished(event: SolarEvent): void {
  const next = [...state.published.filter((e) => e.slug !== event.slug), event].sort(byStartAt);
  setState({ published: next });
  saveLocalPublished(next);
}

export function applyDraftStatus(id: string, status: EventDraft["status"]): void {
  const next = state.inbox.map((d) => (d.id === id ? { ...d, status } : d));
  setState({ inbox: next });
  saveLocalInbox(next);
}

export function applySources(sources: HunterSource[]): void {
  setState({ sources });
  saveLocalSources(sources);
}
