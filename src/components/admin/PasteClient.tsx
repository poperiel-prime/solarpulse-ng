"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ClipboardPaste, RotateCcw } from "lucide-react";
import { parsePaste } from "@/lib/hunter";
import { addDrafts } from "@/lib/review";
import type { EventDraft } from "@/lib/types";

interface Result {
  added: EventDraft[];
  skipped: number;
}

export default function PasteClient() {
  const [text, setText] = useState("");
  const [sourceName, setSourceName] = useState("Paste dump");
  const [result, setResult] = useState<Result | null>(null);

  function convert() {
    const drafts = parsePaste(text).map((d) =>
      sourceName.trim() ? { ...d, sourceName: sourceName.trim() } : d,
    );
    const { added, skipped } = addDrafts(drafts);
    setResult({ added, skipped });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <label htmlFor="paste-source" className="mb-1.5 block text-[13px] font-bold text-cream">
            Source name
          </label>
          <input
            id="paste-source"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="min-h-11 w-full rounded-xl border border-line bg-card px-3.5 text-[14px] text-cream focus:border-gold focus:outline-none sm:max-w-xs"
          />

          <label htmlFor="paste-box" className="mb-1.5 mt-4 block text-[13px] font-bold text-cream">
            Paste titles, dates, URLs — one event per block
          </label>
          <textarea
            id="paste-box"
            rows={12}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setResult(null);
            }}
            placeholder={
              "REAN Installer Meetup — Ibadan\n24 August 2026, Ibadan business hub. Free for members.\nhttps://rean.ng/events\n\nWebinar: battery safety basics\nTue 2 September 2026, 15:00 WAT, online"
            }
            className="w-full rounded-xl border border-line bg-card px-3.5 py-3 font-mono text-[13px] leading-relaxed text-cream placeholder:text-mist/50 focus:border-gold focus:outline-none"
          />

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={convert}
              disabled={!text.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-ink transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-card disabled:text-mist"
            >
              <ClipboardPaste size={16} aria-hidden="true" />
              Turn into drafts
            </button>
            {text ? (
              <button
                type="button"
                onClick={() => {
                  setText("");
                  setResult(null);
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-mist hover:text-cream"
              >
                <RotateCcw size={13} aria-hidden="true" />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        {result ? (
          <div role="status" className="animate-rise mt-4 rounded-2xl border border-mint/40 bg-card p-4 sm:p-5">
            <p className="text-[15px] font-black text-mint">
              {result.added.length} draft{result.added.length === 1 ? "" : "s"} created
              {result.skipped > 0 ? ` · ${result.skipped} duplicate${result.skipped === 1 ? "" : "s"} skipped` : ""}
            </p>
            {result.added.length > 0 ? (
              <ul className="mt-3 space-y-1.5">
                {result.added.map((d) => (
                  <li key={d.id} className="flex items-start gap-2 text-[13px] text-cream/90">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden="true" />
                    {d.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[13px] text-mist">
                Nothing new — everything you pasted was already in the inbox or on the calendar.
              </p>
            )}
            <Link
              href="/admin/inbox"
              className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gold px-4 text-[13px] font-black text-ink hover:bg-gold-hover"
            >
              Review them in the inbox
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        ) : null}
      </div>

      <aside aria-label="How pasting works" className="space-y-3">
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[14px] font-bold text-cream">How the parser reads it</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-mist">
            <li>First line of each block becomes the title.</li>
            <li>Dates like “24 August 2026” or “3–5 February 2026” become start/end guesses.</li>
            <li>Lagos / Abuja / Kano / Port Harcourt set the city; Nairobi, Cape Town, Yaoundé and Accra mark it Africa watch.</li>
            <li>The first http(s) link becomes the source URL the curator verifies.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[14px] font-bold text-cream">Also accepts JSON</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            A later script can drop an array like{" "}
            <code className="rounded bg-ink px-1.5 py-0.5 text-[12px]">
              [{`{"title":"…","url":"…","date":"2026-08-24","city":"Lagos"}`}]
            </code>{" "}
            and the same drafts appear.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[14px] font-bold text-cream">Why this exists</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-mist">
            Most good leads still live in WhatsApp groups and PDF flyers the hunter cannot see.
            Pasting is a first-class input, not a workaround.
          </p>
        </div>
      </aside>
    </div>
  );
}
