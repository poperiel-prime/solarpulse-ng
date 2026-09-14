"use client";

import { useState } from "react";
import { CalendarPlus, Check } from "lucide-react";
import { buildIcs, icsFilename } from "@/lib/ics";
import type { SolarEvent } from "@/lib/types";

export default function IcsButton({
  event,
  className = "",
}: {
  event: SolarEvent;
  className?: string;
}) {
  const [done, setDone] = useState(false);

  function download() {
    const ics = buildIcs(event);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = icsFilename(event);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    setDone(true);
    window.setTimeout(() => setDone(false), 2400);
  }

  return (
    <button
      type="button"
      onClick={download}
      aria-label={`Add ${event.title} to your calendar (.ics, times in WAT)`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-bold text-cream transition-colors hover:border-mint/50 hover:text-mint ${className}`}
    >
      {done ? (
        <Check size={16} className="text-mint" aria-hidden="true" />
      ) : (
        <CalendarPlus size={16} aria-hidden="true" />
      )}
      {done ? "Saved .ics" : "Add to calendar"}
    </button>
  );
}
