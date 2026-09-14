import { NextResponse } from "next/server";

const COOKIE_NAME = "solarpulse-admin";

export async function POST(req: Request) {
  let pin = "";
  try {
    const body = (await req.json()) as { pin?: unknown };
    pin = String(body.pin ?? "");
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // `||` (not `??`): an explicitly blank ADMIN_PIN must fall back too,
  // otherwise an empty env value would match an empty submission.
  const expected = process.env.ADMIN_PIN || "2468";
  if (pin !== expected) {
    return NextResponse.json({ ok: false, error: "Wrong PIN." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
