"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"
import type { OrderAdmin } from "../_components/types"

export default function LitigesPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<OrderAdmin | null>(null)
  const [note, setNote] = useState("")

  const { data: disputes, isLoading } = useQuery<OrderAdmin[]>({
    queryKey: ["admin-disputes"],
    queryFn:  async () => (await api.get("/admin/disputes")).data,
    refetchInterval: 60_000,
  })

  const resolve = useMutation({
    mutationFn: ({ id, verdict }: { id: number; verdict: string }) =>
      api.patch(`/admin/disputes/${id}/resolve`, { verdict, note_admin: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-disputes"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
      setSelected(null)
      setNote("")
    },
  })

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border" />)}</div>
      ) : !disputes?.length ? (
        <div className="bg-white rounded-xl border border-tf-border p-12 text-center">
          <CheckCircle size={40} className="text-tf-success mx-auto mb-3" />
          <p className="font-sans text-[15px] font-bold text-tf-text mb-1">Aucun litige ouvert 🎉</p>
          <p className="font-sans text-[13px] text-tf-text-muted">La plateforme fonctionne sans accroc.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-tf-border flex items-center gap-2">
            <AlertTriangle size={15} className="text-tf-error" />
            <span className="font-sans text-[14px] font-bold text-tf-text">{disputes.length} litige{disputes.length > 1 ? "s" : ""} en cours</span>
          </div>
          <div className="divide-y divide-tf-border">
            {disputes.map(d => (
              <div key={d.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[13px] font-semibold text-tf-text">{d.reference}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    Client : <strong>{d.client_nom}</strong> · Boutique : <strong>{d.shop_nom}</strong>
                  </p>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    Ouvert le {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono text-[16px] font-bold tabular-nums text-tf-black">{formatPrix(d.montant)}</p>
                  <p className="font-sans text-[10px] text-tf-text-muted">Escrow : {d.escrow_statut}</p>
                </div>
                <button
                  onClick={() => setSelected(d)}
                  className="px-3 py-2 bg-tf-black text-white rounded-lg font-sans font-bold text-[12px] hover:bg-tf-charbon transition-colors shrink-0"
                >
                  Arbitrer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal arbitrage */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-sans text-[16px] font-bold text-tf-text">Arbitrage — {selected.reference}</h3>
            <div className="bg-tf-gray-soft rounded-lg p-3 space-y-1">
              <p className="font-sans text-[12px] text-tf-text">Client : <strong>{selected.client_nom}</strong></p>
              <p className="font-sans text-[12px] text-tf-text">Boutique : <strong>{selected.shop_nom}</strong></p>
              <p className="font-sans text-[12px] text-tf-text">Montant en jeu : <strong>{formatPrix(selected.montant)}</strong></p>
            </div>
            <div className="space-y-2">
              {[
                { verdict: "rembourser_client", label: "Rembourser le client",  sub: "100% retourné au client",               color: "border-tf-error hover:bg-tf-error-bg",                          text: "text-tf-error" },
                { verdict: "payer_vendeur",      label: "Payer le vendeur",      sub: "100% libéré au vendeur",                color: "border-tf-success hover:bg-tf-success-bg",                      text: "text-tf-success" },
                { verdict: "partager",           label: "Partage 50/50",         sub: "Remboursement partiel des deux côtés",  color: "border-tf-gold hover:bg-[rgba(201,168,76,0.06)]",               text: "text-tf-gold-dark" },
              ].map(v => (
                <button
                  key={v.verdict}
                  onClick={() => resolve.mutate({ id: selected.id, verdict: v.verdict })}
                  disabled={resolve.isPending}
                  className={`w-full text-left p-3.5 border rounded-xl transition-colors ${v.color}`}
                >
                  <p className={`font-sans text-[13px] font-bold ${v.text}`}>{v.label}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted mt-0.5">{v.sub}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Note admin (optionnel)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Justification de la décision..."
                rows={2}
                className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold resize-none"
              />
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-2.5 border border-tf-border rounded-lg font-sans text-[13px] font-semibold text-tf-text hover:bg-tf-gray-soft transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
