"use client";

import { useMemo, useState } from "react";
import { BellPlus, BellRing, Check, Copy, Star, X } from "lucide-react";
import { dayBadge, eventsInNextDays } from "@/lib/dates";
import { nigeriaEvents } from "@/lib/events";
import {
  loadAlerts,
  toggleCity,
  toggleType,
  updateAlerts,
  type AlertPrefs,
} from "@/lib/storage";
import { useHydrated } from "@/lib/useHydrated";
import {
  EVENT_TYPES,
  NIGERIA_CITIES,
  TYPE_LABELS,
  type EventType,
} from "@/lib/types";

type NotifState = "default" | "granted" | "denied" | "unsupported";

function FollowToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
        active
          ? "border-mint/50 bg-mint/15 text-mint"
          : "border-line bg-card text-mist hover:border-mint/40 hover:text-cream"
      }`}
    >
      {active ? <Check size={14} aria-hidden="true" /> : <BellPlus size={14} aria-hidden="true" />}
      {label}
    </button>
  );
}

const INITIAL_PERM: NotifState = "default";

export default function AlertsClient() {
  const hydrated = useHydrated();

  const basePrefs = useMemo(() => (hydrated ? loadAlerts() : null), [hydrated]);
  const [prefsOverride, setPrefsOverride] = useState<AlertPrefs | null>(null);
  const prefs = prefsOverride ?? basePrefs;

  const basePerm = useMemo<NotifState>(() => {
    if (!hydrated) return INITIAL_PERM;
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  }, [hydrated]);
  const [permOverride, setPermOverride] = useState<NotifState | null>(null);
  const perm = permOverride ?? basePerm;

  const [copied, setCopied] = useState(false);

  const digestLines = useMemo(() => {
    if (!hydrated) return [];
    return eventsInNextDays(nigeriaEvents, 7, new Date()).map(
      (e) =>
        `• ${dayBadge(e.startAt).dow} ${dayBadge(e.startAt).day} ${dayBadge(e.startAt).month} — ${e.title} (${e.city} · ${TYPE_LABELS[e.type]})`,
    );
  }, [hydrated]);

  const digestText = useMemo(
    () =>
      [
        "This week in Nigerian solar — SolarPulse NG",
        "",
        ...(digestLines.length > 0 ? digestLines : ["• Nothing listed in the next 7 days."]),
        "",
        "Times in WAT. Full calendar: solarpulse.ng/events",
      ].join("\n"),
    [digestLines],
  );

  async function enableNotifications() {
    if (typeof Notification === "undefined") {
      setPermOverride("unsupported");
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermOverride(result);
      if (result === "granted" && prefs) setPrefsOverride(updateAlerts({ notifications: true }));
    } catch {
      setPermOverride("unsupported");
    }
  }

  function copyDigest() {
    navigator.clipboard
      .writeText(digestText)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2400);
      })
      .catch(() => {
        window.prompt("Copy the digest:", digestText);
      });
  }

  if (!prefs) {
    return (
      <div className="grid gap-4" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-2xl border border-line bg-card/60" />
        ))}
      </div>
    );
  }

  const followCount = prefs.cities.length + prefs.types.length;

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Follow cities */}
      <section aria-labelledby="follow-cities" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="follow-cities" className="text-[15px] font-black tracking-tight text-cream">
          Follow cities
        </h2>
        <p className="mt-1 text-[12.5px] text-mist">Only the ones you care about show up in your digest.</p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {NIGERIA_CITIES.map((c) => (
            <FollowToggle
              key={c}
              label={c}
              active={prefs.cities.includes(c)}
              onToggle={() => setPrefsOverride(toggleCity(c))}
            />
          ))}
        </div>
      </section>

      {/* Follow types */}
      <section aria-labelledby="follow-types" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="follow-types" className="text-[15px] font-black tracking-tight text-cream">
          Follow types
        </h2>
        <p className="mt-1 text-[12.5px] text-mist">Tender hunter? Only trainings? Pick your lanes.</p>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t: EventType) => (
            <FollowToggle
              key={t}
              label={TYPE_LABELS[t]}
              active={prefs.types.includes(t)}
              onToggle={() => setPrefsOverride(toggleType(t))}
            />
          ))}
        </div>
      </section>

      {/* Weekly digest */}
      <section aria-labelledby="digest" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <h2 id="digest" className="flex items-center gap-2 text-[15px] font-black tracking-tight text-cream">
          <BellRing size={16} className="text-gold" aria-hidden="true" />
          Weekly digest — Monday 07:00 WAT
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-mist">
          One short run-down to start the week: “This week in Nigerian solar — SolarPulse NG”.
        </p>

        <button
          type="button"
          role="switch"
          aria-checked={prefs.digest}
          onClick={() => setPrefsOverride(updateAlerts({ digest: !prefs.digest }))}
          className={`mt-4 flex min-h-11 w-full items-center justify-between gap-2.5 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
            prefs.digest ? "border-mint/50 bg-mint/10 text-mint" : "border-line bg-card text-mist"
          }`}
        >
          Monday digest on this device
          <span
            aria-hidden="true"
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${prefs.digest ? "bg-mint/70" : "bg-line"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream transition-transform ${prefs.digest ? "translate-x-[18px]" : "translate-x-0.5"}`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={enableNotifications}
          disabled={perm === "granted" || perm === "unsupported"}
          className={`mt-2.5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
            perm === "granted"
              ? "border-mint/50 bg-mint/10 text-mint"
              : perm === "unsupported" || perm === "denied"
                ? "border-line bg-card text-mist"
                : "border-gold/50 bg-gold/10 text-gold hover:bg-gold/20"
          }`}
        >
          <BellRing size={15} aria-hidden="true" />
          {perm === "granted"
            ? "Browser notifications enabled"
            : perm === "unsupported"
              ? "Notifications not supported here"
              : perm === "denied"
                ? "Notifications blocked by browser"
                : "Enable browser notifications"}
        </button>

        {perm !== "granted" ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-card px-3.5 py-3 text-[12.5px] leading-relaxed text-mist">
            <Star size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            Real push needs a backend — for now: MVP digest also works if you star this page and
            check Mondays.
          </p>
        ) : null}
      </section>

      {/* Digest preview */}
      <section aria-labelledby="preview" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="preview" className="text-[15px] font-black tracking-tight text-cream">
              This week&apos;s digest preview
            </h2>
            <p className="mt-1 text-[12.5px] text-mist">Generated from the live calendar, next 7 days.</p>
          </div>
          <button
            type="button"
            onClick={copyDigest}
            className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-line bg-card px-3.5 text-[12.5px] font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
          >
            {copied ? <Check size={14} className="text-mint" aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <pre className="mt-3.5 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl border border-line bg-ink p-4 text-[12.5px] leading-relaxed text-cream/90">
          {digestText}
        </pre>
      </section>

      {/* You follow */}
      <section aria-labelledby="you-follow" className="rounded-2xl border border-line bg-surface p-4 sm:p-5 lg:col-span-2">
        <div className="flex items-center justify-between gap-3">
          <h2 id="you-follow" className="text-[15px] font-black tracking-tight text-cream">
            You follow {followCount > 0 ? `(${followCount})` : ""}
          </h2>
          {followCount > 0 ? (
            <button
              type="button"
              onClick={() => setPrefsOverride(updateAlerts({ cities: [], types: [] }))}
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[12.5px] font-bold text-danger hover:bg-danger/10"
            >
              <X size={14} aria-hidden="true" />
              Clear all
            </button>
          ) : null}
        </div>
        {followCount === 0 ? (
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            You are not following anything yet — tap cities or types above. Stored on this device
            only, under <code className="rounded bg-card px-1.5 py-0.5 text-[12px]">solarpulse-alerts</code>.
          </p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {prefs.cities.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setPrefsOverride(toggleCity(c))}
                  aria-label={`Unfollow ${c}`}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl border border-mint/40 bg-mint/10 px-3.5 text-[13px] font-bold text-mint"
                >
                  {c}
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
            {prefs.types.map((t) => (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => setPrefsOverride(toggleType(t))}
                  aria-label={`Unfollow ${TYPE_LABELS[t]}`}
                  className="flex min-h-11 items-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 px-3.5 text-[13px] font-bold text-gold"
                >
                  {TYPE_LABELS[t]}
                  <X size={13} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
