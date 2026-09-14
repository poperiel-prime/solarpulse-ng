"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Globe2, X } from "lucide-react";
import { addDraftToCalendar, AdminApiError } from "@/lib/adminApi";
import { isPast } from "@/lib/dates";
import { setFlash } from "@/lib/flash";
import { kebab, PUBLISHED_ID_PREFIX } from "@/lib/review";
import { applyDraftStatus, applyPublished } from "@/lib/sharedStore";
import {
  AUDIENCE_LABELS,
  AUDIENCES,
  EVENT_TYPES,
  NIGERIA_CITIES,
  PRICE_LABELS,
  PRICE_TYPES,
  TYPE_LABELS,
  type Audience,
  type EventDraft,
  type EventType,
  type PriceType,
  type SolarEvent,
} from "@/lib/types";

interface FormState {
  title: string;
  type: EventType | "unknown";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  city: string;
  country: string;
  venue: string;
  organizer: string;
  url: string;
  price: PriceType;
  priceNote: string;
  audience: Audience[];
  whoShouldGo: string;
  summary: string;
  africaWatch: boolean;
}

type Errors = Partial<Record<"title" | "type" | "startDate" | "city" | "url", string>>;

function splitIso(iso?: string): { date: string; time: string } {
  if (!iso || iso.length < 10) return { date: "", time: "09:00" };
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (m) return { date: m[1], time: m[2] };
  return { date: iso.slice(0, 10), time: "09:00" };
}

const inputCls =
  "min-h-11 w-full rounded-xl border border-line bg-ink px-3.5 text-[14px] text-cream placeholder:text-mist/70 focus:border-gold focus:outline-none";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[12.5px] font-bold text-cream">{children}</span>
  );
}

