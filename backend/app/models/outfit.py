from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class Outfit(Base):
    __tablename__ = "outfits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    titre: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Produits dans le look (JSON) : [{"product_id": 1, "type": "haut"}, ...]
    # Types : "haut", "bas", "chaussures", "accessoire", "complet"
    produits: Mapped[list] = mapped_column(JSONB, default=[])

    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    nb_likes: Mapped[int] = mapped_column(Integer, default=0)
    nb_commentaires: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relations
    user: Mapped["User"] = relationship("User", back_populates="outfits")

    def __repr__(self) -> str:
        return f"<Outfit id={self.id} titre={self.titre}>"
