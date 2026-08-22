# Module `paiement_echelonne`

Paiement en tranches (plans de paiement échelonné pour les vendeurs prêt-à-porter).
Feature V2 — module désactivé par défaut (`installment_payment` dans le registre de
fonctionnalités), migré tel quel dans cette réorganisation, non retravaillé.

**Contient**
- `models.py` — `PaymentPlan`, `OrderInstallment`, `Tranche`
- `router.py` — création et suivi d'un plan de paiement échelonné

**Dépend de** : `commandes`, `boutiques`, `fonctionnalites` (gate `installment_payment`).
