"use client";

import type { EventDraft, HunterSource, SolarEvent } from "./types";

/**
 * Admin write client.
 *
 * The PIN is never hardcoded in the bundle and never persisted. After a
 * successful sign-in the value the curator typed is held in memory for this
 * tab only, and sent as `x-admin-pin` alongside the cookie — that keeps writes
 * working in embedded previews where third-party cookies are blocked. Refresh
 * the tab and the cookie takes over; if neither is present the server rejects
 * the write with 401.
 */

let memoryPin: string | null = null;

export function rememberAdminPin(pin: string): void {
  memoryPin = pin;
}

export function forgetAdminPin(): void {
  memoryPin = null;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (memoryPin) h["x-admin-pin"] = memoryPin;
  return h;
}

export class AdminApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

async function post<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: headers(),
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new AdminApiError("Could not reach the server. Check your connection.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (!res.ok || data.ok === false) {
    const msg =
      res.status === 401
        ? "Not signed in as curator. Open /admin and enter your PIN again."
        : (data.error ?? `Request failed (${res.status}).`);
    throw new AdminApiError(msg, res.status);
  }
  return data;
}

/** Publish a draft and mark it added, in one server call. */
export function addDraftToCalendar(
  draftId: string,
  event: SolarEvent,
): Promise<{ event: SolarEvent; draft: EventDraft | null }> {
  return post(`/api/inbox/${encodeURIComponent(draftId)}/add`, event);
}

export function publishEvent(event: SolarEvent): Promise<{ event: SolarEvent }> {
  return post("/api/events/publish", event);
}

export function setDraftStatus(
  draftId: string,
  status: "ignored" | "pending",
): Promise<{ draft: EventDraft }> {
  return post(`/api/inbox/${encodeURIComponent(draftId)}/ignore`, { status });
}

export function saveSourcesRemote(sources: HunterSource[]): Promise<{ sources: HunterSource[] }> {
  return post("/api/sources", sources);
}

/** Create drafts. Public submissions use this too (no PIN required). */
export async function createDrafts(
  drafts: EventDraft[] | EventDraft,
): Promise<{ created: EventDraft[]; skipped: number; pending: number }> {
  return post("/api/inbox", drafts);
}
