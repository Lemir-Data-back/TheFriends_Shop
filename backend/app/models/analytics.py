from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class EventAnalytics(Base):
    """Collecte tous les événements : vues, clics, likes, recherches..."""
    __tablename__ = "events_analytics"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)

    # Types : "product_view", "product_like", "search", "outfit_view", "add_to_cart", etc.
    event_type: Mapped[str] = mapped_column(String(50), index=True)

    # ID de l'entité concernée (product_id, shop_id, outfit_id...)
    entity_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Métadonnées contextuelles (JSON)
    meta: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
