# Module `boutiques`

Boutiques (couturier / boutique prêt-à-porter / marque) : profil public, zone, scores de
confiance, badges de certification, et personnalisation visuelle (thème boutique).

**Contient**
- `models.py` — `Shop`, `ShopType`
- `theme_models.py` — `ShopTheme` et constantes associées (polices, styles de héros/grille)
- `schemas.py` — `ShopCreate`, `ShopUpdate`, `ShopResponse`, `ShopPublicResponse`
- `router.py` — CRUD boutique, page boutique publique
- `theme_router.py` — configuration du thème visuel de la boutique

**Dépend de** : `utilisateurs` (propriétaire de la boutique), `services/cloudinary_service` (upload photo).
