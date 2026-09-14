"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardPaste,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Loader2,
  Pencil,
  Radar,
  TriangleAlert,
} from "lucide-react";
import EmptyState from "@/components/EmptyState";
import EditDrawer from "@/components/admin/EditDrawer";
import { fmtDateTimeWat, shortDate } from "@/lib/dates";
import { runHunter } from "@/lib/hunter";
import {
  AdminApiError,
  createDrafts,
  saveSourcesRemote,
  setDraftStatus,
} from "@/lib/adminApi";
import { loadHunterLog, saveHunterLog, subscribeReview } from "@/lib/review";
import {
  applyDraftStatus,
  applySources,
  loadInboxShared,
  useSharedInbox,
  usePublishedEvents,
  useSharedSources,
} from "@/lib/sharedStore";
import { useClientSignal, useHydrated } from "@/lib/useHydrated";
import {
  TYPE_LABELS,
  type DraftConfidence,
  type EventDraft,
  type SolarEvent,
} from "@/lib/types";

const DOT: Record<DraftConfidence, string> = {
  low: "bg-mist",
  medium: "bg-gold",
  high: "bg-mint",
};

function guessLine(d: EventDraft): string {
  const parts: string[] = [];
  parts.push(d.startAtGuess ? shortDate(d.startAtGuess) : "Date unknown");
  parts.push(d.cityGuess || "City unknown");
  parts.push(d.typeGuess === "unknown" ? "Type unknown" : TYPE_LABELS[d.typeGuess]);
  return parts.join(" · ");
}

