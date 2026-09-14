"use client";

import Link from "next/link";
import { CalendarRange, MapPin, TriangleAlert } from "lucide-react";
import StatusPill from "@/components/StatusPill";
import TypeChip from "@/components/TypeChip";
import { fmtDateRangeWat, isPast } from "@/lib/dates";
import { keyShows } from "@/lib/events";
import { publicEventPath } from "@/lib/review";
import { useHydrated } from "@/lib/useHydrated";
import type { SolarEvent } from "@/lib/types";

function ShowRow({ event, past }: { event: SolarEvent; past: boolean }) {
  return (
    <li>
      <Link
        href={publicEventPath(event)}
        className={`group flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3.5 py-3 transition-colors ${
          past
            ? "border-line/60 bg-card/40 hover:border-line"
            : "border-line bg-card hover:border-gold/50"
        }`}
      >
        <span
          className={`w-[124px] shrink-0 text-[13px] font-black ${past ? "text-mist" : "text-gold"}`}
        >
          {fmtDateRangeWat(event.startAt, event.endAt).replace(/ 2026/g, "")}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[14px] font-bold ${
              past ? "text-mist" : "text-cream group-hover:text-gold"
            }`}
          >
            {event.title}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-mist">
            <MapPin size={11} className="shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue}</span>
          </span>
        </span>
        <span className="flex shrink-0 flex-wrap items-center gap-1.5">
          <TypeChip type={event.type} />
          {past ? (
            <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-bold text-mist">
              Ended
            </span>
          ) : (
            <StatusPill event={event} short />
          )}
          {event.verifyNote ? (
            <span
              title={event.verifyNote}
              className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10.5px] font-bold text-gold"
            >
              <TriangleAlert size={10} aria-hidden="true" />
              Confirm venue/dates
            </span>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

/**
 * The year's anchor shows, listed whatever the date. Home's other blocks are
 * date-windowed (this week / next 30 days), so without this the big expos
 * disappear from Home once they fall outside those windows.
 */
export default function KeyShowsSection() {
  const hydrated = useHydrated();
  if (keyShows.length === 0) return null;

  const upcoming = keyShows.filter((e) => !isPast(e));
  const past = keyShows.filter((e) => isPast(e));

  return (
    <section aria-labelledby="key-shows-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="key-shows-heading"
            className="flex items-center gap-2 text-xl font-black tracking-tight text-cream"
          >
            <CalendarRange size={18} className="text-gold" aria-hidden="true" />
            Nigeria&apos;s 2026 show calendar
          </h2>
          <p className="mt-0.5 text-[12.5px] font-medium text-mist">
            The anchor expos and forums — confirmed, whatever month they land in
          </p>
        </div>
        <span className="rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-bold text-mist">
          {hydrated ? `${upcoming.length} still to come` : `${keyShows.length} shows`}
        </span>
      </div>

      <ul className="space-y-2">
        {(hydrated ? [...upcoming, ...past] : keyShows).map((e) => (
          <ShowRow key={e.id} event={e} past={hydrated ? isPast(e) : false} />
        ))}
      </ul>
    </section>
  );
}
