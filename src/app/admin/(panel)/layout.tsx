import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import AdminPanelGate from "@/components/admin/AdminPanelGate";

export const metadata: Metadata = {
  title: {
    default: "Curator desk",
    template: "%s — SolarPulse NG curator",
  },
  robots: { index: false, follow: false },
};

/**
 * Cookie remains the normal production gate. AdminPanelGate adds a same-origin
 * local fallback for embedded previews that block the cookie after login.
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const store = await cookies();
  const initialAuthed = store.get("solarpulse-admin")?.value === "1";
  return <AdminPanelGate initialAuthed={initialAuthed}>{children}</AdminPanelGate>;
}
