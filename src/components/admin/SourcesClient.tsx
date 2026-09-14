"use client";

import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Plus, RotateCcw, Trash2, WifiOff } from "lucide-react";
import { AdminApiError, saveSourcesRemote } from "@/lib/adminApi";
import { fmtDateTimeWat } from "@/lib/dates";
import { applySources, useSharedSources } from "@/lib/sharedStore";
import { seedSources } from "@/lib/sources";
import { useHydrated } from "@/lib/useHydrated";
import type { HunterSource, HunterSourceType } from "@/lib/types";

const TYPE_LABEL: Record<HunterSourceType, string> = {
  "events-page": "Events page",
  news: "News",
  organizer: "Organizer",
};

export default function SourcesClient() {
  const hydrated = useHydrated();
  const sources = useSharedSources();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<HunterSourceType>("events-page");
  const [notice, setNotice] = useState<string | null>(null);

  /** Save to the shared watch list; only reflect it locally once accepted. */
  function persist(next: HunterSource[]) {
    applySources(next); // optimistic
    void saveSourcesRemote(next)
      .then((res) => applySources(res.sources))
      .catch((err: unknown) => {
        applySources(sources); // roll back
        setNotice(
          err instanceof AdminApiError
            ? err.message
            : "Could not save the watch list to the server.",
        );
      });
  }

  function toggle(id: string) {
    persist(sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  function remove(id: string) {
    const target = sources.find((s) => s.id === id);
    persist(sources.filter((s) => s.id !== id));
    setNotice(`Removed “${target?.name ?? id}”. Reset to seed to bring defaults back.`);
  }

  function addSource() {
    if (!name.trim()) {
      setNotice("Give the source a name first.");
      return;
    }
    const id = `src-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Math.floor(Math.random() * 1e5)}`;
    const manual = !url.trim();
    if (!manual && !/^https?:\/\/.+/i.test(url.trim())) {
      setNotice("That URL does not look right — include https:// or leave it empty for a manual source.");
      return;
    }
    persist([...sources, { id, name: name.trim(), url: url.trim(), type, enabled: true, manual }]);
    setName("");
    setUrl("");
    setNotice(`Added “${name.trim()}” to the watch list.`);
  }

  function reset() {
    persist(seedSources.map((s) => ({ ...s })));
    setNotice("Watch list reset to the seed sources.");
  }

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl border border-line bg-card/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-3">
        {notice ? (
          <p role="status" className="rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-[13px] font-semibold text-mint">
            {notice}
          </p>
        ) : null}

        <p className="rounded-xl border border-gold/35 bg-gold/5 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
          Hunter often cannot enter these sites from the preview. Tap{" "}
          <span className="font-bold text-cream">Open site</span> on any row, copy the dates you
          see, and drop them into the{" "}
          <Link href="/admin/paste" className="font-bold text-gold hover:text-gold-hover">
            paste dump
          </Link>{" "}
          — that is the working path.
        </p>

        <ul className="space-y-3" aria-label="Watched sources">
          {sources.map((s) => (
            <li
              key={s.id}
              className={`rounded-2xl border p-4 ${s.enabled ? "border-line bg-card" : "border-line/50 bg-card/50 opacity-70"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-bold text-cream">
                    {s.name}
                    <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mist">
                      {TYPE_LABEL[s.type]}
                    </span>
                    {s.manual ? (
                      <span className="rounded-md bg-mist/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mist">
                        manual
                      </span>
                    ) : null}
                  </p>
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-[12.5px] font-semibold text-mint underline decoration-mint/40 underline-offset-2 hover:decoration-mint"
                    >
                      <span className="truncate">{s.url}</span>
                      <ExternalLink size={11} className="shrink-0" aria-hidden="true" />
                    </a>
                  ) : (
                    <p className="mt-1 text-[12.5px] text-mist">
                      No URL — this one arrives via the paste dump.
                    </p>
                  )}
                  <p className="mt-1 text-[11.5px] text-mist/80">
                    {s.lastChecked
                      ? `Last checked ${fmtDateTimeWat(s.lastChecked)}`
                      : "Never checked"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {s.url ? (
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${s.name} in a new tab`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-3 text-[12.5px] font-bold text-cream transition-colors hover:border-mint/50 hover:text-mint"
                    >
                      Open site
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  ) : null}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={s.enabled}
                    aria-label={`${s.enabled ? "Disable" : "Enable"} ${s.name}`}
                    onClick={() => toggle(s.id)}
                    className={`relative h-7 w-12 rounded-full transition-colors ${s.enabled ? "bg-mint/60" : "bg-line"}`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-cream transition-transform ${s.enabled ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s.id)}
                    aria-label={`Remove ${s.name}`}
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-mist transition-colors hover:border-danger/50 hover:text-danger"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside aria-label="Add a source" className="space-y-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[14px] font-bold text-cream">Add a source</h2>
          <div className="mt-3 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name — e.g. State procurement portal"
              aria-label="Source name"
              className="min-h-11 w-full rounded-xl border border-line bg-ink px-3.5 text-[14px] text-cream placeholder:text-mist/60 focus:border-gold focus:outline-none"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://… (empty = manual source)"
              aria-label="Source URL"
              inputMode="url"
              className="min-h-11 w-full rounded-xl border border-line bg-ink px-3.5 text-[14px] text-cream placeholder:text-mist/60 focus:border-gold focus:outline-none"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as HunterSourceType)}
              aria-label="Source type"
              className="min-h-11 w-full rounded-xl border border-line bg-ink px-3.5 text-[14px] text-cream focus:border-gold focus:outline-none"
            >
              <option value="events-page">Events page</option>
              <option value="news">News</option>
              <option value="organizer">Organizer</option>
            </select>
            <button
              type="button"
              onClick={addSource}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-black text-ink transition-colors hover:bg-gold-hover"
            >
              <Plus size={16} aria-hidden="true" />
              Add to watch list
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-[13px] font-bold text-mist transition-colors hover:border-gold/50 hover:text-gold"
        >
          <RotateCcw size={14} aria-hidden="true" />
          Reset to seed sources
        </button>

        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-bold text-cream">
            <WifiOff size={15} className="text-danger" aria-hidden="true" />
            The CORS reality
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            Many sites refuse browser-side fetches from other origins. When the hunter hits one it
            says so in the log and skips the page — the paste dump is how those leads still get in.
            No pretending live scraping always works.
          </p>
        </div>
      </aside>
    </div>
  );
}
