import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, Text, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class ProductCategorie(str, enum.Enum):
    HOMME = "homme"
    FEMME = "femme"
    ENFANT = "enfant"


class ProductOccasion(str, enum.Enum):
    CASUAL = "casual"
    BUREAU = "bureau"
    CEREMONIE = "ceremonie"
    TRADITIONNEL = "traditionnel"
    SPORT = "sport"
    MARIAGE = "mariage"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), index=True)

    titre: Mapped[str] = mapped_column(String(255), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    categorie: Mapped[ProductCategorie] = mapped_column(Enum(ProductCategorie))
    occasion: Mapped[ProductOccasion | None] = mapped_column(Enum(ProductOccasion), nullable=True)
    style: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Tissu : "wax", "bazin", "kente", "coton", "soie", etc.
    tissu: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Prix en FCFA
    prix: Mapped[int] = mapped_column(Integer)
    prix_promo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    promo_expire_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Plancher de négociation optionnel (sur mesure) — le couturier choisit de le définir ou non
    prix_plancher_negociation: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Stock par taille/couleur (JSON)
    # {"M": {"blanc": 5, "noir": 3}, "L": {"blanc": 2}}
    stock: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Seuil sous lequel le badge "Stock faible" s'affiche côté client — None = pas d'alerte
    seuil_stock_faible: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Tableau de tailles du vendeur (JSON)
    # {"XS": {"poitrine": "80-84", "taille": "60-64"}, "S": {...}}
    tailles_guide: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Tags locaux (JSON) : ["wax", "ceremonie", "mariage"]
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Mensurations de référence pour sur mesure (JSON)
    mensurations_ref: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    is_sur_mesure: Mapped[bool] = mapped_column(Boolean, default=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True)

    # Analytics
    nb_vues: Mapped[int] = mapped_column(Integer, default=0)
    nb_likes: Mapped[int] = mapped_column(Integer, default=0)
    nb_commandes: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    shop: Mapped["Shop"] = relationship("Shop", back_populates="products")
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Product id={self.id} titre={self.titre} prix={self.prix}>"


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)

    url_cloudinary: Mapped[str] = mapped_column(String(512))
    public_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ordre: Mapped[int] = mapped_column(Integer, default=0)
    angle: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "face", "dos", "detail"

    # Relations
    product: Mapped["Product"] = relationship("Product", back_populates="images")
