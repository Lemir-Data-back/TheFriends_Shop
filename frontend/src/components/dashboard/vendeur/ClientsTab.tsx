"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Users, TrendingUp, Clock, AlertTriangle, Sparkles, ArrowRight } from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"

interface ClientSummary {
  client_id: number
  nom: string
  nb_commandes: number
  ca_total: number
  panier_moyen: number
  derniere_commande: string
  score_confiance: number
  statut: "premium" | "fiable" | "standard" | "surveille"
}

interface ClientsData {
  top_clients: ClientSummary[]
  clients_inactifs: ClientSummary[]
  total_clients: number
  total_fideles: number
}

const STATUT_BADGE: Record<string, string> = {
  premium:   "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark",
  fiable:    "bg-[#D8F3DC] text-[#2D6A4F]",
  standard:  "bg-tf-gray-soft text-tf-text-muted",
  surveille: "bg-[#FFCCCC] text-[#C0392B]",
}
const STATUT_LABELS: Record<string, string> = {
  premium: "Premium", fiable: "Fiable", standard: "Standard", surveille: "Surveillé",
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 4.5 ? "#C9A84C" : score >= 3.5 ? "#2D6A4F" : score >= 2.5 ? "#6B6760" : "#C0392B"
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-tf-gray-soft rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, backgroundColor: color }} />
      </div>
      <span className="font-sans text-[11px] font-bold tabular-nums" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <Users size={36} className="text-tf-border mx-auto mb-3" />
      <p className="font-sans text-[14px] font-medium text-tf-text mb-1">Pas encore de clients</p>
      <p className="font-sans text-[13px] text-tf-text-muted">Tes clients apparaîtront ici après leurs premières commandes.</p>
    </div>
  )
}

