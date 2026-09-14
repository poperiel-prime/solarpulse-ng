"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, CalendarDays, House, PlusCircle } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", Icon: House },
  { href: "/events", label: "Calendar", Icon: CalendarDays },
  { href: "/submit", label: "Submit", Icon: PlusCircle },
  { href: "/alerts", label: "Alerts", Icon: Bell },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/95 backdrop-blur-md pb-safe md:hidden"
    >
      <ul className="grid grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  active ? "text-gold" : "text-mist hover:text-cream"
                }`}
              >
                <Icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
