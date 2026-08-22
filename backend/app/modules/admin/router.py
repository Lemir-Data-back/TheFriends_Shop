"""
Panel d'administration — réservé au rôle ADMIN.
Gestion des utilisateurs, boutiques, litiges et statistiques globales.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.order import Order, OrderStatut, EscrowStatut
from app.models.product import Product
from app.models.review import Review
from app.models.shop import Shop
from app.models.user import User, UserRole

router = APIRouter(prefix="/admin", tags=["Administration"])


# ── Schémas réponse ───────────────────────────────────────────────────────────

class PlatformStats(BaseModel):
    nb_users_total: int
    nb_users_clients: int
    nb_users_couturiers: int
    nb_users_vendeurs: int
    nb_shops_total: int
    nb_shops_validees: int
    nb_shops_en_attente: int
    nb_commandes_total: int
    nb_commandes_en_cours: int
    nb_litiges_ouverts: int
    ca_total: int
    ca_mois: int
    nb_nouveaux_users_7j: int


class UserAdminOut(BaseModel):
    id: int
    full_name: str
    email: str | None
    phone: str | None
    role: str
    score_confiance: float
    is_active: bool
    is_verified: bool
    nb_commandes: int
    created_at: datetime

    class Config:
        from_attributes = True


class ShopAdminOut(BaseModel):
    id: int
    nom: str
    type: str
    zone: str | None
    is_active: bool
    is_validated: bool
    nb_commandes: int
    nb_avis: int
    score_moyen: float
    owner_name: str
    owner_phone: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderAdminOut(BaseModel):
    id: int
    reference: str
    client_nom: str
    shop_nom: str
    montant: int
    statut: str
    escrow_statut: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    is_active: bool | None = None
    role: str | None = None
    score_confiance: float | None = None


class DisputeResolve(BaseModel):
    verdict: str       # "rembourser_client" | "payer_vendeur" | "partager"
    note_admin: str | None = None


# ── Helpers ───────────────────────────────────────────────────────────────────

def _debut_mois():
    return datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Vue d'ensemble de la plateforme."""
    sept_jours = datetime.now(timezone.utc) - timedelta(days=7)

    # Utilisateurs
    users = db.query(User).all()
    nb_new_7j = db.query(func.count(User.id)).filter(User.created_at >= sept_jours).scalar() or 0

    # Boutiques
    nb_shops = db.query(func.count(Shop.id)).scalar() or 0
    nb_shops_valid = db.query(func.count(Shop.id)).filter(Shop.is_validated == True).scalar() or 0

    # Commandes
    commandes = db.query(Order).all()
    en_cours_statuts = [OrderStatut.ACCEPTEE, OrderStatut.EN_COURS, OrderStatut.EXPEDIE]
    nb_en_cours = sum(1 for o in commandes if o.statut in en_cours_statuts)
    nb_litiges = sum(1 for o in commandes if o.statut == OrderStatut.LITIGE)

    ca_total = sum(o.montant for o in commandes if o.statut == OrderStatut.CONFIRME)
    ca_mois = sum(
        o.montant for o in commandes
        if o.statut == OrderStatut.CONFIRME and o.created_at >= _debut_mois()
    )

    return PlatformStats(
        nb_users_total=len(users),
        nb_users_clients=sum(1 for u in users if u.role == UserRole.CLIENT),
        nb_users_couturiers=sum(1 for u in users if u.role == UserRole.COUTURIER),
        nb_users_vendeurs=sum(1 for u in users if u.role == UserRole.VENDEUR),
        nb_shops_total=nb_shops,
        nb_shops_validees=nb_shops_valid,
        nb_shops_en_attente=nb_shops - nb_shops_valid,
        nb_commandes_total=len(commandes),
        nb_commandes_en_cours=nb_en_cours,
        nb_litiges_ouverts=nb_litiges,
        ca_total=ca_total,
        ca_mois=ca_mois,
        nb_nouveaux_users_7j=nb_new_7j,
    )


@router.get("/users", response_model=list[UserAdminOut])
def list_users(
    role: str | None = Query(None),
    is_active: bool | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Liste tous les utilisateurs avec filtres et recherche."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    if search:
        q = q.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%")) |
            (User.phone.ilike(f"%{search}%"))
        )
    users = q.order_by(desc(User.created_at)).offset(offset).limit(limit).all()

    result = []
    for u in users:
        nb_cmd = db.query(func.count(Order.id)).filter(Order.client_id == u.id).scalar() or 0
        result.append(UserAdminOut(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            phone=u.phone,
            role=u.role.value if hasattr(u.role, "value") else u.role,
            score_confiance=u.score_confiance,
            is_active=u.is_active,
            is_verified=u.is_verified,
            nb_commandes=nb_cmd,
            created_at=u.created_at,
        ))
    return result


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Modifier un utilisateur : suspension, rôle, score confiance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Impossible de se modifier soi-même")

    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.role is not None:
        try:
            user.role = UserRole(payload.role)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Rôle invalide : {payload.role}")
    if payload.score_confiance is not None:
        user.score_confiance = max(0.0, min(5.0, payload.score_confiance))

    db.commit()
    db.refresh(user)
    nb_cmd = db.query(func.count(Order.id)).filter(Order.client_id == user.id).scalar() or 0
    return UserAdminOut(
        id=user.id, full_name=user.full_name, email=user.email, phone=user.phone,
        role=user.role.value if hasattr(user.role, "value") else user.role,
        score_confiance=user.score_confiance, is_active=user.is_active,
        is_verified=user.is_verified, nb_commandes=nb_cmd, created_at=user.created_at,
    )


