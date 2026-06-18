from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.review import Review
from app.models.order import Order, OrderStatut
from app.models.shop import Shop
from app.schemas.dashboard import ReviewCreate, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Avis"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Réservé aux clients")

    order = db.query(Order).filter(
        Order.id == payload.order_id,
        Order.client_id == current_user.id,
        Order.statut == OrderStatut.CONFIRME,
    ).first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Commande introuvable ou non encore confirmée"
        )

    # Un seul avis par commande
    existing = db.query(Review).filter(Review.order_id == payload.order_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Avis déjà soumis pour cette commande")

    # Valider les scores
    for score in (payload.score_delais, payload.score_qualite, payload.score_communication):
        if not (1.0 <= score <= 5.0):
            raise HTTPException(status_code=422, detail="Les scores doivent être entre 1 et 5")

    review = Review(
        order_id=payload.order_id,
        reviewer_id=current_user.id,
        shop_id=order.shop_id,
        score_delais=payload.score_delais,
        score_qualite=payload.score_qualite,
        score_communication=payload.score_communication,
        commentaire=payload.commentaire,
    )
    db.add(review)

    # Recalculer les scores de la boutique
    shop = db.query(Shop).filter(Shop.id == order.shop_id).first()
    if shop:
        all_reviews = db.query(Review).filter(Review.shop_id == shop.id).all()
        n = len(all_reviews) + 1
        shop.score_delais = (
            sum(r.score_delais for r in all_reviews) + payload.score_delais
        ) / n
        shop.score_qualite = (
            sum(r.score_qualite for r in all_reviews) + payload.score_qualite
        ) / n
        shop.score_communication = (
            sum(r.score_communication for r in all_reviews) + payload.score_communication
        ) / n
        shop.nb_avis = n

    db.commit()
    db.refresh(review)

    score_moyen = (review.score_delais + review.score_qualite + review.score_communication) / 3
    return ReviewResponse(
        id=review.id,
        order_id=review.order_id,
        reviewer_id=review.reviewer_id,
        shop_id=review.shop_id,
        score_delais=review.score_delais,
        score_qualite=review.score_qualite,
        score_communication=review.score_communication,
        score_moyen=round(score_moyen, 2),
        commentaire=review.commentaire,
        created_at=review.created_at,
    )


@router.get("/shop/{shop_id}", response_model=list[ReviewResponse])
def get_shop_reviews(
    shop_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    reviews = (
        db.query(Review)
        .filter(Review.shop_id == shop_id)
        .order_by(Review.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    return [
        ReviewResponse(
            id=r.id,
            order_id=r.order_id,
            reviewer_id=r.reviewer_id,
            shop_id=r.shop_id,
            score_delais=r.score_delais,
            score_qualite=r.score_qualite,
            score_communication=r.score_communication,
            score_moyen=round((r.score_delais + r.score_qualite + r.score_communication) / 3, 2),
            commentaire=r.commentaire,
            created_at=r.created_at,
        )
        for r in reviews
    ]
