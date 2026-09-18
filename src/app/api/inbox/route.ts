import { draftDedupKey, eventDedupKey } from "@/lib/dedup";
import { events as seedEvents } from "@/lib/events";
import { isAdminRequest } from "@/lib/server/auth";
import { validateDraft } from "@/lib/server/validate";
import type { EventDraft } from "@/lib/types";
import { PrismaClient } from "@prisma/client";

const prisma = (globalThis as any).prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") (globalThis as any).prisma = prisma;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read the review queue from Neon PostgreSQL */
export async function GET() {
  try {
    const drafts = await prisma.eventDraft.findMany({
      orderBy: { createdAt: "desc" },
    });
    return Response.json(
      { ok: true, drafts },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return Response.json({ ok: false, error: "Database read failed." }, { status: 500 });
  }
}

/** Create draft(s) directly inside the Neon Database */
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
    const parsed = validateDraft(item, admin ? undefined : { sourceName: "Public submission" });
    if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
    candidates.push(parsed.value);
  }

  try {
    const currentInbox = await prisma.eventDraft.findMany();
    // Use fallback empty array if public calendar matching table isn't fully pushed yet
    const published = await prisma.solarEvent.findMany().catch(() => []);

    const keys = new Set<string>([
      ...currentInbox.map(draftDedupKey),
      ...published.map(eventDedupKey),
      ...seedEvents.map(eventDedupKey),
    ]);

    const created: any[] = [];
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

    if (created.length > 0) {
      await prisma.eventDraft.createMany({
        data: created.map(draft => ({
          title: draft.title || "Untitled Solar Event",
          description: draft.description || "",
          date: draft.date ? new Date(draft.date) : new Date(),
          status: "pending",
        })),
      });
    }

    const totalPending = await prisma.eventDraft.count({
      where: { status: "pending" },
    });

    return Response.json({
      ok: true,
      created,
      skipped,
      pending: totalPending,
    });
  } catch (err) {
    return Response.json({ ok: false, error: "Database transaction failed." }, { status: 500 });
  }
}
