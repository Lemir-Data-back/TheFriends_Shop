"use client"

import { Suspense, useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Scissors, Star, TrendingUp, Clock, Send,
  LayoutDashboard, Users, BarChart2, Package, Settings,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"
import { STATUT_LABELS, STATUT_COLORS, Order } from "@/types/order"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { CouturierClientsTab } from "@/components/dashboard/couturier/ClientsTab"
import { CatalogueStockTab } from "@/components/dashboard/CatalogueStockTab"
import { ParametresTab } from "@/components/dashboard/ParametresTab"
import { EvolutionCharts, EvolutionPoint } from "@/components/dashboard/EvolutionCharts"
import { DateRangePicker, DateRange, defaultRange, formatRangeLabel } from "@/components/dashboard/DateRangePicker"
import { ProgressBar } from "@/components/ui/ProgressBar"

interface CouturierDashboard {
  shop_id?: number
  stats: {
    nb_demandes_ouvertes: number
    nb_devis_envoyes: number
    nb_commandes_en_cours: number
    nb_commandes_terminees: number
    revenu_total: number
    revenu_mois: number
    score_moyen: number
    taux_acceptation: number
  }
  demandes_recentes: {
    id: number
    description: string
    statut: string
    nb_devis: number
    created_at: string
  }[]
  commandes_en_cours: Order[]
  evolution_mensuelle?: EvolutionPoint[]
}

function DashboardCouturierContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab,    setTab]    = useState(searchParams.get("tab") ?? "overview")
  const [range, setRange] = useState<DateRange>(defaultRange)

  // Réagit aux liens internes (Accès rapides, sidebar) même sans remontage de page
  useEffect(() => {
    setTab(searchParams.get("tab") ?? "overview")
  }, [searchParams])

  // Change d'onglet ET met à jour l'URL — sinon la sidebar (qui lit l'URL) reste
  // bloquée sur l'ancien onglet quand on clique un onglet interne à la page.
  function handleTabChange(newTab: string) {
    setTab(newTab)
    router.replace(newTab === "overview" ? "/dashboard/couturier" : `/dashboard/couturier?tab=${newTab}`, { scroll: false })
  }

  const { data, isLoading } = useQuery<CouturierDashboard>({
    queryKey: ["dashboard-couturier", range],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/couturier?date_debut=${range.debut}&date_fin=${range.fin}`)
      return data
    },
  })

  const TABS = [
    { id: "overview",    label: "Vue d'ensemble", icon: <LayoutDashboard size={14} /> },
    { id: "catalogue",   label: "Catalogue",       icon: <Package size={14} /> },
    { id: "clients",     label: "Clients",         icon: <Users size={14} />, badge: data?.stats.nb_demandes_ouvertes },
    { id: "analytique",  label: "Analytique",      icon: <BarChart2 size={14} /> },
    { id: "parametres",  label: "Paramètres",      icon: <Settings size={14} /> },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tf-bg">
        <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-tf-border" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-sans text-[13px] text-tf-text-muted">Tableau de bord</p>
            <h1 className="font-serif text-h1 text-tf-black">Espace Couturier</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onChange={setRange} />
          </div>
        </div>

        <DashboardTabs tabs={TABS} active={tab} onChange={handleTabChange} />

        {/* ── Vue d'ensemble ──────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Demandes ouvertes", value: data?.stats.nb_demandes_ouvertes ?? 0,  icon: <Scissors size={18} className="text-tf-gold" /> },
                { label: "En cours",          value: data?.stats.nb_commandes_en_cours ?? 0, icon: <Clock size={18} className="text-tf-info" /> },
                { label: formatRangeLabel(range), value: formatPrix(data?.stats.revenu_mois ?? 0), icon: <TrendingUp size={18} className="text-tf-success" /> },
                { label: "Note moyenne",      value: `${data?.stats.score_moyen ?? 0}/5`,      icon: <Star size={18} className="text-tf-gold" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white rounded-xl border border-tf-border p-4">
                  <div className="flex items-center gap-2 mb-2">{icon}
                    <p className="font-sans text-[12px] text-tf-text-muted">{label}</p>
                  </div>
                  <p className="font-mono text-[20px] font-bold tabular-nums text-tf-black">{value}</p>
                </div>
              ))}
            </div>

            {data?.evolution_mensuelle && <EvolutionCharts data={data.evolution_mensuelle} />}

            {/* Revenu + taux + scores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-xl border border-tf-border p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-sans text-[14px] font-bold text-tf-text mb-1">Revenu total</h2>
                    <p className="font-mono text-[28px] font-bold tabular-nums text-tf-black">
                      {formatPrix(data?.stats.revenu_total ?? 0)}
                    </p>
                    <p className="font-sans text-[12px] text-tf-text-muted mt-1">
                      {data?.stats.nb_commandes_terminees} commandes terminées
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-[12px] text-tf-text-muted">Taux d&apos;acceptation</p>
                    <p className="font-mono text-[24px] font-bold tabular-nums text-tf-success">
                      {data?.stats.taux_acceptation ?? 0}%
                    </p>
                    <p className="font-sans text-[11px] text-tf-text-muted">{data?.stats.nb_devis_envoyes} devis envoyés</p>
                  </div>
                </div>
                {/* Barre taux acceptation */}
                <ProgressBar value={data?.stats.taux_acceptation ?? 0} color="var(--tf-success)" trackClassName="w-full h-1.5 mt-1.5" />
              </div>

              <div className="bg-white rounded-xl border border-tf-border p-5">
                <h2 className="font-sans text-[14px] font-bold text-tf-text mb-3">Accès rapides</h2>
                <div className="space-y-2">
                  {[
                    { label: "Commandes actives", href: "/commandes" },
                    { label: "Messages clients",  href: "/messages" },
                    { label: "Paramètres",        href: "/dashboard/couturier?tab=parametres" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="block font-sans text-[13px] text-tf-gold hover:underline">
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Demandes + commandes en cours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
                <div className="px-5 py-4 border-b border-tf-border">
                  <h2 className="font-sans text-[14px] font-bold text-tf-text">Demandes sur mesure</h2>
                  <p className="font-sans text-[12px] text-tf-text-muted">Clients cherchant un couturier</p>
                </div>
                {!data?.demandes_recentes.length ? (
                  <p className="p-5 font-sans text-[13px] text-tf-text-muted">Aucune demande ouverte</p>
                ) : (
                  <div className="divide-y divide-tf-border">
                    {data.demandes_recentes.map((d) => (
                      <div key={d.id} className="px-5 py-3">
                        <p className="font-sans text-[13px] font-medium text-tf-text mb-1 line-clamp-2">{d.description}</p>
                        <div className="flex items-center justify-between">
                          <p className="font-sans text-[11px] text-tf-text-muted">
                            {d.nb_devis} devis · {new Date(d.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          <button className="flex items-center gap-1 text-[12px] font-semibold text-tf-gold hover:underline">
                            <Send size={12} /> Envoyer un devis
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
                <div className="px-5 py-4 border-b border-tf-border">
                  <h2 className="font-sans text-[14px] font-bold text-tf-text">Commandes en cours</h2>
                </div>
                {!data?.commandes_en_cours.length ? (
                  <p className="p-5 font-sans text-[13px] text-tf-text-muted">Aucune commande en cours</p>
                ) : (
                  <div className="divide-y divide-tf-border">
                    {data.commandes_en_cours.map((order) => (
                      <Link key={order.id} href={`/commandes/${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-tf-bg transition-colors">
                        <div>
                          <p className="font-sans text-[13px] font-medium text-tf-text">{order.reference}</p>
                          <span className={`font-sans text-[10px] px-1.5 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
                            {STATUT_LABELS[order.statut]}
                          </span>
                        </div>
                        <span className="font-mono text-[13px] font-bold tabular-nums text-tf-black">{formatPrix(order.montant)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Catalogue ────────────────────────────────────────────────── */}
        {tab === "catalogue" && data?.shop_id && (
          <CatalogueStockTab shopId={data.shop_id} role="couturier" />
        )}

        {/* ── Clients ──────────────────────────────────────────────────── */}
        {tab === "clients" && <CouturierClientsTab />}

        {/* ── Analytique ───────────────────────────────────────────────── */}
        {tab === "analytique" && (
          <div className="space-y-4">
            {/* Scores détaillés */}
            <div className="bg-white rounded-xl border border-tf-border p-5">
              <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Mes scores de réputation</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Délais",        score: data?.stats.score_moyen ?? 0, color: "var(--tf-gold)" },
                  { label: "Qualité",       score: data?.stats.score_moyen ?? 0, color: "var(--tf-success)" },
                  { label: "Communication", score: data?.stats.score_moyen ?? 0, color: "var(--tf-info)" },
                ].map(({ label, score, color }) => (
                  <div key={label} className="text-center">
                    <p className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wide mb-2">{label}</p>
                    <p className="font-mono text-[32px] font-bold tabular-nums" style={{ color }}>{score.toFixed(1)}</p>
                    <p className="font-sans text-[11px] text-tf-text-muted">/ 5</p>
                    <ProgressBar value={(score / 5) * 100} color={color} trackClassName="w-full h-1.5 mt-1.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tendances */}
            <div className="bg-white rounded-xl border border-tf-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans text-[14px] font-bold text-tf-text">Tendances du marché</h3>
                <span className="text-[10px] px-2 py-0.5 bg-tf-gold/[0.12] text-tf-gold-dark rounded-full font-bold">IA · Phase 2</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Boubou brodé", recherches: 127, delta: "+18%", color: "var(--tf-success)" },
                  { label: "Wax cérémonie", recherches: 94, delta: "+32%", color: "var(--tf-gold)" },
                  { label: "Robe mariage", recherches: 73, delta: "+8%",  color: "var(--tf-info)" },
                ].map((t) => (
                  <div key={t.label}>
                    <div className="flex justify-between mb-1">
                      <span className="font-sans text-[13px] text-tf-text">{t.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold tabular-nums" style={{ color: t.color }}>{t.delta}</span>
                        <span className="font-sans text-[11px] text-tf-text-muted">{t.recherches} recherches</span>
                      </div>
                    </div>
                    <ProgressBar value={(t.recherches / 150) * 100} color={t.color} trackClassName="w-full h-1.5 mt-1.5" />
                  </div>
                ))}
              </div>
              <p className="font-sans text-[11px] text-tf-text-muted mt-3">
                Données basées sur les recherches des clients sur la plateforme cette semaine.
              </p>
            </div>

            {/* Performance catalogue */}
            <div className="bg-white rounded-xl border border-tf-border p-5">
              <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Performance catalogue</h3>
              <div className="divide-y divide-tf-border">
                {data?.commandes_en_cours.slice(0, 3).map((order) => (
                  <div key={order.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-sans text-[13px] font-medium text-tf-text">{order.reference}</p>
                      <p className="font-sans text-[11px] text-tf-text-muted">{order.statut}</p>
                    </div>
                    <span className="font-mono text-[13px] font-bold tabular-nums text-tf-black">{formatPrix(order.montant)}</span>
                  </div>
                ))}
                {!data?.commandes_en_cours.length && (
                  <p className="py-4 font-sans text-[13px] text-tf-text-muted text-center">
                    Les statistiques de performance apparaîtront avec les premières commandes.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Paramètres ───────────────────────────────────────────────── */}
        {tab === "parametres" && data?.shop_id && (
          <ParametresTab shopId={data.shop_id} role="couturier" />
        )}
    </div>
  )
}

export default function DashboardCouturierPage() {
  return (
    <Suspense fallback={null}>
      <DashboardCouturierContent />
    </Suspense>
  )
}
