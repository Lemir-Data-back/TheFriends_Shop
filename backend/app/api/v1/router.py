from fastapi import APIRouter
from app.api.v1.endpoints import auth, shops, products, cart, orders, messages, dashboard, reviews
from app.api.v1.endpoints import shop_theme, installments, admin
from app.modules.router import router as modules_router

api_router = APIRouter(prefix="/api/v1")

# ── Core ──────────────────────────────────────────────────────────────────────
api_router.include_router(auth.router)
api_router.include_router(shops.router)
api_router.include_router(products.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(messages.router)
api_router.include_router(dashboard.router)
api_router.include_router(reviews.router)

# ── Modules système ───────────────────────────────────────────────────────────
api_router.include_router(modules_router)

# ── Features modulaires ───────────────────────────────────────────────────────
api_router.include_router(shop_theme.router)
api_router.include_router(installments.router)
api_router.include_router(admin.router)
