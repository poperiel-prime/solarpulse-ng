import { effectiveStatus } from "@/lib/dates";
import type { EventStatus, SolarEvent } from "@/lib/types";

const STYLES: Record<EventStatus, { label: string; dot: string; text: string; border: string }> = {
  confirmed: {
    label: "Confirmed",
    dot: "bg-mint",
    text: "text-mint",
    border: "border-mint/30",
  },
  tentative: {
    label: "Tentative",
    dot: "bg-gold",
    text: "text-gold",
    border: "border-gold/35",
  },
  unconfirmed: {
    label: "Unconfirmed — verify with organizer",
    dot: "bg-danger",
    text: "text-danger",
    border: "border-danger/40",
  },
};

export default function StatusPill({
  event,
  short = false,
  className = "",
}: {
  event: SolarEvent;
  short?: boolean;
  className?: string;
}) {
  const status = effectiveStatus(event);
  const s = STYLES[status];
  const label = short && status === "unconfirmed" ? "Unconfirmed" : s.label;
  return (
    <span
      title={status === "confirmed" ? "Verified against the organizer listing" : s.label}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border ${s.border} bg-ink/40 px-2 py-0.5 text-[10.5px] font-bold ${s.text} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}
