import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class ShopType(str, enum.Enum):
    COUTURIER = "couturier"
    BOUTIQUE = "boutique"
    MARQUE = "marque"


class Shop(Base):
    __tablename__ = "shops"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)

    nom: Mapped[str] = mapped_column(String(255), index=True)
    type: Mapped[ShopType] = mapped_column(Enum(ShopType))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Localisation
    zone: Mapped[str | None] = mapped_column(String(100), nullable=True)  # "Cocody", "Yopougon", etc.
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Spécialités (JSON) : ["wax", "bazin", "kente", "mariage"]
    specialites: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Badges (JSON) : {"couturier_fiable": true, "premium": false}
    badges: Mapped[dict | None] = mapped_column(JSONB, default={})

    # Scores agrégés
    score_delais: Mapped[float] = mapped_column(Float, default=0.0)
    score_qualite: Mapped[float] = mapped_column(Float, default=0.0)
    score_communication: Mapped[float] = mapped_column(Float, default=0.0)
    nb_avis: Mapped[int] = mapped_column(Integer, default=0)
    nb_commandes: Mapped[int] = mapped_column(Integer, default=0)

    is_active: Mapped[bool] = mapped_column(default=True)
    is_validated: Mapped[bool] = mapped_column(default=False)  # Validé par admin

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relations
    owner: Mapped["User"] = relationship("User", back_populates="shop")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="shop")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="shop")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="shop")
    theme: Mapped["ShopTheme | None"] = relationship(
        "ShopTheme", back_populates="shop", uselist=False, cascade="all, delete-orphan"
    )
    payment_plans: Mapped[list["PaymentPlan"]] = relationship(
        "PaymentPlan", back_populates="shop", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Shop id={self.id} nom={self.nom} type={self.type}>"
