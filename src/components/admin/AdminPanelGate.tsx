"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { Database, TriangleAlert } from "lucide-react";
import AdminGate from "./AdminGate";
import AdminNav from "./AdminNav";
import { createDrafts } from "@/lib/adminApi";
import { loadLocalAdmin, subscribeAdminSession } from "@/lib/adminSession";
import { loadInbox, loadPublished } from "@/lib/review";
import { loadInboxShared, loadPublishedShared } from "@/lib/sharedStore";
import { useClientSignal, useHydrated } from "@/lib/useHydrated";

export default function AdminPanelGate({
  initialAuthed,
  children,
}: {
  /** Server saw the httpOnly cookie. */
  initialAuthed: boolean;
  children: ReactNode;
}) {
  const hydrated = useHydrated();
  const localAuthed = useClientSignal(subscribeAdminSession, loadLocalAdmin, false);
  const allowed = initialAuthed || (hydrated && localAuthed);

  /**
   * One-time lift: drafts that older builds saved only in this browser are
   * pushed into the shared queue so nothing from earlier testing is stranded.
   * The server dedups, so running this repeatedly is harmless.
   */
  useEffect(() => {
    if (!allowed) return;
    const localDrafts = loadInbox().filter((d) => d.status === "pending");
    if (localDrafts.length === 0) return;
    void createDrafts(localDrafts)
      .then(() => loadInboxShared(true))
      .catch(() => {
        /* offline or not authorised — the local copy is still listed */
      });
  }, [allowed]);

  // Keep the curator's view fresh when the desk is opened.
  useEffect(() => {
    if (!allowed) return;
    void loadPublishedShared(true);
    void loadInboxShared(true);
  }, [allowed]);

  if (!hydrated && !initialAuthed) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-hidden="true">
        <div className="h-48 animate-pulse rounded-2xl border border-line bg-card/60" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-md">
          <AdminGate redirectTo="current" />
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-gold/35 bg-gold/5 px-4 py-3 text-[12.5px] leading-relaxed text-mist">
            <TriangleAlert size={14} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            Your browser blocked the admin cookie or this is a fresh preview URL. Enter the PIN
            again; the embedded-preview fallback will keep this desk open on this exact URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6">
        <p className="mb-5 flex items-start gap-2 rounded-xl border border-line bg-surface/70 px-4 py-3 text-[12px] leading-relaxed text-mist">
          <Database size={14} className="mt-0.5 shrink-0 text-mint" aria-hidden="true" />
          The queue and the public calendar live in the shared server store — what you Add here is
          what every visitor sees. Only you can write: the API checks your PIN cookie or header on
          every change.
        </p>
        {children}
      </div>
    </>
  );
}
