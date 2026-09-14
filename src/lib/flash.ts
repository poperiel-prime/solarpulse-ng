/**
 * One-shot confirmation passed across a navigation (Add → Home).
 * sessionStorage so it survives the redirect but never sticks around.
 */

export const FLASH_KEY = "solarpulse-flash";

export interface FlashMessage {
  title: string;
  /** Link to the saved item, e.g. /events/published/slug */
  path?: string;
  /** Set when the saved event's date is already in the past. */
  past?: boolean;
}

export function setFlash(msg: FlashMessage): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FLASH_KEY, JSON.stringify(msg));
  } catch {
    /* private mode — the banner is a nicety, not a requirement */
  }
}

/** Read without clearing (safe to call during render). */
export function peekFlash(): FlashMessage | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FLASH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlashMessage;
    return typeof parsed.title === "string" ? parsed : null;
  } catch {
    return null;
  }
}

export function clearFlash(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FLASH_KEY);
  } catch {
    /* ignore */
  }
}
