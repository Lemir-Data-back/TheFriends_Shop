"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Users, TrendingUp, Clock, AlertTriangle, Sparkles, ArrowRight, Ruler } from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"

interface ClientCouturier {
  client_id: number
  nom: string
  nb_commandes: number
  ca_total: number
  score_confiance: number
  statut: "premium" | "fiable" | "standard" | "surveille"
  derniere_commande: string
  mensurations: {
    poitrine?: number
    taille?: number
    hanches?: number
    pointure?: number
  } | null
}

interface CouturierClientsData {
  top_clients: ClientCouturier[]
  clients_inactifs: ClientCouturier[]
  clients_en_attente: ClientCouturier[]
  total_clients: number
}

const STATUT_BADGE: Record<string, string> = {
  premium:   "bg-tf-gold/[0.15] text-tf-gold-dark",
  fiable:    "bg-tf-success-bg text-tf-success",
  standard:  "bg-tf-gray-soft text-tf-text-muted",
  surveille: "bg-tf-error-bg text-tf-error",
}
const STATUT_LABELS: Record<string, string> = {
  premium: "Premium", fiable: "Fiable", standard: "Standard", surveille: "Surveillé",
}

export function CouturierClientsTab() {
  const [view, setView] = useState<"classement" | "inactifs" | "attente">("classement")

  const { data, isLoading } = useQuery<CouturierClientsData>({
    queryKey: ["couturier-clients"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/couturier/clients")
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-tf-border" />)}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Users size={36} className="text-tf-border mx-auto mb-3" />
        <p className="font-sans text-[14px] font-medium text-tf-text">Pas encore de clients</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clients total",        value: data.total_clients,              icon: <Users size={16} className="text-tf-gold" /> },
          { label: "Commandes en attente", value: data.clients_en_attente.length,  icon: <Clock size={16} className="text-tf-warning" />, warn: data.clients_en_attente.some(c => c.statut === "surveille") },
          { label: "Inactifs 60j+",        value: data.clients_inactifs.length,    icon: <TrendingUp size={16} className="text-tf-text-muted" /> },
          { label: "Clients réguliers",    value: data.top_clients.filter(c => c.nb_commandes >= 2).length, icon: <TrendingUp size={16} className="text-tf-success" /> },
        ].map(({ label, value, icon, warn }) => (
          <div key={label} className={`bg-white rounded-xl border p-4 ${warn ? "border-tf-error/40" : "border-tf-border"}`}>
            <div className="flex items-center gap-1.5 mb-1.5">{icon}
              <span className="font-sans text-[11px] text-tf-text-muted">{label}</span>
            </div>
            <p className="font-mono text-[20px] font-bold tabular-nums text-tf-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Table principale */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div role="tablist" className="flex border-b border-tf-border overflow-x-auto">
          {[
            { id: "classement", label: "🏆 Classement" },
            { id: "attente",    label: `⚠️ En attente (${data.clients_en_attente.length})` },
            { id: "inactifs",   label: `⏰ Inactifs (${data.clients_inactifs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={view === t.id}
              onClick={() => setView(t.id as typeof view)}
              className={`px-5 py-3.5 font-sans text-[13px] font-semibold whitespace-nowrap border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                view === t.id ? "border-tf-black text-tf-black" : "border-transparent text-tf-text-muted hover:text-tf-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Classement */}
        {view === "classement" && (
          <div className="divide-y divide-tf-border">
            {!data.top_clients.length ? (
              <p className="p-5 text-center font-sans text-[13px] text-tf-text-muted">Aucun client pour le moment</p>
            ) : data.top_clients.map((c, i) => (
              <div key={c.client_id} className="px-5 py-4 flex items-center gap-3">
                <span className="font-sans text-[13px] font-bold text-tf-text-muted w-5 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{c.nom}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${STATUT_BADGE[c.statut]}`}>
                      {STATUT_LABELS[c.statut]}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-tf-text-muted">{c.nb_commandes} commande(s)</p>
                </div>
                {/* Mensurations si disponibles */}
                {c.mensurations && (
                  <div className="hidden md:flex items-center gap-1 px-2 py-1 bg-tf-gray-soft rounded-lg">
                    <Ruler size={11} className="text-tf-text-muted" />
                    <span className="font-sans text-[10px] text-tf-text-muted">
                      {c.mensurations.poitrine && `P${c.mensurations.poitrine}`}
                      {c.mensurations.taille   && ` T${c.mensurations.taille}`}
                      {c.mensurations.hanches  && ` H${c.mensurations.hanches}`}
                    </span>
                  </div>
                )}
                <p className="font-mono text-[13px] font-bold tabular-nums text-tf-black shrink-0">{formatPrix(c.ca_total)}</p>
              </div>
            ))}
          </div>
        )}

        {/* En attente — vérification score avant acceptation */}
        {view === "attente" && (
          <div className="divide-y divide-tf-border">
            {!data.clients_en_attente.length ? (
              <p className="p-5 text-center font-sans text-[13px] text-tf-text-muted">Aucune commande en attente</p>
            ) : data.clients_en_attente.map((c) => (
              <div key={c.client_id} className="px-5 py-4 flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-sans text-[13px] font-semibold text-tf-text">{c.nom}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_BADGE[c.statut]}`}>
                      {STATUT_LABELS[c.statut]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px] text-tf-text-muted">
                    <span>Score : <strong className={c.score_confiance < 2.5 ? "text-tf-error" : "text-tf-success"}>{c.score_confiance}/5</strong></span>
                    <span>{c.nb_commandes} commande(s) passée(s)</span>
                  </div>
                  {c.mensurations && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-tf-text-muted">
                      <Ruler size={11} />
                      Mensurations enregistrées :
                      {c.mensurations.poitrine && <span> Poitrine {c.mensurations.poitrine}cm</span>}
                      {c.mensurations.taille   && <span> · Taille {c.mensurations.taille}cm</span>}
                      {c.mensurations.hanches  && <span> · Hanches {c.mensurations.hanches}cm</span>}
                    </div>
                  )}
                  {c.statut === "surveille" && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-tf-error">
                      <AlertTriangle size={11} />
                      Client surveillé — historique d&apos;annulations ou comportement signalé
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inactifs */}
        {view === "inactifs" && (
          <div className="divide-y divide-tf-border">
            {!data.clients_inactifs.length ? (
              <div className="p-8 text-center">
                <p className="font-sans text-[14px] font-medium text-tf-success">Aucun client inactif 🎉</p>
              </div>
            ) : data.clients_inactifs.map((c) => {
              const jours = Math.floor(
                (Date.now() - new Date(c.derniere_commande).getTime()) / (1000 * 60 * 60 * 24)
              )
              return (
                <div key={c.client_id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-sans text-[13px] font-semibold text-tf-text">{c.nom}</p>
                    <p className="font-sans text-[11px] text-tf-text-muted">
                      {c.nb_commandes} commande(s) · dernière il y a <span className="font-semibold text-tf-warning">{jours} jours</span>
                    </p>
                  </div>
                  <Link
                    href={`/messages?client=${c.client_id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[11px] hover:bg-tf-gold-light transition-colors"
                  >
                    Relancer <ArrowRight size={11} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Suggestions ciblées */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="px-5 py-4 border-b border-tf-border flex items-center gap-2">
          <Sparkles size={15} className="text-tf-gold" />
          <h3 className="font-sans text-[14px] font-bold text-tf-text">Clients cherchant des créations précises</h3>
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-tf-gold/[0.12] text-tf-gold-dark rounded-full font-bold">IA</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { client: "Nadia S.", recherche: "robe wax bicolore cérémonie", match: true },
            { client: "Adjoua K.", recherche: "boubou brodé homme grande taille", match: false },
          ].map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-3 bg-tf-gold/[0.04] border border-tf-gold/20 rounded-lg">
              <div>
                <p className="font-sans text-[13px] font-semibold text-tf-text">
                  <span className="text-tf-gold">{s.client}</span> cherche : <span className="italic">&ldquo;{s.recherche}&rdquo;</span>
                </p>
                {s.match
                  ? <p className="font-sans text-[12px] text-tf-success mt-0.5">✓ Tu as un modèle correspondant dans ton catalogue</p>
                  : <p className="font-sans text-[12px] text-tf-text-muted mt-0.5">Aucune correspondance — opportunité de nouvelle création</p>
                }
              </div>
              <Link
                href="/messages"
                className="shrink-0 px-3 py-1.5 bg-tf-black text-white rounded-md font-sans font-bold text-[11px] hover:bg-tf-charbon transition-colors"
              >
                Contacter
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
