export type EventType =
  | "expo"
  | "conference"
  | "training"
  | "tender"
  | "association"
  | "webinar";

export type EventStatus = "confirmed" | "tentative" | "unconfirmed";
export type PriceType = "free" | "paid" | "unknown";

export type Audience =
  | "installers"
  | "epcs"
  | "distributors"
  | "investors"
  | "policy"
  | "buyers"
  | "technicians"
  | "media";

export type NigeriaCity =
  | "Lagos"
  | "Abuja"
  | "Port Harcourt"
  | "Kano"
  | "Nationwide"
  | "Online";

/** Nigerian filter cities, plus free-form for Africa-watch events (Nairobi, Yaoundé…). */
export type EventCity = NigeriaCity | (string & {});

export const NIGERIA_CITIES: NigeriaCity[] = [
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Kano",
  "Nationwide",
  "Online",
];

export const EVENT_TYPES: EventType[] = [
  "expo",
  "conference",
  "training",
  "tender",
  "association",
  "webinar",
];

export const PRICE_TYPES: PriceType[] = ["free", "paid", "unknown"];

export const AUDIENCES: Audience[] = [
  "installers",
  "epcs",
  "distributors",
  "investors",
  "policy",
  "buyers",
  "technicians",
  "media",
];

export interface SolarEvent {
  id: string;
  slug: string;
  title: string;
  type: EventType;
  status: EventStatus;
  /** ISO string pinned to WAT (+01:00), e.g. "2026-07-14T09:00:00+01:00" */
  startAt: string;
  endAt: string;
  /** Nigeria-first feed; "africa" events live in the separate Africa-watch section. */
  region: "nigeria" | "africa";
  city: EventCity;
  /** Set for Africa-watch events outside Nigeria. */
  country?: string;
  venue: string;
  organizer: string;
  url: string;
  price: PriceType;
  priceNote?: string;
  audience: Audience[];
  whoShouldGo: string;
  summary: string;
  /** Human-readable provenance, shown on the detail page. */
  source: string;
  /** Flagship shows get the spotlight banner on home. */
  flagship?: boolean;
  /** ISO stamp set when a curator publishes this from the review queue. */
  addedAt?: string;
  /** Anchor shows for the year — surfaced on Home regardless of date. */
  keyShow?: boolean;
  /** Amber caveat, e.g. "Confirm venue/dates with the organizer." */
  verifyNote?: string;
  /** 14-day rule: untouched records past this window render as Unconfirmed. */
  stale?: boolean;
}

// ——— Hunter / review queue ———

export type DraftConfidence = "low" | "medium" | "high";
export type DraftStatus = "pending" | "added" | "ignored";

export interface EventDraft {
  id: string;
  createdAt: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
  typeGuess: EventType | "unknown";
  cityGuess: string;
  startAtGuess?: string;
  endAtGuess?: string;
  organizerGuess?: string;
  rawSnippet: string;
  africaWatch: boolean;
  confidence: DraftConfidence;
  status: DraftStatus;
}

export type HunterSourceType = "events-page" | "news" | "organizer";

export interface HunterSource {
  id: string;
  name: string;
  /** Empty for manual sources (e.g. WhatsApp notes). */
  url: string;
  type: HunterSourceType;
  enabled: boolean;
  lastChecked?: string;
  manual?: boolean;
  /** True for shipped watch-list entries; false/undefined for curator-added. */
  seed?: boolean;
}

export type HunterOutcome = "draft" | "no-dates" | "failed" | "manual";

export interface HunterSourceResult {
  sourceId: string;
  name: string;
  outcome: HunterOutcome;
  drafts: number;
  message?: string;
}

export interface HunterLog {
  ranAt: string;
  found: number;
  created: number;
  skippedDupes: number;
  results: HunterSourceResult[];
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  city?: NigeriaCity | (string & {});
}

export const TYPE_LABELS: Record<EventType, string> = {
  expo: "Expo",
  conference: "Conference",
  training: "Training",
  tender: "Tender",
  association: "Association",
  webinar: "Webinar",
};

export const TYPE_DESCRIPTIONS: Record<EventType, string> = {
  expo: "Trade shows & product floors",
  conference: "Summits, forums & panels",
  training: "Hands-on skills & certification",
  tender: "RFPs, prequalification & procurement",
  association: "REAN, working groups & member meets",
  webinar: "Online briefings, times in WAT",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  installers: "Installers",
  epcs: "EPCs",
  distributors: "Distributors",
  investors: "Investors",
  policy: "Policy",
  buyers: "Buyers",
  technicians: "Technicians",
  media: "Media",
};

export const PRICE_LABELS: Record<PriceType, string> = {
  free: "Free",
  paid: "Paid",
  unknown: "Check page",
};
