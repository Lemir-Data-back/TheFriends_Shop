"""Configuration Behave — exécute les scénarios contre une base de test dédiée
(thefriendsshop_test_db), réinitialisée avant chaque scénario pour l'isolation.
"""
import os

# Doit être fait AVANT tout import de app.* pour que Settings() et l'engine
# SQLAlchemy se branchent sur la base de test, pas la base de développement.
os.environ["DATABASE_URL"] = (
    "postgresql://thefriends:Amir2468@localhost:5432/thefriendsshop_test_db?client_encoding=utf8"
)
os.environ.setdefault("SECRET_KEY", "test-secret-key-behave-min-32-characters")

from fastapi.testclient import TestClient  # noqa: E402

from app.db.base import Base, engine  # noqa: E402
import app.db.all_models  # noqa: E402,F401 — enregistre tous les modèles sur Base.metadata
from main import app as fastapi_app  # noqa: E402


def before_all(context):
    context.client = TestClient(fastapi_app)


def before_scenario(context, scenario):
    # Base propre pour chaque scénario — isolation totale, pas d'effets de bord.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    context.tokens = {}
    context.users = {}
    context.shops = {}
    context.orders = {}
    context.response = None
