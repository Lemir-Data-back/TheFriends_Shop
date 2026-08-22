"""
Panel d'administration — réservé au rôle ADMIN.
Gestion des utilisateurs, boutiques, litiges et statistiques globales.
"""
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, status, Query
from pydantic import BaseModel
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.modules.activity_log.service import get_client_ip, log_activity
from app.modules.activity_log.models import ActivityLog
from app.modules.commandes.models import Order, OrderStatut, EscrowStatut
from app.modules.produits.models import Product
from app.modules.avis.models import Review
from app.modules.boutiques.models import Shop
from app.modules.utilisateurs.models import User, UserRole

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
    badges: dict | None
    created_at: datetime

    class Config:
        from_attributes = True


class ShopBadgeUpdate(BaseModel):
    certifie: bool


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


class DailyPoint(BaseModel):
    date: str
    value: int


class StatsSeries(BaseModel):
    ca: list[DailyPoint]
    nouveaux_users: list[DailyPoint]
    commandes: list[DailyPoint]


class LogOut(BaseModel):
    id: int
    action: str
    ip_address: str | None
    details: dict | None
    created_at: datetime
    user_id: int | None
    user_name: str | None
    user_role: str | None


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


@router.get("/logs", response_model=list[LogOut])
def get_logs(
    action: str | None = Query(None),
    user_id: int | None = Query(None),
    period: str = Query("7d"),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Journal des événements de la plateforme avec filtres."""
    n_days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 7)
    start = datetime.now(timezone.utc) - timedelta(days=n_days)

    q = db.query(ActivityLog).filter(ActivityLog.created_at >= start)
    if action:
        q = q.filter(ActivityLog.action == action)
    if user_id:
        q = q.filter(ActivityLog.user_id == user_id)

    logs = q.order_by(desc(ActivityLog.created_at)).offset(offset).limit(limit).all()
    return [
        LogOut(
            id=l.id,
            action=l.action,
            ip_address=l.ip_address,
            details=l.details,
            created_at=l.created_at,
            user_id=l.user_id,
            user_name=l.user.full_name if l.user else None,
            user_role=l.user.role.value if l.user else None,
        )
        for l in logs
    ]


@router.patch("/users/{user_id}", response_model=UserAdminOut)
def update_user(
    user_id: int,
    payload: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Modifier un utilisateur : suspension, rôle, score confiance."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur introuvable")
    if user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Impossible de se modifier soi-même")

    changes: dict = {}
    if payload.is_active is not None:
        changes["is_active"] = payload.is_active
        user.is_active = payload.is_active
    if payload.role is not None:
        try:
            user.role = UserRole(payload.role)
            changes["role"] = payload.role
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Rôle invalide : {payload.role}")
    if payload.score_confiance is not None:
        user.score_confiance = max(0.0, min(5.0, payload.score_confiance))
        changes["score_confiance"] = user.score_confiance

    log_activity(db, "user_modifie", user_id=current_admin.id, ip=get_client_ip(request),
                 details={"cible_id": user_id, "modifications": changes})
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
            badges=s.badges,
            created_at=s.created_at,
        ))
    return result


@router.patch("/shops/{shop_id}/validate")
def validate_shop(
    shop_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Valider une boutique — la rend visible sur la plateforme."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    shop.is_validated = True
    shop.is_active = True
    log_activity(db, "boutique_validee", user_id=current_admin.id, ip=get_client_ip(request),
                 details={"shop_id": shop_id, "nom": shop.nom})
    db.commit()
    return {"message": f"Boutique '{shop.nom}' validée avec succès"}


@router.patch("/shops/{shop_id}/suspend")
def suspend_shop(
    shop_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Suspendre une boutique — masquée de la plateforme."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    shop.is_active = False
    log_activity(db, "boutique_suspendue", user_id=current_admin.id, ip=get_client_ip(request),
                 details={"shop_id": shop_id, "nom": shop.nom})
    db.commit()
    return {"message": f"Boutique '{shop.nom}' suspendue"}


@router.patch("/shops/{shop_id}/badge-fiable")
def update_shop_badge_fiable(
    shop_id: int,
    payload: ShopBadgeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
):
    """Certification manuelle du badge 'Couturier Fiable' — décision admin, pas de calcul auto."""
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    shop.badges = {**(shop.badges or {}), "couturier_fiable": payload.certifie}
    log_activity(
        db, "boutique_badge_fiable_certifie" if payload.certifie else "boutique_badge_fiable_revoque",
        user_id=current_admin.id, ip=get_client_ip(request),
        details={"shop_id": shop_id, "nom": shop.nom},
    )
    db.commit()
    action = "certifiée fiable" if payload.certifie else "n'est plus certifiée fiable"
    return {"message": f"Boutique '{shop.nom}' {action}"}


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
    request: Request,
    db: Session = Depends(get_db),
    current_admin=Depends(require_admin),
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

    log_activity(db, "litige_resolu", user_id=current_admin.id, ip=get_client_ip(request),
                 details={"order_id": order_id, "verdict": payload.verdict})
    db.commit()
    return {"message": "Litige résolu", "verdict": payload.verdict}


@router.get("/stats/series", response_model=StatsSeries)
def get_stats_series(
    period: str = Query("30d"),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Séries temporelles pour les graphes du dashboard admin."""
    n_days = {"7d": 7, "30d": 30, "90d": 90}.get(period, 30)
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=n_days)

    dates = [(now - timedelta(days=i)).date() for i in range(n_days - 1, -1, -1)]

    users_raw = (
        db.query(func.date(User.created_at).label("day"), func.count(User.id).label("cnt"))
        .filter(User.created_at >= start)
        .group_by(func.date(User.created_at))
        .all()
    )
    users_by_day: dict[str, int] = {str(r.day): r.cnt for r in users_raw}

    ca_raw = (
        db.query(func.date(Order.updated_at).label("day"), func.sum(Order.montant).label("total"))
        .filter(Order.statut == OrderStatut.CONFIRME, Order.updated_at >= start)
        .group_by(func.date(Order.updated_at))
        .all()
    )
    ca_by_day: dict[str, int] = {str(r.day): int(r.total or 0) for r in ca_raw}

    cmd_raw = (
        db.query(func.date(Order.created_at).label("day"), func.count(Order.id).label("cnt"))
        .filter(Order.created_at >= start)
        .group_by(func.date(Order.created_at))
        .all()
    )
    cmd_by_day: dict[str, int] = {str(r.day): r.cnt for r in cmd_raw}

    return StatsSeries(
        ca=[DailyPoint(date=str(d), value=ca_by_day.get(str(d), 0)) for d in dates],
        nouveaux_users=[DailyPoint(date=str(d), value=users_by_day.get(str(d), 0)) for d in dates],
        commandes=[DailyPoint(date=str(d), value=cmd_by_day.get(str(d), 0)) for d in dates],
    )


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
