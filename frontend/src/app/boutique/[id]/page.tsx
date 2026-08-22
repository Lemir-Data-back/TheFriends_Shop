"use client"

import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { MapPin, Star, Package, CheckCircle, MessageCircle } from "lucide-react"
import { api } from "@/lib/api"
import { ProductCard } from "@/components/product/ProductCard"
import { cn } from "@/lib/utils"
import { useThemeContext } from "@/features/shop-theming/ThemeProvider"
import type { Shop } from "@/types/shop"
import type { ProductListResponse } from "@/types/product"

const SHOP_TYPE_LABELS: Record<string, string> = {
  couturier: "Couturier",
  boutique: "Boutique",
  marque: "Marque",
}

// ── Barre de score ────────────────────────────────────────────────────────────

function ScoreBarItem({ label, score }: { label: string; score: number }) {
  const { theme } = useThemeContext()
  return (
    <div className="flex items-center gap-3 shrink-0">
      <span className="text-nav text-tf-text-muted">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={cn("w-5 h-1.5 rounded-full")}
            style={{
              backgroundColor: s <= Math.round(score)
                ? theme.couleur_principale
                : "#E8E4DC",
            }}
          />
        ))}
      </div>
      <span className="font-mono text-nav font-bold tabular-nums text-tf-text">{score.toFixed(1)}</span>
    </div>
  )
}

// ── Contenu principal ─────────────────────────────────────────────────────────

