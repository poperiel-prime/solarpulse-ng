import { isAdminRequest, unauthorized } from "@/lib/server/auth";
import { readCollection, writeCollection } from "@/lib/server/store";
import { validateSources } from "@/lib/server/validate";
import { reconcileSources } from "@/lib/sourcesCore";
import { seedSources } from "@/lib/sources";
import type { HunterSource } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read the hunter watch list, with new seed entries folded in. */
export async function GET() {
  const stored = await readCollection<HunterSource>("sources");
  const sources = stored.length > 0 ? reconcileSources(stored) : seedSources.map((s) => ({ ...s }));
  return Response.json(
    { ok: true, sources },
    { headers: { "cache-control": "no-store" } },
  );
}

/** Admin only: replace the watch list (add / edit / enable / disable). */
export async function POST(req: Request) {
  if (!isAdminRequest(req)) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = Array.isArray(body) ? body : (body as { sources?: unknown })?.sources;
  const parsed = validateSources(payload);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });

  await writeCollection("sources", parsed.value);
  return Response.json({ ok: true, sources: parsed.value });
}
