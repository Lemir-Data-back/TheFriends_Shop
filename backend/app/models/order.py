import enum
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, Enum, Text, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base


class OrderType(str, enum.Enum):
    PRET_A_PORTER = "pret_a_porter"
    SUR_MESURE = "sur_mesure"


class OrderStatut(str, enum.Enum):
    EN_ATTENTE = "en_attente"         # Commande passée, attente vendeur
    ACCEPTEE = "acceptee"             # Vendeur a accepté
    EN_COURS = "en_cours"             # En production / préparation
    EXPEDIE = "expedie"               # Expédié
    LIVRE = "livre"                   # Livré, attente confirmation client
    CONFIRME = "confirme"             # Client a confirmé réception → fonds libérés
    LITIGE = "litige"                 # Litige ouvert
    ANNULE = "annule"                 # Annulé
    REMBOURSE = "rembourse"           # Remboursé


class EscrowStatut(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    BLOQUE = "bloque"
    LIBERE = "libere"
    REMBOURSE = "rembourse"
    LITIGE = "litige"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference: Mapped[str] = mapped_column(String(50), unique=True, index=True)

    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    shop_id: Mapped[int] = mapped_column(ForeignKey("shops.id"), index=True)

    type: Mapped[OrderType] = mapped_column(Enum(OrderType))
    statut: Mapped[OrderStatut] = mapped_column(Enum(OrderStatut), default=OrderStatut.EN_ATTENTE)

    # Montant en FCFA
    montant: Mapped[int] = mapped_column(Integer)
    penalite: Mapped[int] = mapped_column(Integer, default=0)  # Montant pénalité appliquée

    # Escrow
    escrow_statut: Mapped[EscrowStatut] = mapped_column(
        Enum(EscrowStatut), default=EscrowStatut.EN_ATTENTE
    )

    # Articles commandés (JSON)
    # [{"product_id": 1, "titre": "...", "taille": "M", "couleur": "noir", "quantite": 1, "prix": 15000}]
    items: Mapped[list] = mapped_column(JSONB, default=[])

    # Livraison
    adresse_livraison: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    date_livraison_promise: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    date_livraison_reelle: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Jalons (pour commandes > 50 000 FCFA)
    jalons: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # Notes
    note_client: Mapped[str | None] = mapped_column(Text, nullable=True)
    note_vendeur: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relations
    client: Mapped["User"] = relationship("User", back_populates="orders")
    shop: Mapped["Shop"] = relationship("Shop", back_populates="orders")
    payment: Mapped["Payment"] = relationship("Payment", back_populates="order", uselist=False)
    review: Mapped["Review"] = relationship("Review", back_populates="order", uselist=False)
    installment: Mapped["OrderInstallment | None"] = relationship(
        "OrderInstallment", back_populates="order", uselist=False
    )

    def __repr__(self) -> str:
        return f"<Order id={self.id} ref={self.reference} statut={self.statut}>"


class CreationRequestStatut(str, enum.Enum):
    OUVERTE = "ouverte"
    DEVIS_RECUS = "devis_recus"
    COUTURIER_SELECTIONNE = "couturier_selectionne"
    EN_COURS = "en_cours"
    TERMINEE = "terminee"
    ANNULEE = "annulee"


class CreationRequest(Base):
    """Demande de création sur mesure avec tissu fourni par le client."""
    __tablename__ = "creation_requests"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    description: Mapped[str] = mapped_column(Text)

    # Photos du modèle souhaité (JSON) : ["url1", "url2"]
    photos_modele: Mapped[list] = mapped_column(JSONB, default=[])
    photo_tissu: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Mensurations au moment de la demande
    mensurations: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    statut: Mapped[CreationRequestStatut] = mapped_column(
        Enum(CreationRequestStatut), default=CreationRequestStatut.OUVERTE
    )

    # Option diffusion : "favori" | "manuel" | "tous"
    option_diffusion: Mapped[str] = mapped_column(String(20), default="tous")
    couturier_favori_id: Mapped[int | None] = mapped_column(
        ForeignKey("shops.id"), nullable=True
    )

    # Devis reçus (JSON) : [{"shop_id": 1, "prix": 35000, "delai_jours": 14, "message": "..."}]
    devis: Mapped[list] = mapped_column(JSONB, default=[])

    # Couturier sélectionné
    couturier_selectionne_id: Mapped[int | None] = mapped_column(
        ForeignKey("shops.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self) -> str:
        return f"<CreationRequest id={self.id} statut={self.statut}>"
