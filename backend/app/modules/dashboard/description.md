# Module `dashboard`

Tableaux de bord agrégés par rôle (client / vendeur / couturier) et alertes personnalisées.
Module de lecture transverse — ne possède pas de modèle propre, il interroge les autres
modules (`commandes`, `produits`, `boutiques`, `outfits`, `analytics`) pour composer ses statistiques.

**Contient**
- `schemas.py` — `ClientDashboard`, `VendeurDashboard`, `CouturierDashboard` et leurs stats
- `router.py` — `GET /dashboard/client|vendeur|couturier`, `/profil/stats`, `/alertes`

**Dépend de** : `utilisateurs`, `commandes`, `produits`, `boutiques`, `outfits`, `analytics`.
