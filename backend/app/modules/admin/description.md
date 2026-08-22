# Module `admin`

Panel d'administration : point d'entrée unique pour toute la modération et la supervision
de la plateforme, réservé au rôle `admin`. Ne possède pas de modèle propre — lit et modifie
les entités d'autres modules (utilisateurs, boutiques, commandes) pour garder toute la
surface admin regroupée au même endroit plutôt que dispersée module par module.

**Contient**
- `router.py` — stats plateforme, gestion des utilisateurs (liste/activation), validation/
  suspension de boutiques, litiges, journal d'activité

**Dépend de** : `utilisateurs`, `boutiques`, `commandes`, `produits`, `avis`, `activity_log`.
