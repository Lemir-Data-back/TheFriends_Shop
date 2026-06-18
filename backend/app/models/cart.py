from datetime import datetime, timezone
from sqlalchemy import Integer, ForeignKey, DateTime, String, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Cart(Base):
    """Panier persistant par client (un seul panier actif par client)."""
    __tablename__ = "carts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    items: Mapped[list["CartItem"]] = relationship(
        "CartItem", back_populates="cart", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Cart id={self.id} client_id={self.client_id}>"


class CartItem(Base):
    """Article dans le panier."""
    __tablename__ = "cart_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cart_id: Mapped[int] = mapped_column(ForeignKey("carts.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)

    taille: Mapped[str | None] = mapped_column(String(20), nullable=True)
    couleur: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantite: Mapped[int] = mapped_column(Integer, default=1)

    # Prix capturé au moment de l'ajout (en FCFA)
    prix_unitaire: Mapped[int] = mapped_column(Integer)
    prix_promo: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relations
    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    product: Mapped["Product"] = relationship("Product")

    @property
    def prix_effectif(self) -> int:
        return self.prix_promo if self.prix_promo else self.prix_unitaire

    @property
    def sous_total(self) -> int:
        return self.prix_effectif * self.quantite

    def __repr__(self) -> str:
        return f"<CartItem id={self.id} product_id={self.product_id} qte={self.quantite}>"
