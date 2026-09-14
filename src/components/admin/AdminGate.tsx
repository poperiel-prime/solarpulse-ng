"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { rememberAdminPin } from "@/lib/adminApi";
import { setLocalAdmin } from "@/lib/adminSession";

export default function AdminGate({
  redirectTo = "inbox",
}: {
  redirectTo?: "inbox" | "current";
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Wrong PIN.");
        setPin("");
        return;
      }
      // The API sets the required cookie. These two fallbacks cover embedded
      // previews that block cookies: a UI flag, and the typed PIN held in
      // memory for this tab so write requests can carry x-admin-pin.
      setLocalAdmin(true);
      rememberAdminPin(pin);
      if (redirectTo === "inbox") router.push("/admin/inbox");
      else router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
      aria-label="Curator sign-in"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/15">
        <KeyRound size={20} className="text-gold" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-xl font-black tracking-tight text-cream">Curator sign-in</h1>
      <p className="mt-1.5 text-[13px] leading-relaxed text-mist">
        This desk is for the review queue only. Readers never see it — there is no link anywhere in
        the public navigation.
      </p>

      <label htmlFor="admin-pin" className="mb-1.5 mt-5 block text-[13px] font-bold text-cream">
        PIN
      </label>
      <input
        id="admin-pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "pin-error" : undefined}
        placeholder="••••"
        className="min-h-12 w-full rounded-xl border border-line bg-card px-4 text-center text-[18px] font-black tracking-[0.5em] text-cream placeholder:text-mist/50 focus:border-gold focus:outline-none"
      />
      {error ? (
        <p id="pin-error" role="alert" className="mt-2 text-[13px] font-semibold text-danger">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!pin.trim() || busy}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gold text-[15px] font-black text-ink transition-colors hover:bg-gold-hover disabled:cursor-not-allowed disabled:bg-card disabled:text-mist"
      >
        {busy ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <ArrowRight size={17} aria-hidden="true" />}
        {busy ? "Checking…" : "Open the review queue"}
      </button>

      <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-card px-3.5 py-3 text-[12px] leading-relaxed text-mist">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
        MVP gate: the PIN lives in the ADMIN_PIN environment variable (default 2468 for local demo
        only). One cookie, no accounts — it keeps honest people out, nothing more.
      </p>
    </form>
  );
}
