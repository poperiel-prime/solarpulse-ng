import { CalendarX2 } from "lucide-react";

export default function EmptyState({
  title = "No listed events this week.",
  hint = "Check the next 30 days.",
  pidgin = "Nothing dey this week o — we dey watch the ground for you.",
  action,
}: {
  title?: string;
  hint?: string;
  pidgin?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card">
        <CalendarX2 size={22} className="text-gold" aria-hidden="true" />
      </span>
      <p className="mt-4 text-[15px] font-bold text-cream">{title}</p>
      <p className="mt-1 text-[13px] text-mist">{hint}</p>
      {pidgin ? <p className="mt-2 text-[12px] italic text-mist/80">{pidgin}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
