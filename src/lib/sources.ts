import type { HunterSource } from "./types";

/**
 * The hunter's watch list — the only places it looks.
 *
 * This array is the shipped seed. Curator edits (enable/disable, added or
 * removed rows, lastChecked) are stored in localStorage "solarpulse-sources"
 * and win over the seed; see reconcileSources() in lib/review.ts, which folds
 * new seed entries into an existing saved list without losing custom rows.
 */

/** Bump when the seed list below changes so saved lists pick up new entries. */
export const SOURCES_SEED_VERSION = 2;

export const seedSources: HunterSource[] = [
  {
    id: "src-rean",
    name: "REAN",
    url: "https://rean.org.ng/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-rean-events",
    name: "REAN events",
    url: "https://rean.org.ng/publication/event/",
    type: "events-page",
    enabled: true,
    seed: true,
  },
  {
    id: "src-afsia-events",
    name: "AFSIA events",
    url: "https://www.afsiasolar.com/afsia-events/list/",
    type: "events-page",
    enabled: true,
    seed: true,
  },
  {
    id: "src-african-power-platform",
    name: "African Power Platform",
    url: "https://www.africanpowerplatform.org/resources/events.html",
    type: "events-page",
    enabled: true,
    seed: true,
  },
  {
    id: "src-nigeria-solar-forum",
    name: "Nigeria Solar Forum",
    url: "https://solar.eventhive.ng/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-gogla",
    name: "GOGLA",
    url: "https://www.gogla.org/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-thecable-energy",
    name: "TheCable energy",
    url: "https://www.thecable.ng/",
    type: "news",
    enabled: true,
    seed: true,
  },
  {
    id: "src-businessday",
    name: "BusinessDay",
    url: "https://businessday.ng/",
    type: "news",
    enabled: true,
    seed: true,
  },
  {
    id: "src-nigeria-energy",
    name: "Nigeria Energy",
    url: "https://www.nigeria-energy.com/en/home.html",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-nnepie",
    name: "NNEPIE",
    url: "https://www.nnepie.com/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-powerelec",
    name: "POWERELEC Nigeria",
    url: "https://www.powerelecnigeria.com",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-solar-storage-live",
    name: "Solar & Storage Live Nigeria",
    url: "https://www.terrapinn.com/exhibition/solar-storage-live-nigeria/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-pv-power-nigeria",
    name: "PV Power Nigeria",
    url: "https://www.pvpower-nigeria.com/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-landmark-events",
    name: "Landmark events",
    url: "https://landmarklagos.com/event/",
    type: "events-page",
    enabled: true,
    seed: true,
  },
  {
    id: "src-rea",
    name: "REA",
    url: "https://rea.gov.ng/",
    type: "organizer",
    enabled: true,
    seed: true,
  },
  {
    id: "src-refa-afsia",
    name: "REFA / AFSIA",
    url: "https://www.afsiasolar.com/refa-renewable-energy-forum-africa/",
    type: "events-page",
    enabled: true,
    seed: true,
  },
];
