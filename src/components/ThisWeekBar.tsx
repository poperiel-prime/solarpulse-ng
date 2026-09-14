"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, ArrowRight } from "lucide-react";
import { eventsInNextDays, eventsThisWeek } from "@/lib/dates";
import { useMergedNigeriaEvents } from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";

/** Sticky "This week" pulse count — computed on the client so it stays live. */
export default function ThisWeekBar() {
  const hydrated = useHydrated();
  const merged = useMergedNigeriaEvents();
  const counts = useMemo(() => {
    if (!hydrated) return null;
    const now = new Date();
    return {
      week: eventsThisWeek(merged, now).length,
      month: eventsInNextDays(merged, 30, now).length,
    };
  }, [hydrated, merged]);

  return (
    <div className="border-b border-line/60 bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <p className="flex min-w-0 items-center gap-2 text-[12px] font-medium text-mist">
          <Activity size={13} className="shrink-0 text-mint" aria-hidden="true" />
          <span className="truncate">
            <span className="font-bold text-cream">{counts ? counts.week : "–"}</span> listed this
            week
            <span className="hidden sm:inline">
              {" "}
              · <span className="font-bold text-cream">{counts ? counts.month : "–"}</span> in the
              next 30 days
            </span>
          </span>
        </p>
        <Link
          href="/events"
          className="flex shrink-0 items-center gap-1 text-[12px] font-bold text-gold hover:text-gold-hover"
        >
          Full calendar
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
