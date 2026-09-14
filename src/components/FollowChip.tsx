"use client";

import { BellPlus, Check } from "lucide-react";
import { loadAlerts, toggleCity, toggleType } from "@/lib/storage";
import { useClientSignal } from "@/lib/useHydrated";
import type { EventType } from "@/lib/types";

export function subscribeAlerts(cb: () => void): () => void {
  window.addEventListener("solarpulse:alerts", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("solarpulse:alerts", cb);
    window.removeEventListener("storage", cb);
  };
}

/** Writes followed cities/types into localStorage alerts (key: solarpulse-alerts). */
export default function FollowChip({
  kind,
  value,
  label,
  className = "",
}: {
  kind: "city" | "type";
  value: string | EventType;
  label: string;
  className?: string;
}) {
  const active = useClientSignal(
    subscribeAlerts,
    () => {
      const prefs = loadAlerts();
      return kind === "city"
        ? prefs.cities.includes(value)
        : prefs.types.includes(value as EventType);
    },
    false,
  );

  function toggle() {
    if (kind === "city") toggleCity(value);
    else toggleType(value as EventType);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      aria-label={`${active ? "Unfollow" : "Follow"} ${label}`}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-bold transition-colors ${
        active
          ? "border-mint/50 bg-mint/10 text-mint"
          : "border-line bg-card text-cream hover:border-mint/40 hover:text-mint"
      } ${className}`}
    >
      {active ? (
        <Check size={16} aria-hidden="true" />
      ) : (
        <BellPlus size={16} aria-hidden="true" />
      )}
      {active ? `Following ${label}` : `Follow ${label}`}
    </button>
  );
}
