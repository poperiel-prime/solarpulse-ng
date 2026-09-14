import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  Globe2,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import EventCard from "@/components/EventCard";
import FollowChip from "@/components/FollowChip";
import IcsButton from "@/components/IcsButton";
import ShareButton from "@/components/ShareButton";
import StatusPill from "@/components/StatusPill";
import TypeChip from "@/components/TypeChip";
import { WhenCard, WhereCard, isNigeriaCity } from "@/components/EventSections";
import { fmtDateRangeWat } from "@/lib/dates";
import { events, getEventBySlug, relatedEvents } from "@/lib/events";
import { AUDIENCE_LABELS, PRICE_LABELS, TYPE_LABELS } from "@/lib/types";

export const dynamicParams = false;

export function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: `${fmtDateRangeWat(event.startAt, event.endAt)} · ${event.venue}. ${event.summary}`,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: `${event.title} — SolarPulse NG`,
      description: event.summary,
      type: "article",
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const related = relatedEvents(event);
  const shareText = `${fmtDateRangeWat(event.startAt, event.endAt)} · ${event.venue} — SolarPulse NG`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
      <nav aria-label="Breadcrumb">
        <Link
          href="/events"
          className="inline-flex min-h-11 items-center gap-1.5 text-[13px] font-bold text-mist transition-colors hover:text-gold"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          Back to calendar
        </Link>
      </nav>

      <header className="mt-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <TypeChip type={event.type} />
          <StatusPill event={event} />
          {event.flagship ? (
            <span className="rounded-md bg-gold px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-ink">
              Flagship
            </span>
          ) : null}
          {event.region === "africa" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-mint/40 bg-mint/10 px-2 py-0.5 text-[10.5px] font-bold text-mint">
              <Globe2 size={11} aria-hidden="true" />
              Africa watch — not Nigeria-first
            </span>
          ) : null}
        </div>
        <h1 className="mt-3 max-w-3xl text-2xl font-black leading-tight tracking-tight text-cream sm:text-[34px]">
          {event.title}
        </h1>
        <p className="mt-2 text-[14px] font-semibold text-mist">
          Organized by <span className="text-cream">{event.organizer}</span>
        </p>
      </header>

      {event.verifyNote ? (
        <p
          role="note"
          className="mt-4 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[13px] font-semibold leading-relaxed text-gold"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          {event.verifyNote}
        </p>
      ) : null}
      {event.status === "tentative" ? (
        <p
          role="note"
          className="mt-4 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-[13px] font-semibold leading-relaxed text-gold"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Dates are tentative — the organizer has not confirmed the final window yet. We update
          this card the moment they do.
        </p>
      ) : null}
      {event.status === "unconfirmed" ? (
        <p
          role="note"
          className="mt-4 flex items-start gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[13px] font-semibold leading-relaxed text-danger"
        >
          <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Unconfirmed — verify with the organizer before making plans. This listing is awaiting a
          fresh source check.
        </p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_330px]">
        <div className="min-w-0 space-y-4">
          <WhenCard event={event} />
          <WhereCard event={event} />

          <section aria-label="Who should go" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-mist">
              <Users size={13} className="text-gold" aria-hidden="true" />
              Who should go
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-cream/90">{event.whoShouldGo}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Audience">
              {event.audience.map((a) => (
                <li
                  key={a}
                  className="rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-mist"
                >
                  {AUDIENCE_LABELS[a]}
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="About this event" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="text-[11px] font-black uppercase tracking-[0.18em] text-mist">
              About this event
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-cream/90">{event.summary}</p>
          </section>

          <section aria-label="Price and source" className="rounded-2xl border border-line bg-card p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-mist">
              <Wallet size={13} className="text-gold" aria-hidden="true" />
              Price &amp; source
            </h2>
            <p className="mt-3 flex flex-wrap items-center gap-2 text-[14px] font-bold text-cream">
              {PRICE_LABELS[event.price]}
              {event.priceNote ? (
                <span className="text-[13px] font-medium text-mist">{event.priceNote}</span>
              ) : null}
            </p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-mist">
              We never invent ticket prices — the organizer page is the source of truth.
            </p>
            <p className="mt-3 flex items-center gap-2 border-t border-line/70 pt-3 text-[12.5px] text-mist">
              <BadgeCheck size={14} className="shrink-0 text-mint" aria-hidden="true" />
              Source: {event.source}
            </p>
          </section>
        </div>

        {/* Actions */}
        <aside aria-label="Actions" className="lg:sticky lg:top-[112px] lg:self-start">
          <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
              aria-label="Register or open the source page (new tab)"
            >
              Register / open source page
              <ExternalLink size={15} aria-hidden="true" />
            </a>
            <IcsButton event={event} className="w-full" />
            <ShareButton title={event.title} text={shareText} path={`/events/${event.slug}`} />
            <div className="h-px bg-line/70" />
            <FollowChip kind="type" value={event.type} label={TYPE_LABELS[event.type]} className="w-full" />
            {isNigeriaCity(event.city) ? (
              <FollowChip kind="city" value={event.city} label={event.city} className="w-full" />
            ) : null}
            <p className="text-[11.5px] leading-relaxed text-mist">
              Followed cities and types power your weekly digest on the Alerts screen.
            </p>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section aria-labelledby="related-heading" className="mt-10">
          <h2 id="related-heading" className="mb-4 text-lg font-black tracking-tight text-cream">
            More like this
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
