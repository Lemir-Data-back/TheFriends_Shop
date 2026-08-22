from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class CartItemAdd(BaseModel):
    product_id: int
    taille: Optional[str] = None
    couleur: Optional[str] = None
    quantite: int = Field(1, ge=1, le=10)


class CartItemUpdate(BaseModel):
    quantite: int = Field(..., ge=0, le=10)  # 0 = supprimer


class ProductSnapshotResponse(BaseModel):
    id: int
    titre: str
    shop_id: int
    shop_nom: str
    cover_url: Optional[str] = None
    is_sur_mesure: bool


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product: ProductSnapshotResponse
    taille: Optional[str] = None
    couleur: Optional[str] = None
    quantite: int
    prix_unitaire: int
    prix_promo: Optional[int] = None
    prix_effectif: int
    sous_total: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CartVendeurGroup(BaseModel):
    """Articles regroupés par vendeur/boutique."""
    shop_id: int
    shop_nom: str
    items: list[CartItemResponse]
    sous_total_boutique: int


class CartResponse(BaseModel):
    id: int
    nb_articles: int
    total: int
    groupes: list[CartVendeurGroup]
    updated_at: datetime

    model_config = {"from_attributes": True}
