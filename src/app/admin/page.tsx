import type { Metadata } from "next";
import { Crosshair, Timer, TriangleAlert } from "lucide-react";
import AdminGate from "@/components/admin/AdminGate";

export const metadata: Metadata = {
  title: "Curator sign-in",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
        <AdminGate />

        <div className="space-y-4">
          <div className="rounded-2xl border border-gold/30 bg-card p-5">
            <h2 className="flex items-center gap-2 text-[16px] font-black tracking-tight text-cream">
              <Crosshair size={17} className="text-gold" aria-hidden="true" />
              You are the referee. The hunter is the intern.
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
              The hunter fetches a fixed source list and drafts what it finds. It never publishes.
              Every item on the public calendar got there because a human opened the source, tapped{" "}
              <span className="font-bold text-cream">Add</span>, and confirmed the date is real.
              Organizer submissions land in the same queue, marked as public submissions.
            </p>
            <p className="mt-2 flex items-start gap-2 text-[13px] font-semibold text-gold">
              <Timer size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
              Expected use: 15–30 minutes a day, not all afternoon.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-black text-cream">
              <TriangleAlert size={15} className="text-danger" aria-hidden="true" />
              Honest limits
            </h2>
            <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
              The hunter only watches the source list. It cannot see most WhatsApp groups. It will
              miss closed trainings and last-minute venue changes. A human still accepts or
              declines. Many sites also refuse browser-side fetches (CORS) — when that happens the
              log says so, and the paste dump is the supported path in.
            </p>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-[14px] font-black text-cream">The flow</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-mist">
              <li>Hunter or submission creates a draft in the review inbox.</li>
              <li>You open the source link and check the date yourself.</li>
              <li>Add publishes instantly (this device); Ignore teaches dedup.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
