import { isAdminRequest, unauthorized } from "@/lib/server/auth";
import { mutateCollection } from "@/lib/server/store";
import { validateEvent } from "@/lib/server/validate";
import type { SolarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Admin only: add or update one published event on the shared calendar. */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = validateEvent(body);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  const event = parsed.value;

  const saved = await mutateCollection<SolarEvent, SolarEvent>("published", (current) => {
    const next = current.filter((e) => e.slug !== event.slug && e.id !== event.id);
    next.push(event);
    next.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    return { next, result: event };
  });

  return Response.json({ ok: true, event: saved });
}
