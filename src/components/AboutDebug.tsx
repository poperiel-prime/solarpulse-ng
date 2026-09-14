"use client";

import Link from "next/link";
import { Cloud, Database, HardDrive } from "lucide-react";
import {
  usePublishedEvents,
  useSharedInbox,
  useStorageBadge,
} from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";

/** Diagnostics: where the notebook lives, and what is in it right now. */
export default function AboutDebug() {
  const hydrated = useHydrated();
  const badge = useStorageBadge();
  const published = usePublishedEvents();
  const inbox = useSharedInbox();
  const counts = {
    published: published.length,
    draftsTotal: inbox.length,
    draftsPending: inbox.filter((d) => d.status === "pending").length,
    draftsAdded: inbox.filter((d) => d.status === "added").length,
    draftsIgnored: inbox.filter((d) => d.status === "ignored").length,
  };

  return (
    <section
      aria-label="Storage diagnostics"
      className="mt-4 rounded-2xl border border-line bg-card p-5"
    >
      <h2 className="flex items-center gap-2 text-[15px] font-black text-cream">
        <Database size={16} className="text-mint" aria-hidden="true" />
        Debug — the shared notebook
      </h2>

      <p
        className={`mt-3 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-bold ${
          !hydrated || !badge.ready
            ? "border-line bg-surface text-mist"
            : badge.shared
              ? "border-mint/40 bg-mint/10 text-mint"
              : "border-gold/40 bg-gold/10 text-gold"
        }`}
      >
        {badge.shared ? (
          <Cloud size={14} aria-hidden="true" />
        ) : (
          <HardDrive size={14} aria-hidden="true" />
        )}
        {hydrated && badge.ready ? badge.label : "Storage: checking…"}
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
        {badge.shared
          ? "Approved events are stored on the server, so every visitor sees the same calendar."
          : "Falling back to this browser only — approvals will not reach other visitors until the server store is reachable."}
      </p>
      <p className="mt-2 font-mono text-[13px] leading-relaxed text-mist">
        published events:{" "}
        <span className="font-bold text-mint">{hydrated ? counts.published : "…"}</span>
        {"  ·  "}
        inbox drafts:{" "}
        <span className="font-bold text-gold">{hydrated ? counts.draftsTotal : "…"}</span>
        {hydrated && counts.draftsTotal > 0 ? (
          <>
            {" "}
            <span className="text-mist/80">
              ({counts.draftsPending} pending, {counts.draftsAdded} added, {counts.draftsIgnored}{" "}
              ignored)
            </span>
          </>
        ) : null}
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
        Counts read live from the shared store (with a{" "}
        <code className="rounded bg-surface px-1.5 py-0.5">localStorage</code> mirror for offline
        use). Published events appear on{" "}
        <Link href="/" className="font-bold text-gold hover:text-gold-hover">
          Home
        </Link>{" "}
        under “Recently added” and in the{" "}
        <Link href="/events" className="font-bold text-gold hover:text-gold-hover">
          calendar
        </Link>{" "}
        (switch on “Include past events” for dates that have already passed).
      </p>
    </section>
  );
}
