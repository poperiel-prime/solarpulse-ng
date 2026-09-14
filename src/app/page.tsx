import Link from "next/link";
import { ArrowRight, CalendarDays, ShieldCheck, Zap } from "lucide-react";
import FlagshipBanner from "@/components/FlagshipBanner";
import { NewsStrip } from "@/components/NewsCard";
import SavedBanner from "@/components/SavedBanner";
import KeyShowsSection from "@/components/home/KeyShowsSection";
import NextThirtySection from "@/components/home/NextThirtySection";
import RecentlyAddedSection from "@/components/home/RecentlyAddedSection";
import SubmitCta from "@/components/home/SubmitCta";
import ThisWeekSection from "@/components/home/ThisWeekSection";
import { flagshipEvent, nigeriaEvents } from "@/lib/events";
import { news } from "@/lib/news";

function Hero() {
  return (
    <section className="sun-glow relative overflow-hidden border-b border-line/60">
      <div aria-hidden="true" className="grid-fade absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">
        <p className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.16em] text-mint">
          <Zap size={12} strokeWidth={2.5} aria-hidden="true" />
          Independent industry calendar · Nigeria
        </p>
        <h1 className="mt-5 max-w-3xl text-[34px] font-black leading-[1.05] tracking-tight text-cream sm:text-5xl">
          What is happening in Nigerian{" "}
          <span className="bg-gradient-to-r from-gold to-[#ffd97a] bg-clip-text text-transparent">
            solar
          </span>{" "}
          this month.
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-mist sm:text-base">
          Expos, tenders, trainings, association meetings. Times in WAT. Open it Monday, plan the
          month — no LinkedIn hunting, no WhatsApp forwards.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href="/events"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
          >
            <CalendarDays size={17} aria-hidden="true" />
            Open the calendar
          </Link>
          <Link
            href="/submit"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-5 text-sm font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
          >
            Submit an event
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <dl className="mt-9 flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist">Listed events</dt>
            <dd className="mt-0.5 text-2xl font-black text-cream">{nigeriaEvents.length}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist">Categories</dt>
            <dd className="mt-0.5 text-2xl font-black text-cream">6</dd>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.16em] text-mist">Timezone</dt>
            <dd className="mt-0.5 text-2xl font-black text-gold">WAT</dd>
          </div>
        </dl>
      </div>
      <svg
        aria-hidden="true"
        viewBox="0 0 1280 46"
        preserveAspectRatio="none"
        className="relative block h-9 w-full text-mint/35"
      >
        <path
          d="M0 23 H420 l22 -14 l30 28 l22 -14 H880 l17 -10 l24 20 l17 -10 H1280"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-pulse-line"
        />
      </svg>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <SavedBanner />
        <div className="space-y-12">
          <RecentlyAddedSection />
          <ThisWeekSection />
          <NextThirtySection />
          <KeyShowsSection />
          {flagshipEvent ? <FlagshipBanner event={flagshipEvent} /> : null}
          <section aria-labelledby="news-heading">
            <div className="mb-4 flex items-end justify-between gap-2">
              <div>
                <h2 id="news-heading" className="text-xl font-black tracking-tight text-cream">
                  Industry news
                </h2>
                <p className="mt-0.5 text-[12.5px] font-medium text-mist">
                  From Nigerian and sector press — links open the publisher
                </p>
              </div>
            </div>
            <NewsStrip items={news.slice(0, 5)} />
          </section>
          <SubmitCta />
          <p className="flex items-start gap-2 rounded-xl border border-line/70 bg-surface/60 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
            SolarPulse NG is a curated human calendar — not an official organizer app. Always
            confirm dates, venues and prices with organizers before you travel or pay.
          </p>
        </div>
      </div>
    </>
  );
}
