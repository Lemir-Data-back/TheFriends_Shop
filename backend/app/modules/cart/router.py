from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import (
    CartItemAdd,
    CartItemUpdate,
    CartItemResponse,
    CartResponse,
    CartVendeurGroup,
    ProductSnapshotResponse,
)

router = APIRouter(prefix="/cart", tags=["Panier"])


def _get_or_create_cart(client_id: int, db: Session) -> Cart:
    cart = db.query(Cart).filter(Cart.client_id == client_id).first()
    if not cart:
        cart = Cart(client_id=client_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _build_cart_response(cart: Cart, db: Session) -> CartResponse:
    items_loaded = (
        db.query(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.shop))
        .filter(CartItem.cart_id == cart.id)
        .all()
    )

    # Regrouper par boutique
    groupes: dict[int, CartVendeurGroup] = {}
    total = 0

    for item in items_loaded:
        product = item.product
        shop = product.shop
        cover_url = product.images[0].url_cloudinary if product.images else None

        item_response = CartItemResponse(
            id=item.id,
            product_id=item.product_id,
            product=ProductSnapshotResponse(
                id=product.id,
                titre=product.titre,
                shop_id=shop.id,
                shop_nom=shop.nom,
                cover_url=cover_url,
                is_sur_mesure=product.is_sur_mesure,
            ),
            taille=item.taille,
            couleur=item.couleur,
            quantite=item.quantite,
            prix_unitaire=item.prix_unitaire,
            prix_promo=item.prix_promo,
            prix_effectif=item.prix_effectif,
            sous_total=item.sous_total,
            created_at=item.created_at,
        )

        if shop.id not in groupes:
            groupes[shop.id] = CartVendeurGroup(
                shop_id=shop.id,
                shop_nom=shop.nom,
                items=[],
                sous_total_boutique=0,
            )
        groupes[shop.id].items.append(item_response)
        groupes[shop.id].sous_total_boutique += item.sous_total
        total += item.sous_total

    return CartResponse(
        id=cart.id,
        nb_articles=sum(i.quantite for i in items_loaded),
        total=total,
        groupes=list(groupes.values()),
        updated_at=cart.updated_at,
    )


@router.get("", response_model=CartResponse)
def get_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(current_user.id, db)
    return _build_cart_response(cart, db)


@router.post("/items", response_model=CartResponse, status_code=status.HTTP_201_CREATED)
def add_item(
    payload: CartItemAdd,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    product = db.query(Product).filter(
        Product.id == payload.product_id, Product.actif == True
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    cart = _get_or_create_cart(current_user.id, db)

    # Vérifier si l'article existe déjà (même produit + taille + couleur)
    existing = db.query(CartItem).filter(
        CartItem.cart_id == cart.id,
        CartItem.product_id == payload.product_id,
        CartItem.taille == payload.taille,
        CartItem.couleur == payload.couleur,
    ).first()

    if existing:
        existing.quantite = min(existing.quantite + payload.quantite, 10)
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=payload.product_id,
            taille=payload.taille,
            couleur=payload.couleur,
            quantite=payload.quantite,
            prix_unitaire=product.prix,
            prix_promo=product.prix_promo,
        )
        db.add(item)

    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, db)


@router.patch("/items/{item_id}", response_model=CartResponse)
def update_item(
    item_id: int,
    payload: CartItemUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(
        CartItem.id == item_id, CartItem.cart_id == cart.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Article introuvable")

    if payload.quantite == 0:
        db.delete(item)
    else:
        item.quantite = payload.quantite

    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, db)


@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_item(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(current_user.id, db)
    item = db.query(CartItem).filter(
        CartItem.id == item_id, CartItem.cart_id == cart.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Article introuvable")

    db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart, db)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_cart(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    cart = _get_or_create_cart(current_user.id, db)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    db.commit()
