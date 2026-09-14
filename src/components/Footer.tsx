import Link from "next/link";
import Logo from "./Logo";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Calendar" },
  { href: "/submit", label: "Submit an event" },
  { href: "/alerts", label: "Alerts" },
  { href: "/about", label: "About & sources" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line/70 bg-surface/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 pt-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1.2fr] md:pb-10">
        <div>
          <div className="flex items-center gap-2.5">
            <Logo size={30} />
            <span className="text-[16px] font-extrabold tracking-tight text-cream">
              SolarPulse <span className="text-gold">NG</span>
            </span>
          </div>
          <p className="mt-3 max-w-sm text-[13.5px] leading-relaxed text-mist">
            What is happening in Nigerian solar this month. Expos, tenders, trainings and
            association meetings — independent industry infrastructure, not a marketplace.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mist">Screens</p>
          <ul className="mt-3 space-y-2">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13.5px] font-medium text-cream/85 transition-colors hover:text-gold"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-mist">Data note</p>
          <p className="mt-3 text-[13px] leading-relaxed text-mist">
            Times in WAT. Curated for Nigeria. Data older than 14 days before an event is marked
            Unconfirmed.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-mist">
            Independent feed — not affiliated with Solar &amp; Storage Live, REAN, or any organizer.
          </p>
          <a
            href="mailto:events@solarpulse.ng"
            className="mt-3 inline-block text-[13.5px] font-bold text-gold hover:text-gold-hover"
          >
            events@solarpulse.ng
          </a>
        </div>
      </div>
    </footer>
  );
}
