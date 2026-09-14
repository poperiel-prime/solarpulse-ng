import type { Metadata } from "next";
import LogClient from "@/components/admin/LogClient";

export const metadata: Metadata = {
  title: "Hunter log",
};

export default function LogPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">Hunter log</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          The last run — when, how many candidates, which sources failed, and how much dedup memory
          the desk has built.
        </p>
      </header>
      <LogClient />
    </>
  );
}
