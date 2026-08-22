"""
Thème personnalisé d'une boutique.
Le vendeur/couturier configure son interface ; les visiteurs voient ce thème sur /boutique/[id].
"""
from datetime import datetime
from typing import Any
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


# Polices autorisées — liste fermée pour éviter de casser l'UI
POLICES_TITRES = ["Georgia", "Playfair Display", "Cormorant Garamond", "Libre Baskerville"]
POLICES_CORPS = ["Inter", "Lato", "Poppins", "Open Sans", "Nunito"]

# Styles de hero disponibles
HERO_STYLES = ["full", "split", "minimal"]

# Styles de grille produits
GRID_STYLES = ["2col", "3col", "masonry"]


class ShopTheme(Base):
    """
    Tokens de design d'une boutique.
    Stocke des valeurs sémantiques (hex, nom de police, slug de layout)
    et non du CSS brut — le frontend génère les CSS variables à partir de ces tokens.
    """
    __tablename__ = "shop_themes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shop_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("shops.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # ── Couleurs (hex validés côté API) ────────────────────────────────────────
    couleur_principale: Mapped[str] = mapped_column(String(7), default="#C9A84C")
    couleur_secondaire: Mapped[str] = mapped_column(String(7), default="#111111")
    couleur_fond: Mapped[str] = mapped_column(String(7), default="#FDFCFA")
    couleur_texte: Mapped[str] = mapped_column(String(7), default="#111111")
    couleur_accent: Mapped[str] = mapped_column(String(7), default="#C9A84C")

    # ── Typographie ────────────────────────────────────────────────────────────
    police_titres: Mapped[str] = mapped_column(String(64), default="Georgia")
    police_corps: Mapped[str] = mapped_column(String(64), default="Inter")

    # ── Médias ──────────────────────────────────────────────────────────────────
    banniere_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    banniere_public_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    logo_public_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # ── Contenu éditorial ──────────────────────────────────────────────────────
    slogan: Mapped[str | None] = mapped_column(String(160), nullable=True)
    message_accueil: Mapped[str | None] = mapped_column(String(512), nullable=True)
    a_propos: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Coordonnées de contact ──────────────────────────────────────────────────
    telephone_contact: Mapped[str | None] = mapped_column(String(32), nullable=True)
    whatsapp: Mapped[str | None] = mapped_column(String(32), nullable=True)
    instagram: Mapped[str | None] = mapped_column(String(128), nullable=True)
    tiktok: Mapped[str | None] = mapped_column(String(128), nullable=True)
    horaires: Mapped[str | None] = mapped_column(String(256), nullable=True)

    # ── Configuration de disposition ──────────────────────────────────────────
    # Exemple :
    # {
    #   "hero_style": "split",
    #   "grid_style": "3col",
    #   "sections": ["banner", "featured", "catalog", "about"],
    #   "show_reviews": true,
    #   "show_stats": true
    # }
    layout_config: Mapped[dict] = mapped_column(
        JSON,
        default=lambda: {
            "hero_style": "full",
            "grid_style": "2col",
            "sections": ["banner", "featured", "catalog", "about"],
            "show_reviews": True,
            "show_stats": True,
        },
    )

    # ── Statut ─────────────────────────────────────────────────────────────────
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    shop: Mapped[Any] = relationship("Shop", back_populates="theme")
