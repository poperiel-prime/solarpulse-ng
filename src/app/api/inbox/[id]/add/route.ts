import { isAdminRequest, unauthorized } from "@/lib/server/auth";
import { mutateCollection } from "@/lib/server/store";
import { validateEvent } from "@/lib/server/validate";
import type { EventDraft, SolarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin only: publish a draft to the shared calendar and mark it added.
 * Body is the curator-edited event from the review drawer.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorized();

  const { id } = await ctx.params;

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

  const draft = await mutateCollection<EventDraft, EventDraft | null>("inbox", (current) => {
    let updated: EventDraft | null = null;
    const next = current.map((d) => {
      if (d.id !== id) return d;
      updated = { ...d, status: "added" as const };
      return updated;
    });
    return { next, result: updated };
  });

  return Response.json({ ok: true, event: saved, draft });
}
