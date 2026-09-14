import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const store = await cookies();
  const authed = store.get("solarpulse-admin")?.value === "1";
  return NextResponse.json({ authed });
}
