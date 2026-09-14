import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import type { EventStatus, SolarEvent } from "./types";

/** Every datetime in SolarPulse NG is rendered in West Africa Time. */
export const WAT = "Africa/Lagos";

export function byStartAt(a: SolarEvent, b: SolarEvent): number {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export function fmtDateTimeWat(iso: string): string {
  return `${formatInTimeZone(iso, WAT, "EEE d MMM yyyy, HH:mm")} WAT`;
}

export function fmtDateWat(iso: string): string {
  return formatInTimeZone(iso, WAT, "EEE d MMM yyyy");
}

export function fmtTimeWat(iso: string): string {
  return `${formatInTimeZone(iso, WAT, "HH:mm")} WAT`;
}

export function sameWatDay(a: string | Date, b: string | Date): boolean {
  return formatInTimeZone(a, WAT, "yyyy-MM-dd") === formatInTimeZone(b, WAT, "yyyy-MM-dd");
}

/** "Tue 3 Feb 2026" or "Tue 3 – Thu 5 Feb 2026" for multi-day runs. */
export function fmtDateRangeWat(startAt: string, endAt: string): string {
  if (sameWatDay(startAt, endAt)) return fmtDateWat(startAt);
  return `${fmtDateWat(startAt)} – ${fmtDateWat(endAt)}`;
}

export interface DayBadge {
  day: string;
  month: string;
  dow: string;
}

export function dayBadge(iso: string): DayBadge {
  return {
    day: formatInTimeZone(iso, WAT, "d"),
    month: formatInTimeZone(iso, WAT, "MMM"),
    dow: formatInTimeZone(iso, WAT, "EEE"),
  };
}

export function monthKey(iso: string): string {
  return formatInTimeZone(iso, WAT, "yyyy-MM");
}

export function monthLabelFromKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(y, m - 1, 2)),
  );
}

export function shortDate(iso: string): string {
  return formatInTimeZone(iso, WAT, "d MMM yyyy");
}

/** Monday-start week boundaries, computed in Africa/Lagos. */
export function watWeekRange(now: Date = new Date()): { start: Date; end: Date } {
  const zoned = toZonedTime(now, WAT);
  const start = startOfWeek(zoned, { weekStartsOn: 1 });
  const end = endOfWeek(zoned, { weekStartsOn: 1 });
  return { start: fromZonedTime(start, WAT), end: fromZonedTime(end, WAT) };
}

export function fmtWeekRange(now: Date = new Date()): string {
  const { start, end } = watWeekRange(now);
  return `${formatInTimeZone(start, WAT, "EEE d MMM")} – ${formatInTimeZone(end, WAT, "EEE d MMM yyyy")}`;
}

export function overlapsRange(e: SolarEvent, start: Date, end: Date): boolean {
  const s = new Date(e.startAt).getTime();
  const t = new Date(e.endAt).getTime();
  return s <= end.getTime() && t >= start.getTime();
}

/** Events whose any day touches the current WAT week (Mon–Sun). */
export function eventsThisWeek(events: SolarEvent[], now: Date = new Date()): SolarEvent[] {
  const { start, end } = watWeekRange(now);
  return events.filter((e) => overlapsRange(e, start, end)).sort(byStartAt);
}

/** Events starting (or running) within the next `days` days. */
export function eventsInNextDays(
  events: SolarEvent[],
  days: number,
  now: Date = new Date(),
): SolarEvent[] {
  const end = addDays(now, days);
  const nowMs = now.getTime();
  return events
    .filter((e) => {
      const s = new Date(e.startAt).getTime();
      const t = new Date(e.endAt).getTime();
      return s <= end.getTime() && t >= nowMs;
    })
    .sort(byStartAt);
}

export function isPast(e: SolarEvent, now: Date = new Date()): boolean {
  return new Date(e.endAt).getTime() < now.getTime();
}

/**
 * Status rule: anything not confirmed renders as-is; confirmed records that
 * have gone stale (untouched past the 14-day window) drop to Unconfirmed.
 * Seed flagship events are kept confirmed and never flagged stale.
 */
export function effectiveStatus(e: SolarEvent): EventStatus {
  if (e.status !== "confirmed") return e.status;
  if (e.stale) return "unconfirmed";
  return "confirmed";
}

/**
 * Every WAT calendar day an event touches (start through end, inclusive).
 * Compares day keys, not timestamps: an event ending at 17:00 on the final day
 * must not spill into the next day just because the clock time is later.
 */
export function eventDayKeys(e: SolarEvent): string[] {
  const keys: string[] = [];
  const lastKey = formatInTimeZone(e.endAt, WAT, "yyyy-MM-dd");
  let d = toZonedTime(e.startAt, WAT);
  let guard = 0;
  while (guard < 40) {
    const key = formatInTimeZone(d, WAT, "yyyy-MM-dd");
    keys.push(key);
    if (key >= lastKey) break;
    d = addDays(d, 1);
    guard += 1;
  }
  return keys;
}

export function eventCoversDay(e: SolarEvent, dayKey: string): boolean {
  return eventDayKeys(e).includes(dayKey);
}

export function groupByMonth(
  list: SolarEvent[],
): Array<{ key: string; label: string; events: SolarEvent[] }> {
  const map = new Map<string, SolarEvent[]>();
  for (const e of list) {
    const key = monthKey(e.startAt);
    const bucket = map.get(key);
    if (bucket) bucket.push(e);
    else map.set(key, [e]);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => ({
      key,
      label: monthLabelFromKey(key),
      events: bucket.sort(byStartAt),
    }));
}

export function relativeDay(iso: string, now: Date = new Date()): string | null {
  const todayKey = formatInTimeZone(now, WAT, "yyyy-MM-dd");
  const eventKey = formatInTimeZone(iso, WAT, "yyyy-MM-dd");
  if (eventKey === todayKey) return "Today";
  const tomorrowKey = formatInTimeZone(addDays(now, 1), WAT, "yyyy-MM-dd");
  if (eventKey === tomorrowKey) return "Tomorrow";
  return null;
}
