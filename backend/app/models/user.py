import enum
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Enum, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class UserRole(str, enum.Enum):
    CLIENT = "client"
    COUTURIER = "couturier"
    VENDEUR = "vendeur"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255))
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.CLIENT)

    # Mensurations (JSON) : {"poitrine": 90, "taille": 70, "hanches": 95, "pointure": 40}
    mensurations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    morphologie: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tranche_age: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Numéros Mobile Money — couturiers et vendeurs principalement
    # {"wave": "0707000000", "orange_money": "0505000000", "mtn_money": "0606000000"}
    mobile_money: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Score de confiance (0.0 - 5.0)
    score_confiance: Mapped[float] = mapped_column(Float, default=5.0)

    # Auth
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    shop: Mapped["Shop"] = relationship("Shop", back_populates="owner", uselist=False)
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="client")
    outfits: Mapped[list["Outfit"]] = relationship("Outfit", back_populates="user")
    reviews: Mapped[list["Review"]] = relationship("Review", back_populates="reviewer")

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email} role={self.role}>"
