"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { api } from "@/lib/api"
import { Order, OrderListResponse, STATUT_LABELS, STATUT_COLORS } from "@/types/order"
import { formatPrix } from "@/lib/utils"

export function ClientCommandesTab() {
  const { data, isLoading } = useQuery<OrderListResponse>({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders?limit=50")).data,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-tf-border" />
        ))}
      </div>
    )
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Package size={56} className="text-tf-border mb-4" />
        <p className="font-sans text-[16px] font-semibold text-tf-text mb-2">Aucune commande</p>
        <p className="font-sans text-[13px] text-tf-text-muted mb-6">
          Tes commandes apparaîtront ici après ton premier achat
        </p>
        <Link href="/shopping" className="btn-gold">
          Aller en shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.items.map((order: Order) => (
        <Link
          key={order.id}
          href={`/commandes/${order.id}`}
          className="block bg-white rounded-xl border border-tf-border p-4 hover:border-[rgba(201,168,76,0.4)] hover:shadow-card transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-sans text-[13px] font-bold text-tf-text">{order.reference}</span>
                <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
                  {STATUT_LABELS[order.statut]}
                </span>
              </div>
              <p className="font-sans text-[12px] text-tf-text-muted">
                {order.items.length} article{order.items.length > 1 ? "s" : ""} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p className="font-sans text-[12px] text-tf-text-muted truncate mt-0.5">
                {order.items.map((i) => i.titre).join(", ")}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-mono text-[15px] font-bold text-tf-black">{formatPrix(order.montant)}</span>
              <ChevronRight size={16} className="text-tf-text-muted" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
