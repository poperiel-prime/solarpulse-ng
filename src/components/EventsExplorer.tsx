"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, RotateCcw, Search } from "lucide-react";
import AfricaWatchSection from "@/components/AfricaWatchSection";
import CalendarMonth from "@/components/CalendarMonth";
import CityFilter from "@/components/CityFilter";
import EmptyState from "@/components/EmptyState";
import EventCard from "@/components/EventCard";
import {
  effectiveStatus,
  eventCoversDay,
  groupByMonth,
  isPast,
  monthKey,
  relativeDay,
} from "@/lib/dates";
import { useMergedAfricaEvents, useMergedNigeriaEvents } from "@/lib/sharedStore";
import { useHydrated } from "@/lib/useHydrated";
import {
  EVENT_TYPES,
  NIGERIA_CITIES,
  PRICE_LABELS,
  PRICE_TYPES,
  TYPE_LABELS,
  type EventType,
  type PriceType,
  type SolarEvent,
} from "@/lib/types";

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function matchesQuery(e: SolarEvent, q: string): boolean {
  const hay = `${e.title} ${e.organizer} ${e.venue}`.toLowerCase();
  return hay.includes(q);
}

export default function EventsExplorer() {
  const hydrated = useHydrated();
  const nigeriaList = useMergedNigeriaEvents();
  const africaList = useMergedAfricaEvents();
  const [cities, setCities] = useState<string[]>([]);
  const [types, setTypes] = useState<EventType[]>([]);
  const [prices, setPrices] = useState<PriceType[]>([]);
  const [confirmedOnly, setConfirmedOnly] = useState(true);
  const [query, setQuery] = useState("");
  const [includePast, setIncludePast] = useState(false);
  const [view, setView] = useState<"list" | "month">("list");
  const [cursorOverride, setCursorOverride] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const defaultCursor = useMemo(() => {
    if (!hydrated) return null;
    const upcoming = nigeriaList.find((e) => !isPast(e));
    return monthKey((upcoming ?? nigeriaList[0]).startAt);
  }, [hydrated, nigeriaList]);
  const cursor = cursorOverride ?? defaultCursor;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nigeriaList.filter((e) => {
      if (cities.length > 0 && !cities.includes(e.city)) return false;
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (prices.length > 0 && !prices.includes(e.price)) return false;
      if (confirmedOnly && effectiveStatus(e) !== "confirmed") return false;
      if (q && !matchesQuery(e, q)) return false;
      if (!includePast && hydrated && isPast(e)) return false;
      return true;
    });
  }, [cities, types, prices, confirmedOnly, query, includePast, hydrated, nigeriaList]);

  const filteredAfrica = useMemo(() => {
    const q = query.trim().toLowerCase();
    return africaList.filter((e) => {
      if (types.length > 0 && !types.includes(e.type)) return false;
      if (prices.length > 0 && !prices.includes(e.price)) return false;
      if (confirmedOnly && effectiveStatus(e) !== "confirmed") return false;
      if (q && !matchesQuery(e, q)) return false;
      if (!includePast && hydrated && isPast(e)) return false;
      return true;
    });
  }, [types, prices, confirmedOnly, query, includePast, hydrated, africaList]);

  const months = useMemo(() => groupByMonth(filtered), [filtered]);

  const hasActiveFilters =
    cities.length > 0 ||
    types.length > 0 ||
    prices.length > 0 ||
    query.trim() !== "" ||
    includePast ||
    !confirmedOnly;

  function resetFilters() {
    setCities([]);
    setTypes([]);
    setPrices([]);
    setQuery("");
    setIncludePast(false);
    setConfirmedOnly(true);
  }

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    return filtered.filter((e) => eventCoversDay(e, selectedDay));
  }, [selectedDay, filtered]);

  const cursorMonthEvents = useMemo(() => {
    if (!cursor) return filtered;
    return filtered.filter((e) => monthKey(e.startAt) === cursor);
  }, [cursor, filtered]);

  const monthShown = selectedDay ? dayEvents : cursorMonthEvents;

  return (
    <div className="space-y-6">
      {/* Filter panel */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
        <label
          htmlFor="event-search"
          className="mb-1.5 block text-[11px] font-black uppercase tracking-[0.16em] text-mist"
        >
          Search title, organizer, venue
        </label>
        <div className="relative">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-mist"
          />
          <input
            id="event-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “Landmark”, “REAN”, “mini-grid”…"
            className="min-h-11 w-full rounded-xl border border-line bg-card pl-10 pr-4 text-[14px] text-cream placeholder:text-mist/70 focus:border-gold focus:outline-none"
          />
        </div>

        <div className="mt-4 space-y-4">
          <CityFilter
            label="City"
            options={NIGERIA_CITIES}
            selected={cities}
            onToggle={(c) => setCities((prev) => toggleValue(prev, c))}
            optionLabel={(c) => c}
          />
          <CityFilter
            label="Type"
            options={EVENT_TYPES}
            selected={types}
            onToggle={(t) => setTypes((prev) => toggleValue(prev, t))}
            optionLabel={(t) => TYPE_LABELS[t]}
          />
          <CityFilter
            label="Price"
            options={PRICE_TYPES}
            selected={prices}
            onToggle={(p) => setPrices((prev) => toggleValue(prev, p))}
            optionLabel={(p) => PRICE_LABELS[p]}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-line/70 pt-4">
          <button
            type="button"
            role="switch"
            aria-checked={confirmedOnly}
            onClick={() => setConfirmedOnly((v) => !v)}
            className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
              confirmedOnly ? "border-mint/50 bg-mint/10 text-mint" : "border-line bg-card text-mist"
            }`}
          >
            <span
              aria-hidden="true"
              className={`relative h-5 w-9 rounded-full transition-colors ${confirmedOnly ? "bg-mint/70" : "bg-line"}`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-cream transition-transform ${confirmedOnly ? "translate-x-[18px]" : "translate-x-0.5"}`}
              />
            </span>
            Confirmed only
          </button>

          <button
            type="button"
            aria-pressed={includePast}
            onClick={() => setIncludePast((v) => !v)}
            className={`min-h-11 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
              includePast
                ? "border-gold bg-gold/15 text-gold"
                : "border-line bg-card text-mist hover:text-cream"
            }`}
          >
            Include past events
          </button>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-danger hover:bg-danger/10"
            >
              <RotateCcw size={14} aria-hidden="true" />
              Clear all
            </button>
          ) : null}
        </div>
      </div>

      {/* Results header + view toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-mist" aria-live="polite">
          Showing{" "}
          <span className="font-black text-cream">{hydrated ? filtered.length : "–"}</span> of{" "}
          {nigeriaList.length} Nigerian events
          {confirmedOnly ? " · confirmed only" : ""}
        </p>
        <div
          role="group"
          aria-label="View"
          className="flex overflow-hidden rounded-xl border border-line bg-card"
        >
          {(
            [
              { key: "list", label: "List", Icon: List },
              { key: "month", label: "Month", Icon: CalendarDays },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              onClick={() => setView(key)}
              className={`flex min-h-11 items-center gap-1.5 px-4 text-[13px] font-bold transition-colors ${
                view === key ? "bg-gold text-ink" : "text-mist hover:text-cream"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {!hydrated ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-line bg-card/60" />
          ))}
        </div>
      ) : view === "list" ? (
        months.length === 0 ? (
          <EmptyState
            title="No events match those filters."
            hint="Loosen a filter or include past events."
            pidgin="We no see am o — clear the filters make we check again."
            action={
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-11 items-center rounded-xl bg-card px-4 text-sm font-bold text-gold hover:text-gold-hover"
              >
                Clear all filters
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {months.map((m) => (
              <section key={m.key} aria-labelledby={`month-${m.key}`}>
                <h2
                  id={`month-${m.key}`}
                  className="sticky top-[104px] z-10 -mx-1 bg-ink/90 px-1 py-2 text-[13px] font-black uppercase tracking-[0.18em] text-gold backdrop-blur-sm"
                >
                  {m.label}
                  <span className="ml-2 text-mist">({m.events.length})</span>
                </h2>
                <ul className="mt-1 grid gap-3 sm:grid-cols-2">
                  {m.events.map((e) => (
                    <EventCard key={e.id} event={e} badge={relativeDay(e.startAt) ?? undefined} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          {cursor ? (
            <CalendarMonth
              events={filtered}
              cursor={cursor}
              onCursorChange={(c) => {
                setCursorOverride(c);
                setSelectedDay(null);
              }}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          ) : null}
          <div className="min-w-0">
            <h2 className="mb-2 text-[13px] font-black uppercase tracking-[0.16em] text-mist">
              {selectedDay
                ? `Events on ${selectedDay}`
                : cursorMonthEvents.length > 0
                  ? "This month"
                  : "No events this month"}
            </h2>
            {monthShown.length === 0 ? (
              <EmptyState
                title={selectedDay ? "Nothing listed on this day." : "No events this month."}
                hint="Try another month, or clear filters."
                pidgin="This one dry — check another day."
              />
            ) : (
              <ul className="divide-y divide-line/60 overflow-hidden rounded-2xl border border-line bg-surface px-2 py-1.5">
                {monthShown.map((e) => (
                  <EventCard key={e.id} event={e} variant="row" />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Africa watch stays separate */}
      {hydrated ? <AfricaWatchSection events={filteredAfrica} /> : null}
    </div>
  );
}
