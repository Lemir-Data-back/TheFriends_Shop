from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List
from app.models.shop import ShopType


class ShopCreate(BaseModel):
    nom: str = Field(..., min_length=2, max_length=255)
    type: ShopType
    description: Optional[str] = None
    zone: Optional[str] = None
    adresse: Optional[str] = None
    specialites: Optional[List[str]] = None


class ShopUpdate(BaseModel):
    nom: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    zone: Optional[str] = None
    adresse: Optional[str] = None
    specialites: Optional[List[str]] = None


class ShopResponse(BaseModel):
    id: int
    user_id: int
    nom: str
    type: ShopType
    description: Optional[str] = None
    photo_url: Optional[str] = None
    zone: Optional[str] = None
    specialites: Optional[List[str]] = None
    badges: Optional[dict] = None
    score_delais: float
    score_qualite: float
    score_communication: float
    nb_avis: int
    nb_commandes: int
    is_active: bool
    is_validated: bool

    model_config = {"from_attributes": True}


class ShopPublicResponse(BaseModel):
    """Version publique — sans infos sensibles"""
    id: int
    nom: str
    type: ShopType
    description: Optional[str] = None
    photo_url: Optional[str] = None
    zone: Optional[str] = None
    specialites: Optional[List[str]] = None
    badges: Optional[dict] = None
    score_delais: float
    score_qualite: float
    nb_avis: int

    model_config = {"from_attributes": True}
