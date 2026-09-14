"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle } from "lucide-react";
import Logo from "./Logo";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Calendar" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About" },
];

export function NigeriaChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold tracking-wide text-mist">
      <span aria-hidden="true" className="flex gap-[3px]">
        <span className="h-2 w-[3px] rounded-sm bg-mint/70" />
        <span className="h-2 w-[3px] rounded-sm bg-cream/80" />
        <span className="h-2 w-[3px] rounded-sm bg-mint/70" />
      </span>
      NIGERIA
    </span>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-line/70 bg-ink/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="SolarPulse NG home">
          <Logo />
          <span className="truncate text-[17px] font-extrabold tracking-tight text-cream">
            SolarPulse
            <span className="ml-1 rounded-md bg-gold px-1.5 py-0.5 text-[12px] font-black text-ink">
              NG
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                  active ? "bg-card text-gold" : "text-mist hover:bg-card/60 hover:text-cream"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <NigeriaChip />
          <Link
            href="/submit"
            className="hidden min-h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-bold text-ink transition-colors hover:bg-gold-hover sm:inline-flex"
          >
            <PlusCircle size={17} strokeWidth={2.5} aria-hidden="true" />
            Submit
          </Link>
        </div>
      </div>
    </header>
  );
}
