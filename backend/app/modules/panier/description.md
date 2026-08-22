# Module `panier`

Panier d'achat du client avant passage de commande.

**Contient**
- `models.py` — `Cart`, `CartItem`
- `schemas.py` — schémas d'entrée/sortie du panier
- `router.py` — ajout/retrait d'articles, consultation du panier

**Dépend de** : `utilisateurs` (propriétaire du panier), `produits` (articles ajoutés).
