"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckCircle, XCircle, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react"
import { api } from "@/lib/api"
import { Badge, SearchBar } from "../_components/shared"
import type { ShopAdmin } from "../_components/types"

const TYPE_LABELS: Record<string, string> = { couturier: "Couturier", boutique: "Boutique", marque: "Marque" }

export default function BoutiquesPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "active">("pending")

  const params = new URLSearchParams()
  if (filter === "pending") params.set("is_validated", "false")
  if (filter === "active")  params.set("is_validated", "true")
  if (search) params.set("search", search)

  const { data: shops, isLoading } = useQuery<ShopAdmin[]>({
    queryKey: ["admin-shops", filter, search],
    queryFn:  async () => (await api.get(`/admin/shops?${params}`)).data,
  })

  const validateShop = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/shops/${id}/validate`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-shops"] }),
  })
  const suspendShop = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/shops/${id}/suspend`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-shops"] }),
  })
  const setBadgeFiable = useMutation({
    mutationFn: ({ id, certifie }: { id: number; certifie: boolean }) =>
      api.patch(`/admin/shops/${id}/badge-fiable`, { certifie }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["admin-shops"] }),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une boutique..." />
        </div>
        <div className="flex gap-1 bg-tf-gray-soft rounded-lg p-1">
          {[
            { id: "pending", label: "En attente" },
            { id: "active",  label: "Actives" },
            { id: "all",     label: "Toutes" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as typeof filter)}
              aria-pressed={filter === f.id}
              className={`px-4 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${filter === f.id ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 bg-tf-gray-soft rounded animate-pulse" />)}</div>
        ) : !shops?.length ? (
          <div className="p-8 text-center">
            <p className="font-sans text-[14px] font-medium text-tf-text mb-1">
              {filter === "pending" ? "Aucune boutique en attente de validation 🎉" : "Aucune boutique trouvée"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-tf-border">
            {shops.map(s => (
              <div key={s.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-tf-black flex items-center justify-center shrink-0">
                  <span className="font-serif text-[14px] text-tf-gold">{s.nom[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{s.nom}</p>
                    <Badge color="bg-tf-gray-soft text-tf-text-muted">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                    {!s.is_validated && <Badge color="bg-[#FFF3CD] text-[#B8892A]">En attente</Badge>}
                    {s.is_validated && !s.is_active && <Badge color="bg-tf-error-bg text-tf-error">Suspendue</Badge>}
                    {s.badges?.couturier_fiable && <Badge color="bg-[rgba(201,168,76,0.15)] text-tf-gold-dark">Fiable</Badge>}
                  </div>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    {s.owner_name} · {s.zone ?? "Zone inconnue"} · {s.nb_commandes} commandes · Score {s.score_moyen.toFixed(1)}/5
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!s.is_validated && (
                    <button
                      onClick={() => validateShop.mutate(s.id)}
                      disabled={validateShop.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-tf-success text-white rounded-lg font-sans font-bold text-[11px] hover:bg-[#25593f] transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={12} /> Valider
                    </button>
                  )}
                  {s.is_active && (
                    <button
                      onClick={() => suspendShop.mutate(s.id)}
                      disabled={suspendShop.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-tf-error text-tf-error rounded-lg font-sans font-bold text-[11px] hover:bg-tf-error-bg transition-colors disabled:opacity-50"
                    >
                      <XCircle size={12} /> Suspendre
                    </button>
                  )}
                  {!s.is_active && s.is_validated && (
                    <button
                      onClick={() => validateShop.mutate(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-tf-gold text-tf-black rounded-lg font-sans font-bold text-[11px] hover:bg-tf-gold-light transition-colors"
                    >
                      <RefreshCw size={12} /> Réactiver
                    </button>
                  )}
                  {s.type === "couturier" && (
                    s.badges?.couturier_fiable ? (
                      <button
                        onClick={() => setBadgeFiable.mutate({ id: s.id, certifie: false })}
                        disabled={setBadgeFiable.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-tf-border text-tf-text-muted rounded-lg font-sans font-bold text-[11px] hover:bg-tf-gray-soft transition-colors disabled:opacity-50"
                      >
                        <ShieldOff size={12} /> Révoquer fiable
                      </button>
                    ) : (
                      <button
                        onClick={() => setBadgeFiable.mutate({ id: s.id, certifie: true })}
                        disabled={setBadgeFiable.isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-tf-gold text-tf-gold-dark rounded-lg font-sans font-bold text-[11px] hover:bg-[rgba(201,168,76,0.1)] transition-colors disabled:opacity-50"
                      >
                        <ShieldCheck size={12} /> Certifier fiable
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
