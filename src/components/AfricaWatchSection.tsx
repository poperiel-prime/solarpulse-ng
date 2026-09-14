import { ChevronDown, Globe2 } from "lucide-react";
import type { SolarEvent } from "@/lib/types";
import EventCard from "./EventCard";

/** Africa-wide shows, kept separate from the Nigeria-first list. */
export default function AfricaWatchSection({ events }: { events: SolarEvent[] }) {
  if (events.length === 0) return null;

  return (
    <details className="group rounded-2xl border border-line bg-surface/60 open:bg-surface">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5 text-[14px] font-bold text-cream">
          <Globe2 size={17} className="text-mint" aria-hidden="true" />
          Also in Africa (not Nigeria)
          <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-bold text-mist">
            {events.length}
          </span>
        </span>
        <ChevronDown
          size={17}
          aria-hidden="true"
          className="shrink-0 text-mist transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="border-t border-line/70 px-4 py-4 sm:px-5">
        <p className="mb-3 text-[12.5px] leading-relaxed text-mist">
          Africa watch — these shows happen outside Nigeria. They are not mixed into the main list;
          they sit here so teams planning regional travel can still see them.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Africa watch events">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </ul>
      </div>
    </details>
  );
}
