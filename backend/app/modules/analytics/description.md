# Module `analytics`

Journal des événements plateforme (vues, likes, recherches) utilisé pour les statistiques
client/vendeur. Modèle seul pour l'instant — pas de router dédié, les autres modules
(`dashboard` notamment) l'interrogent directement.

**Contient**
- `models.py` — `EventAnalytics`

**Dépend de** : `utilisateurs` (événement rattaché à un utilisateur).
