"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { WAT, eventDayKeys, monthLabelFromKey } from "@/lib/dates";
import { typeColor } from "@/components/TypeChip";
import { useHydrated } from "@/lib/useHydrated";
import type { SolarEvent } from "@/lib/types";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface DayCell {
  key: string; // yyyy-MM-dd in WAT terms
  day: number;
  events: SolarEvent[];
}

function addMonthsCursor(cursor: string, delta: number): string {
  const [y, m] = cursor.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export default function CalendarMonth({
  events,
  cursor,
  onCursorChange,
  selectedDay,
  onSelectDay,
}: {
  events: SolarEvent[];
  cursor: string;
  onCursorChange: (cursor: string) => void;
  selectedDay: string | null;
  onSelectDay: (key: string | null) => void;
}) {
  const hydrated = useHydrated();
  const todayKey = useMemo(
    () => (hydrated ? formatInTimeZone(new Date(), WAT, "yyyy-MM-dd") : ""),
    [hydrated],
  );

  const weeks = useMemo(() => {
    const [y, m] = cursor.split("-").map(Number);

    const byDay = new Map<string, SolarEvent[]>();
    for (const e of events) {
      for (const key of eventDayKeys(e)) {
        const bucket = byDay.get(key);
        if (bucket) bucket.push(e);
        else byDay.set(key, [e]);
      }
    }

    const firstDow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const cells: Array<DayCell | null> = [];
    for (let i = 0; i < firstDow; i += 1) cells.push(null);
    for (let d = 1; d <= daysInMonth; d += 1) {
      const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ key, day: d, events: byDay.get(key) ?? [] });
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const out: Array<Array<DayCell | null>> = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cursor, events]);

  return (
    <div className="rounded-2xl border border-line bg-card p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onCursorChange(addMonthsCursor(cursor, -1))}
          aria-label="Previous month"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-mist transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <p className="text-[15px] font-black tracking-tight text-cream" aria-live="polite">
          {monthLabelFromKey(cursor)}
        </p>
        <button
          type="button"
          onClick={() => onCursorChange(addMonthsCursor(cursor, 1))}
          aria-label="Next month"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-mist transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        role="group"
        aria-label={`Events in ${monthLabelFromKey(cursor)}`}
      >
        {DOW_LABELS.map((d) => (
          <div key={d} className="pb-1 text-center text-[10px] font-black uppercase tracking-wider text-mist">
            {d}
          </div>
        ))}
        {weeks.flatMap((week, wi) =>
          week.map((cell, di) => {
            if (!cell) return <div key={`${wi}-${di}`} aria-hidden="true" />;
            const has = cell.events.length > 0;
            const selected = selectedDay === cell.key;
            return (
              <button
                key={cell.key}
                type="button"
                aria-pressed={selected}
                aria-label={`${cell.day} ${monthLabelFromKey(cursor)}${has ? `, ${cell.events.length} event${cell.events.length > 1 ? "s" : ""}` : ""}`}
                onClick={() => onSelectDay(selected ? null : cell.key)}
                className={`flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-[13px] font-bold transition-colors sm:min-h-12 ${
                  selected
                    ? "bg-gold text-ink"
                    : has
                      ? "bg-card-2 text-cream hover:border-gold hover:text-gold"
                      : "text-mist/70 hover:bg-card-2/70"
                } ${todayKey === cell.key && !selected ? "ring-1 ring-mint/60" : ""}`}
              >
                {cell.day}
                {has ? (
                  <span className="flex gap-[3px]" aria-hidden="true">
                    {cell.events.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: selected ? "#0B1220" : typeColor(e.type) }}
                      />
                    ))}
                  </span>
                ) : (
                  <span className="h-1 w-1" aria-hidden="true" />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
