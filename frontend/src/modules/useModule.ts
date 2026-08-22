"use client"

import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { MODULES } from "./registry"

export interface ModuleStatus {
  slug: string
  is_active: boolean
  config: Record<string, unknown>
}

/**
 * Récupère les modules actifs d'une boutique depuis l'API.
 * Résultat mis en cache 5 minutes — les modules changent rarement.
 */
async function fetchShopModules(shopId: number): Promise<ModuleStatus[]> {
  const { data } = await api.get<ModuleStatus[]>(`/modules/shop/${shopId}/active`)
  return data
}

/**
 * Hook principal : vérifie si un module est actif pour une boutique.
 *
 * Usage :
 *   const { isActive, config } = useModule("installment_payment", shopId)
 *   if (!isActive) return null
 */
export function useModule(slug: string, shopId?: number) {
  const { data: modules, isLoading } = useQuery({
    queryKey: ["shop-modules", shopId],
    queryFn: () => fetchShopModules(shopId!),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  })

  if (!shopId) {
    const moduleDef = MODULES[slug]
    return {
      isActive: moduleDef?.defaultActive ?? false,
      config: {} as Record<string, unknown>,
      isLoading: false,
    }
  }

  const found = modules?.find((m) => m.slug === slug)
  const moduleDef = MODULES[slug]

  return {
    isActive: found?.is_active ?? moduleDef?.defaultActive ?? false,
    config: found?.config ?? {},
    isLoading,
  }
}

/**
 * Retourne tous les modules actifs d'une boutique sous forme de map.
 * Utile pour vérifier plusieurs modules à la fois dans un même composant.
 */
export function useShopModules(shopId?: number) {
  const { data: modules, isLoading } = useQuery({
    queryKey: ["shop-modules", shopId],
    queryFn: () => fetchShopModules(shopId!),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  })

  const moduleMap = new Map<string, ModuleStatus>()
  modules?.forEach((m) => moduleMap.set(m.slug, m))

  return { modules: moduleMap, isLoading }
}