function BoutiqueContent({ shopId }: { shopId: string }) {
  const { theme } = useThemeContext()

  const { data: shop, isLoading: shopLoading } = useQuery<Shop>({
    queryKey: ["shop", shopId],
    queryFn: async () => {
      const { data } = await api.get(`/shops/${shopId}`)
      return data
    },
  })

  const { data: products, isLoading: productsLoading } = useQuery<ProductListResponse>({
    queryKey: ["shop-products", shopId],
    queryFn: async () => {
      const { data } = await api.get(`/products?shop_id=${shopId}&limit=40`)
      return data
    },
    enabled: !!shop,
  })

  if (shopLoading) {
    return (
      <div>
        <div className="h-48 animate-pulse" style={{ backgroundColor: theme.couleur_secondaire }} />
        <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-4">
          <div className="h-8 w-48 rounded bg-tf-gray-soft animate-pulse" />
          <div className="h-4 w-96 rounded bg-tf-gray-soft animate-pulse" />
        </div>
      </div>
    )
  }

  if (!shop) return null

  const scoreGlobal = ((shop.score_delais + shop.score_qualite + (shop.score_communication ?? 0)) / 3).toFixed(1)
  const isCouturierFiable = shop.badges?.couturier_fiable
  const gridClass = theme.layout_config?.grid_style === "3col"
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3"
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"

  return (
    <div>
      {/* Hero boutique */}
      <div style={{ backgroundColor: theme.couleur_secondaire }} className="relative overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border"
              style={{ borderColor: `${theme.couleur_principale}33`, backgroundColor: `${theme.couleur_principale}15` }}
            >
              {shop.photo_url ? (
                <Image src={shop.photo_url} alt={shop.nom} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-h1"
                    style={{ fontFamily: `'${theme.police_titres}', Georgia, serif`, color: theme.couleur_principale }}
                  >
                    {shop.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1
                  className="text-h1"
                  style={{ fontFamily: `'${theme.police_titres}', Georgia, serif`, color: theme.couleur_principale }}
                >
                  {shop.nom}
                </h1>
                {isCouturierFiable && <CheckCircle size={18} style={{ color: theme.couleur_principale }} className="shrink-0" />}
              </div>

              <p className="text-nav mb-3" style={{ color: `${theme.couleur_principale}80` }}>
                {SHOP_TYPE_LABELS[shop.type] ?? shop.type}
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Star size={13} style={{ fill: theme.couleur_principale, color: theme.couleur_principale }} />
                  <span className="text-nav font-bold" style={{ color: theme.couleur_principale }}>{scoreGlobal}</span>
                  <span className="text-micro" style={{ color: `${theme.couleur_principale}60` }}>({shop.nb_avis} avis)</span>
                </div>
                {shop.zone && (
                  <div className="flex items-center gap-1 text-nav" style={{ color: `${theme.couleur_principale}70` }}>
                    <MapPin size={12} />{shop.zone}
                  </div>
                )}
                <div className="flex items-center gap-1 text-nav" style={{ color: `${theme.couleur_principale}70` }}>
                  <Package size={12} />
                  {products?.total ?? 0} articles
                </div>
              </div>
            </div>

            {/* Bouton message */}
            <Link
              href={`/messages?shop=${shopId}`}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg font-sans font-bold text-[13px] transition-opacity hover:opacity-90"
              style={{
                backgroundColor: theme.couleur_principale,
                color: theme.couleur_secondaire,
              }}
            >
              <MessageCircle size={15} />
              Contacter
            </Link>
          </div>

          {/* Slogan / Description */}
          {(theme.slogan || shop.description) && (
            <p
              className="mt-4 text-body max-w-2xl leading-relaxed"
              style={{
                color: `${theme.couleur_principale}80`,
                fontFamily: `'${theme.police_corps}', Inter, sans-serif`,
              }}
            >
              {theme.slogan || shop.description}
            </p>
          )}

          {/* Spécialités */}
          {shop.specialites && shop.specialites.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {shop.specialites.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-1 rounded-sm text-nav text-label uppercase tracking-widest"
                  style={{
                    backgroundColor: `${theme.couleur_principale}15`,
                    color: theme.couleur_principale,
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Badge couturier fiable */}
          {isCouturierFiable && (
            <div
              className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border"
              style={{ borderColor: `${theme.couleur_principale}40`, backgroundColor: `${theme.couleur_principale}10` }}
            >
              <CheckCircle size={13} style={{ color: theme.couleur_principale }} />
              <span className="text-nav font-medium" style={{ color: theme.couleur_principale }}>
                Couturier Fiable
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Barre de scores */}
      <div className="bg-white border-b border-tf-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-6 overflow-x-auto">
            <ScoreBarItem label="Délais"        score={shop.score_delais} />
            <ScoreBarItem label="Qualité"       score={shop.score_qualite} />
            {shop.score_communication !== undefined && shop.score_communication > 0 && (
              <ScoreBarItem label="Communication" score={shop.score_communication} />
            )}
          </div>
        </div>
      </div>

      {/* À propos */}
      {(theme.a_propos || theme.message_accueil) && (
        <div className="border-b border-tf-border" style={{ backgroundColor: `${theme.couleur_fond}` }}>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-5">
            <p
              className="text-body leading-relaxed max-w-3xl"
              style={{
                color: `${theme.couleur_texte}CC`,
                fontFamily: `'${theme.police_corps}', Inter, sans-serif`,
              }}
            >
              {theme.a_propos || theme.message_accueil}
            </p>
          </div>
        </div>
      )}

      {/* Catalogue */}
      <div
        id="catalogue"
        className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 scroll-mt-24"
        style={{ backgroundColor: theme.couleur_fond }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-h2"
            style={{
              fontFamily: `'${theme.police_titres}', Georgia, serif`,
              color: theme.couleur_texte,
            }}
          >
            Articles
          </h2>
          <p className="text-nav text-tf-text-muted">
            {products?.total ?? 0} article{(products?.total ?? 0) > 1 ? "s" : ""}
          </p>
        </div>

        {productsLoading ? (
          <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-tf-gray-soft animate-pulse" />
            ))}
          </div>
        ) : products?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p
              className="text-h2 mb-2"
              style={{ fontFamily: `'${theme.police_titres}', Georgia, serif`, color: theme.couleur_texte }}
            >
              Aucun article pour le moment
            </p>
            <p className="text-body text-tf-text-muted">Cette boutique n&apos;a pas encore publié d&apos;articles.</p>
          </div>
        ) : (
          <div className={`grid ${gridClass} gap-3 sm:gap-4`}>
            {products?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page principale — le thème est déjà appliqué par boutique/[id]/layout.tsx ─

export default function BoutiquePage() {
  const { id } = useParams<{ id: string }>()
  return <BoutiqueContent shopId={id} />
}
