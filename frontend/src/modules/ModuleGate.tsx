"use client"

import { useModule } from "./useModule"

interface ModuleGateProps {
  slug: string
  shopId?: number
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Rend `children` uniquement si le module est actif.
 * Pendant le chargement, ne rend rien (pas de flash de contenu).
 *
 * Usage :
 *   <ModuleGate slug="installment_payment" shopId={shop.id}>
 *     <InstallmentBadge />
 *   </ModuleGate>
 *
 *   <ModuleGate slug="negociation" shopId={shop.id} fallback={<p>Non disponible</p>}>
 *     <NegociationButton />
 *   </ModuleGate>
 */
export function ModuleGate({ slug, shopId, fallback = null, children }: ModuleGateProps) {
  const { isActive, isLoading } = useModule(slug, shopId)

  if (isLoading) return null
  if (!isActive) return <>{fallback}</>
  return <>{children}</>
}
