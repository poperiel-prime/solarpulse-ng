import { draftDedupKey, eventDedupKey } from "@/lib/dedup";
import { events as seedEvents } from "@/lib/events";
import { isAdminRequest } from "@/lib/server/auth";
import { mutateCollection, readCollection } from "@/lib/server/store";
import { validateDraft } from "@/lib/server/validate";
import type { EventDraft, SolarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_DRAFTS = 500;

/** Read the review queue. */
export async function GET() {
  const drafts = await readCollection<EventDraft>("inbox");
  return Response.json(
    { ok: true, drafts },
    { headers: { "cache-control": "no-store" } },
  );
}

/**
 * Create draft(s). Open to the public submit form — but a draft is only ever
 * a draft: status is forced to "pending" and nothing reaches the public
 * calendar until an admin calls /api/inbox/:id/add.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const admin = isAdminRequest(req);
  const incoming = Array.isArray(body) ? body : [body];
  if (incoming.length > 50) {
    return Response.json({ ok: false, error: "Too many drafts in one request." }, { status: 400 });
  }

  const candidates: EventDraft[] = [];
  for (const item of incoming) {
    // Public submissions are always labelled as such; the hunter (admin) may
    // name its own source.
    const parsed = validateDraft(item, admin ? undefined : { sourceName: "Public submission" });
    if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
    candidates.push(parsed.value);
  }

  const published = await readCollection<SolarEvent>("published");

  const outcome = await mutateCollection<EventDraft, { created: EventDraft[]; skipped: number }>(
    "inbox",
    (current) => {
      const keys = new Set<string>([
        ...current.map(draftDedupKey),
        ...published.map(eventDedupKey),
        ...seedEvents.map(eventDedupKey),
      ]);
      const created: EventDraft[] = [];
      let skipped = 0;
      for (const draft of candidates) {
        const key = draftDedupKey(draft);
        if (keys.has(key)) {
          skipped += 1;
          continue;
        }
        keys.add(key);
        created.push(draft);
      }
      const next = [...current, ...created].slice(-MAX_DRAFTS);
      return { next, result: { created, skipped } };
    },
  );

  const drafts = await readCollection<EventDraft>("inbox");
  return Response.json({
    ok: true,
    created: outcome.created,
    skipped: outcome.skipped,
    pending: drafts.filter((d) => d.status === "pending").length,
  });
}
