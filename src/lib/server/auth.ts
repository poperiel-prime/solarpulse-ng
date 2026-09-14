/**
 * Admin authorisation for write APIs.
 *
 * The PIN is read on the server from the ADMIN_PIN environment variable only.
 * It is never shipped to the browser bundle. A request is authorised when it
 * carries either the `x-admin-pin` header or the `solarpulse-admin` cookie
 * that /api/admin/login sets after a correct PIN.
 */

export const ADMIN_COOKIE = "solarpulse-admin";
export const ADMIN_PIN_HEADER = "x-admin-pin";

/** Server-side only. Demo fallback keeps local runs usable; set ADMIN_PIN in prod. */
export function adminPin(): string {
  return process.env.ADMIN_PIN || "2468";
}

/** Constant-time-ish compare so the PIN is not leaked by response timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function isAdminRequest(req: Request): boolean {
  const header = req.headers.get(ADMIN_PIN_HEADER);
  if (header && safeEqual(header, adminPin())) return true;

  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_COOKIE && rest.join("=") === "1") return true;
  }
  return false;
}

export function unauthorized(): Response {
  return Response.json(
    { ok: false, error: "Admin only. Sign in at /admin with your PIN." },
    { status: 401 },
  );
}
