# Module `activity_log`

Journal d'audit des actions sensibles de la plateforme (principalement les actions admin).
Écrit depuis les autres modules via `log_activity(...)`, jamais bloquant pour le flux principal
appelant (échec silencieux en cas d'erreur d'écriture).

**Contient**
- `models.py` — `ActivityLog`
- `service.py` — `log_activity(...)`, `get_client_ip(...)`

**Dépend de** : rien — utilisé en écriture par `admin` et `auth` notamment.
