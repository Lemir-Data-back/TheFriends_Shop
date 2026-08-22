# Module `paiements`

Modèle de paiement et service d'intégration CinetPay (Wave, Orange Money, MTN Money, carte
bancaire). Ne possède pas de routes propres — les routes de paiement vivent dans `commandes`
car elles sont déclenchées par et modifient l'état de la commande.

**Contient**
- `models.py` — `Payment`, `PaymentStatut`, `PaymentOperateur`
- `cinetpay_service.py` — appels à l'API CinetPay

**Dépend de** : `commandes` (chaque paiement est rattaché à une commande).
