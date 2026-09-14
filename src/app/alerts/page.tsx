import type { Metadata } from "next";
import AlertsClient from "@/components/AlertsClient";

export const metadata: Metadata = {
  title: "Alerts",
  description:
    "Follow Nigerian solar cities and event types, and get the Monday 07:00 WAT digest. Stored on your device — no account needed.",
};

export default function AlertsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-7">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">Alerts</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          Follow the cities and categories you care about and get the Monday digest. Everything is
          stored on this device — no account, no tracking.
        </p>
      </header>
      <AlertsClient />
    </div>
  );
}
