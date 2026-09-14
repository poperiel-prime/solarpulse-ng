import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Sparkle } from "lucide-react";
import { fmtDateRangeWat, fmtTimeWat } from "@/lib/dates";
import type { SolarEvent } from "@/lib/types";

export default function FlagshipBanner({ event }: { event: SolarEvent }) {
  return (
    <section aria-label="Flagship event" className="animate-rise">
      <Link
        href={`/events/${event.slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-gold/35 bg-gradient-to-br from-card via-card to-[#2a2414] p-5 transition-all hover:border-gold/60 hover:shadow-[0_20px_60px_-20px_rgba(245,185,66,0.35)] sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/15 blur-3xl animate-soft-glow"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 640 90"
          preserveAspectRatio="none"
          className="pointer-events-none absolute bottom-0 left-0 h-14 w-full text-mint/25"
        >
          <path
            d="M0 45 H180 l18 -22 l24 44 l18 -22 H420 l14 -16 l20 32 l14 -16 H640"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse-line"
          />
        </svg>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-2.5 py-1 text-[10.5px] font-black uppercase tracking-[0.16em] text-ink">
            <Sparkle size={11} strokeWidth={3} aria-hidden="true" />
            Flagship
          </span>
          <h3 className="mt-3 max-w-xl text-xl font-black leading-tight tracking-tight text-cream group-hover:text-gold sm:text-3xl">
            {event.title}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] font-medium text-mist">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={14} className="text-gold" aria-hidden="true" />
              {fmtDateRangeWat(event.startAt, event.endAt)} · {fmtTimeWat(event.startAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gold" aria-hidden="true" />
              {event.venue}
            </span>
          </div>
          <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-mist">
            {event.summary}
          </p>
          <span className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors group-hover:bg-gold-hover">
            See the flagship details
            <ArrowRight
              size={16}
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
            />
          </span>
        </div>
      </Link>
    </section>
  );
}
