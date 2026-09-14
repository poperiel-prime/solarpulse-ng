import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck2,
  Check,
  Handshake,
  Mail,
  ShieldOff,
  Timer,
  X,
} from "lucide-react";
import AboutDebug from "@/components/AboutDebug";
import Logo from "@/components/Logo";

export const metadata: Metadata = {
  title: "About & sources",
  description:
    "SolarPulse NG is independent industry infrastructure: a curated, Nigeria-first calendar of solar events, tenders, trainings and news. How data gets in, and the 14-day unconfirmed rule.",
};

const IS = [
  "A live calendar of Nigerian solar expos, conferences, trainings, tenders and association meetings",
  "A news strip from Nigerian and sector press, linked out to the publisher",
  "A submission channel a human curator verifies before anything goes live",
  "Times in WAT, always — readable on a mid-range Android on a slow network",
];

const IS_NOT = [
  "Not a sizing calculator or quote tool",
  "Not a marketplace — nothing is sold here",
  "Not IoT or device monitoring",
  "Not ticketing or payments — register links always point out to organizers",
];

const PARTNERS = ["REAN", "AFSIA", "Terrapinn", "Eventhive", "GOGLA"];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="max-w-3xl">
        <div className="flex items-center gap-3">
          <Logo size={44} />
          <p className="text-[11.5px] font-black uppercase tracking-[0.2em] text-mint">
            Independent industry infrastructure
          </p>
        </div>
        <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-cream sm:text-[34px]">
          One screen that answers: what is happening in Nigerian solar this month.
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-mist">
          A technician in Ibadan or a developer in Lagos can open SolarPulse NG on a Monday and
          know the month&apos;s expos, tenders, trainings and meetings — without hunting LinkedIn
          or chasing WhatsApp forwards.
        </p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="what-it-is" className="rounded-2xl border border-mint/30 bg-card p-5">
          <h2 id="what-it-is" className="flex items-center gap-2 text-[15px] font-black text-mint">
            <CalendarCheck2 size={17} aria-hidden="true" />
            What this is
          </h2>
          <ul className="mt-3 space-y-2.5">
            {IS.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-cream/90">
                <Check size={15} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="what-it-is-not" className="rounded-2xl border border-line bg-card p-5">
          <h2 id="what-it-is-not" className="flex items-center gap-2 text-[15px] font-black text-cream">
            <ShieldOff size={17} className="text-danger" aria-hidden="true" />
            What this is not
          </h2>
          <ul className="mt-3 space-y-2.5">
            {IS_NOT.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-mist">
                <X size={15} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section aria-labelledby="nigeria-first" className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 id="nigeria-first" className="text-[15px] font-black text-cream">
          Why Nigeria-first
        </h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-mist">
          Nigeria is one of the fastest-moving solar markets in Africa — diesel economics, C&amp;I
          rooftops, mini-grids and a growing local assembly base. Continental roundups bury the
          Lagos and Abuja shows under regional noise, so this feed flips it: Nigeria is the main
          calendar. Africa-wide shows live in a clearly-marked “Also in Africa” watch section.
          Africa later, properly.
        </p>
      </section>

      <section aria-labelledby="how-data" className="mt-4 rounded-2xl border border-line bg-card p-5">
        <h2 id="how-data" className="text-[15px] font-black text-cream">
          How data gets in
        </h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-mist">
          A curator in Lagos maintains the calendar. A small background hunter watches a fixed
          source list (REAN, AFSIA, organizer pages, energy press) and drops drafts into a private
          review inbox; the public submit form lands in the same queue. Nothing ever auto-publishes
          — every listing goes live because a human opened the source and tapped Add.
        </p>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-mist">
          Honest limits: the hunter only watches the source list. It cannot see most WhatsApp
          groups. It will miss closed trainings and last-minute venue changes. A human still
          accepts or declines.
        </p>
        <p className="mt-2 text-[13.5px]">
          <Link href="/admin" className="font-bold text-mist underline underline-offset-2 hover:text-gold">
            Curator →
          </Link>
        </p>
        <p className="mt-3 text-[12px] font-black uppercase tracking-[0.16em] text-mist">
          Ecosystem we track
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Ecosystem partners we track">
          {PARTNERS.map((p) => (
            <li
              key={p}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[12.5px] font-bold text-cream"
            >
              {p}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="The 14-day rule" className="mt-4 rounded-2xl border border-gold/35 bg-gold/5 p-5">
        <h2 className="flex items-center gap-2 text-[15px] font-black text-gold">
          <Timer size={17} aria-hidden="true" />
          The 14-day rule
        </h2>
        <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-cream/85">
          Data older than 14 days before an event is marked Unconfirmed. Flagship shows are
          re-checked against organizer pages as their dates approach; tentative items stay amber
          until the organizer locks a window. If you spot a stale card, email{" "}
          <a href="mailto:events@solarpulse.ng" className="font-bold text-gold hover:text-gold-hover">
            events@solarpulse.ng
          </a>
          .
        </p>
      </section>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <section aria-labelledby="partners-wanted" className="rounded-2xl border border-line bg-card p-5">
          <h2 id="partners-wanted" className="flex items-center gap-2 text-[15px] font-black text-cream">
            <Handshake size={17} className="text-mint" aria-hidden="true" />
            Partners wanted
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
            Associations, training providers and state programmes: if you run a recurring calendar,
            we can list it under your name with a source link on every card. No fees, no ads —
            the goal is a complete, trusted industry calendar.
          </p>
        </section>

        <section aria-labelledby="contact" className="rounded-2xl border border-line bg-card p-5">
          <h2 id="contact" className="flex items-center gap-2 text-[15px] font-black text-cream">
            <Mail size={17} className="text-gold" aria-hidden="true" />
            Contact
          </h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-mist">
            Corrections, submissions, partnerships and press:{" "}
            <a href="mailto:events@solarpulse.ng" className="font-bold text-gold hover:text-gold-hover">
              events@solarpulse.ng
            </a>
            . A human reads every message from Lagos.
          </p>
        </section>
      </div>

      <AboutDebug />

      <p className="mt-6 rounded-xl border border-line/70 bg-surface/60 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
        SolarPulse NG is not affiliated with Solar &amp; Storage Live, REAN, or any organizer.
        Independent feed. Times in WAT. Curated for Nigeria.
      </p>
    </div>
  );
}
