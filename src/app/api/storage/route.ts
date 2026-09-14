import { storeInfo } from "@/lib/server/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Powers the honest "Storage: …" badge on /about. */
export async function GET() {
  const info = await storeInfo();
  return Response.json(
    { ok: true, ...info },
    { headers: { "cache-control": "no-store" } },
  );
}
