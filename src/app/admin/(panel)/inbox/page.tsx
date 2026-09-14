import type { Metadata } from "next";
import InboxClient from "@/components/admin/InboxClient";

export const metadata: Metadata = {
  title: "Review inbox",
};

export default function InboxPage() {
  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-cream sm:text-3xl">Review inbox</h1>
          <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-mist">
            Drafts from the hunter and public submissions. Nothing here is public until you open
            the source and tap Add.
          </p>
        </div>
      </header>
      <InboxClient />
    </>
  );
}
