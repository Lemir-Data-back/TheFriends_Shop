from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List

from app.db.base import get_db
from app.modules.utilisateurs.models import User
from app.modules.boutiques.models import Shop
from app.modules.produits.models import Product, ProductImage, ProductCategorie, ProductOccasion
from app.modules.produits.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductListResponse, SizeRecommendation,
)
from app.api.deps import get_current_active_user, get_current_user_optional
from app.services.cloudinary_service import upload_product_image, delete_image

router = APIRouter(prefix="/products", tags=["Produits"])


def _stock_status(product: Product) -> tuple[Optional[int], Optional[str]]:
    """Calcule le stock total et le statut d'alerte à partir du détail taille/couleur.
    Retourne (None, None) si le vendeur ne suit pas le stock de cet article."""
    if not product.stock:
        return None, None
    total = sum(
        qte
        for couleurs in product.stock.values()
        for qte in (couleurs.values() if isinstance(couleurs, dict) else [couleurs])
    )
    if total <= 0:
        return total, "rupture"
    if product.seuil_stock_faible is not None and total <= product.seuil_stock_faible:
        return total, "stock_faible"
    return total, None


def _to_list_response(product: Product) -> ProductListResponse:
    resp = ProductListResponse.model_validate(product)
    _, resp.stock_statut = _stock_status(product)
    return resp


def _to_full_response(product: Product) -> ProductResponse:
    resp = ProductResponse.model_validate(product)
    resp.stock_total, resp.stock_statut = _stock_status(product)
    return resp


@router.get("/mine", response_model=dict)
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Catalogue complet du vendeur/couturier connecté — actifs et inactifs, pour la
    page de gestion Catalogue et Stock (pas de filtre `actif`, contrairement à la liste publique)."""
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=403, detail="Vous devez avoir une boutique active")

    products = db.query(Product).filter(Product.shop_id == shop.id).order_by(Product.created_at.desc()).all()

    return {
        "total": len(products),
        "items": [_to_full_response(p) for p in products],
    }


@router.get("", response_model=dict)
def list_products(
    db: Session = Depends(get_db),
    search: Optional[str] = Query(None),
    categorie: Optional[ProductCategorie] = Query(None),
    occasion: Optional[ProductOccasion] = Query(None),
    tissu: Optional[str] = Query(None),
    prix_min: Optional[int] = Query(None, ge=0),
    prix_max: Optional[int] = Query(None, ge=0),
    is_sur_mesure: Optional[bool] = Query(None),
    shop_id: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    query = db.query(Product).filter(Product.actif == True)

    if search:
        query = query.filter(
            or_(
                Product.titre.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )
    if categorie:
        query = query.filter(Product.categorie == categorie)
    if occasion:
        query = query.filter(Product.occasion == occasion)
    if tissu:
        query = query.filter(Product.tissu.ilike(f"%{tissu}%"))
    if prix_min is not None:
        query = query.filter(Product.prix >= prix_min)
    if prix_max is not None:
        query = query.filter(Product.prix <= prix_max)
    if is_sur_mesure is not None:
        query = query.filter(Product.is_sur_mesure == is_sur_mesure)
    if shop_id:
        query = query.filter(Product.shop_id == shop_id)

    total = query.count()
    products = query.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "items": [_to_list_response(p) for p in products],
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.actif == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    # Incrémenter les vues
    product.nb_vues += 1
    db.commit()
    db.refresh(product)

    return _to_full_response(product)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id, Shop.is_active == True).first()
    if not shop:
        raise HTTPException(status_code=403, detail="Vous devez avoir une boutique active")

    product = Product(shop_id=shop.id, **payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_full_response(product)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    product = db.query(Product).filter(Product.id == product_id, Product.shop_id == shop.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return _to_full_response(product)


@router.post("/{product_id}/images", response_model=ProductResponse)
async def add_image(
    product_id: int,
    file: UploadFile = File(...),
    angle: Optional[str] = Query(None, description="face | dos | detail"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    product = db.query(Product).filter(Product.id == product_id, Product.shop_id == shop.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    if len(product.images) >= 6:
        raise HTTPException(status_code=400, detail="Maximum 6 images par produit")

    result = await upload_product_image(file, product_id)
    ordre = len(product.images)

    image = ProductImage(
        product_id=product_id,
        url_cloudinary=result["url"],
        public_id=result["public_id"],
        ordre=ordre,
        angle=angle,
    )
    db.add(image)
    db.commit()
    db.refresh(product)
    return _to_full_response(product)


@router.delete("/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    product = db.query(Product).filter(Product.id == product_id, Product.shop_id == shop.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    image = db.query(ProductImage).filter(ProductImage.id == image_id, ProductImage.product_id == product_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image introuvable")

    if image.public_id:
        delete_image(image.public_id)

    db.delete(image)
    db.commit()


@router.get("/{product_id}/size-recommendation", response_model=SizeRecommendation)
def get_size_recommendation(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    product = db.query(Product).filter(Product.id == product_id, Product.actif == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    if not product.tailles_guide:
        return SizeRecommendation(
            taille_recommandee=None,
            message="Ce vendeur n'a pas encore fourni de guide de tailles.",
            indice_confiance=0.0,
        )

    user_mensurations = current_user.mensurations
    if not user_mensurations or not user_mensurations.get("poitrine"):
        return SizeRecommendation(
            taille_recommandee=None,
            message="Renseignez vos mensurations dans votre profil pour obtenir une recommandation.",
            indice_confiance=0.0,
        )

    # Algorithme simple de correspondance basé sur la poitrine
    poitrine = user_mensurations["poitrine"]
    best_taille = None
    best_score = float("inf")

    for taille, mesures in product.tailles_guide.items():
        if isinstance(mesures, dict) and "poitrine" in mesures:
            ref = mesures["poitrine"]
            # Format "80-84" ou valeur directe
            if isinstance(ref, str) and "-" in ref:
                parts = ref.split("-")
                mid = (float(parts[0]) + float(parts[1])) / 2
            else:
                mid = float(ref)

            score = abs(poitrine - mid)
            if score < best_score:
                best_score = score
                best_taille = taille

    if not best_taille:
        return SizeRecommendation(
            taille_recommandee=None,
            message="Impossible de déterminer votre taille pour ce produit.",
            indice_confiance=0.0,
        )

    # Indice de confiance selon l'écart
    if best_score <= 2:
        confiance = 0.95
        note = "Correspond parfaitement à vos mensurations."
    elif best_score <= 5:
        confiance = 0.80
        note = "Correspond bien — article légèrement taillé petit."
    else:
        confiance = 0.55
        note = "Correspondance approximative. Consultez le guide complet."

    return SizeRecommendation(
        taille_recommandee=best_taille,
        message=f"Votre taille pour ce produit est {best_taille}. {note}",
        indice_confiance=confiance,
        details=note,
    )
