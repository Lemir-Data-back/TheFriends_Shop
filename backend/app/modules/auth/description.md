# Module `auth`

Authentification : inscription, connexion, émission et rafraîchissement des tokens JWT.
Ne possède pas de modèle propre — s'appuie sur `User` du module `utilisateurs`.

**Contient**
- `router.py` — `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, etc.

**Dépend de** : `utilisateurs` (modèle `User`), `core.security` (hash/JWT).
