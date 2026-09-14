import { TYPE_LABELS, type EventType } from "@/lib/types";

export const TYPE_COLORS: Record<EventType, string> = {
  expo: "#F5B942",
  conference: "#6EA8FE",
  training: "#B794F6",
  tender: "#FF8A5C",
  association: "#3DDC97",
  webinar: "#5BDDEB",
};

export function typeColor(type: EventType): string {
  return TYPE_COLORS[type];
}

export default function TypeChip({
  type,
  className = "",
}: {
  type: EventType;
  className?: string;
}) {
  const color = TYPE_COLORS[type];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.12em] ${className}`}
      style={{
        color,
        borderColor: `color-mix(in oklab, ${color} 38%, transparent)`,
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`,
      }}
    >
      {TYPE_LABELS[type]}
    </span>
  );
}
