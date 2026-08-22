# Module `utilisateurs`

Gestion des utilisateurs de la plateforme : identité, profil, mensurations et rôle
(client / couturier / vendeur / admin). Ne gère pas l'authentification (voir `auth`) —
uniquement l'utilisateur en tant qu'entité et son auto-gestion (profil).

**Contient**
- `models.py` — `User`, `UserRole`
- `schemas.py` — schémas Pydantic utilisateur (`ProfileUpdate`, `UserResponse`, ...)
- `router.py` — `GET/PATCH /dashboard/profil` (l'utilisateur consulte/modifie son propre profil)

**Dépend de** : rien (module de base, importé par la quasi-totalité des autres modules).

**Note** : la gestion des utilisateurs *par l'admin* (liste, activation/désactivation) reste
dans `admin/router.py`, aux côtés de la gestion admin des autres entités (boutiques, litiges).
