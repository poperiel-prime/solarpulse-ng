"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Inbox, RotateCcw } from "lucide-react";
import { createDrafts } from "@/lib/adminApi";
import { addDrafts, buildSubmissionDraft } from "@/lib/review";
import { addPendingSubmission, type PendingSubmission } from "@/lib/storage";
import {
  AUDIENCE_LABELS,
  AUDIENCES,
  EVENT_TYPES,
  NIGERIA_CITIES,
  PRICE_LABELS,
  PRICE_TYPES,
  TYPE_LABELS,
  type Audience,
  type EventType,
  type PriceType,
} from "@/lib/types";

interface FormState {
  title: string;
  type: EventType | "";
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  city: string;
  venue: string;
  organizer: string;
  url: string;
  price: PriceType;
  priceNote: string;
  audience: Audience[];
  whoShouldGo: string;
  contact: string;
}

const INITIAL: FormState = {
  title: "",
  type: "",
  startDate: "",
  startTime: "09:00",
  endDate: "",
  endTime: "17:00",
  city: "",
  venue: "",
  organizer: "",
  url: "",
  price: "unknown",
  priceNote: "",
  audience: [],
  whoShouldGo: "",
  contact: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

const inputCls =
  "min-h-11 w-full rounded-xl border border-line bg-card px-3.5 text-[14px] text-cream placeholder:text-mist/70 focus:border-gold focus:outline-none";

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-bold text-cream">
        {label}
        {required ? (
          <span className="ml-1 text-gold" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[12px] text-mist">{hint}</p> : null}
      {error ? (
        <p role="alert" className="mt-1 text-[12.5px] font-semibold text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function buildMailto(s: Omit<PendingSubmission, "id" | "submittedAt">): string {
  const lines = [
    `Title: ${s.title}`,
    `Type: ${s.type}`,
    `Start (WAT): ${s.startAt}`,
    `End (WAT): ${s.endAt}`,
    `City: ${s.city}`,
    `Venue: ${s.venue}`,
    `Organizer: ${s.organizer}`,
    `Public URL: ${s.url}`,
    `Price: ${s.price}${s.priceNote ? ` (${s.priceNote})` : ""}`,
    `Audience: ${s.audience.join(", ") || "—"}`,
    `Who should go: ${s.whoShouldGo || "—"}`,
    `Contact (WhatsApp/email): ${s.contact}`,
    "",
    "Sent from the SolarPulse NG submit form.",
  ];
  return `mailto:events@solarpulse.ng?subject=${encodeURIComponent(
    `Event submission: ${s.title}`,
  )}&body=${encodeURIComponent(lines.join("\n"))}`;
}

export default function SubmitForm() {
  const uid = useId();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{
    mailto: string;
    title: string;
    queued: boolean;
    pendingCount: number;
    shared: boolean;
  } | null>(null);
  const [sending, setSending] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }

  const audienceCount = useMemo(() => form.audience.length, [form.audience]);

  function validate(): Errors {
    const next: Errors = {};
    if (!form.title.trim()) next.title = "Add the event title.";
    if (!form.type) next.type = "Pick a category.";
    if (!form.startDate) next.startDate = "Start date is required.";
    if (!form.endDate) next.endDate = "End date is required.";
    if (!form.city) next.city = "Pick a city.";
    if (!form.organizer.trim()) next.organizer = "Who is organizing it?";
    if (!form.contact.trim()) next.contact = "Add a WhatsApp number or email so we can verify.";
    try {
      const u = new URL(form.url.trim());
      if (!u.protocol.startsWith("http")) throw new Error("bad");
    } catch {
      next.url = "Add a valid public link (https://…) to the organizer page.";
    }
    if (form.startDate && form.endDate) {
      const start = new Date(`${form.startDate}T${form.startTime || "09:00"}:00+01:00`);
      const end = new Date(`${form.endDate}T${form.endTime || "17:00"}:00+01:00`);
      if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime()) && end < start) {
        next.endDate = "End must be after the start.";
      }
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) {
      document.querySelector<HTMLElement>("[data-error='true']")?.focus();
      return;
    }
    setSending(true);
    const payload: Omit<PendingSubmission, "id" | "submittedAt"> = {
      title: form.title.trim(),
      type: form.type as EventType,
      startAt: `${form.startDate}T${form.startTime || "09:00"}:00+01:00`,
      endAt: `${form.endDate}T${form.endTime || "17:00"}:00+01:00`,
      city: form.city,
      venue: form.venue.trim(),
      organizer: form.organizer.trim(),
      url: form.url.trim(),
      price: form.price,
      priceNote: form.priceNote.trim() || undefined,
      audience: form.audience,
      whoShouldGo: form.whoShouldGo.trim(),
      contact: form.contact.trim(),
    };
    // Send the draft to the SHARED review queue so the curator sees it from
    // any device. Falls back to this browser only if the server is unreachable.
    const draft = buildSubmissionDraft(payload);
    addPendingSubmission(payload); // local receipt for the submitter
    try {
      const res = await createDrafts(draft);
      setSent({
        mailto: buildMailto(payload),
        title: payload.title,
        queued: res.created.length > 0,
        pendingCount: res.pending,
        shared: true,
      });
    } catch {
      const { added } = addDrafts([draft]);
      setSent({
        mailto: buildMailto(payload),
        title: payload.title,
        queued: added.length > 0,
        pendingCount: added.length,
        shared: false,
      });
    } finally {
      setSending(false);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (sent) {
    return (
      <div className="animate-rise rounded-2xl border border-mint/40 bg-card p-5 sm:p-7" role="status">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint/15">
          <CheckCircle2 size={24} className="text-mint" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-black tracking-tight text-cream">E don land!</h2>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-mist">
          Thanks. A curator will verify this before it goes live. Flagship shows are checked against
          organizer pages.
        </p>
        <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3">
          <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-cream">
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${sent.queued ? "bg-mint" : "bg-gold"}`}
            />
            {sent.queued
              ? sent.shared
                ? "Saved to the shared curator review queue"
                : "Saved on this device only"
              : "Already in the queue — we kept the original draft"}
          </p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-mist">
            {sent.shared ? (
              <>
                Stored on the server as a draft marked{" "}
                <span className="font-semibold text-cream">Public submission</span>, so the curator
                sees it from any device. There {sent.pendingCount === 1 ? "is" : "are"} now{" "}
                <span className="font-bold text-cream">{sent.pendingCount}</span> draft
                {sent.pendingCount === 1 ? "" : "s"} waiting for review. It only reaches the public
                calendar after the curator approves it.
              </>
            ) : (
              <>
                The server could not be reached, so this is held in this browser only. Please use
                the email button below so the curator definitely receives it.
              </>
            )}
          </p>
        </div>
        <p className="mt-3 text-[13px] leading-relaxed text-mist">
          To make sure the desk sees it today (drafts are stored per device), send it over email
          too:
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/inbox"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
          >
            <Inbox size={15} aria-hidden="true" />
            Open curator inbox ({sent.pendingCount})
          </Link>
          <a
            href={sent.mailto}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-bold text-ink transition-colors hover:bg-gold-hover"
          >
            Email it to events@solarpulse.ng
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => {
              setForm(INITIAL);
              setSent(null);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-sm font-bold text-cream transition-colors hover:border-gold/50 hover:text-gold"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <Field id={`${uid}-title`} label="Event title" required error={errors.title}>
        <input
          id={`${uid}-title`}
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          data-error={Boolean(errors.title) || undefined}
          aria-invalid={Boolean(errors.title)}
          placeholder="e.g. Solar Installer Certification — Ibadan"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-type`} label="Category" required error={errors.type}>
          <select
            id={`${uid}-type`}
            value={form.type}
            onChange={(e) => set("type", e.target.value as EventType | "")}
            data-error={Boolean(errors.type) || undefined}
            aria-invalid={Boolean(errors.type)}
            className={inputCls}
          >
            <option value="" disabled>
              Pick one…
            </option>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${uid}-city`} label="City" required error={errors.city}>
          <select
            id={`${uid}-city`}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            data-error={Boolean(errors.city) || undefined}
            aria-invalid={Boolean(errors.city)}
            className={inputCls}
          >
            <option value="" disabled>
              Pick one…
            </option>
            {NIGERIA_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-start-date`} label="Start date" required error={errors.startDate} hint="All times are WAT.">
          <div className="flex gap-2">
            <input
              id={`${uid}-start-date`}
              type="date"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              data-error={Boolean(errors.startDate) || undefined}
              aria-invalid={Boolean(errors.startDate)}
              className={inputCls}
            />
            <input
              type="time"
              aria-label="Start time (WAT)"
              value={form.startTime}
              onChange={(e) => set("startTime", e.target.value)}
              className={`${inputCls} w-28`}
            />
          </div>
        </Field>
        <Field id={`${uid}-end-date`} label="End date" required error={errors.endDate}>
          <div className="flex gap-2">
            <input
              id={`${uid}-end-date`}
              type="date"
              value={form.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              data-error={Boolean(errors.endDate) || undefined}
              aria-invalid={Boolean(errors.endDate)}
              className={inputCls}
            />
            <input
              type="time"
              aria-label="End time (WAT)"
              value={form.endTime}
              onChange={(e) => set("endTime", e.target.value)}
              className={`${inputCls} w-28`}
            />
          </div>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-venue`} label="Venue">
          <input
            id={`${uid}-venue`}
            type="text"
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="e.g. Landmark Centre, Victoria Island"
            className={inputCls}
          />
        </Field>
        <Field id={`${uid}-organizer`} label="Organizer" required error={errors.organizer}>
          <input
            id={`${uid}-organizer`}
            type="text"
            value={form.organizer}
            onChange={(e) => set("organizer", e.target.value)}
            data-error={Boolean(errors.organizer) || undefined}
            aria-invalid={Boolean(errors.organizer)}
            placeholder="e.g. REAN / company or association name"
            className={inputCls}
          />
        </Field>
      </div>

      <Field
        id={`${uid}-url`}
        label="Public URL"
        required
        error={errors.url}
        hint="The organizer or registration page — this is what listings link out to."
      >
        <input
          id={`${uid}-url`}
          type="url"
          inputMode="url"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          data-error={Boolean(errors.url) || undefined}
          aria-invalid={Boolean(errors.url)}
          placeholder="https://…"
          className={inputCls}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${uid}-price`} label="Price">
          <select
            id={`${uid}-price`}
            value={form.price}
            onChange={(e) => set("price", e.target.value as PriceType)}
            className={inputCls}
          >
            {PRICE_TYPES.map((p) => (
              <option key={p} value={p}>
                {PRICE_LABELS[p]}
              </option>
            ))}
          </select>
        </Field>
        <Field id={`${uid}-pricenote`} label="Price note" hint="Optional — e.g. “free for trade visitors” or “member rate”.">
          <input
            id={`${uid}-pricenote`}
            type="text"
            value={form.priceNote}
            onChange={(e) => set("priceNote", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-[13px] font-bold text-cream">
          Who should go{" "}
          <span className="font-medium text-mist">({audienceCount} selected)</span>
        </legend>
        <div className="flex flex-wrap gap-1.5">
          {AUDIENCES.map((a) => {
            const active = form.audience.includes(a);
            return (
              <button
                key={a}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  set(
                    "audience",
                    active ? form.audience.filter((x) => x !== a) : [...form.audience, a],
                  )
                }
                className={`min-h-11 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
                  active
                    ? "border-mint bg-mint/15 text-mint"
                    : "border-line bg-card text-mist hover:text-cream"
                }`}
              >
                {AUDIENCE_LABELS[a]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <Field id={`${uid}-who`} label="Who should go — one line" hint="Shown on the listing. e.g. “Installers and resellers in the South-West.”">
        <textarea
          id={`${uid}-who`}
          rows={3}
          value={form.whoShouldGo}
          onChange={(e) => set("whoShouldGo", e.target.value)}
          className={`${inputCls} py-2.5`}
        />
      </Field>

      <Field
        id={`${uid}-contact`}
        label="Your contact — WhatsApp or email"
        required
        error={errors.contact}
        hint="Only used by the curator to verify details. Never published."
      >
        <input
          id={`${uid}-contact`}
          type="text"
          value={form.contact}
          onChange={(e) => set("contact", e.target.value)}
          data-error={Boolean(errors.contact) || undefined}
          aria-invalid={Boolean(errors.contact)}
          placeholder="+234 … or you@company.com"
          className={inputCls}
        />
      </Field>

      <p className="rounded-xl border border-line bg-surface px-4 py-3 text-[12.5px] leading-relaxed text-mist">
        Do not submit product ads disguised as expos. Listings are for industry gatherings, tenders
        and trainings — adverts get dropped without reply.
      </p>

      <button
        type="submit"
        disabled={sending}
        className="flex min-h-12 w-full items-center justify-center rounded-xl bg-gold px-5 text-[15px] font-black text-ink transition-colors hover:bg-gold-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-8"
      >
        {sending ? "Sending…" : "Submit for verification"}
      </button>
    </form>
  );
}
