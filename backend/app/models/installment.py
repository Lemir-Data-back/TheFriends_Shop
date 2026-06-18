"""
Paiement en plusieurs tranches — disponible pour les vendeurs PAP uniquement.
Logique : le client paie des acomptes successifs.
La livraison est déclenchée automatiquement quand le montant total est atteint.
"""
from datetime import date, datetime
from typing import Any
from sqlalchemy import (
    Boolean, Date, DateTime, Float, ForeignKey,
    Integer, String, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PaymentPlan(Base):
    """
    Plan de paiement défini par un vendeur PAP.
    Un vendeur peut créer plusieurs plans (ex: 3x, 6x, 10x).
    """
    __tablename__ = "payment_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    shop_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("shops.id", ondelete="CASCADE"), nullable=False
    )

    nom: Mapped[str] = mapped_column(String(128), nullable=False)   # ex: "Paiement 3x sans frais"
    nb_tranches: Mapped[int] = mapped_column(Integer, nullable=False)  # 2, 3, 4, 6...
    acompte_percent: Mapped[int] = mapped_column(Integer, default=30)  # % du 1er versement
    intervalle_jours: Mapped[int] = mapped_column(Integer, default=30)  # jours entre versements
    montant_min: Mapped[int] = mapped_column(Integer, default=10000)  # FCFA minimum
    montant_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frais_percent: Mapped[float] = mapped_column(Float, default=0.0)  # 0 = sans frais
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    shop: Mapped[Any] = relationship("Shop", back_populates="payment_plans")
    order_installments: Mapped[list["OrderInstallment"]] = relationship(
        "OrderInstallment", back_populates="plan"
    )


class OrderInstallment(Base):
    """
    Instance d'un plan de paiement appliqué à une commande.
    Suit l'avancement global du remboursement.
    """
    __tablename__ = "order_installments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    payment_plan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("payment_plans.id"), nullable=False
    )

    montant_total: Mapped[int] = mapped_column(Integer, nullable=False)  # FCFA
    montant_paye: Mapped[int] = mapped_column(Integer, default=0)         # cumulé
    # en_cours | complete | defaut | annule
    statut: Mapped[str] = mapped_column(String(16), default="en_cours")

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    order: Mapped[Any] = relationship("Order", back_populates="installment")
    plan: Mapped["PaymentPlan"] = relationship("PaymentPlan", back_populates="order_installments")
    tranches: Mapped[list["Tranche"]] = relationship(
        "Tranche", back_populates="order_installment", order_by="Tranche.numero"
    )

    @property
    def is_complete(self) -> bool:
        return self.montant_paye >= self.montant_total

    @property
    def reste_a_payer(self) -> int:
        return max(0, self.montant_total - self.montant_paye)

    @property
    def progression_percent(self) -> int:
        if self.montant_total == 0:
            return 100
        return min(100, int(self.montant_paye / self.montant_total * 100))


class Tranche(Base):
    """
    Versement individuel dans un plan de paiement échelonné.
    """
    __tablename__ = "tranches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_installment_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("order_installments.id", ondelete="CASCADE"), nullable=False
    )
    payment_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("payments.id"), nullable=True
    )

    numero: Mapped[int] = mapped_column(Integer, nullable=False)   # 1 = acompte, 2, 3...
    montant: Mapped[int] = mapped_column(Integer, nullable=False)   # FCFA
    echeance: Mapped[date] = mapped_column(Date, nullable=False)
    paye_le: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    # en_attente | paye | en_retard | annule
    statut: Mapped[str] = mapped_column(String(16), default="en_attente")

    order_installment: Mapped["OrderInstallment"] = relationship(
        "OrderInstallment", back_populates="tranches"
    )
    payment: Mapped[Any] = relationship("Payment")
