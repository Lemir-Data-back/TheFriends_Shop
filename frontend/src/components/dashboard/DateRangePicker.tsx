"use client"

import { useState, useEffect } from "react"
import { CalendarDays } from "lucide-react"

export interface DateRange {
  debut: string  // YYYY-MM-DD
  fin: string    // YYYY-MM-DD
}

function todayStr()      { return new Date().toISOString().split("T")[0] }
function firstOfMonth()  {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`
}

export function defaultRange(): DateRange {
  return { debut: firstOfMonth(), fin: todayStr() }
}

export function formatRangeLabel(range: DateRange): string {
  const debut = new Date(range.debut + "T00:00:00")
  const fin   = new Date(range.fin   + "T00:00:00")
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  return `${debut.toLocaleDateString("fr-FR", opts)} — ${fin.toLocaleDateString("fr-FR", opts)}`
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (v: DateRange) => void
}

// Raccourcis prédéfinis pour aider l'utilisateur
const PRESETS = [
  { label: "Ce mois",     getRange: () => ({ debut: firstOfMonth(),           fin: todayStr() }) },
  { label: "7 jours",     getRange: () => { const d = new Date(); d.setDate(d.getDate() - 7);  return { debut: d.toISOString().split("T")[0], fin: todayStr() } } },
  { label: "30 jours",    getRange: () => { const d = new Date(); d.setDate(d.getDate() - 30); return { debut: d.toISOString().split("T")[0], fin: todayStr() } } },
  { label: "3 mois",      getRange: () => { const d = new Date(); d.setMonth(d.getMonth() - 3); return { debut: d.toISOString().split("T")[0], fin: todayStr() } } },
  { label: "Cette année", getRange: () => ({ debut: `${new Date().getFullYear()}-01-01`, fin: todayStr() }) },
]

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [local, setLocal] = useState<DateRange>(value)

  useEffect(() => { setLocal(value) }, [value])

  function apply() {
    if (local.debut && local.fin && local.debut <= local.fin) {
      onChange(local)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-tf-border rounded-lg font-sans text-[12px] font-semibold text-tf-text hover:border-tf-gold transition-colors"
      >
        <CalendarDays size={14} className="text-tf-gold" />
        <span>{formatRangeLabel(value)}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Overlay mobile */}
          <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-full mt-2 z-40 bg-white border border-tf-border rounded-xl shadow-card-hover p-4 w-72">

            {/* Raccourcis */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => { const r = p.getRange(); setLocal(r); onChange(r); setOpen(false) }}
                  className="px-2.5 py-1 rounded-full bg-tf-gray-soft font-sans text-[11px] font-semibold text-tf-text hover:bg-[rgba(201,168,76,0.15)] hover:text-tf-gold-dark transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="border-t border-tf-border pt-3 space-y-3">
              <p className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider">Période personnalisée</p>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-sans text-[10px] font-semibold text-tf-text-muted block mb-1">Début</label>
                  <input
                    type="date"
                    value={local.debut}
                    max={local.fin || todayStr()}
                    onChange={e => setLocal(l => ({ ...l, debut: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-tf-border rounded-lg font-sans text-[12px] text-tf-text focus:outline-none focus:border-tf-gold"
                  />
                </div>
                <div>
                  <label className="font-sans text-[10px] font-semibold text-tf-text-muted block mb-1">Fin</label>
                  <input
                    type="date"
                    value={local.fin}
                    min={local.debut}
                    max={todayStr()}
                    onChange={e => setLocal(l => ({ ...l, fin: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-tf-border rounded-lg font-sans text-[12px] text-tf-text focus:outline-none focus:border-tf-gold"
                  />
                </div>
              </div>

              <button
                onClick={apply}
                disabled={!local.debut || !local.fin || local.debut > local.fin}
                className="w-full py-2 bg-tf-black text-white rounded-lg font-sans font-bold text-[12px] hover:bg-tf-charbon transition-colors disabled:opacity-40"
              >
                Appliquer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
