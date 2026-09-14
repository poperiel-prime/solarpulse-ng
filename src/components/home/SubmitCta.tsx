import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

export default function SubmitCta() {
  return (
    <section aria-label="Submit an event">
      <div className="flex flex-col items-start gap-4 rounded-3xl border border-line bg-gradient-to-r from-card to-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gold/15">
            <ClipboardList size={20} className="text-gold" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-[17px] font-black tracking-tight text-cream">
              Know a show, tender or training we missed?
            </h2>
            <p className="mt-0.5 max-w-md text-[13px] leading-relaxed text-mist">
              Send it in — a curator verifies every listing against the organizer page before it
              goes live.
            </p>
          </div>
        </div>
        <Link
          href="/submit"
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
        >
          Submit an event
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