function DraftCard({
  draft,
  onEdit,
  onIgnore,
  onRestore,
}: {
  draft: EventDraft;
  onEdit: (d: EventDraft) => void;
  onIgnore: (d: EventDraft) => void;
  onRestore: (d: EventDraft) => void;
}) {
  const pending = draft.status === "pending";
  const isHttp = draft.sourceUrl.startsWith("http");
  return (
    <article
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        pending ? "border-line bg-card" : "border-line/50 bg-card/50 opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-mist">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${DOT[draft.confidence]}`} />
          {draft.confidence} confidence
        </span>
        <span className="text-[11px] text-mist/70">
          {fmtDateTimeWat(draft.createdAt)}
        </span>
        {draft.africaWatch ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-mint/40 bg-mint/10 px-1.5 py-0.5 text-[10.5px] font-bold text-mint">
            <Globe2 size={10} aria-hidden="true" />
            Not Nigeria — Africa watch only
          </span>
        ) : null}
        {draft.status === "added" ? (
          <span className="rounded-md bg-mint/15 px-1.5 py-0.5 text-[10.5px] font-bold text-mint">Added</span>
        ) : null}
        {draft.status === "ignored" ? (
          <span className="rounded-md bg-mist/15 px-1.5 py-0.5 text-[10.5px] font-bold text-mist">Ignored</span>
        ) : null}
      </div>

      <h3 className="mt-2 text-[15.5px] font-bold leading-snug text-cream">{draft.title}</h3>
      <p className="mt-1 text-[12.5px] font-semibold text-gold/90">{guessLine(draft)}</p>

      <p className="mt-1.5 text-[12.5px] font-medium text-mist">
        {draft.sourceName}
        {" — "}
        {isHttp ? (
          <a
            href={draft.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-mint underline decoration-mint/40 underline-offset-2 hover:decoration-mint"
            aria-label={`Open source: ${draft.sourceName} (new tab)`}
          >
            open source
            <ExternalLink size={11} aria-hidden="true" />
          </a>
        ) : (
          <span className="text-mist/70">manual entry (no link)</span>
        )}
      </p>

      {draft.rawSnippet ? (
        <p className="mt-2 line-clamp-3 whitespace-pre-wrap rounded-lg bg-ink/60 px-3 py-2 text-[12px] leading-relaxed text-mist">
          {draft.rawSnippet}
        </p>
      ) : null}

      {pending ? (
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(draft)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gold px-4 text-[13px] font-black text-ink transition-colors hover:bg-gold-hover"
          >
            <CheckCircle2 size={15} aria-hidden="true" />
            Add
          </button>
          <button
            type="button"
            onClick={() => onEdit(draft)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-4 text-[13px] font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onIgnore(draft)}
            className="inline-flex min-h-11 items-center rounded-xl px-4 text-[13px] font-bold text-mist transition-colors hover:bg-danger/10 hover:text-danger"
          >
            Ignore
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onRestore(draft)}
            className="text-[12px] font-bold text-mist underline underline-offset-2 hover:text-cream"
          >
            Move back to waiting
          </button>
        </div>
      )}
    </article>
  );
}

export default function InboxClient() {
  const hydrated = useHydrated();
  const inbox = useSharedInbox();
  const sources = useSharedSources();
  const published = usePublishedEvents();
  const log = useClientSignal(subscribeReview, loadHunterLog, null);
  const publishedCount = published.length;
  const [hideIgnored, setHideIgnored] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<EventDraft | null>(null);
  const [sourceLinks, setSourceLinks] = useState<{ name: string; url: string }[]>([]);

  /**
   * Open every enabled source in its own tab. Browsers block bulk pop-ups, so
   * the same click also reveals a tappable list as the reliable fallback.
   */
  function openAllSources() {
    const list = sources.filter((s) => s.enabled && s.url.startsWith("http"));
    setSourceLinks(list.map((s) => ({ name: s.name, url: s.url })));
    let blocked = 0;
    for (const s of list) {
      const win = window.open(s.url, "_blank", "noopener,noreferrer");
      if (!win) blocked += 1;
    }
    setNotice(
      blocked > 0
        ? `Your browser blocked ${blocked} of ${list.length} tabs. Use the list below to open them one by one, then paste what you find.`
        : `Opened ${list.length} source${list.length === 1 ? "" : "s"} in new tabs. Copy any dates you see into the paste dump.`,
    );
  }

  const waiting = useMemo(() => inbox.filter((d) => d.status === "pending"), [inbox]);
  const visible = useMemo(() => {
    // The control says "Hide ignored", so added items must remain as a visible
    // audit trail. Previously this used `waiting` and accidentally hid Added.
    const list = hideIgnored ? inbox.filter((d) => d.status !== "ignored") : inbox;
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [inbox, hideIgnored]);

  const failures = useMemo(
    () => (log ? log.results.filter((r) => r.outcome === "failed") : []),
    [log],
  );

  async function onRun() {
    if (running) return;
    setRunning(true);
    setNotice(null);
    setProgress("Warming up…");
    try {
      const run = await runHunter(sources, setProgress);

      // Drafts go into the SHARED queue; the server dedups against seed,
      // published and existing drafts before anything is stored.
      let created = 0;
      let skipped = 0;
      if (run.drafts.length > 0) {
        const res = await createDrafts(run.drafts);
        created = res.created.length;
        skipped = res.skipped;
      }

      const checked = new Set(run.checkedIds);
      if (checked.size > 0) {
        const stamped = sources.map((s) =>
          checked.has(s.id) ? { ...s, lastChecked: run.ranAt } : s,
        );
        try {
          const saved = await saveSourcesRemote(stamped);
          applySources(saved.sources);
        } catch {
          /* lastChecked is cosmetic — never block the run on it */
        }
      }

      saveHunterLog({
        ranAt: run.ranAt,
        found: run.drafts.length,
        created,
        skippedDupes: skipped,
        results: run.results,
      });
      await loadInboxShared(true);

      const failedCount = run.results.filter((r) => r.outcome === "failed").length;
      setNotice(
        `Hunter finished: ${created} new draft${created === 1 ? "" : "s"} in the shared queue, ` +
          `${skipped} duplicates skipped` +
          (failedCount > 0
            ? `, ${failedCount} source${failedCount === 1 ? "" : "s"} unreachable from the browser`
            : "") +
          ".",
      );
    } catch (err) {
      setNotice(
        err instanceof AdminApiError
          ? err.message
          : "Hunter run failed before drafts could be saved.",
      );
    } finally {
      setRunning(false);
      setProgress("");
    }
  }

  async function updateStatus(d: EventDraft, status: "ignored" | "pending") {
    try {
      await setDraftStatus(d.id, status);
      applyDraftStatus(d.id, status);
      setNotice(
        status === "ignored"
          ? `Ignored “${d.title.slice(0, 60)}” — the hunter will not re-add it.`
          : `Moved “${d.title.slice(0, 60)}” back to waiting.`,
      );
    } catch (err) {
      setNotice(
        err instanceof AdminApiError ? err.message : "Could not update that draft.",
      );
    }
  }

  function onIgnore(d: EventDraft) {
    void updateStatus(d, "ignored");
  }

  function onRestore(d: EventDraft) {
    void updateStatus(d, "pending");
  }

  function onAdded(event: SolarEvent, title: string) {
    setNotice(`Added “${title.slice(0, 60)}” — it is live on the public calendar for everyone.`);
  }

  if (!hydrated) {
    return (
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl border border-line bg-card/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5">
        <p
          aria-live="polite"
          className="mr-1 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-[14px] font-black text-cream"
        >
          <span className="text-xl text-gold">{waiting.length}</span>
          <span className="text-[12px] font-bold uppercase tracking-wide text-mist">waiting</span>
        </p>
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-[13px] font-black text-ink transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-70"
        >
          {running ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Radar size={15} aria-hidden="true" />}
          {running ? "Hunting…" : "Run hunter now"}
        </button>
        <Link
          href="/admin/paste"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-mint/50 bg-mint/10 px-4 text-[13px] font-bold text-mint transition-colors hover:bg-mint/20"
        >
          <ClipboardPaste size={15} aria-hidden="true" />
          Paste dump
        </Link>
        <button
          type="button"
          onClick={openAllSources}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
        >
          <ExternalLink size={15} aria-hidden="true" />
          Open all sources
        </button>
        <button
          type="button"
          aria-pressed={!hideIgnored}
          onClick={() => setHideIgnored((v) => !v)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-[13px] font-bold transition-colors ${
            hideIgnored ? "border-line bg-card text-mist hover:text-cream" : "border-gold/60 bg-gold/10 text-gold"
          }`}
        >
          {hideIgnored ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
          {hideIgnored ? "Hide ignored" : "Showing history"}
        </button>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-gold/35 bg-gold/5 px-4 py-3 text-[12.5px] font-semibold leading-relaxed text-mist">
        <TriangleAlert size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
        Hunter often cannot enter these sites from the preview. Paste is the working path — open a
        source, copy the dates, drop them in the{" "}
        <Link href="/admin/paste" className="font-bold text-gold hover:text-gold-hover">
          paste dump
        </Link>
        .
      </p>

      {sourceLinks.length > 0 ? (
        <details open className="rounded-xl border border-line bg-surface px-4 py-3">
          <summary className="cursor-pointer text-[12.5px] font-bold text-cream">
            Source links ({sourceLinks.length}) — tap to open one at a time
          </summary>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {sourceLinks.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-bold text-cream transition-colors hover:border-mint/50 hover:text-mint"
                >
                  {s.name}
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {progress ? (
        <p role="status" className="text-[13px] font-semibold text-gold">
          {progress}
        </p>
      ) : null}

      {notice ? (
        <p role="status" className="rounded-xl border border-mint/40 bg-mint/10 px-4 py-3 text-[13px] font-semibold leading-relaxed text-mint">
          {notice}
        </p>
      ) : null}

      <p className="text-[12.5px] font-medium text-mist">
        {log
          ? `Last hunter run: ${fmtDateTimeWat(log.ranAt)} · ${log.created} new · ${log.skippedDupes} dupes skipped`
          : "The hunter has not run yet on this device."}
        {" · "}
        <Link href="/" className="font-bold text-mint hover:text-cream">
          {publishedCount} published on the public calendar
        </Link>
      </p>

      {failures.length > 0 ? (
        <div className="rounded-xl border border-danger/40 bg-danger/5 px-4 py-3">
          <p className="flex items-center gap-2 text-[12.5px] font-bold text-danger">
            <TriangleAlert size={14} aria-hidden="true" />
            {failures.length} source{failures.length === 1 ? "" : "s"} could not be opened (last run)
          </p>
          <ul className="mt-2 space-y-1 text-[12.5px] text-mist">
            {failures.map((f) => (
              <li key={f.sourceId}>
                <span className="font-bold text-cream/80">{f.name}:</span> {f.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Queue */}
      {visible.length === 0 ? (
        <EmptyState
          title="No drafts."
          hint="Run the hunter or paste something you saw on WhatsApp."
          pidgin=""
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={onRun}
                disabled={running}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-[13px] font-black text-ink hover:bg-gold-hover disabled:opacity-70"
              >
                <Radar size={15} aria-hidden="true" />
                Run hunter now
              </button>
              <Link
                href="/admin/paste"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-[13px] font-bold text-cream hover:border-gold/50 hover:text-gold"
              >
                <ClipboardPaste size={15} aria-hidden="true" />
                Paste dump
              </Link>
            </div>
          }
        />
      ) : (
        <div className="space-y-3" aria-live="polite">
          {visible.map((d) => (
            <DraftCard
              key={d.id}
              draft={d}
              onEdit={setEditing}
              onIgnore={onIgnore}
              onRestore={onRestore}
            />
          ))}
        </div>
      )}

      <p className="rounded-xl border border-line/70 bg-surface/60 px-4 py-3 text-[12px] leading-relaxed text-mist">
        Drafts and accepted events live in this browser&apos;s storage. Run the desk from one
        device; the paste dump is the bridge for anything you saw elsewhere.
      </p>

      {editing ? (
        <EditDrawer
          key={editing.id}
          draft={editing}
          onClose={() => setEditing(null)}
          onSaved={setNotice}
          onAdded={onAdded}
        />
      ) : null}
    </div>
  );
}
