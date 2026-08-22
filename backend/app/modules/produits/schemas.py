from pydantic import BaseModel, Field
from typing import Optional, List, Any, Literal
from datetime import datetime
from app.modules.produits.models import ProductCategorie, ProductOccasion

StockStatut = Literal["rupture", "stock_faible"]


class ProductImageResponse(BaseModel):
    id: int
    url_cloudinary: str
    ordre: int
    angle: Optional[str] = None

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    titre: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    categorie: ProductCategorie
    occasion: Optional[ProductOccasion] = None
    style: Optional[str] = None
    tissu: Optional[str] = None
    prix: int = Field(..., gt=0, description="Prix en FCFA")
    prix_promo: Optional[int] = Field(None, gt=0)
    stock: Optional[dict] = None
    tailles_guide: Optional[dict] = None
    tags: Optional[List[str]] = None
    mensurations_ref: Optional[dict] = None
    is_sur_mesure: bool = False
    prix_plancher_negociation: Optional[int] = Field(None, gt=0)
    seuil_stock_faible: Optional[int] = Field(None, ge=0)


class ProductUpdate(BaseModel):
    titre: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    occasion: Optional[ProductOccasion] = None
    style: Optional[str] = None
    tissu: Optional[str] = None
    prix: Optional[int] = Field(None, gt=0)
    prix_promo: Optional[int] = Field(None, gt=0)
    stock: Optional[dict] = None
    tailles_guide: Optional[dict] = None
    tags: Optional[List[str]] = None
    actif: Optional[bool] = None
    prix_plancher_negociation: Optional[int] = Field(None, gt=0)
    seuil_stock_faible: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    shop_id: int
    titre: str
    description: Optional[str] = None
    categorie: ProductCategorie
    occasion: Optional[ProductOccasion] = None
    style: Optional[str] = None
    tissu: Optional[str] = None
    prix: int
    prix_promo: Optional[int] = None
    stock: Optional[dict] = None
    tailles_guide: Optional[dict] = None
    tags: Optional[List[str]] = None
    is_sur_mesure: bool
    prix_plancher_negociation: Optional[int] = None
    seuil_stock_faible: Optional[int] = None
    stock_total: Optional[int] = None
    stock_statut: Optional[StockStatut] = None
    actif: bool
    nb_vues: int
    nb_likes: int
    nb_commandes: int
    images: List[ProductImageResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """Version allégée pour la liste catalogue"""
    id: int
    shop_id: int
    titre: str
    categorie: ProductCategorie
    occasion: Optional[ProductOccasion] = None
    tissu: Optional[str] = None
    prix: int
    prix_promo: Optional[int] = None
    tags: Optional[List[str]] = None
    is_sur_mesure: bool
    nb_likes: int
    stock_statut: Optional[StockStatut] = None
    images: List[ProductImageResponse] = []

    model_config = {"from_attributes": True}


class SizeRecommendation(BaseModel):
    """Recommandation de taille basée sur les mensurations du client"""
    taille_recommandee: Optional[str]
    message: str
    indice_confiance: float = Field(..., ge=0.0, le=1.0)
    details: Optional[str] = None


class ProductFilters(BaseModel):
    categorie: Optional[ProductCategorie] = None
    occasion: Optional[ProductOccasion] = None
    tissu: Optional[str] = None
    prix_min: Optional[int] = None
    prix_max: Optional[int] = None
    is_sur_mesure: Optional[bool] = None
    tags: Optional[List[str]] = None
    search: Optional[str] = None
    shop_id: Optional[int] = None
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
