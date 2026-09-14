import type { Metadata } from "next";
import SourcesClient from "@/components/admin/SourcesClient";

export const metadata: Metadata = {
  title: "Sources",
};

export default function SourcesPage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">Watch list</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          The only places the hunter looks. Toggle sources off, add your own, or reset to the seed
          list. Changes save on this device.
        </p>
      </header>
      <SourcesClient />
    </>
  );
}
