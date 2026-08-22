"use client"

import { Search } from "lucide-react"

export const CHART_GOLD    = "#C9A84C"
export const CHART_SUCCESS = "#2D6A4F"
export const CHART_BLUE    = "#185FA5"
export const CHART_GRAY    = "#9CA3AF"

export function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function fmtCaShort(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`
  return String(v)
}

export function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {children}
    </span>
  )
}

export function StatCard({ label, value, sub, color = "text-tf-black" }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white border border-tf-border rounded-xl p-4">
      <p className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono text-[22px] font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="font-sans text-[11px] text-tf-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

export function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tf-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)] bg-white"
      />
    </div>
  )
}

export function ChartCard({ title, period, className = "", children }: {
  title: string; period: string; className?: string; children: React.ReactNode
}) {
  return (
    <div className={`bg-white border border-tf-border rounded-xl p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-[13px] font-bold text-tf-text">{title}</p>
        <p className="font-sans text-[11px] text-tf-text-muted">{period}</p>
      </div>
      {children}
    </div>
  )
}
