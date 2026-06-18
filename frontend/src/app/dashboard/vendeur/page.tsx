"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Package, ShoppingBag, TrendingUp, Star, Plus,
  LayoutDashboard, Users, Palette, CreditCard,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { formatPrix } from "@/lib/utils"
import { STATUT_LABELS, STATUT_COLORS, Order } from "@/types/order"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { VendeurClientsTab } from "@/components/dashboard/vendeur/ClientsTab"
import { VendeurThemeTab } from "@/components/dashboard/vendeur/ThemeTab"
import { DateRangePicker, DateRange, defaultRange, formatRangeLabel } from "@/components/dashboard/DateRangePicker"

interface VendeurDashboard {
  stats: {
    nb_commandes_total: number
    nb_commandes_en_attente: number
    nb_commandes_en_cours: number
    nb_produits_actifs: number
    revenu_total: number
    revenu_mois: number
    score_moyen: number
    nb_avis: number
  }
  commandes_recentes: Order[]
  produits_populaires: { id: number; titre: string; nb_commandes: number; prix: number }[]
  shop_id?: number
}

export default function DashboardVendeurPage() {
  const { user } = useAuthStore()
  const [tab, setTab]       = useState("overview")
  const [range, setRange] = useState<DateRange>(defaultRange)

  const { data, isLoading } = useQuery<VendeurDashboard>({
    queryKey: ["dashboard-vendeur", range],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/vendeur?date_debut=${range.debut}&date_fin=${range.fin}`)
      return data
    },
  })

  const TABS = [
    { id: "overview",  label: "Vue d'ensemble", icon: <LayoutDashboard size={14} /> },
    { id: "clients",   label: "Clients",         icon: <Users size={14} />, badge: data?.stats.nb_commandes_en_attente },
    { id: "theme",     label: "Thème boutique",  icon: <Palette size={14} /> },
    { id: "plans",     label: "Plans de paiement", icon: <CreditCard size={14} /> },
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
            <h1 className="font-serif text-h1 text-tf-black">Ma boutique</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateRangePicker value={range} onChange={setRange} />
            <Link
              href="/boutique/ajouter-produit"
              className="flex items-center gap-2 px-4 py-2.5 bg-tf-gold text-tf-black rounded-md font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
            >
              <Plus size={15} /> Ajouter un produit
            </Link>
          </div>
        </div>

        <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

        {/* ── Vue d'ensemble ──────────────────────────────────────────── */}
        {tab === "overview" && (
          <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Commandes total",  value: data?.stats.nb_commandes_total ?? 0,       icon: <ShoppingBag size={18} className="text-tf-gold" /> },
                { label: "En attente",       value: data?.stats.nb_commandes_en_attente ?? 0,  icon: <Package size={18} className="text-orange-500" /> },
                { label: formatRangeLabel(range), value: formatPrix(data?.stats.revenu_mois ?? 0), icon: <TrendingUp size={18} className="text-green-500" /> },
                { label: "Note moyenne",     value: `${data?.stats.score_moyen ?? 0}/5`,        icon: <Star size={18} className="text-tf-gold" /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="bg-white rounded-xl border border-tf-border p-4">
                  <div className="flex items-center gap-2 mb-2">{icon}
                    <p className="font-sans text-[12px] text-tf-text-muted">{label}</p>
                  </div>
                  <p className="font-sans text-[20px] font-bold tabular-nums text-tf-black">{value}</p>
                </div>
              ))}
            </div>

            {/* Revenu total + raccourcis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-xl border border-tf-border p-5">
                <h2 className="font-sans text-[14px] font-bold text-tf-text mb-1">Revenu total</h2>
                <p className="font-serif text-[28px] font-bold tabular-nums text-tf-black">
                  {formatPrix(data?.stats.revenu_total ?? 0)}
                </p>
                <p className="font-sans text-[12px] text-tf-text-muted mt-1">
                  {data?.stats.nb_avis} avis · {data?.stats.nb_produits_actifs} produits actifs
                </p>
              </div>
              <div className="bg-white rounded-xl border border-tf-border p-5">
                <h2 className="font-sans text-[14px] font-bold text-tf-text mb-3">Accès rapides</h2>
                <div className="space-y-2">
                  {[
                    { label: "Commandes reçues", href: "/commandes" },
                    { label: "Messages clients",  href: "/messages" },
                    { label: "Ma boutique",       href: "/profil" },
                  ].map(({ label, href }) => (
                    <Link key={href} href={href} className="block font-sans text-[13px] text-tf-gold hover:underline">
                      {label} →
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Commandes récentes + produits populaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-tf-border">
                  <h2 className="font-sans text-[14px] font-bold text-tf-text">Commandes récentes</h2>
                  <Link href="/commandes" className="font-sans text-[12px] text-tf-gold hover:underline">Voir tout</Link>
                </div>
                {!data?.commandes_recentes.length ? (
                  <p className="p-5 font-sans text-[13px] text-tf-text-muted">Aucune commande</p>
                ) : (
                  <div className="divide-y divide-tf-border">
                    {data.commandes_recentes.slice(0, 5).map((order) => (
                      <Link key={order.id} href={`/commandes/${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-tf-bg transition-colors">
                        <div>
                          <p className="font-sans text-[13px] font-medium text-tf-text">{order.reference}</p>
                          <span className={`font-sans text-[10px] px-1.5 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
                            {STATUT_LABELS[order.statut]}
                          </span>
                        </div>
                        <span className="font-sans text-[13px] font-bold tabular-nums text-tf-black">{formatPrix(order.montant)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
                <div className="px-5 py-4 border-b border-tf-border">
                  <h2 className="font-sans text-[14px] font-bold text-tf-text">Produits populaires</h2>
                </div>
                {!data?.produits_populaires.length ? (
                  <div className="p-5 text-center">
                    <p className="font-sans text-[13px] text-tf-text-muted mb-3">Aucun produit</p>
                    <Link href="/boutique/ajouter-produit" className="font-sans text-[13px] text-tf-gold hover:underline">
                      Ajouter votre premier produit →
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-tf-border">
                    {data.produits_populaires.map((p, i) => (
                      <Link key={p.id} href={`/produits/${p.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-tf-bg transition-colors">
                        <span className="font-sans text-[12px] font-bold text-tf-text-muted w-4">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[13px] font-medium text-tf-text truncate">{p.titre}</p>
                          <p className="font-sans text-[11px] text-tf-text-muted">{p.nb_commandes} commandes</p>
                        </div>
                        <span className="font-sans text-[13px] font-bold tabular-nums text-tf-black">{formatPrix(p.prix)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Clients ──────────────────────────────────────────────────── */}
        {tab === "clients" && <VendeurClientsTab />}

        {/* ── Thème boutique ───────────────────────────────────────────── */}
        {tab === "theme" && data?.shop_id && (
          <VendeurThemeTab shopId={data.shop_id} />
        )}

        {/* ── Plans de paiement ────────────────────────────────────────── */}
        {tab === "plans" && (
          <div className="bg-white rounded-xl border border-tf-border p-8 text-center">
            <CreditCard size={36} className="text-tf-border mx-auto mb-3" />
            <p className="font-sans text-[14px] font-bold text-tf-text mb-1">Plans de paiement en tranches</p>
            <p className="font-sans text-[13px] text-tf-text-muted max-w-md mx-auto mb-4">
              Active le module "Paiement en tranches" depuis le panneau admin pour configurer tes plans (2x, 3x, 6x) et permettre à tes clients de payer progressivement.
            </p>
            <p className="font-sans text-[12px] text-tf-text-muted">
              Une fois activé, les plans apparaîtront ici pour configuration.
            </p>
          </div>
        )}
    </div>
  )
}
