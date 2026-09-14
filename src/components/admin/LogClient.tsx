"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarX2,
  CheckCircle2,
  CircleMinus,
  FileText,
  Loader2,
  Timer,
  TriangleAlert,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { fmtDateTimeWat } from "@/lib/dates";
import { loadHunterLog, subscribeReview } from "@/lib/review";
import { usePublishedEvents, useSharedInbox } from "@/lib/sharedStore";
import { useClientSignal, useHydrated } from "@/lib/useHydrated";
import type { HunterOutcome } from "@/lib/types";

const OUTCOME_STYLE: Record<HunterOutcome, { label: string; cls: string }> = {
  draft: { label: "Draft created", cls: "text-mint border-mint/40 bg-mint/10" },
  "no-dates": { label: "Checked — no clear dates", cls: "text-gold border-gold/40 bg-gold/10" },
  failed: { label: "Could not open", cls: "text-danger border-danger/40 bg-danger/10" },
  manual: { label: "Manual source", cls: "text-mist border-line bg-card" },
};

function Stat({ label, value, Icon }: { label: string; value: number | string; Icon: typeof FileText }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-mist">
        <Icon size={12} className="text-gold" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-black text-cream">{value}</p>
    </div>
  );
}

export default function LogClient() {
  const hydrated = useHydrated();
  const log = useClientSignal(subscribeReview, loadHunterLog, null);
  const inbox = useSharedInbox();
  const published = usePublishedEvents();

  const counts = useMemo(() => {
    const pending = inbox.filter((d) => d.status === "pending").length;
    const ignored = inbox.filter((d) => d.status === "ignored").length;
    const added = inbox.filter((d) => d.status === "added").length;
    return { pending, ignored, added };
  }, [inbox]);

  if (!hydrated) {
    return (
      <div className="grid gap-3 sm:grid-cols-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-card/60" />
        ))}
      </div>
    );
  }

  if (!log) {
    return (
      <EmptyState
        title="The hunter has not run yet on this device."
        hint="Run it from the inbox, or paste leads from WhatsApp with the paste dump."
        pidgin=""
        action={
          <Link
            href="/admin/inbox"
            className="inline-flex min-h-11 items-center rounded-xl bg-gold px-4 text-[13px] font-black text-ink hover:bg-gold-hover"
          >
            Open the inbox
          </Link>
        }
      />
    );
  }

  const failed = log.results.filter((r) => r.outcome === "failed").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Last run" value={fmtDateTimeWat(log.ranAt)} Icon={Timer} />
        <Stat label="Candidates found" value={log.found} Icon={FileText} />
        <Stat label="New drafts" value={log.created} Icon={CheckCircle2} />
        <Stat label="Dupes skipped" value={log.skippedDupes} Icon={CircleMinus} />
      </div>

      <section aria-labelledby="source-results" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="source-results" className="text-[15px] font-black tracking-tight text-cream">
          Per-source results
        </h2>
        <ul className="mt-3 space-y-2">
          {log.results.map((r) => {
            const style = OUTCOME_STYLE[r.outcome];
            return (
              <li
                key={r.sourceId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-cream">{r.name}</p>
                  {r.message ? <p className="mt-0.5 text-[12px] text-mist">{r.message}</p> : null}
                </div>
                <span className={`shrink-0 rounded-lg border px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide ${style.cls}`}>
                  {style.label}
                </span>
              </li>
            );
          })}
        </ul>
        {failed > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
            {failed} source{failed === 1 ? "" : "s"} refused the browser fetch. Open the page
            yourself, copy the event text, and drop it in the paste dump — that path is supported,
            not a hack.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="dedup-memory" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Waiting in inbox" value={counts.pending} Icon={Loader2} />
        <Stat label="Added (published)" value={published.length} Icon={CheckCircle2} />
        <Stat label="Marked added" value={counts.added} Icon={CheckCircle2} />
        <Stat label="Ignored (dedup memory)" value={counts.ignored} Icon={CalendarX2} />
      </section>

      <p className="rounded-xl border border-line/70 bg-surface/60 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
        Expected use: 15–30 minutes a day, not all afternoon. Ignored drafts stay in storage so the
        hunter never re-adds the same URL + title, and accepted drafts show up on the public
        calendar immediately on this device.
      </p>
    </div>
  );
}
