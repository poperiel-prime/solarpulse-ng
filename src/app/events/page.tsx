import type { Metadata } from "next";
import EventsExplorer from "@/components/EventsExplorer";

export const metadata: Metadata = {
  title: "Calendar",
  description:
    "Every listed solar expo, tender, training and industry meeting in Nigeria — filter by city, type, price and status. Times in WAT.",
};

export default function EventsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">
          Solar calendar
        </h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          Every listed expo, tender, training and association meeting — Nigeria first, grouped by
          month, soonest first. Times in WAT.
        </p>
      </header>
      <EventsExplorer />
    </div>
  );
}
