# Module `fonctionnalites`

Registre des fonctionnalités activables/désactivables de la plateforme (ex. escrow,
négociation, thème boutique, communauté...) avec bascule globale par l'admin et override
par entité (boutique/utilisateur). C'est le système de "modules" au sens produit du terme —
à ne pas confondre avec les modules de code de `app/modules/`, qui sont la découpe technique
du backend.

**Contient**
- `registry.py` — définition statique de chaque fonctionnalité (phase, portée, actif par défaut)
- `models.py` — `Module`, `EntityModule` (override par entité, persistés en base)
- `dependencies.py` — dépendance FastAPI `require_module(...)` pour gater une route
- `router.py` — `GET/PATCH /modules/...` (consultation et bascule par l'admin)

**Dépend de** : rien de métier — utilisé par les autres modules pour gater leurs routes
optionnelles (ex. `paiement_echelonne`).
