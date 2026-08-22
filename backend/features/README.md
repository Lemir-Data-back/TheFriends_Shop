# Tests de règles métier (Behave / BDD)

Chaque règle métier du cahier des charges est testée comme un scénario Gherkin
en français, exécuté contre une vraie base PostgreSQL de test (isolée de la
base de développement).

## Lancer les tests

```bash
cd backend
source venv/Scripts/activate
python -m behave
```

Pour lancer un seul fichier : `python -m behave features/negociation.feature`

## Comment ça marche

- `environment.py` bascule `DATABASE_URL` vers `thefriendsshop_test_db` **avant**
  tout import de l'app, et réinitialise les tables avant chaque scénario
  (`before_scenario`) — chaque scénario démarre sur une base vide, sans effet
  de bord d'un scénario à l'autre.
- Les requêtes passent par `TestClient(app)` (FastAPI/Starlette) — donc tout le
  pipeline réel (validation Pydantic, dépendances, sécurité) est exercé, pas de
  mock.
- `steps/common_steps.py` contient les briques réutilisables par toutes les
  features : inscription, connexion, création d'une commande de test,
  assertions génériques (code retour, message d'erreur).

## Ajouter une nouvelle règle métier

1. Écrire le fichier `.feature` dans `backend/features/`, avec `# language: fr`
   en première ligne. Décrire la règle dans le commentaire de la
   `Fonctionnalité` (référencer la section du CDC si elle existe).
2. Réutiliser les steps de `common_steps.py` quand possible (inscription,
   connexion, etc.).
3. Si la règle a son propre vocabulaire (ex: pénalités de retard, score de
   confiance), créer `steps/<nom_regle>_steps.py` plutôt que de tout mettre
   dans `common_steps.py`.
4. Lancer `python -m behave` — Behave indique les steps "undefined" avec un
   squelette Python prêt à copier si un step n'existe pas encore.

## Ce qui est couvert aujourd'hui

| Fichier | Règle métier (CDC) |
|---|---|
| `negociation.feature` | 2.2.6 — contre-offre max -20%, une seule négociation par commande |
| `acceptation_refus.feature` | Acceptation avec délai de confection, refus → remboursement automatique |

## Ce qui n'est pas encore couvert (logique pas encore implémentée)

- Grille de pénalités de retard (5%/10%/20%/30%) — `Order.penalite` existe
  mais le calcul automatique selon le retard n'est pas câblé.
- Déductions du score de confiance client (annulation, comportement
  irrespectueux, fraude) — pas de logique automatique en place.
- Jalons de paiement par étapes pour commandes > 50 000 FCFA.

Écrire le `.feature` *avant* d'implémenter ces règles est volontairement
encouragé (TDD) : ça force à clarifier le comportement attendu avant le code.
