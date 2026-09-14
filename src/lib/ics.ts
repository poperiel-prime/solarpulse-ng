import { formatInTimeZone } from "date-fns-tz";
import { WAT } from "./dates";
import type { SolarEvent } from "./types";

function esc(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** RFC 5545 folding for any line longer than 74 octets. */
function fold(line: string): string {
  if (line.length <= 74) return line;
  const parts: string[] = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 73)}`);
    rest = rest.slice(73);
  }
  return parts.join("\r\n");
}

/** Builds a single-VEVENT calendar file with DTSTART in Africa/Lagos. */
export function buildIcs(e: SolarEvent): string {
  const dtStart = formatInTimeZone(e.startAt, WAT, "yyyyMMdd'T'HHmmss");
  const dtEnd = formatInTimeZone(e.endAt, WAT, "yyyyMMdd'T'HHmmss");
  const dtStamp = formatInTimeZone(new Date(), "UTC", "yyyyMMdd'T'HHmmss'Z'");
  const location = e.country
    ? `${e.venue}`
    : `${e.venue} (${e.city})`;
  const description = `${e.summary}\n\nOrganizer: ${e.organizer}\nSource page: ${e.url}\nListed via SolarPulse NG — times in WAT.`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SolarPulse NG//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VTIMEZONE",
    "TZID:Africa/Lagos",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0100",
    "TZOFFSETTO:+0100",
    "TZNAME:WAT",
    "DTSTART:19700101T000000",
    "END:STANDARD",
    "END:VTIMEZONE",
    "BEGIN:VEVENT",
    `UID:${e.slug}@solarpulse.ng`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Africa/Lagos:${dtStart}`,
    `DTEND;TZID=Africa/Lagos:${dtEnd}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc(location)}`,
    `DESCRIPTION:${esc(description)}`,
    `URL:${e.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.map(fold).join("\r\n") + "\r\n";
}

export function icsFilename(e: SolarEvent): string {
  return `${e.slug}.ics`;
}
