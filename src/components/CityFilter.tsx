"use client";

/** Accessible multi-select chip row — used for city, type and price filters. */
export default function CityFilter<T extends string>({
  label,
  options,
  selected,
  onToggle,
  optionLabel,
}: {
  label: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  optionLabel: (value: T) => string;
}) {
  return (
    <div>
      <p
        id={`filter-${label.toLowerCase()}`}
        className="mb-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-mist"
      >
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={`filter-${label.toLowerCase()}`}
        className="scrollbar-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-0.5 sm:flex-wrap"
      >
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={`min-h-11 shrink-0 rounded-xl border px-3.5 text-[13px] font-bold transition-colors ${
                active
                  ? "border-gold bg-gold text-ink"
                  : "border-line bg-card text-mist hover:border-gold/50 hover:text-cream"
              }`}
            >
              {optionLabel(option)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
