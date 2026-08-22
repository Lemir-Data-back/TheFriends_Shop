from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from app.models.order import OrderType, OrderStatut, EscrowStatut, CreationRequestStatut


class AdresseLivraison(BaseModel):
    nom: str
    telephone: str
    quartier: str
    commune: str
    ville: str = "Abidjan"
    details: Optional[str] = None


class OrderItemSchema(BaseModel):
    product_id: int
    titre: str
    taille: Optional[str] = None
    couleur: Optional[str] = None
    quantite: int
    prix: int


class OrderCreateFromCart(BaseModel):
    """Créer une commande depuis le panier (tous les articles ou par boutique)."""
    shop_id: int  # Commander pour une boutique spécifique
    adresse_livraison: AdresseLivraison
    note_client: Optional[str] = None


class OrderUpdateStatut(BaseModel):
    statut: OrderStatut
    note: Optional[str] = None


class OrderItemResponse(BaseModel):
    product_id: int
    titre: str
    taille: Optional[str] = None
    couleur: Optional[str] = None
    quantite: int
    prix: int


class OrderResponse(BaseModel):
    id: int
    reference: str
    type: OrderType
    statut: OrderStatut
    escrow_statut: EscrowStatut
    montant: int
    penalite: int
    items: list
    adresse_livraison: Optional[dict] = None
    date_livraison_promise: Optional[datetime] = None
    date_livraison_reelle: Optional[datetime] = None
    note_client: Optional[str] = None
    note_vendeur: Optional[str] = None
    shop_id: int
    client_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderResponse]
    total: int
    page: int
    limit: int


# ─── Paiement ────────────────────────────────────────────────────────────────

class PaymentInitRequest(BaseModel):
    order_id: int
    operateur: str = Field(..., description="wave | orange_money | mtn_money | carte")
    telephone: Optional[str] = None  # Requis pour Wave/OM/MTN


class PaymentInitResponse(BaseModel):
    payment_url: str
    transaction_id: str
    reference: str
    montant: int


class CinetPayWebhookPayload(BaseModel):
    cpm_trans_id: str
    cpm_site_id: str
    cpm_amount: str
    cpm_currency: str
    cpm_payment_date: Optional[str] = None
    cpm_payment_time: Optional[str] = None
    cpm_error_message: Optional[str] = None
    cpm_result: Optional[str] = None
    signature: Optional[str] = None


# ─── Commande sur mesure ─────────────────────────────────────────────────────

class CreationRequestCreate(BaseModel):
    description: str = Field(..., min_length=20)
    mensurations: Optional[dict] = None
    option_diffusion: str = Field("tous", pattern="^(favori|manuel|tous)$")
    couturier_favori_id: Optional[int] = None


class DevisReponse(BaseModel):
    shop_id: int
    prix: int = Field(..., gt=0)
    delai_jours: int = Field(..., gt=0)
    message: Optional[str] = None


class CreationRequestResponse(BaseModel):
    id: int
    client_id: int
    description: str
    photos_modele: list
    photo_tissu: Optional[str] = None
    mensurations: Optional[dict] = None
    statut: CreationRequestStatut
    option_diffusion: str
    couturier_favori_id: Optional[int] = None
    devis: list
    couturier_selectionne_id: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}
