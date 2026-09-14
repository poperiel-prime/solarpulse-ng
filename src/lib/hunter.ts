import { formatInTimeZone } from "date-fns-tz";
import { WAT } from "./dates";
import type {
  EventDraft,
  EventType,
  HunterSource,
  HunterSourceResult,
} from "./types";

/**
 * The hunter is an intern, not a magician: it fetches the source list,
 * extracts obvious event-shaped text, and drops drafts in the review inbox.
 * Browsers block many cross-origin fetches (CORS) — those sources are
 * reported honestly and the paste-dump flow covers them.
 */

export const AFRICA_WATCH_CITIES = ["Nairobi", "Cape Town", "Yaoundé", "Yaounde", "Accra"];
const NIGERIA_CITY_WORDS = ["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan", "Kaduna"];

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

const MONTH_RE =
  "January|February|March|April|May|June|July|August|September|October|November|December";

export interface FoundDate {
  iso: string;
  raw: string;
}

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T09:00:00+01:00`;
}

function validDay(y: number, m: number, d: number): boolean {
  return y >= 2025 && y <= 2030 && m >= 1 && m <= 12 && d >= 1 && d <= 31;
}

/** Extract explicit 2025–2030 dates in common formats, in order of appearance. */
export function findDates(text: string): FoundDate[] {
  const found: FoundDate[] = [];
  const seen = new Set<string>();
  const push = (y: number, m: number, d: number, raw: string) => {
    if (!validDay(y, m, d)) return;
    const iso = toIso(y, m, d);
    const key = iso.slice(0, 10);
    if (seen.has(key)) return;
    seen.add(key);
    found.push({ iso, raw });
  };

  const patterns: Array<{ re: RegExp; read: (m: RegExpExecArray) => [number, number, number] }> = [
    {
      // 3–5 February 2026 (range → pushes start, and end via second pattern run)
      re: new RegExp(
        `\\b([0-3]?\\d)\\s*[–—]\\s*([0-3]?\\d)\\s+(${MONTH_RE})\\s*,?\\s*(20[2-3]\\d)\\b`,
        "gi",
      ),
      read: (m) => {
        const y = Number(m[4]);
        const mo = MONTHS[m[3].toLowerCase()];
        push(y, mo, Number(m[1]), m[0]);
        return [y, mo, Number(m[2])];
      },
    },
    {
      // 14 July 2026 / 14th July, 2026
      re: new RegExp(
        `\\b([0-3]?\\d)(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\s*,?\\s*(20[2-3]\\d)\\b`,
        "gi",
      ),
      read: (m) => [Number(m[3]), MONTHS[m[2].toLowerCase()], Number(m[1])],
    },
    {
      // July 14, 2026
      re: new RegExp(
        `\\b(${MONTH_RE})\\s+([0-3]?\\d)(?:st|nd|rd|th)?\\s*,\\s*(20[2-3]\\d)\\b`,
        "gi",
      ),
      read: (m) => [Number(m[3]), MONTHS[m[1].toLowerCase()], Number(m[2])],
    },
    {
      // 2026-03-12
      re: /\b(20[2-3]\d)-(0[1-9]|1[0-2])-([0-3]\d)\b/g,
      read: (m) => [Number(m[1]), Number(m[2]), Number(m[3])],
    },
  ];

  for (const { re, read } of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const [y, mo, d] = read(m);
      push(y, mo, d, m[0]);
      if (found.length >= 8) return found;
    }
  }
  return found.slice(0, 8);
}

export function detectCity(text: string): { city: string; africaWatch: boolean } {
  for (const c of NIGERIA_CITY_WORDS) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      return { city: c === "Ibadan" || c === "Kaduna" ? "Nationwide" : c, africaWatch: false };
    }
  }
  for (const c of AFRICA_WATCH_CITIES) {
    if (new RegExp(`\\b${c}\\b`, "i").test(text)) {
      return { city: c === "Yaounde" ? "Yaoundé" : c, africaWatch: true };
    }
  }
  if (/\bNigeria\b/i.test(text)) return { city: "Nationwide", africaWatch: false };
  return { city: "", africaWatch: false };
}

export function guessType(text: string): EventType | "unknown" {
  const t = text.toLowerCase();
  if (/\b(tender|rfp|rfq|prequalification|procurement|invitation to bid)\b/.test(t)) return "tender";
  if (/\b(webinar|virtual session|online briefing)\b/.test(t)) return "webinar";
  if (/\b(training|workshop|masterclass|certification|bootcamp)\b/.test(t)) return "training";
  if (/\b(expo|exhibition|trade fair|trade show)\b/.test(t)) return "expo";
  if (/\b(conference|summit|forum|symposium)\b/.test(t)) return "conference";
  if (/\b(stakeholder meeting|association|member|roundtable)\b/.test(t)) return "association";
  return "unknown";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHtmlTitle(html: string): string {
  const og = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]) return og[1].trim();
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (t?.[1]) return t[1].replace(/\s+/g, " ").trim();
  return "";
}

function cleanLeadLine(line: string): string {
  return line.replace(/^[\s\-•*▸▪]+/, "").trim();
}

function uid(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `draft-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function firstUrl(text: string): string {
  const m = text.match(/https?:\/\/[^\s"'<>]+/i);
  return m ? m[0].replace(/[),.;]+$/, "") : "manual://paste";
}

function baseDraft(partial: Partial<EventDraft> & { title: string }): EventDraft {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    sourceName: "Paste dump",
    sourceUrl: "manual://paste",
    typeGuess: "unknown",
    cityGuess: "",
    rawSnippet: "",
    africaWatch: false,
    confidence: "low",
    status: "pending",
    ...partial,
  };
}

interface PasteJsonEntry {
  title?: string;
  name?: string;
  url?: string;
  link?: string;
  sourceUrl?: string;
  startAt?: string;
  start?: string;
  date?: string;
  endAt?: string;
  end?: string;
  city?: string;
  organizer?: string;
  type?: string;
  notes?: string;
}

/** Paste-dump parser: JSON array first, else one event per blank-line block. */
export function parsePaste(text: string): EventDraft[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          const e = entry as PasteJsonEntry;
          const title = (e.title ?? e.name ?? "").trim();
          if (!title) return null;
          const start = e.startAt ?? e.start ?? e.date;
          const { city, africaWatch } = e.city
            ? detectCity(e.city)
            : { city: "", africaWatch: false };
          return baseDraft({
            title,
            sourceUrl: e.url ?? e.link ?? e.sourceUrl ?? "manual://paste",
            startAtGuess: start && start.length >= 10 ? start : undefined,
            endAtGuess: e.endAt ?? e.end ?? undefined,
            cityGuess: city || (e.city ?? ""),
            organizerGuess: e.organizer || undefined,
            typeGuess: e.type ? guessType(e.type) : "unknown",
            rawSnippet: (e.notes ?? "").slice(0, 400),
            africaWatch,
            confidence: start ? "medium" : "low",
          });
        })
        .filter((d): d is EventDraft => d !== null);
    }
  } catch {
    /* not JSON — fall through to block mode */
  }

  const blocks = trimmed.split(/\n\s*\n+/);
  return blocks
    .map((block) => {
      const lines = block
        .split("\n")
        .map(cleanLeadLine)
        .filter((l) => l.length > 0);
      const title = lines[0] ?? "";
      if (title.length < 4) return null;
      const dates = findDates(block);
      const { city, africaWatch } = detectCity(block);
      const url = firstUrl(block);
      return baseDraft({
        title: title.slice(0, 140),
        sourceUrl: url,
        startAtGuess: dates[0]?.iso,
        endAtGuess: dates[1]?.iso,
        cityGuess: city,
        organizerGuess: undefined,
        typeGuess: guessType(block),
        rawSnippet: block.replace(/\s+/g, " ").slice(0, 400),
        africaWatch,
        confidence: dates.length > 0 && city ? "high" : dates.length > 0 || city ? "medium" : "low",
      });
    })
    .filter((d): d is EventDraft => d !== null);
}

