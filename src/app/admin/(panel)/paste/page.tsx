import type { Metadata } from "next";
import PasteClient from "@/components/admin/PasteClient";

export const metadata: Metadata = {
  title: "Paste dump",
};

export default function PastePage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">Paste dump</h1>
        <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
          How the desk works in week one: paste titles, dates and links from WhatsApp, newsletters
          or PDF flyers. The parser turns them into drafts for the inbox.
        </p>
      </header>
      <PasteClient />
    </>
  );
}
