from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.modules.utilisateurs.models import User, UserRole
from app.modules.boutiques.models import Shop
from app.modules.boutiques.schemas import ShopCreate, ShopUpdate, ShopResponse, ShopPublicResponse
from app.api.deps import get_current_active_user
from app.services.cloudinary_service import upload_shop_photo

router = APIRouter(prefix="/shops", tags=["Boutiques"])


@router.get("", response_model=list[ShopPublicResponse])
def list_shops(
    type: str | None = Query(None, description="couturier | boutique | marque"),
    zone: str | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(40, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    """Liste publique des boutiques validées et actives."""
    q = db.query(Shop).filter(Shop.is_active == True, Shop.is_validated == True)
    if type:
        q = q.filter(Shop.type == type)
    if zone:
        q = q.filter(Shop.zone.ilike(f"%{zone}%"))
    if search:
        q = q.filter(Shop.nom.ilike(f"%{search}%"))
    shops = q.order_by(desc(Shop.nb_commandes)).offset(offset).limit(limit).all()
    return [ShopPublicResponse.model_validate(s) for s in shops]


@router.post("", response_model=ShopResponse, status_code=status.HTTP_201_CREATED)
def create_shop(
    payload: ShopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if current_user.role == UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Les clients ne peuvent pas créer une boutique")

    existing = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà une boutique")

    shop = Shop(user_id=current_user.id, **payload.model_dump())
    db.add(shop)
    db.commit()
    db.refresh(shop)
    return ShopResponse.model_validate(shop)


@router.get("/{shop_id}", response_model=ShopPublicResponse)
def get_shop(shop_id: int, db: Session = Depends(get_db)):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.is_active == True).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    return ShopPublicResponse.model_validate(shop)


@router.patch("/{shop_id}", response_model=ShopResponse)
def update_shop(
    shop_id: int,
    payload: ShopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(shop, field, value)

    db.commit()
    db.refresh(shop)
    return ShopResponse.model_validate(shop)


@router.post("/{shop_id}/photo", response_model=ShopResponse)
async def upload_photo(
    shop_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.id == shop_id, Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")

    result = await upload_shop_photo(file, shop_id)
    shop.photo_url = result["url"]
    db.commit()
    db.refresh(shop)
    return ShopResponse.model_validate(shop)


@router.get("/me/shop", response_model=ShopResponse)
def get_my_shop(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Vous n'avez pas encore de boutique")
    return ShopResponse.model_validate(shop)
