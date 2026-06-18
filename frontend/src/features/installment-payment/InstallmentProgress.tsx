"use client"

import { useOrderInstallment, formatFCFA } from "./useInstallment"

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
    paye: "text-[#2D6A4F]",
    en_retard: "text-[#C0392B]",
    annule: "text-tf-text-muted line-through",
  }

  return (
    <div className="border border-tf-border rounded-xl p-4 bg-tf-surface space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-tf-text text-sm">Paiement échelonné</h3>
        <span className="text-xs text-tf-text-muted">
          {formatFCFA(installment.montant_paye)} / {formatFCFA(installment.montant_total)}
        </span>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-tf-gray-soft rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${installment.progression_percent}%`,
            backgroundColor: "var(--tf-shop-primary, #C9A84C)",
          }}
        />
      </div>
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
                    ? "bg-[#D8F3DC] text-[#2D6A4F]"
                    : tranche.statut === "en_retard"
                    ? "bg-[#FFCCCC] text-[#C0392B]"
                    : "bg-tf-gray-soft text-tf-text-muted"
                  }`}
              >
                {tranche.numero}
              </span>
              <span className={`font-medium ${statutColor[tranche.statut]}`}>
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
        <p className="text-sm text-[#2D6A4F] font-medium text-center">
          Paiement complet — livraison en cours
        </p>
      )}

      {installment.reste_a_payer > 0 && installment.statut === "en_cours" && (
        <p className="text-sm text-tf-text-muted text-center">
          Reste à payer : <span className="font-semibold text-tf-text">{formatFCFA(installment.reste_a_payer)}</span>
        </p>
      )}
    </div>
  )
}
