import { ExternalLink, CalendarDays, MapPin } from "lucide-react";
import { eventDayKeys, fmtDateRangeWat, fmtDateTimeWat, fmtTimeWat, sameWatDay } from "@/lib/dates";
import { NIGERIA_CITIES, type SolarEvent } from "@/lib/types";

export function isNigeriaCity(city: string): boolean {
  return (NIGERIA_CITIES as string[]).includes(city);
}

export function WhenCard({ event }: { event: SolarEvent }) {
  const sameDay = sameWatDay(event.startAt, event.endAt);
  const days = eventDayKeys(event).length;
  return (
    <section aria-label="When" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-mist">
        <CalendarDays size={13} className="text-gold" aria-hidden="true" />
        When · WAT
      </h2>
      <dl className="mt-3 space-y-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="w-11 text-[12px] font-bold uppercase text-mist">Start</dt>
          <dd className="text-[15px] font-bold text-cream">{fmtDateTimeWat(event.startAt)}</dd>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-2">
          <dt className="w-11 text-[12px] font-bold uppercase text-mist">End</dt>
          <dd className="text-[15px] font-bold text-cream">
            {sameDay ? fmtTimeWat(event.endAt) : fmtDateTimeWat(event.endAt)}
          </dd>
        </div>
      </dl>
      {days > 1 ? (
        <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] font-semibold text-mist">
          Runs {days} days — {fmtDateRangeWat(event.startAt, event.endAt)}
        </p>
      ) : null}
    </section>
  );
}

export function WhereCard({ event }: { event: SolarEvent }) {
  const online = event.city === "Online";
  const q = encodeURIComponent(
    `${event.venue.replace(/—.*$/, "").trim()}, ${event.city}${
      event.country ? `, ${event.country}` : isNigeriaCity(event.city) ? ", Nigeria" : ""
    }`,
  );
  return (
    <section aria-label="Where" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-mist">
        <MapPin size={13} className="text-gold" aria-hidden="true" />
        Where
      </h2>
      <p className="mt-3 text-[15px] font-bold text-cream">{event.venue}</p>
      <p className="mt-1 text-[13px] font-medium text-mist">
        {event.city}
        {event.country ? `, ${event.country}` : ""}
      </p>
      {!online ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${q}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3.5 text-[13px] font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
            aria-label="Open location search in Google Maps (new tab)"
          >
            Google Maps
            <ExternalLink size={13} aria-hidden="true" />
          </a>
          <a
            href={`https://www.openstreetmap.org/search?query=${q}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3.5 text-[13px] font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
            aria-label="Open location search in OpenStreetMap (new tab)"
          >
            OpenStreetMap
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-[12.5px] font-semibold text-mist">
          Online event — the dial-in link is shared on registration.
        </p>
      )}
    </section>
  );
}
