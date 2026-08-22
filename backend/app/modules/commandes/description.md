# Module `commandes`

Cœur transactionnel : commandes (prêt-à-porter et sur-mesure), demandes de création sur
mesure avec devis, négociation de prix, escrow et jalons de livraison. Héberge aussi
l'intégration paiement CinetPay (initialisation, webhook) car elle est intimement liée aux
transitions de statut de la commande.

**Contient**
- `models.py` — `Order`, `CreationRequest`, `OrderType`, `OrderStatut`, `EscrowStatut`, ...
- `schemas.py` — schémas commande, négociation, devis
- `router.py` — cycle de vie commande, négociation de prix, routes CinetPay

**Dépend de** : `utilisateurs`, `boutiques`, `produits`, `paiements` (modèle `Payment` + service CinetPay).
