import type { Metadata } from "next";
import { FileCheck2, Hand, SearchCheck } from "lucide-react";
import SubmitForm from "@/components/SubmitForm";

export const metadata: Metadata = {
  title: "Submit an event",
  description:
    "Submit a Nigerian solar expo, tender, training or meeting. A curator verifies every listing against the organizer page before it goes live.",
};

const STEPS = [
  {
    Icon: FileCheck2,
    title: "You submit",
    text: "The form below — no login needed. It saves on your device and opens an email to the curation desk.",
  },
  {
    Icon: SearchCheck,
    title: "A curator verifies",
    text: "We check the organizer page, dates and venue. Flagship shows are checked against organizer pages directly.",
  },
  {
    Icon: Hand,
    title: "It goes live",
    text: "Verified listings join the calendar with times in WAT. Anything we cannot verify is marked Unconfirmed or dropped.",
  },
];

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-7">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">
          Submit an event
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          No login. Tell us what is happening — a human verifies it before it goes live on the
          calendar.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <SubmitForm />
        </div>
        <aside aria-label="How verification works" className="space-y-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <div key={title} className="rounded-2xl border border-line bg-card p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-[12px] font-black text-gold">
                  {i + 1}
                </span>
                <h2 className="flex items-center gap-1.5 text-[14px] font-bold text-cream">
                  <Icon size={14} className="text-gold" aria-hidden="true" />
                  {title}
                </h2>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-mist">{text}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-line bg-card p-4">
            <h2 className="text-[13px] font-bold text-cream">Direct email</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-mist">
              Prefer email? Send the details to{" "}
              <a
                href="mailto:events@solarpulse.ng"
                className="font-bold text-gold hover:text-gold-hover"
              >
                events@solarpulse.ng
              </a>
              .
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
