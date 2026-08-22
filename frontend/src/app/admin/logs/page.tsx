"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ScrollText } from "lucide-react"
import { api } from "@/lib/api"
import { Badge, SearchBar } from "../_components/shared"
import type { LogEntry } from "../_components/types"

const ACTION_META: Record<string, { label: string; color: string }> = {
  connexion:          { label: "Connexion",          color: "bg-tf-success-bg text-tf-success" },
  connexion_echec:    { label: "Échec connexion",    color: "bg-tf-error-bg text-tf-error" },
  inscription:        { label: "Inscription",        color: "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark" },
  boutique_validee:   { label: "Boutique validée",   color: "bg-tf-success-bg text-tf-success" },
  boutique_suspendue: { label: "Boutique suspendue", color: "bg-tf-error-bg text-tf-error" },
  user_modifie:       { label: "User modifié",       color: "bg-tf-gray-soft text-tf-text-muted" },
  litige_resolu:      { label: "Litige résolu",      color: "bg-[rgba(24,95,165,0.1)] text-[#185FA5]" },
}

const ACTION_FILTERS = [
  { label: "Tous",          value: "" },
  { label: "Connexions",    value: "connexion" },
  { label: "Inscriptions",  value: "inscription" },
  { label: "Actions admin", value: "user_modifie" },
  { label: "Litiges",       value: "litige_resolu" },
]

const PERIOD_LABELS: Record<string, string> = { "7d": "7 jours", "30d": "30 jours", "90d": "90 jours" }

export default function LogsPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d")
  const [action, setAction] = useState("")
  const [search, setSearch] = useState("")

  const params = new URLSearchParams({ period })
  if (action) params.set("action", action)

  const { data: logs, isLoading } = useQuery<LogEntry[]>({
    queryKey: ["admin-logs", period, action],
    queryFn:  async () => (await api.get(`/admin/logs?${params}`)).data,
    refetchInterval: 30_000,
  })

  const filtered = (logs ?? []).filter(l =>
    !search ||
    l.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    (l.ip_address ?? "").includes(search)
  )

  function actionMeta(a: string) {
    return ACTION_META[a] ?? { label: a, color: "bg-tf-gray-soft text-tf-text-muted" }
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par utilisateur ou IP..." />
        </div>
        <div className="flex gap-1 bg-tf-gray-soft rounded-lg p-1 shrink-0">
          {(["7d", "30d", "90d"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
              className={`px-3 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${period === p ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-tf-gray-soft rounded-lg p-1 shrink-0 flex-wrap">
          {ACTION_FILTERS.map(f => (
            <button key={f.value} onClick={() => setAction(f.value)} aria-pressed={action === f.value}
              className={`px-3 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${action === f.value ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="font-sans text-[12px] text-tf-text-muted" aria-live="polite">
        {filtered.length} événement{filtered.length > 1 ? "s" : ""}
      </p>

      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-tf-bg border-b border-tf-border">
          {[
            { label: "Date / Heure", span: "col-span-2" },
            { label: "Utilisateur",  span: "col-span-3" },
            { label: "Action",       span: "col-span-2" },
            { label: "IP",           span: "col-span-2" },
            { label: "Détails",      span: "col-span-3" },
          ].map(h => (
            <span key={h.label} className={`font-sans text-[10px] font-bold text-tf-text-muted uppercase tracking-wider ${h.span}`}>
              {h.label}
            </span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-tf-gray-soft rounded animate-pulse" />)}</div>
        ) : !filtered.length ? (
          <div className="p-10 text-center">
            <ScrollText size={32} className="text-tf-text-muted mx-auto mb-3 opacity-40" />
            <p className="font-sans text-[13px] text-tf-text-muted">Aucun événement sur cette période</p>
          </div>
        ) : (
          <div className="divide-y divide-tf-border">
            {filtered.map(l => {
              const meta = actionMeta(l.action)
              return (
                <div key={l.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-start hover:bg-tf-bg transition-colors">
                  <div className="col-span-2">
                    <p className="font-mono text-[11px] font-semibold text-tf-text tabular-nums">
                      {new Date(l.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="font-mono text-[10px] text-tf-text-muted tabular-nums">
                      {new Date(l.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    {l.user_name ? (
                      <>
                        <p className="font-sans text-[12px] font-semibold text-tf-text truncate">{l.user_name}</p>
                        {l.user_role && (
                          <Badge color={l.user_role === "admin" ? "bg-tf-black text-white" : l.user_role === "couturier" ? "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark" : "bg-tf-gray-soft text-tf-text-muted"}>
                            {l.user_role}
                          </Badge>
                        )}
                      </>
                    ) : (
                      <span className="font-sans text-[11px] text-tf-text-muted italic">Anonyme</span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge color={meta.color}>{meta.label}</Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="font-sans text-[11px] text-tf-text font-mono truncate">
                      {l.ip_address ?? <span className="text-tf-text-muted">—</span>}
                    </p>
                  </div>
                  <div className="col-span-3 min-w-0">
                    {l.details ? (
                      <p className="font-sans text-[10px] text-tf-text-muted leading-relaxed break-words">
                        {Object.entries(l.details).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ")}
                      </p>
                    ) : (
                      <span className="text-tf-text-muted text-[11px]">—</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
