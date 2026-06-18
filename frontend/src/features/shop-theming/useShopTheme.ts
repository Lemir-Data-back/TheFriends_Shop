"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface ShopTheme {
  id: number
  shop_id: number
  couleur_principale: string
  couleur_secondaire: string
  couleur_fond: string
  couleur_texte: string
  couleur_accent: string
  police_titres: string
  police_corps: string
  banniere_url: string | null
  logo_url: string | null
  slogan: string | null
  message_accueil: string | null
  a_propos: string | null
  layout_config: {
    hero_style: "full" | "split" | "minimal"
    grid_style: "2col" | "3col" | "masonry"
    sections: string[]
    show_reviews: boolean
    show_stats: boolean
  }
  is_published: boolean
}

export type ShopThemeUpdate = Partial<Omit<ShopTheme, "id" | "shop_id">>

/** Thème par défaut (charte graphique TheFriends) */
export const DEFAULT_THEME: ShopTheme = {
  id: 0,
  shop_id: 0,
  couleur_principale: "#C9A84C",
  couleur_secondaire: "#111111",
  couleur_fond: "#FDFCFA",
  couleur_texte: "#111111",
  couleur_accent: "#C9A84C",
  police_titres: "Georgia",
  police_corps: "Inter",
  banniere_url: null,
  logo_url: null,
  slogan: null,
  message_accueil: null,
  a_propos: null,
  layout_config: {
    hero_style: "full",
    grid_style: "2col",
    sections: ["banner", "featured", "catalog", "about"],
    show_reviews: true,
    show_stats: true,
  },
  is_published: false,
}

/** Récupère le thème publié d'une boutique (pour les visiteurs) */
export function useShopTheme(shopId: number) {
  return useQuery<ShopTheme>({
    queryKey: ["shop-theme", shopId],
    queryFn: async () => {
      const { data } = await api.get<ShopTheme>(`/shop-theme/${shopId}`)
      return data
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: { ...DEFAULT_THEME, shop_id: shopId },
  })
}

/** Récupère le brouillon en cours d'édition (dashboard) */
export function useShopThemeDraft(shopId: number) {
  return useQuery<ShopTheme>({
    queryKey: ["shop-theme-draft", shopId],
    queryFn: async () => {
      const { data } = await api.get<ShopTheme>(`/shop-theme/${shopId}/draft`)
      return data
    },
  })
}

/** Met à jour le brouillon du thème */
export function useUpdateShopTheme(shopId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShopThemeUpdate) =>
      api.patch<ShopTheme>(`/shop-theme/${shopId}`, payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["shop-theme-draft", shopId], data)
    },
  })
}

/** Publie le thème — les visiteurs voient la nouvelle version */
export function usePublishShopTheme(shopId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<ShopTheme>(`/shop-theme/${shopId}/publish`).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(["shop-theme", shopId], data)
      queryClient.setQueryData(["shop-theme-draft", shopId], data)
    },
  })
}

/** Options de polices autorisées */
export function usePoliceOptions() {
  return useQuery<{ titres: string[]; corps: string[] }>({
    queryKey: ["police-options"],
    queryFn: async () => {
      const { data } = await api.get("/shop-theme/options/polices")
      return data
    },
    staleTime: Infinity,
  })
}
