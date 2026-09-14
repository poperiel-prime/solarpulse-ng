import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { dayBadge, fmtDateRangeWat, fmtTimeWat, isPast } from "@/lib/dates";
import { publicEventPath } from "@/lib/review";
import { PRICE_LABELS, type SolarEvent } from "@/lib/types";
import StatusPill from "./StatusPill";
import TypeChip from "./TypeChip";

export function PriceTag({ event, className = "" }: { event: SolarEvent; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-line bg-ink/40 px-1.5 py-0.5 text-[10.5px] font-bold text-mist ${className}`}
    >
      {PRICE_LABELS[event.price]}
    </span>
  );
}

function DateBadge({ startAt }: { startAt: string }) {
  const b = dayBadge(startAt);
  return (
    <div
      aria-hidden="true"
      className="flex w-[62px] shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-surface py-2"
    >
      <span className="text-[21px] font-black leading-none text-gold">{b.day}</span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-mist">
        {b.month}
      </span>
      <span className="text-[10px] font-medium text-mist/80">{b.dow}</span>
    </div>
  );
}

export default function EventCard({
  event,
  badge,
  variant = "card",
}: {
  event: SolarEvent;
  /** Client-computed relative label, e.g. "Today" / "Tomorrow". */
  badge?: string;
  variant?: "card" | "row";
}) {
  const past = isPast(event);

  if (variant === "row") {
    return (
      <li>
        <Link
          href={publicEventPath(event)}
          className="group flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-card/70"
          aria-label={`${event.title}, ${fmtDateRangeWat(event.startAt, event.endAt)}`}
        >
          <span className="w-16 shrink-0 text-[12px] font-bold text-gold">
            {dayBadge(event.startAt).day} {dayBadge(event.startAt).month}
            <span className="block text-[10px] font-medium uppercase tracking-wide text-mist">
              {dayBadge(event.startAt).dow}
            </span>
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-cream group-hover:text-gold">
              {event.title}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px] text-mist">
              <MapPin size={11} className="shrink-0" aria-hidden="true" />
              <span className="truncate">
                {event.city}
                {event.country ? `, ${event.country}` : ""} · {event.organizer}
              </span>
            </span>
          </span>
          {badge ? (
            <span className="shrink-0 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
              {badge}
            </span>
          ) : null}
          <ArrowUpRight
            size={15}
            className="shrink-0 text-mist transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-gold"
            aria-hidden="true"
          />
        </Link>
      </li>
    );
  }

  return (
    <li className="h-full">
      <Link
        href={publicEventPath(event)}
        aria-label={`${event.title}, ${fmtDateRangeWat(event.startAt, event.endAt)}, ${event.city}`}
        className="group flex h-full gap-3.5 rounded-2xl border border-line bg-card p-3.5 transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_12px_40px_-16px_rgba(245,185,66,0.25)]"
      >
        <DateBadge startAt={event.startAt} />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeChip type={event.type} />
            <StatusPill event={event} short />
            {past ? (
              <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-bold text-mist">
                Ended
              </span>
            ) : null}
            {event.verifyNote ? (
              <span
                title={event.verifyNote}
                className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[10.5px] font-bold text-gold"
              >
                Confirm venue/dates
              </span>
            ) : null}
            {badge ? (
              <span className="rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-bold text-mint">
                {badge}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug text-cream group-hover:text-gold">
            {event.title}
          </h3>
          <p className="mt-1 text-[12px] font-medium text-mist">
            {fmtTimeWat(event.startAt)} · {fmtDateRangeWat(event.startAt, event.endAt)}
          </p>
          <div className="mt-auto flex items-center gap-1.5 pt-2 text-[12px] text-mist">
            <MapPin size={12} className="shrink-0" aria-hidden="true" />
            <span className="truncate">
              {event.city}
              {event.country ? `, ${event.country}` : ""} · {event.organizer}
            </span>
            <PriceTag event={event} className="ml-auto" />
          </div>
        </div>
      </Link>
    </li>
  );
}
