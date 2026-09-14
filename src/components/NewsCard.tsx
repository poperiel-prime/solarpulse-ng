import { ExternalLink } from "lucide-react";
import { shortDate } from "@/lib/dates";
import type { NewsItem } from "@/lib/types";

export default function NewsCard({ item }: { item: NewsItem }) {
  return (
    <li className="w-[270px] shrink-0 snap-start sm:w-[320px]">
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-full flex-col rounded-2xl border border-line bg-card p-4 transition-colors hover:border-mint/40"
        aria-label={`${item.title} — ${item.source} (opens in new tab)`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-md border border-mint/30 bg-mint/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-mint">
            {item.source}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-mist">
            {shortDate(item.publishedAt)}
            <ExternalLink
              size={11}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
        </div>
        <p className="mt-2.5 line-clamp-4 text-[13.5px] font-semibold leading-snug text-cream group-hover:text-gold">
          {item.title}
        </p>
      </a>
    </li>
  );
}

export function NewsStrip({ items }: { items: NewsItem[] }) {
  return (
    <ul
      className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6"
      aria-label="Industry news"
    >
      {items.map((item) => (
        <NewsCard key={item.id} item={item} />
      ))}
    </ul>
  );
}
