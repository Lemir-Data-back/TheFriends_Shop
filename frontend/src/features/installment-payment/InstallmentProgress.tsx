"use client"

import { useOrderInstallment, formatFCFA } from "./useInstallment"
import { ProgressBar } from "@/components/ui/ProgressBar"

interface InstallmentProgressProps {
  orderId: number
}

/**
 * Affiche la progression du paiement échelonné d'une commande.
 * À intégrer sur la page de détail commande.
 */
export function InstallmentProgress({ orderId }: InstallmentProgressProps) {
  const { data: installment, isLoading } = useOrderInstallment(orderId)

  if (isLoading || !installment) return null

  const statutLabel: Record<string, string> = {
    en_attente: "En attente",
    paye: "Payé",
    en_retard: "En retard",
    annule: "Annulé",
  }

  const statutColor: Record<string, string> = {
    en_attente: "text-tf-text-muted",
    paye: "text-tf-success",
    en_retard: "text-tf-error",
    annule: "text-tf-text-muted line-through",
  }

  return (
    <div className="border border-tf-border rounded-xl p-4 bg-tf-surface space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-tf-text text-sm">Paiement échelonné</h3>
        <span className="font-mono text-xs text-tf-text-muted">
          {formatFCFA(installment.montant_paye)} / {formatFCFA(installment.montant_total)}
        </span>
      </div>

      {/* Barre de progression */}
      <ProgressBar value={installment.progression_percent} color="var(--tf-shop-primary, var(--tf-gold))" trackClassName="w-full h-2" />
      <p className="text-xs text-tf-text-muted text-right -mt-2">
        {installment.progression_percent}% réglé
      </p>

      {/* Liste des tranches */}
      <ol className="space-y-2">
        {installment.tranches.map((tranche) => (
          <li key={tranche.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${tranche.statut === "paye"
                    ? "bg-tf-success-bg text-tf-success"
                    : tranche.statut === "en_retard"
                    ? "bg-tf-error-bg text-tf-error"
                    : "bg-tf-gray-soft text-tf-text-muted"
                  }`}
              >
                {tranche.numero}
              </span>
              <span className={`font-mono font-medium ${statutColor[tranche.statut]}`}>
                {formatFCFA(tranche.montant)}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-xs ${statutColor[tranche.statut]}`}>
                {statutLabel[tranche.statut]}
              </span>
              <p className="text-xs text-tf-text-muted">
                {tranche.statut === "paye" && tranche.paye_le
                  ? new Date(tranche.paye_le).toLocaleDateString("fr-CI")
                  : `Échéance : ${new Date(tranche.echeance).toLocaleDateString("fr-CI")}`}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {installment.statut === "complete" && (
        <p className="text-sm text-tf-success font-medium text-center">
          Paiement complet — livraison en cours
        </p>
      )}

      {installment.reste_a_payer > 0 && installment.statut === "en_cours" && (
        <p className="text-sm text-tf-text-muted text-center">
          Reste à payer : <span className="font-mono font-semibold text-tf-text">{formatFCFA(installment.reste_a_payer)}</span>
        </p>
      )}
    </div>
  )
}
