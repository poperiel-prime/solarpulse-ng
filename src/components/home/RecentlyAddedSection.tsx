"use client";

import { Sparkles } from "lucide-react";
import EventCard from "@/components/EventCard";
import { isPast, relativeDay } from "@/lib/dates";
import { useRecentlyAdded } from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";

const VISIBLE = 6;

/**
 * Everything a curator accepted, newest first. This block exists so a saved
 * event is ALWAYS visible on Home — even when its date is past or months out,
 * which would exclude it from “This week” and “Next 30 days”.
 */
export default function RecentlyAddedSection() {
  const hydrated = useHydrated();
  const recent = useRecentlyAdded();

  if (!hydrated || recent.length === 0) return null;

  return (
    <section aria-labelledby="recently-added-heading" className="animate-rise">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="recently-added-heading"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-cream"
          >
            <Sparkles size={18} className="text-mint" aria-hidden="true" />
            Recently added
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-mist">
            Accepted by the curator · newest first
          </p>
        </div>
        <span className="rounded-full border border-mint/40 bg-mint/10 px-2.5 py-1 text-[11.5px] font-bold text-mint">
          {recent.length} published
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.slice(0, VISIBLE).map((e) => (
          <EventCard
            key={e.id}
            event={e}
            badge={isPast(e) ? "Ended" : (relativeDay(e.startAt) ?? "New")}
          />
        ))}
      </ul>
    </section>
  );
}
