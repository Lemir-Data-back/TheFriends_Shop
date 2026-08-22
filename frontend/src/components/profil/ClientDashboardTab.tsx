"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  ShoppingBag, TrendingUp, Clock, User, Wallet,
  AlertTriangle, ArrowRight, Pencil, Heart, TrendingDown,
  Bell, Store, Scissors, Package,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"
import { STATUT_LABELS, STATUT_COLORS, Order } from "@/types/order"
import { DateRangePicker, DateRange, defaultRange, formatRangeLabel } from "@/components/dashboard/DateRangePicker"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClientDashboard {
  stats: {
    nb_commandes: number
    nb_commandes_en_cours: number
    nb_commandes_mois: number
    total_depense: number
    depense_mois: number
    score_confiance: number
    nb_likes_cumules: number
    article_plus_cher: { titre: string; prix: number } | null
    article_moins_cher: { titre: string; prix: number } | null
  }
  dernieres_commandes: Order[]
}

interface Alerte {
  type: string
  titre: string
  desc: string
  href: string
}

// ── Helpers budget ────────────────────────────────────────────────────────────

type BudgetPeriod = "mensuel" | "hebdomadaire" | "annuel"

const BUDGET_KEY     = "tf_budget_montant"
const BUDGET_TYPE_KEY = "tf_budget_type"

function getBudgetLocal()      { return parseInt(localStorage.getItem(BUDGET_KEY) ?? "0", 10) || 0 }
function getBudgetTypeLocal()  { return (localStorage.getItem(BUDGET_TYPE_KEY) ?? "mensuel") as BudgetPeriod }
function setBudgetLocal(v: number, t: BudgetPeriod) {
  localStorage.setItem(BUDGET_KEY, String(v))
  localStorage.setItem(BUDGET_TYPE_KEY, t)
}

const BUDGET_PERIOD_LABELS: Record<BudgetPeriod, string> = {
  mensuel:       "Budget mensuel",
  hebdomadaire:  "Budget hebdomadaire",
  annuel:        "Budget annuel",
}

// ── Score config ──────────────────────────────────────────────────────────────

const SCORE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  premium:  { label: "Premium ⭐",  color: "text-tf-gold-dark",  bg: "bg-[rgba(201,168,76,0.12)]" },
  fiable:   { label: "Fiable ✓",   color: "text-[#2D6A4F]",     bg: "bg-[#D8F3DC]" },
  standard: { label: "Standard",    color: "text-tf-text-muted",  bg: "bg-tf-gray-soft" },
  surveille:{ label: "Surveillé ⚠️", color: "text-[#B8892A]",     bg: "bg-[#FFF3CD]" },
  restreint:{ label: "Restreint",    color: "text-[#C0392B]",     bg: "bg-[#FFCCCC]" },
}
function getStatut(s: number) {
  if (s >= 4.5) return "premium"
  if (s >= 3.5) return "fiable"
  if (s >= 2.5) return "standard"
  if (s >= 1.5) return "surveille"
  return "restreint"
}

// ── Composant budget ──────────────────────────────────────────────────────────

