import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PaymentOperateur(str, enum.Enum):
    WAVE = "wave"
    ORANGE_MONEY = "orange_money"
    MTN_MONEY = "mtn_money"
    CARTE = "carte"


class PaymentStatut(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    SUCCES = "succes"
    ECHEC = "echec"
    REMBOURSE = "rembourse"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), unique=True)

    montant: Mapped[int] = mapped_column(Integer)  # En FCFA
    operateur: Mapped[PaymentOperateur] = mapped_column(Enum(PaymentOperateur))
    statut: Mapped[PaymentStatut] = mapped_column(
        Enum(PaymentStatut), default=PaymentStatut.EN_ATTENTE
    )

    # Référence CinetPay
    ref_cinetpay: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    transaction_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relations
    order: Mapped["Order"] = relationship("Order", back_populates="payment")

    def __repr__(self) -> str:
        return f"<Payment id={self.id} montant={self.montant} statut={self.statut}>"
