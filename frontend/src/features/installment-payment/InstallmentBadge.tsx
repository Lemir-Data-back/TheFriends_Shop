"use client"

import { ModuleGate } from "@/modules/ModuleGate"
import { usePaymentPlans, formatFCFA, PaymentPlan } from "./useInstallment"

interface InstallmentBadgeProps {
  shopId: number
  orderAmount: number
  onSelect?: (plan: PaymentPlan) => void
}

/**
 * Affiche les plans de paiement disponibles sur une fiche produit ou dans le panier.
 * Visible uniquement si le module est actif pour la boutique.
 *
 * Usage :
 *   <InstallmentBadge shopId={shop.id} orderAmount={25000} onSelect={handlePlan} />
 */
export function InstallmentBadge({ shopId, orderAmount, onSelect }: InstallmentBadgeProps) {
  return (
    <ModuleGate slug="installment_payment" shopId={shopId}>
      <InstallmentBadgeInner shopId={shopId} orderAmount={orderAmount} onSelect={onSelect} />
    </ModuleGate>
  )
}

function InstallmentBadgeInner({ shopId, orderAmount, onSelect }: InstallmentBadgeProps) {
  const { data: plans, isLoading } = usePaymentPlans(shopId)

  const eligiblePlans = plans?.filter(
    (p) => orderAmount >= p.montant_min && (!p.montant_max || orderAmount <= p.montant_max)
  )

  if (isLoading || !eligiblePlans?.length) return null

  const bestPlan = eligiblePlans[0]
  const acompte = Math.ceil((orderAmount * bestPlan.acompte_percent) / 100)

  return (
    <div className="border border-tf-border rounded-lg p-3 bg-tf-surface text-sm">
      <p className="font-medium text-tf-text">
        Disponible en{" "}
        <span className="text-tf-gold font-semibold">{bestPlan.nb_tranches}x</span>
      </p>
      <p className="text-tf-text-muted mt-0.5">
        Acompte dès{" "}
        <span className="font-mono font-medium text-tf-text">{formatFCFA(acompte)}</span>
        {bestPlan.frais_percent === 0 && (
          <span className="ml-1 text-xs text-tf-success font-medium">sans frais</span>
        )}
      </p>
      {eligiblePlans.length > 1 && (
        <p className="text-xs text-tf-text-muted mt-1">
          {eligiblePlans.length} plans disponibles
        </p>
      )}
      {onSelect && (
        <button
          onClick={() => onSelect(bestPlan)}
          className="mt-2 text-xs font-medium text-tf-gold underline underline-offset-2 hover:text-tf-gold-dark"
        >
          Voir les options de paiement
        </button>
      )}
    </div>
  )
}
