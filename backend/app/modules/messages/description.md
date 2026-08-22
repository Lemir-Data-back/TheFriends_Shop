# Module `messages`

Messagerie intégrée entre clients et boutiques (couturiers/vendeurs), avec liaison
optionnelle à une commande.

**Contient**
- `models.py` — `Conversation`, `Message`
- `schemas.py` — schémas conversation/message
- `router.py` — liste des conversations, envoi/lecture de messages

**Dépend de** : `utilisateurs`, `boutiques`, `commandes` (rattachement optionnel).
