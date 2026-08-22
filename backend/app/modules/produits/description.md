# Module `produits`

Catalogue produits : articles prêt-à-porter et sur-mesure, images, stock par taille/couleur,
guide des tailles et recommandation automatique basée sur les mensurations du profil client.

**Contient**
- `models.py` — `Product`, `ProductImage`, `ProductCategorie`, `ProductOccasion`
- `schemas.py` — `ProductCreate`, `ProductUpdate`, `ProductResponse`, `SizeRecommendation`, ...
- `router.py` — CRUD produit, upload images, filtres catalogue, `GET /{id}/size-recommendation`

**Dépend de** : `boutiques` (propriétaire du produit), `services/cloudinary_service` (upload images).
