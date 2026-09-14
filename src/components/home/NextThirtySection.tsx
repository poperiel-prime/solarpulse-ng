"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/EventCard";
import { eventsInNextDays, relativeDay } from "@/lib/dates";
import { useMergedNigeriaEvents } from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";

const VISIBLE = 8;

export default function NextThirtySection() {
  const hydrated = useHydrated();
  const merged = useMergedNigeriaEvents();
  const list = useMemo(
    () => (hydrated ? eventsInNextDays(merged, 30, new Date()) : null),
    [hydrated, merged],
  );

  return (
    <section aria-labelledby="next-30-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="next-30-heading" className="text-xl font-black tracking-tight text-cream">
            Next 30 days
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-mist">
            Nigeria-first · soonest first · times in WAT
          </p>
        </div>
        <span className="rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold text-mist">
          {list === null ? "–" : list.length} listed
        </span>
      </div>

      {list === null ? (
        <div className="space-y-1.5 rounded-2xl border border-line bg-surface p-2" aria-hidden="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-card/60" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          title="Nothing listed in the next 30 days."
          hint="The calendar rolls forward weekly — check the full list."
          pidgin="E dry small — but shows dey load. Check the full calendar."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface px-2 py-1.5">
          <ul className="divide-y divide-line/60">
            {list.slice(0, VISIBLE).map((e) => (
              <EventCard key={e.id} event={e} variant="row" badge={relativeDay(e.startAt) ?? undefined} />
            ))}
          </ul>
          {list.length > VISIBLE ? (
            <Link
              href="/events"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-t border-line/60 text-[13px] font-bold text-gold hover:text-gold-hover"
            >
              See all {list.length} in the calendar
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