export function VendeurClientsTab() {
  const [view, setView] = useState<"classement" | "inactifs">("classement")

  const { data, isLoading } = useQuery<ClientsData>({
    queryKey: ["vendeur-clients"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/vendeur/clients")
      return data
    },
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-tf-border" />
        ))}
      </div>
    )
  }

  if (!data) return <EmptyState />

  return (
    <div className="space-y-6">
      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Clients total", value: data.total_clients, icon: <Users size={16} className="text-tf-gold" /> },
          { label: "Clients fidèles", value: data.total_fideles, icon: <TrendingUp size={16} className="text-[#2D6A4F]" /> },
          { label: "Inactifs 30j+", value: data.clients_inactifs.length, icon: <Clock size={16} className="text-[#B8892A]" /> },
          {
            label: "Panier moyen",
            value: formatPrix(
              data.top_clients.length
                ? Math.round(data.top_clients.reduce((s, c) => s + c.panier_moyen, 0) / data.top_clients.length)
                : 0
            ),
            icon: <TrendingUp size={16} className="text-tf-gold" />,
          },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-tf-border p-4">
            <div className="flex items-center gap-1.5 mb-1.5">{icon}
              <span className="font-sans text-[11px] text-tf-text-muted">{label}</span>
            </div>
            <p className="font-sans text-[20px] font-bold tabular-nums text-tf-black">{value}</p>
          </div>
        ))}
      </div>

      {/* Onglet interne */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="flex border-b border-tf-border">
          {[
            { id: "classement", label: "🏆 Classement" },
            { id: "inactifs",   label: `⏰ Inactifs (${data.clients_inactifs.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id as typeof view)}
              className={`px-5 py-3.5 font-sans text-[13px] font-semibold border-b-2 transition-colors ${
                view === t.id ? "border-tf-black text-tf-black" : "border-transparent text-tf-text-muted hover:text-tf-text"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {view === "classement" && (
          <div>
            {/* En-tête tableau */}
            <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-tf-bg border-b border-tf-border">
              <span className="col-span-1 font-sans text-[10px] font-bold text-tf-text-muted uppercase">#</span>
              <span className="col-span-3 font-sans text-[10px] font-bold text-tf-text-muted uppercase">Client</span>
              <span className="col-span-2 font-sans text-[10px] font-bold text-tf-text-muted uppercase text-right">Commandes</span>
              <span className="col-span-2 font-sans text-[10px] font-bold text-tf-text-muted uppercase text-right">CA total</span>
              <span className="col-span-2 font-sans text-[10px] font-bold text-tf-text-muted uppercase text-right">Panier moy.</span>
              <span className="col-span-2 font-sans text-[10px] font-bold text-tf-text-muted uppercase text-right">Score</span>
            </div>

            {!data.top_clients.length ? (
              <EmptyState />
            ) : (
              <div className="divide-y divide-tf-border">
                {data.top_clients.map((c, i) => (
                  <div key={c.client_id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-tf-bg transition-colors">
                    <span className="col-span-1 font-sans text-[12px] font-bold text-tf-text-muted">{i + 1}</span>
                    <div className="col-span-3">
                      <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{c.nom}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${STATUT_BADGE[c.statut]}`}>
                        {STATUT_LABELS[c.statut]}
                      </span>
                    </div>
                    <p className="col-span-2 font-sans text-[13px] font-bold tabular-nums text-tf-text text-right">{c.nb_commandes}</p>
                    <p className="col-span-2 font-sans text-[13px] font-bold tabular-nums text-tf-text text-right">{formatPrix(c.ca_total)}</p>
                    <p className="col-span-2 font-sans text-[12px] tabular-nums text-tf-text-muted text-right">{formatPrix(c.panier_moyen)}</p>
                    <div className="col-span-2 flex justify-end">
                      <ScoreBar score={c.score_confiance} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "inactifs" && (
          <div>
            {!data.clients_inactifs.length ? (
              <div className="p-8 text-center">
                <p className="font-sans text-[14px] font-medium text-[#2D6A4F]">Aucun client inactif 🎉</p>
                <p className="font-sans text-[13px] text-tf-text-muted mt-1">Tous tes clients ont commandé récemment.</p>
              </div>
            ) : (
              <div className="divide-y divide-tf-border">
                {data.clients_inactifs.map((c) => {
                  const jours = Math.floor(
                    (Date.now() - new Date(c.derniere_commande).getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={c.client_id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-sans text-[13px] font-semibold text-tf-text">{c.nom}</p>
                        <p className="font-sans text-[11px] text-tf-text-muted">
                          {c.nb_commandes} commande(s) · dernière il y a <span className="font-semibold text-[#B8892A]">{jours} jours</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-[12px] font-bold tabular-nums text-tf-text">{formatPrix(c.ca_total)}</span>
                        <Link
                          href={`/messages?client=${c.client_id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[11px] hover:bg-tf-gold-light transition-colors"
                        >
                          Relancer <ArrowRight size={11} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Suggestions ciblées */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="px-5 py-4 border-b border-tf-border flex items-center gap-2">
          <Sparkles size={16} className="text-tf-gold" />
          <h3 className="font-sans text-[14px] font-bold text-tf-text">Suggestions ciblées</h3>
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-[rgba(201,168,76,0.12)] text-tf-gold-dark rounded-full font-bold">IA</span>
        </div>
        <div className="p-5 space-y-3">
          {[
            { client: "Bamba A.", recherche: "jupe wax rouge taille L", match: "Jupe wax imprimé rouge — 8 500 FCFA" },
            { client: "Konan M.", recherche: "chemise oversize homme M", match: "Chemise oversize coton — 12 000 FCFA" },
          ].map((s, i) => (
            <div key={i} className="flex items-start justify-between gap-4 p-3 bg-[rgba(201,168,76,0.05)] border border-[rgba(201,168,76,0.2)] rounded-lg">
              <div>
                <p className="font-sans text-[13px] font-semibold text-tf-text">
                  <span className="text-tf-gold">{s.client}</span> cherche : <span className="italic">"{s.recherche}"</span>
                </p>
                <p className="font-sans text-[12px] text-[#2D6A4F] mt-0.5">✓ Correspondance dans ton stock : {s.match}</p>
              </div>
              <Link
                href="/messages"
                className="shrink-0 px-3 py-1.5 bg-tf-black text-white rounded-md font-sans font-bold text-[11px] hover:bg-tf-charbon transition-colors"
              >
                Proposer
              </Link>
            </div>
          ))}
          <p className="font-sans text-[11px] text-tf-text-muted text-center pt-1">
            Basé sur les recherches récentes des clients dans le catalogue
          </p>
        </div>
      </div>
    </div>
  )
}
