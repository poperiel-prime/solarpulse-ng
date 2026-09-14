"use client";

import { useState } from "react";
import { Check, Send } from "lucide-react";
import { useClientSignal, subscribeNone } from "@/lib/useHydrated";

export default function ShareButton({
  title,
  text,
  path,
  className = "",
}: {
  title: string;
  text: string;
  /** e.g. /events/slug — resolved against the current origin at click time. */
  path: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canShare = useClientSignal(
    subscribeNone,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    false,
  );

  async function share() {
    const url = `${window.location.origin}${path}`;
    if (canShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        return; // user dismissed the sheet
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={share}
        aria-label={`Share ${title}`}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
      >
        {copied ? (
          <Check size={16} className="text-mint" aria-hidden="true" />
        ) : (
          <Send size={16} aria-hidden="true" />
        )}
        {copied ? "Link copied" : "Share"}
      </button>
      {copied ? (
        <p
          role="status"
          className="absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-line bg-ink px-3 py-1.5 text-[12px] font-semibold text-mint shadow-xl"
        >
          Link copied — send give your guys
        </p>
      ) : null}
    </div>
  );
}