@router.get("/shops", response_model=list[ShopAdminOut])
def list_shops(
    is_validated: bool | None = Query(None),
    search: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Liste toutes les boutiques."""
    q = db.query(Shop)
    if is_validated is not None:
        q = q.filter(Shop.is_validated == is_validated)
    if search:
        q = q.filter(Shop.nom.ilike(f"%{search}%"))
    shops = q.order_by(desc(Shop.created_at)).offset(offset).limit(limit).all()

    result = []
    for s in shops:
        score_moyen = (s.score_delais + s.score_qualite + (s.score_communication or 0)) / 3
        result.append(ShopAdminOut(
            id=s.id, nom=s.nom, type=s.type.value if hasattr(s.type, "value") else s.type,
            zone=s.zone, is_active=s.is_active, is_validated=s.is_validated,
            nb_commandes=s.nb_commandes, nb_avis=s.nb_avis, score_moyen=round(score_moyen, 2),
            owner_name=s.owner.full_name if s.owner else "—",
            owner_phone=s.owner.phone if s.owner else None,
            created_at=s.created_at,
        ))
    return result


@router.patch("/shops/{shop_id}/validate")
def validate_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Valider une boutique — la rend visible sur la plateforme."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    shop.is_validated = True
    shop.is_active = True
    db.commit()
    return {"message": f"Boutique '{shop.nom}' validée avec succès"}


@router.patch("/shops/{shop_id}/suspend")
def suspend_shop(
    shop_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Suspendre une boutique — masquée de la plateforme."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    shop.is_active = False
    db.commit()
    return {"message": f"Boutique '{shop.nom}' suspendue"}


@router.get("/disputes", response_model=list[OrderAdminOut])
def list_disputes(
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Liste tous les litiges ouverts."""
    orders = (
        db.query(Order)
        .filter(Order.statut == OrderStatut.LITIGE)
        .order_by(desc(Order.updated_at))
        .all()
    )
    result = []
    for o in orders:
        result.append(OrderAdminOut(
            id=o.id, reference=o.reference,
            client_nom=o.client.full_name if o.client else "—",
            shop_nom=o.shop.nom if o.shop else "—",
            montant=o.montant, statut=o.statut.value,
            escrow_statut=o.escrow_statut.value if o.escrow_statut else "—",
            created_at=o.created_at,
        ))
    return result


@router.patch("/disputes/{order_id}/resolve")
def resolve_dispute(
    order_id: int,
    payload: DisputeResolve,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """
    Arbitrage d'un litige.
    - rembourser_client : escrow REMBOURSE, commande REMBOURSE
    - payer_vendeur     : escrow LIBERE, commande CONFIRME
    - partager          : remboursement partiel (50/50)
    """
    order = db.query(Order).filter(Order.id == order_id, Order.statut == OrderStatut.LITIGE).first()
    if not order:
        raise HTTPException(status_code=404, detail="Litige introuvable ou déjà résolu")

    if payload.verdict == "rembourser_client":
        order.statut = OrderStatut.REMBOURSE
        order.escrow_statut = EscrowStatut.REMBOURSE
    elif payload.verdict == "payer_vendeur":
        order.statut = OrderStatut.CONFIRME
        order.escrow_statut = EscrowStatut.LIBERE
    elif payload.verdict == "partager":
        order.statut = OrderStatut.REMBOURSE
        order.escrow_statut = EscrowStatut.REMBOURSE
        order.penalite = order.montant // 2
    else:
        raise HTTPException(status_code=400, detail="Verdict invalide")

    if payload.note_admin:
        order.note_vendeur = f"[ADMIN] {payload.note_admin}"

    db.commit()
    return {"message": "Litige résolu", "verdict": payload.verdict}


@router.get("/orders", response_model=list[OrderAdminOut])
def list_all_orders(
    statut: str | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Vue globale de toutes les commandes."""
    q = db.query(Order)
    if statut:
        try:
            q = q.filter(Order.statut == OrderStatut(statut))
        except ValueError:
            pass
    orders = q.order_by(desc(Order.created_at)).offset(offset).limit(limit).all()
    return [
        OrderAdminOut(
            id=o.id, reference=o.reference,
            client_nom=o.client.full_name if o.client else "—",
            shop_nom=o.shop.nom if o.shop else "—",
            montant=o.montant, statut=o.statut.value,
            escrow_statut=o.escrow_statut.value if o.escrow_statut else "—",
            created_at=o.created_at,
        )
        for o in orders
    ]
