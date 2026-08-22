"""Importe le module `models` de chaque module métier pour que SQLAlchemy et
Alembic découvrent toutes les tables au démarrage. Remplace l'ancien
`app/models/__init__.py` de l'architecture en couches."""

import app.modules.utilisateurs.models  # noqa: F401
import app.modules.boutiques.models  # noqa: F401
import app.modules.boutiques.theme_models  # noqa: F401
import app.modules.produits.models  # noqa: F401
import app.modules.panier.models  # noqa: F401
import app.modules.commandes.models  # noqa: F401
import app.modules.paiements.models  # noqa: F401
import app.modules.paiement_echelonne.models  # noqa: F401
import app.modules.messages.models  # noqa: F401
import app.modules.avis.models  # noqa: F401
import app.modules.analytics.models  # noqa: F401
import app.modules.outfits.models  # noqa: F401
import app.modules.activity_log.models  # noqa: F401
import app.modules.fonctionnalites.models  # noqa: F401
