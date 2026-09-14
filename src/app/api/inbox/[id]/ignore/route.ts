import { isAdminRequest, unauthorized } from "@/lib/server/auth";
import { mutateCollection } from "@/lib/server/store";
import type { EventDraft } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Admin only: decline a draft. It stays stored so dedup never re-adds it. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) return unauthorized();

  const { id } = await ctx.params;
  let status: EventDraft["status"] = "ignored";
  try {
    const body = (await req.json()) as { status?: unknown };
    if (body?.status === "pending") status = "pending"; // "move back to waiting"
  } catch {
    /* empty body is fine — default to ignored */
  }

  const draft = await mutateCollection<EventDraft, EventDraft | null>("inbox", (current) => {
    let updated: EventDraft | null = null;
    const next = current.map((d) => {
      if (d.id !== id) return d;
      updated = { ...d, status };
      return updated;
    });
    return { next, result: updated };
  });

  if (!draft) return Response.json({ ok: false, error: "Draft not found." }, { status: 404 });
  return Response.json({ ok: true, draft });
}
