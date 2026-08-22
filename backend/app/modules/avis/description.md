# Module `avis`

Notation post-livraison : évaluation à trois critères (délais, qualité, communication) qui
alimente le score de confiance d'une boutique.

**Contient**
- `models.py` — `Review`
- `schemas.py` — `ReviewCreate`, `ReviewResponse`
- `router.py` — publication d'un avis, liste des avis d'une boutique

**Dépend de** : `utilisateurs`, `commandes` (un avis est rattaché à une commande livrée), `boutiques`.
