"use client";

import { useSyncExternalStore } from "react";

const subscribeNone = (): (() => void) => () => {};

/**
 * True only after client hydration. Gate anything that depends on the current
 * time, localStorage, or browser APIs so SSR markup stays identical.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribeNone, () => true, () => false);
}

/**
 * Subscribe to an external browser value the React way — server snapshot is
 * always `fallback`, so hydration never mismatches.
 */
export function useClientSignal<T>(subscribe: (cb: () => void) => () => void, get: () => T, fallback: T): T {
  return useSyncExternalStore(subscribe, get, () => fallback);
}

export { subscribeNone };
