import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card">
        <Compass size={26} className="text-gold" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-black tracking-tight text-cream">Page not found</h1>
      <p className="mt-2 max-w-md text-[14px] leading-relaxed text-mist">
        That link does not point at a listed event or screen. The calendar is the best place to
        start.
      </p>
      <Link
        href="/events"
        className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
      >
        Open the calendar
      </Link>
    </div>
  );
}