export interface HunterRun {
  ranAt: string;
  drafts: EventDraft[];
  results: HunterSourceResult[];
  checkedIds: string[];
}

/**
 * One live pass over the enabled source list.
 * Pure-ish: it fetches and drafts, but never persists. The caller decides
 * where drafts go (now: the shared server queue via /api/inbox).
 */
export async function runHunter(
  watchList: HunterSource[],
  onProgress?: (message: string) => void,
): Promise<HunterRun> {
  const sources = watchList.filter((s) => s.enabled);
  const results: HunterSourceResult[] = [];
  const drafts: EventDraft[] = [];
  const checkedIds = new Set<string>();

  for (const source of sources) {
    if (source.manual || !source.url) {
      results.push({
        sourceId: source.id,
        name: source.name,
        outcome: "manual",
        drafts: 0,
        message: "Manual source — paste notes with the Paste dump tool.",
      });
      continue;
    }

    onProgress?.(`Checking ${source.name}…`);
    checkedIds.add(source.id);
    try {
      const res = await fetch(source.url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = (await res.text()).slice(0, 600_000);
      const visible = stripHtml(html);
      const dates = findDates(visible);
      const pageTitle = extractHtmlTitle(html) || source.name;
      const { city, africaWatch } = detectCity(visible.slice(0, 30_000));

      if (dates.length > 0) {
        drafts.push(
          baseDraft({
            title: pageTitle.slice(0, 140),
            sourceName: source.name,
            sourceUrl: source.url,
            startAtGuess: dates[0].iso,
            endAtGuess: dates[1]?.iso,
            cityGuess: city,
            organizerGuess: source.name,
            typeGuess: guessType(visible),
            rawSnippet: visible.slice(0, 400),
            africaWatch,
            confidence: city && !africaWatch ? "high" : "medium",
          }),
        );
        results.push({ sourceId: source.id, name: source.name, outcome: "draft", drafts: 1 });
      } else {
        drafts.push(
          baseDraft({
            title: "Check this page for new events",
            sourceName: source.name,
            sourceUrl: source.url,
            cityGuess: city,
            rawSnippet: visible.slice(0, 400),
            africaWatch,
            confidence: "low",
          }),
        );
        results.push({ sourceId: source.id, name: source.name, outcome: "no-dates", drafts: 1 });
      }
    } catch {
      results.push({
        sourceId: source.id,
        name: source.name,
        outcome: "failed",
        drafts: 0,
        message: "Could not open this site from the browser. Paste the text instead.",
      });
    }
  }

  const ranAt = formatInTimeZone(new Date(), WAT, "yyyy-MM-dd'T'HH:mm:ssXXX");
  return { ranAt, drafts, results, checkedIds: Array.from(checkedIds) };
}
