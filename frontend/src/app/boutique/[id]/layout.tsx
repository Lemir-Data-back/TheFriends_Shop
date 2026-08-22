"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { TopNav } from "@/components/layout/TopNav"
import { Footer } from "@/components/layout/Footer"
import { ClientBottomNav } from "@/components/layout/ClientBottomNav"
import { ShopThemeProvider } from "@/features/shop-theming/ThemeProvider"
import { useShopTheme } from "@/features/shop-theming/useShopTheme"
import type { Shop } from "@/types/shop"

/**
 * Enveloppe toute la branche /boutique/[id]/* (la boutique elle-même et ses fiches
 * produit imbriquées) avec une nav/footer partagés — mêmes composants que le reste
 * du site, juste renseignés avec l'identité de cette boutique.
 */
export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>()
  const shopId = Number(id)

  const { data: shop } = useQuery<Shop>({
    queryKey: ["shop", id],
    queryFn: async () => (await api.get(`/shops/${id}`)).data,
  })
  const { data: theme } = useShopTheme(shopId)

  const navShop = shop ? { id: shop.id, nom: shop.nom, logoUrl: theme?.logo_url } : undefined

  return (
    <div className="min-h-screen bg-tf-bg">
      <TopNav shop={navShop} />
      <div className="pt-20 sm:pt-24 pb-bottom-nav lg:pb-0">
        <main>
          <ShopThemeProvider shopId={shopId}>{children}</ShopThemeProvider>
        </main>
        <Footer
          shop={
            shop
              ? {
                  id: shop.id,
                  nom: shop.nom,
                  slogan: theme?.slogan,
                  telephone_contact: theme?.telephone_contact,
                  whatsapp: theme?.whatsapp,
                  instagram: theme?.instagram,
                  tiktok: theme?.tiktok,
                  horaires: theme?.horaires,
                }
              : undefined
          }
        />
      </div>
      <ClientBottomNav />
    </div>
  )
}