export default function EditDrawer({
  draft,
  onClose,
  onSaved,
  onAdded,
}: {
  draft: EventDraft;
  onClose: () => void;
  onSaved: (message: string) => void;
  onAdded: (event: SolarEvent, draftTitle: string) => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    const s = splitIso(draft.startAtGuess);
    const e = splitIso(draft.endAtGuess);
    return {
      title: draft.title,
      type: draft.typeGuess,
      startDate: s.date,
      startTime: s.time,
      endDate: draft.endAtGuess ? e.date : s.date,
      endTime: draft.endAtGuess ? e.time : "17:00",
      city: draft.cityGuess,
      country: draft.africaWatch ? draft.cityGuess.replace(/^Yaoundé$/, "Cameroon").replace(/^Nairobi$/, "Kenya") : "",
      venue: "",
      organizer: draft.organizerGuess ?? "",
      url: draft.sourceUrl.startsWith("http") ? draft.sourceUrl : "",
      price: "unknown",
      priceNote: "",
      audience: [],
      whoShouldGo: "",
      summary: draft.rawSnippet.replace(/\s+/g, " ").slice(0, 240),
      africaWatch: draft.africaWatch,
    };
  });
  const router = useRouter();
  const [verified, setVerified] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const canAdd = useMemo(
    () =>
      form.title.trim().length > 0 &&
      form.type !== "unknown" &&
      form.startDate.length === 10 &&
      form.city.trim().length > 0 &&
      /^https?:\/\/.+/i.test(form.url.trim()) &&
      verified,
    [form, verified],
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  }

  function validate(): Errors {
    const next: Errors = {};
    if (!form.title.trim()) next.title = "Title is required to publish.";
    if (form.type === "unknown") next.type = "Pick a real category.";
    if (!form.startDate) next.startDate = "Start date is required to publish.";
    if (!form.city.trim()) next.city = "City is required to publish.";
    if (!/^https?:\/\/.+/i.test(form.url.trim())) next.url = "A public source URL is required.";
    return next;
  }

  /**
   * Draft edits are kept in the drawer until you publish — the shared queue
   * only stores what the server accepted, so there is no half-edited state
   * for other people to see.
   */
  function saveEdits() {
    onSaved("Edits kept for this review. Tap Add to publish them.");
    onClose();
  }

  async function addToCalendar() {
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean) || !verified || saving) return;
    setSaveError(null);

    const suffix =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().slice(0, 6)
        : Math.floor(Math.random() * 1e6).toString(36);
    const startAt = `${form.startDate}T${form.startTime || "09:00"}:00+01:00`;
    const endAt = `${form.endDate || form.startDate}T${form.endTime || "17:00"}:00+01:00`;
    const event: SolarEvent = {
      id: `${PUBLISHED_ID_PREFIX}${suffix}`,
      slug: `${kebab(form.title) || "event"}-${suffix}`,
      title: form.title.trim(),
      type: form.type as EventType,
      status: "confirmed",
      startAt,
      endAt,
      region: form.africaWatch ? "africa" : "nigeria",
      city: form.city.trim(),
      country: form.africaWatch ? form.country.trim() || undefined : undefined,
      venue: form.venue.trim() || `${form.city.trim()} — see organizer page`,
      organizer: form.organizer.trim() || draft.sourceName,
      url: form.url.trim(),
      price: form.price,
      priceNote: form.priceNote.trim() || undefined,
      audience: form.audience,
      whoShouldGo:
        form.whoShouldGo.trim() ||
        "See the organizer page for who this is for — the curator has not written guidance for this one yet.",
      summary:
        form.summary.trim() ||
        "Accepted from the review queue. Full detail is on the linked organizer page.",
      source: `Curated via review queue — ${draft.sourceName}`,
    };
    // Write to the SHARED notebook first. Only if the server accepts it do we
    // update this screen — no more "saved" messages for data nobody else has.
    setSaving(true);
    try {
      const result = await addDraftToCalendar(draft.id, event);
      const saved = result.event ?? event;

      applyPublished(saved);
      applyDraftStatus(draft.id, "added");
      onAdded(saved, saved.title);
      onClose();

      setFlash({
        title: saved.title,
        path: `/events/published/${saved.slug}`,
        past: isPast(saved),
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      setSaveError(
        err instanceof AdminApiError
          ? err.message
          : "Could not save to the shared calendar. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`Review draft: ${draft.title}`}>
      <button
        type="button"
        aria-label="Close without saving"
        onClick={onClose}
        className="absolute inset-0 bg-ink/70 backdrop-blur-sm"
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-line bg-surface shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-mist">
              {draft.sourceName} · {draft.confidence} confidence
            </p>
            <h2 className="mt-1 truncate text-[16px] font-black text-cream">Review &amp; publish</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line text-mist hover:text-cream"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <Label>Title *</Label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={Boolean(errors.title)}
              className={inputCls}
            />
            {errors.title ? <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">{errors.title}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Category *</Label>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as EventType | "unknown")}
                aria-invalid={Boolean(errors.type)}
                className={inputCls}
              >
                <option value="unknown" disabled>
                  Pick one…
                </option>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              {errors.type ? <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">{errors.type}</p> : null}
            </div>
            <div>
              <Label>City *</Label>
              <input
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                aria-invalid={Boolean(errors.city)}
                list="drawer-cities"
                className={inputCls}
              />
              <datalist id="drawer-cities">
                {NIGERIA_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
                <option value="Nairobi" />
                <option value="Yaoundé" />
                <option value="Accra" />
                <option value="Cape Town" />
              </datalist>
              {errors.city ? <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">{errors.city}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Start date (WAT) *</Label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set("startDate", e.target.value)}
                  aria-invalid={Boolean(errors.startDate)}
                  aria-label="Start date"
                  className={inputCls}
                />
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) => set("startTime", e.target.value)}
                  aria-label="Start time (WAT)"
                  className={`${inputCls} w-28`}
                />
              </div>
              {errors.startDate ? <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">{errors.startDate}</p> : null}
            </div>
            <div>
              <Label>End date (WAT)</Label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                  aria-label="End date"
                  className={inputCls}
                />
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => set("endTime", e.target.value)}
                  aria-label="End time (WAT)"
                  className={`${inputCls} w-28`}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Venue</Label>
              <input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="e.g. Landmark Centre" className={inputCls} />
            </div>
            <div>
              <Label>Organizer</Label>
              <input value={form.organizer} onChange={(e) => set("organizer", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <Label>Public source URL *</Label>
            <input
              type="url"
              inputMode="url"
              value={form.url}
              onChange={(e) => set("url", e.target.value)}
              aria-invalid={Boolean(errors.url)}
              placeholder="https://…"
              className={inputCls}
            />
            {errors.url ? <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">{errors.url}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Price</Label>
              <select value={form.price} onChange={(e) => set("price", e.target.value as PriceType)} className={inputCls}>
                {PRICE_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {PRICE_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Price note</Label>
              <input value={form.priceNote} onChange={(e) => set("priceNote", e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <Label>Audience</Label>
            <div className="flex flex-wrap gap-1.5">
              {AUDIENCES.map((a) => {
                const active = form.audience.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      set("audience", active ? form.audience.filter((x) => x !== a) : [...form.audience, a])
                    }
                    className={`min-h-11 rounded-lg border px-3 text-[12.5px] font-bold transition-colors ${
                      active ? "border-mint bg-mint/15 text-mint" : "border-line bg-ink text-mist hover:text-cream"
                    }`}
                  >
                    {AUDIENCE_LABELS[a]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label>Who should go — one line</Label>
            <textarea rows={2} value={form.whoShouldGo} onChange={(e) => set("whoShouldGo", e.target.value)} className={`${inputCls} py-2.5`} />
          </div>

          <div>
            <Label>Summary</Label>
            <textarea rows={4} value={form.summary} onChange={(e) => set("summary", e.target.value)} className={`${inputCls} py-2.5`} />
          </div>

          {form.africaWatch ? (
            <div>
              <Label>Country (outside Nigeria)</Label>
              <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="e.g. Kenya" className={inputCls} />
            </div>
          ) : null}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-ink px-4 py-3">
            <input
              type="checkbox"
              checked={form.africaWatch}
              onChange={(e) => set("africaWatch", e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#3ddc97]"
            />
            <span className="text-[13px] leading-relaxed text-mist">
              <span className="flex items-center gap-1.5 font-bold text-cream">
                <Globe2 size={13} className="text-mint" aria-hidden="true" />
                Not Nigeria — Africa watch only
              </span>
              Lists this under “Also in Africa” on the public calendar, never in the main Nigeria
              list.
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-1 h-4 w-4 accent-[#f5b942]"
            />
            <span className="text-[13px] font-semibold leading-relaxed text-cream">
              I opened the source page and the date is real.
            </span>
          </label>

          <details className="rounded-xl border border-line bg-ink px-4 py-3">
            <summary className="cursor-pointer text-[12px] font-bold text-mist">Raw snippet</summary>
            <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-mist">{draft.rawSnippet}</p>
          </details>
        </div>

        <div className="border-t border-line px-5 py-4">
          {saveError ? (
            <p
              role="alert"
              className="mb-3 rounded-xl border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[12.5px] font-semibold leading-relaxed text-danger"
            >
              {saveError}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={addToCalendar}
            disabled={!canAdd || saving}
            className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black transition-colors ${
              canAdd && !saving
                ? "bg-gold text-ink hover:bg-gold-hover"
                : "cursor-not-allowed bg-card text-mist"
            }`}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            {saving ? "Publishing…" : "Add to public calendar"}
          </button>
          <button
            type="button"
            onClick={saveEdits}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-line px-4 text-sm font-bold text-cream hover:border-gold/50 hover:text-gold"
          >
            Close
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
