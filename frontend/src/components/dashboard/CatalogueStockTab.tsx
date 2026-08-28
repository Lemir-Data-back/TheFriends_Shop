"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Package, AlertTriangle, XCircle, Pencil } from "lucide-react"
import { api } from "@/lib/api"
import { formatPrix, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/Badge"
import type { Product } from "@/types/product"

interface CatalogueStockTabProps {
  shopId: number
  /** Change uniquement le libellé — même comportement pour vendeur et couturier. */
  role?: "vendeur" | "couturier"
}

async function fetchMyProducts(): Promise<{ total: number; items: Product[] }> {
  const { data } = await api.get("/products/mine")
  return data
}

function StockCell({ product }: { product: Product }) {
  if (product.stock_statut === "rupture") {
    return <Badge variant="rupture">Rupture</Badge>
  }
  if (product.stock_statut === "stock_faible") {
    return <Badge variant="stock-faible">Stock faible ({product.stock_total})</Badge>
  }
  if (product.stock_total != null) {
    return <span className="font-mono text-[12px] text-tf-text-muted">{product.stock_total} en stock</span>
  }
  return <span className="font-sans text-[12px] text-tf-text-muted">Non suivi</span>
}

export function CatalogueStockTab({ shopId, role = "vendeur" }: CatalogueStockTabProps) {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["products-mine", shopId],
    queryFn: fetchMyProducts,
  })

  const toggleActif = useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      api.patch(`/products/${id}`, { actif }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products-mine", shopId] }),
  })

  const items = data?.items ?? []
  const nbActifs = items.filter((p) => p.actif).length
  const nbRupture = items.filter((p) => p.stock_statut === "rupture").length
  const nbStockFaible = items.filter((p) => p.stock_statut === "stock_faible").length

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-h2 text-tf-black">
            {role === "couturier" ? "Catalogue" : "Stock et catalogue"}
          </h2>
          <p className="font-sans text-[13px] text-tf-text-muted">
            Gère tes articles, leurs prix, tailles, stock et seuils d&apos;alerte.
          </p>
        </div>
        <Link
          href="/boutique/ajouter-produit"
          className="flex items-center gap-2 px-4 py-2.5 bg-tf-gold text-tf-black rounded-md font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
        >
          <Plus size={15} /> {role === "couturier" ? "Ajouter un modèle" : "Ajouter un produit"}
        </Link>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Articles",     value: items.length, icon: <Package size={16} className="text-tf-gold" /> },
          { label: "Actifs",       value: nbActifs,      icon: <Package size={16} className="text-tf-success" /> },
          { label: "Stock faible", value: nbStockFaible, icon: <AlertTriangle size={16} className="text-tf-warning" /> },
          { label: "Rupture",      value: nbRupture,     icon: <XCircle size={16} className="text-tf-error" /> },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl border border-tf-border p-4">
            <div className="flex items-center gap-2 mb-1.5">{icon}</div>
            <p className="font-mono text-h3 font-bold text-tf-black">{value}</p>
            <p className="font-sans text-[12px] text-tf-text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-tf-border p-10 flex flex-col items-center text-center">
          <Package size={28} className="text-tf-text-muted mb-3" />
          <p className="font-sans text-[14px] font-semibold text-tf-text mb-1">
            {role === "couturier" ? "Aucun modèle pour le moment" : "Aucun article pour le moment"}
          </p>
          <p className="font-sans text-[13px] text-tf-text-muted mb-4">
            {role === "couturier"
              ? "Ajoute ton premier modèle pour qu'il apparaisse dans ton catalogue."
              : "Ajoute ton premier article pour qu'il apparaisse dans ta boutique."}
          </p>
          <Link href="/boutique/ajouter-produit" className="text-[13px] font-semibold text-tf-gold-dark hover:underline">
            {role === "couturier" ? "Ajouter un modèle →" : "Ajouter un produit →"}
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-tf-border divide-y divide-tf-border">
          {items.map((p) => {
            const cover = p.images[0]
            return (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <div className="relative w-12 h-14 shrink-0 rounded-md overflow-hidden bg-tf-gray-soft">
                  {cover ? (
                    <Image src={cover.url_cloudinary} alt={p.titre} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-tf-text-muted">
                      <Package size={16} />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn("font-sans text-[13px] font-medium truncate", !p.actif && "text-tf-text-muted")}>
                    {p.titre}
                  </p>
                  <p className="font-mono text-[12px] text-tf-text-muted">{formatPrix(p.prix_promo ?? p.prix)}</p>
                </div>

                <div className="hidden sm:block shrink-0">
                  <StockCell product={p} />
                </div>

                <button
                  type="button"
                  onClick={() => toggleActif.mutate({ id: p.id, actif: !p.actif })}
                  disabled={toggleActif.isPending}
                  aria-pressed={p.actif}
                  className={cn(
                    "shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors",
                    p.actif ? "bg-tf-success-bg text-tf-success" : "bg-tf-gray-soft text-tf-text-muted"
                  )}
                >
                  {p.actif ? "Actif" : "Inactif"}
                </button>

                <Link
                  href={`/boutique/produits/${p.id}/modifier`}
                  aria-label={`Modifier ${p.titre}`}
                  className="relative shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-tf-text-muted hover:text-tf-gold-dark hover:bg-tf-gray-soft transition-colors before:absolute before:-inset-1.5 before:content-['']"
                >
                  <Pencil size={14} />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
