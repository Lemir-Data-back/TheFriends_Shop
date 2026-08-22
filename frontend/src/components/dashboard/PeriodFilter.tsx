"use client"

export type Period = "this_month" | "3_months" | "6_months" | "this_year" | "all"

export const PERIODS: { value: Period; label: string; short: string }[] = [
  { value: "this_month", label: "Ce mois",       short: "Mois" },
  { value: "3_months",   label: "3 derniers mois", short: "3 mois" },
  { value: "6_months",   label: "6 derniers mois", short: "6 mois" },
  { value: "this_year",  label: "Cette année",    short: "Année" },
  { value: "all",        label: "Tout",            short: "Tout" },
]

export function getPeriodLabel(period: Period): string {
  return PERIODS.find(p => p.value === period)?.label ?? "Ce mois"
}

interface PeriodFilterProps {
  value: Period
  onChange: (v: Period) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-1 bg-tf-gray-soft rounded-full p-1 overflow-x-auto">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          aria-pressed={value === p.value}
          className={`px-3 py-1.5 rounded-full font-sans text-[12px] font-semibold whitespace-nowrap transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
            value === p.value
              ? "bg-white text-tf-black shadow-sm"
              : "text-tf-text-muted hover:text-tf-text"
          }`}
        >
          {/* Texte court sur mobile, long sur desktop */}
          <span className="sm:hidden">{p.short}</span>
          <span className="hidden sm:inline">{p.label}</span>
        </button>
      ))}
    </div>
  )
}
