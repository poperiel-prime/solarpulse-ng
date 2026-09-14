"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/EventCard";
import { eventsThisWeek, fmtWeekRange, relativeDay } from "@/lib/dates";
import { useMergedNigeriaEvents } from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";

export default function ThisWeekSection() {
  const hydrated = useHydrated();
  const merged = useMergedNigeriaEvents();
  const week = useMemo(
    () => (hydrated ? eventsThisWeek(merged, new Date()) : null),
    [hydrated, merged],
  );
  const range = useMemo(() => (hydrated ? fmtWeekRange(new Date()) : ""), [hydrated]);

  return (
    <section id="this-week" aria-labelledby="this-week-heading" className="scroll-mt-28">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="this-week-heading" className="text-xl font-black tracking-tight text-cream">
            This week
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-mist">
            {range || "Mon – Sun, WAT"}
          </p>
        </div>
        <Link
          href="/events"
          className="flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-gold hover:text-gold-hover"
        >
          Open calendar
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {week === null ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-card/60" />
          ))}
        </div>
      ) : week.length === 0 ? (
        <EmptyState
          title="No listed events this week."
          hint="Check the next 30 days."
          action={
            <Link
              href="/events"
              className="inline-flex min-h-11 items-center rounded-xl bg-card px-4 text-sm font-bold text-gold hover:text-gold-hover"
            >
              Browse the full calendar
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {week.map((e) => (
            <EventCard key={e.id} event={e} badge={relativeDay(e.startAt) ?? undefined} />
          ))}
        </ul>
      )}
    </section>
  );
}