function BudgetSection({ depensePeriode }: { depensePeriode: number; range?: DateRange }) {
  const [budget,      setBudget]      = useState(0)
  const [budgetType,  setBudgetType]  = useState<BudgetPeriod>("mensuel")
  const [editing,     setEditing]     = useState(false)
  const [inputVal,    setInputVal]    = useState("")
  const [inputType,   setInputType]   = useState<BudgetPeriod>("mensuel")

  useEffect(() => {
    setBudget(getBudgetLocal())
    setBudgetType(getBudgetTypeLocal())
  }, [])

  function handleSave() {
    const val = parseInt(inputVal, 10)
    if (val > 0) { setBudget(val); setBudgetType(inputType); setBudgetLocal(val, inputType) }
    else         { setBudget(0);   setBudgetType(inputType); setBudgetLocal(0, inputType) }
    setEditing(false)
  }

  const pct         = budget > 0 ? Math.min(100, Math.round((depensePeriode / budget) * 100)) : 0
  const reste       = Math.max(0, budget - depensePeriode)
  const depasse     = budget > 0 && depensePeriode > budget
  const procheLimit = budget > 0 && pct >= 80 && !depasse
  const barColor    = depasse ? "#C0392B" : procheLimit ? "#B8892A" : "#2D6A4F"

  return (
    <div className="bg-white rounded-xl border border-tf-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet size={16} className="text-tf-gold" />
          <h2 className="font-sans text-[15px] font-bold text-tf-text">
            {budget > 0 ? BUDGET_PERIOD_LABELS[budgetType] : "Gestion budgétaire"}
          </h2>
        </div>
        <button
          onClick={() => { setEditing(!editing); setInputVal(budget > 0 ? String(budget) : ""); setInputType(budgetType) }}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-tf-gold hover:text-tf-gold-dark transition-colors"
        >
          <Pencil size={12} />{budget > 0 ? "Modifier" : "Définir"}
        </button>
      </div>

      {editing && (
        <div className="mb-4 space-y-2">
          {/* Sélection du type de période */}
          <div className="flex gap-1.5">
            {(["mensuel", "hebdomadaire", "annuel"] as BudgetPeriod[]).map(t => (
              <button key={t} onClick={() => setInputType(t)}
                className={`flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors capitalize ${
                  inputType === t ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-gold"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {/* Montant */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center border border-tf-border rounded-lg overflow-hidden focus-within:border-tf-gold">
              <input
                type="number" min={1000} step={1000}
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                placeholder="ex : 50 000"
                className="flex-1 px-3 py-2 font-sans text-[14px] text-tf-text outline-none bg-white"
              />
              <span className="px-3 font-sans text-[12px] text-tf-text-muted bg-tf-gray-soft border-l border-tf-border py-2">FCFA</span>
            </div>
            <button onClick={handleSave}
              className="px-4 py-2 bg-tf-black text-white rounded-lg font-sans font-bold text-[13px] hover:bg-tf-charbon transition-colors">
              OK
            </button>
          </div>
        </div>
      )}

      {budget > 0 ? (
        <>
          {depasse && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FFCCCC] rounded-lg">
              <AlertTriangle size={13} className="text-[#C0392B] shrink-0" />
              <p className="font-sans text-[12px] font-semibold text-[#C0392B]">
                Budget dépassé de {formatPrix(depensePeriode - budget)}
              </p>
            </div>
          )}
          {procheLimit && !depasse && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-[#FFF3CD] rounded-lg">
              <AlertTriangle size={13} className="text-[#B8892A] shrink-0" />
              <p className="font-sans text-[12px] font-semibold text-[#B8892A]">
                Plus que {formatPrix(reste)} disponibles
              </p>
            </div>
          )}

          <div className="mb-3">
            <div className="flex justify-between mb-1.5">
              <span className="font-sans text-[12px] text-tf-text-muted">Dépensé sur la période</span>
              <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: barColor }}>{pct}%</span>
            </div>
            <div className="w-full h-3 bg-tf-gray-soft rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Budget",   value: formatPrix(budget),         color: "text-tf-text" },
              { label: "Dépensé",  value: formatPrix(depensePeriode), color: barColor },
              { label: "Restant",  value: formatPrix(reste),          color: depasse ? "#C0392B" : "#2D6A4F" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-wide mb-1">{label}</p>
                <p className="font-mono text-[14px] font-bold tabular-nums" style={{ color }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-3">
          <p className="font-sans text-[13px] text-tf-text-muted mb-1">Aucun budget défini</p>
          <p className="font-sans text-[12px] text-tf-text-muted">
            Définis un budget mensuel, hebdomadaire ou annuel pour suivre tes dépenses.
          </p>
          {depensePeriode > 0 && (
            <p className="font-sans text-[13px] font-semibold text-tf-text mt-2">
              Dépensé sur la période : <span className="text-tf-gold">{formatPrix(depensePeriode)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Composant alertes ─────────────────────────────────────────────────────────

function AlertesSection() {
  const { data, isLoading } = useQuery<{ alertes: Alerte[]; nb_total: number }>({
    queryKey: ["alertes"],
    queryFn: async () => (await api.get("/dashboard/alertes")).data,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading || !data?.alertes.length) return null

  const ALERTE_ICONS: Record<string, React.ReactNode> = {
    nouvelle_boutique: <Store size={14} className="text-[#185FA5]" />,
    nouveau_couturier: <Scissors size={14} className="text-tf-gold" />,
    article_disponible: <Package size={14} className="text-[#2D6A4F]" />,
  }

  const ALERTE_BG: Record<string, string> = {
    nouvelle_boutique:  "bg-[#E8F0FB] border-[rgba(24,95,165,0.3)]",
    nouveau_couturier:  "bg-[rgba(201,168,76,0.06)] border-[rgba(201,168,76,0.3)]",
    article_disponible: "bg-[#D8F3DC] border-[rgba(45,106,79,0.3)]",
  }

  return (
    <div className="bg-white rounded-xl border border-tf-border overflow-hidden mb-6">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-tf-border">
        <Bell size={15} className="text-tf-gold" />
        <h2 className="font-sans text-[14px] font-bold text-tf-text">Alertes</h2>
        <span className="ml-auto text-[10px] px-2 py-0.5 bg-tf-gold text-tf-black rounded-full font-bold">
          {data.nb_total}
        </span>
      </div>
      <div className="p-4 space-y-2">
        {data.alertes.map((a, i) => (
          <Link key={i} href={a.href}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm ${ALERTE_BG[a.type] ?? "bg-tf-gray-soft border-tf-border"}`}
          >
            <span className="mt-0.5 shrink-0">{ALERTE_ICONS[a.type] ?? <Bell size={14} />}</span>
            <div className="min-w-0">
              <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{a.titre}</p>
              <p className="font-sans text-[11px] text-tf-text-muted">{a.desc}</p>
            </div>
            <ArrowRight size={13} className="text-tf-text-muted shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Onglet Vue d'ensemble ─────────────────────────────────────────────────────

export function ClientDashboardTab({ onViewAllOrders }: { onViewAllOrders?: () => void }) {
  const [range, setRange] = useState<DateRange>(defaultRange)

  const { data, isLoading } = useQuery<ClientDashboard>({
    queryKey: ["dashboard-client", range],
    queryFn: async () => (await api.get(
      `/dashboard/client?date_debut=${range.debut}&date_fin=${range.fin}`
    )).data,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-tf-border" />)}
      </div>
    )
  }

  const score  = data?.stats.score_confiance ?? 5
  const statut = getStatut(score)
  const sc     = SCORE_CONFIG[statut]

  return (
    <div>
      <div className="flex justify-end mb-4">
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {/* Alertes */}
      <AlertesSection />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Commandes total",       value: data?.stats.nb_commandes ?? 0,          icon: <ShoppingBag size={16} className="text-tf-gold" /> },
          { label: "En cours",              value: data?.stats.nb_commandes_en_cours ?? 0, icon: <Clock size={16} className="text-[#185FA5]" /> },
          { label: formatRangeLabel(range), value: data?.stats.nb_commandes_mois ?? 0,     icon: <TrendingUp size={16} className="text-[#2D6A4F]" /> },
          { label: "Likes cumulés",         value: data?.stats.nb_likes_cumules ?? 0,      icon: <Heart size={16} className="text-[#C0392B]" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-tf-border p-4">
            <div className="flex items-center gap-1.5 mb-2">{icon}
              <p className="font-sans text-[11px] text-tf-text-muted leading-tight">{label}</p>
            </div>
            <p className="font-mono text-[20px] font-bold tabular-nums text-tf-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Articles extrêmes */}
      {(data?.stats.article_plus_cher || data?.stats.article_moins_cher) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {data?.stats.article_plus_cher && (
            <div className="bg-white rounded-xl border border-tf-border p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[rgba(201,168,76,0.1)] flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-tf-gold" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[11px] text-tf-text-muted">Article le plus cher acheté</p>
                <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{data.stats.article_plus_cher.titre}</p>
                <p className="font-mono text-[14px] font-bold text-tf-gold">{formatPrix(data.stats.article_plus_cher.prix)}</p>
              </div>
            </div>
          )}
          {data?.stats.article_moins_cher && (
            <div className="bg-white rounded-xl border border-tf-border p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#D8F3DC] flex items-center justify-center shrink-0">
                <TrendingDown size={16} className="text-[#2D6A4F]" />
              </div>
              <div className="min-w-0">
                <p className="font-sans text-[11px] text-tf-text-muted">Article le moins cher acheté</p>
                <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{data.stats.article_moins_cher.titre}</p>
                <p className="font-mono text-[14px] font-bold text-[#2D6A4F]">{formatPrix(data.stats.article_moins_cher.prix)}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Budget + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BudgetSection depensePeriode={data?.stats.depense_mois ?? 0} range={range} />

        {/* Score confiance */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-tf-gold" />
            <h2 className="font-sans text-[15px] font-bold text-tf-text">Mon score de confiance</h2>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${sc.bg}`}>
              <p className={`font-mono text-[22px] font-bold tabular-nums ${sc.color}`}>{score.toFixed(1)}</p>
            </div>
            <div>
              <p className={`font-sans text-[14px] font-bold ${sc.color}`}>{sc.label}</p>
              <p className="font-sans text-[12px] text-tf-text-muted">sur 5 points</p>
            </div>
          </div>
          <div className="w-full h-2 bg-tf-gray-soft rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(score / 5) * 100}%`, backgroundColor: score >= 4.5 ? "#C9A84C" : score >= 3.5 ? "#2D6A4F" : score >= 2.5 ? "#7A766F" : "#C0392B" }} />
          </div>
          <div className="space-y-1.5">
            {[
              { label: "Premium ⭐",  min: 4.5, desc: "Accès prioritaire aux collections" },
              { label: "Fiable ✓",   min: 3.5, desc: "Accès normal à toutes les fonctions" },
              { label: "Standard",    min: 2.5, desc: "Rappels préventifs activés" },
              { label: "Surveillé",   min: 1.5, desc: "Certains vendeurs peuvent refuser" },
              { label: "Restreint",   min: 0,   desc: "Accès limité" },
            ].map(({ label, min, desc }) => {
              const active = score >= min
              return (
                <div key={label} className={`flex items-center gap-2 text-[11px] ${active ? "opacity-100" : "opacity-35"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-tf-gold" : "bg-tf-border"}`} />
                  <span className="font-semibold text-tf-text">{label}</span>
                  <span className="text-tf-text-muted">— {desc}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Dépense totale */}
      <div className="bg-white rounded-xl border border-tf-border p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans text-[12px] text-tf-text-muted mb-1">Total dépensé depuis ton inscription</p>
            <p className="font-mono text-[28px] font-bold tabular-nums text-tf-black">{formatPrix(data?.stats.total_depense ?? 0)}</p>
          </div>
          <div className="text-right">
            <p className="font-sans text-[12px] text-tf-text-muted mb-1">Sur la période sélectionnée</p>
            <p className="font-mono text-[22px] font-bold tabular-nums text-tf-gold">{formatPrix(data?.stats.depense_mois ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-tf-border">
          <h2 className="font-sans text-[15px] font-bold text-tf-text">Commandes sur la période</h2>
          {onViewAllOrders ? (
            <button onClick={onViewAllOrders} className="flex items-center gap-1 font-sans text-[13px] text-tf-gold hover:underline">
              Voir tout <ArrowRight size={13} />
            </button>
          ) : (
            <Link href="/commandes" className="flex items-center gap-1 font-sans text-[13px] text-tf-gold hover:underline">
              Voir tout <ArrowRight size={13} />
            </Link>
          )}
        </div>
        {!data?.dernieres_commandes.length ? (
          <div className="p-8 text-center">
            <ShoppingBag size={36} className="text-tf-border mx-auto mb-3" />
            <p className="font-sans text-[13px] text-tf-text-muted mb-3">Aucune commande sur cette période</p>
            <Link href="/shopping" className="inline-flex items-center gap-2 px-4 py-2 bg-tf-gold text-tf-black rounded-md font-bold text-[13px] hover:bg-tf-gold-light transition-colors">
              Aller en shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-tf-border">
            {data.dernieres_commandes.map((order) => (
              <Link key={order.id} href={`/commandes/${order.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-tf-bg transition-colors">
                <div>
                  <p className="font-sans text-[13px] font-semibold text-tf-text">{order.reference}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-sans text-[11px] px-2 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
                    {STATUT_LABELS[order.statut]}
                  </span>
                  <span className="font-mono text-[14px] font-bold tabular-nums text-tf-black">{formatPrix(order.montant)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
