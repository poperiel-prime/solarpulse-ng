import { readCollection, storeInfo } from "@/lib/server/store";
import type { SolarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public read: extra published events (seed events live in the code bundle). */
export async function GET() {
  const [events, info] = await Promise.all([
    readCollection<SolarEvent>("published"),
    storeInfo(),
  ]);
  return Response.json(
    { ok: true, events, mode: info.mode, shared: info.shared, label: info.label },
    { headers: { "cache-control": "no-store" } },
  );
}
