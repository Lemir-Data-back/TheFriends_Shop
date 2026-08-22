from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Text, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True)
    reviewer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), index=True)

    # Trois critères
    score_delais: Mapped[float] = mapped_column(Float)         # 1.0 - 5.0
    score_qualite: Mapped[float] = mapped_column(Float)        # 1.0 - 5.0
    score_communication: Mapped[float] = mapped_column(Float)  # 1.0 - 5.0

    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relations
    order: Mapped["Order"] = relationship("Order", back_populates="review")
    reviewer: Mapped["User"] = relationship("User", back_populates="reviews")
    shop: Mapped["Shop"] = relationship("Shop", back_populates="reviews")

    def __repr__(self) -> str:
        return f"<Review id={self.id} shop={self.shop_id} qualite={self.score_qualite}>"
