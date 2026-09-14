"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, LogOut, Radar } from "lucide-react";
import { forgetAdminPin } from "@/lib/adminApi";
import { setLocalAdmin } from "@/lib/adminSession";

const TABS = [
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/paste", label: "Paste dump" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/log", label: "Log" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    setLocalAdmin(false);
    forgetAdminPin();
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div className="border-b border-line/70 bg-surface/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-6">
        <p className="flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.16em] text-gold">
          <Radar size={14} aria-hidden="true" />
          Curator desk
        </p>
        <nav aria-label="Curator" className="flex flex-wrap items-center gap-1">
          {TABS.map((t) => {
            const active = pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`min-h-11 rounded-lg px-3 py-2.5 text-[13px] font-bold transition-colors ${
                  active ? "bg-card text-gold" : "text-mist hover:text-cream"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
          <span className="mx-1 hidden h-5 w-px bg-line sm:block" aria-hidden="true" />
          <Link
            href="/events"
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 py-2.5 text-[12.5px] font-bold text-mist hover:text-mint"
          >
            Public site
            <ExternalLink size={12} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={logout}
            disabled={leaving}
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 py-2.5 text-[12.5px] font-bold text-mist hover:text-danger"
          >
            <LogOut size={12} aria-hidden="true" />
            {leaving ? "Leaving…" : "Log out"}
          </button>
        </nav>
      </div>
    </div>
  );
}
