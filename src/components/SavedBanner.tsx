"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, X } from "lucide-react";
import { clearFlash, peekFlash } from "@/lib/flash";
import { useHydrated } from "@/lib/useHydrated";

/** “Saved: [title]” confirmation shown on Home after a curator publishes. */
export default function SavedBanner() {
  const hydrated = useHydrated();
  const flash = useMemo(() => (hydrated ? peekFlash() : null), [hydrated]);
  const [dismissed, setDismissed] = useState(false);

  // Consume it so a refresh does not replay the banner (no setState here).
  useEffect(() => {
    if (flash) clearFlash();
  }, [flash]);

  if (!flash || dismissed) return null;

  return (
    <div
      role="status"
      className="animate-rise mb-6 rounded-2xl border border-mint/50 bg-mint/10 p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black text-cream">
            Saved: <span className="text-mint">{flash.title}</span>
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-mist">
            {flash.past
              ? "It is live on the public calendar. The date has already passed, so it sits under “Recently added” and in the calendar with Include past events switched on — not in This week."
              : "It is live on the public calendar and listed under “Recently added” below."}
          </p>
          {flash.path ? (
            <Link
              href={flash.path}
              className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-mint hover:text-cream"
            >
              Open the event
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss confirmation"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-mist transition-colors hover:text-cream"
        >
          <X size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
