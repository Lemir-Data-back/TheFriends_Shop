from fastapi import APIRouter
from app.modules.auth.router import router as auth_router
from app.modules.utilisateurs.router import router as users_router
from app.modules.boutiques.router import router as shops_router
from app.modules.boutiques.theme_router import router as shop_theme_router
from app.modules.produits.router import router as products_router
from app.modules.panier.router import router as cart_router
from app.modules.commandes.router import router as orders_router
from app.modules.messages.router import router as messages_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.avis.router import router as reviews_router
from app.modules.paiement_echelonne.router import router as installments_router
from app.modules.admin.router import router as admin_router
from app.modules.fonctionnalites.router import router as modules_router

api_router = APIRouter(prefix="/api/v1")

# ── Core ──────────────────────────────────────────────────────────────────────
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(shops_router)
api_router.include_router(products_router)
api_router.include_router(cart_router)
api_router.include_router(orders_router)
api_router.include_router(messages_router)
api_router.include_router(dashboard_router)
api_router.include_router(reviews_router)

# ── Modules système ───────────────────────────────────────────────────────────
api_router.include_router(modules_router)

# ── Features modulaires ───────────────────────────────────────────────────────
api_router.include_router(shop_theme_router)
api_router.include_router(installments_router)
api_router.include_router(admin_router)
