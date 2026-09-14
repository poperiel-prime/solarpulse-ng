/**
 * Admin session fallback for embedded previews.
 *
 * The real login endpoint still sets the required httpOnly cookie. Arena and
 * some privacy-focused browsers can block cookies inside embedded previews,
 * so the same successful PIN response also unlocks the local curator UI on
 * this exact origin. This is appropriate for the MVP because every draft is
 * already browser-local; there are no server-side admin records to expose.
 */

export const ADMIN_LOCAL_KEY = "solarpulse-admin-preview";
export const ADMIN_SESSION_EVENT = "solarpulse:admin-session";

export function loadLocalAdmin(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_LOCAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLocalAdmin(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (enabled) window.localStorage.setItem(ADMIN_LOCAL_KEY, "1");
    else window.localStorage.removeItem(ADMIN_LOCAL_KEY);
    window.dispatchEvent(new CustomEvent(ADMIN_SESSION_EVENT));
  } catch {
    /* The server cookie still works outside blocked/private storage modes. */
  }
}

export function subscribeAdminSession(cb: () => void): () => void {
  window.addEventListener(ADMIN_SESSION_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(ADMIN_SESSION_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
