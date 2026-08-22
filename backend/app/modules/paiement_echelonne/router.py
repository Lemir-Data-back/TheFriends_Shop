"""
Paiement en plusieurs tranches — vendeurs PAP uniquement.
Livraison déclenchée automatiquement quand le montant total est atteint.
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.modules.paiement_echelonne.models import OrderInstallment, PaymentPlan, Tranche
from app.modules.commandes.models import Order, OrderStatut
from app.modules.boutiques.models import Shop, ShopType
from app.modules.fonctionnalites.dependencies import get_module_status

router = APIRouter(prefix="/installments", tags=["installments"])


# ── Schémas ────────────────────────────────────────────────────────────────────

class PaymentPlanCreate(BaseModel):
    nom: str
    nb_tranches: int
    acompte_percent: int = 30
    intervalle_jours: int = 30
    montant_min: int = 10000
    montant_max: int | None = None
    frais_percent: float = 0.0

    @field_validator("nb_tranches")
    @classmethod
    def valid_tranches(cls, v):
        if v < 2 or v > 12:
            raise ValueError("Le nombre de tranches doit être entre 2 et 12")
        return v

    @field_validator("acompte_percent")
    @classmethod
    def valid_acompte(cls, v):
        if v < 10 or v > 80:
            raise ValueError("L'acompte doit être entre 10% et 80%")
        return v


class PaymentPlanOut(BaseModel):
    id: int
    shop_id: int
    nom: str
    nb_tranches: int
    acompte_percent: int
    intervalle_jours: int
    montant_min: int
    montant_max: int | None
    frais_percent: float
    is_active: bool

    class Config:
        from_attributes = True


class TrancheOut(BaseModel):
    id: int
    numero: int
    montant: int
    echeance: date
    paye_le: date | None
    statut: str

    class Config:
        from_attributes = True


class OrderInstallmentOut(BaseModel):
    id: int
    order_id: int
    payment_plan_id: int
    montant_total: int
    montant_paye: int
    reste_a_payer: int
    progression_percent: int
    statut: str
    tranches: list[TrancheOut]

    class Config:
        from_attributes = True


class InitInstallmentPayload(BaseModel):
    order_id: int
    payment_plan_id: int


# ── Helpers ────────────────────────────────────────────────────────────────────

def _generate_tranches(
    order_installment_id: int,
    montant_total: int,
    plan: PaymentPlan,
    today: date,
) -> list[Tranche]:
    montant_avec_frais = int(montant_total * (1 + plan.frais_percent / 100))
    acompte = int(montant_avec_frais * plan.acompte_percent / 100)
    reste = montant_avec_frais - acompte
    tranches_restantes = plan.nb_tranches - 1
    montant_par_tranche = reste // tranches_restantes if tranches_restantes > 0 else 0
    derniere_tranche = reste - montant_par_tranche * (tranches_restantes - 1)

    tranches = []
    for i in range(1, plan.nb_tranches + 1):
        if i == 1:
            montant = acompte
        elif i == plan.nb_tranches:
            montant = derniere_tranche
        else:
            montant = montant_par_tranche
        echeance = today + timedelta(days=plan.intervalle_jours * (i - 1))
        tranches.append(Tranche(
            order_installment_id=order_installment_id,
            numero=i,
            montant=montant,
            echeance=echeance,
            statut="en_attente",
        ))
    return tranches


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/plans/shop/{shop_id}", response_model=list[PaymentPlanOut])
def list_payment_plans(shop_id: int, db: Session = Depends(get_db)):
    """Plans de paiement actifs d'une boutique (public)."""
    return db.query(PaymentPlan).filter(
        PaymentPlan.shop_id == shop_id,
        PaymentPlan.is_active == True,
    ).all()


@router.post("/plans", response_model=PaymentPlanOut, status_code=status.HTTP_201_CREATED)
def create_payment_plan(
    payload: PaymentPlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Crée un plan de paiement — vendeurs PAP uniquement."""
    shop = db.query(Shop).filter(Shop.user_id == current_user.id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Vous n'avez pas de boutique")
    if shop.type == ShopType.COUTURIER:
        raise HTTPException(
            status_code=403,
            detail="Le paiement en tranches est réservé aux vendeurs PAP. "
                   "Les couturiers utilisent le système de jalons.",
        )

    module_status = get_module_status("installment_payment", "shop", shop.id, db)
    if not module_status["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Le module paiement en tranches n'est pas activé pour votre boutique.",
        )

    plan = PaymentPlan(shop_id=shop.id, **payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.patch("/plans/{plan_id}", response_model=PaymentPlanOut)
def update_payment_plan(
    plan_id: int,
    payload: PaymentPlanCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    plan = db.query(PaymentPlan).join(Shop).filter(
        PaymentPlan.id == plan_id,
        Shop.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan introuvable")
    for field, value in payload.model_dump().items():
        setattr(plan, field, value)
    db.commit()
    db.refresh(plan)
    return plan


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Désactive un plan (soft delete)."""
    plan = db.query(PaymentPlan).join(Shop).filter(
        PaymentPlan.id == plan_id,
        Shop.user_id == current_user.id,
    ).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan introuvable")
    plan.is_active = False
    db.commit()


@router.post("/orders/init", response_model=OrderInstallmentOut, status_code=status.HTTP_201_CREATED)
def init_order_installment(
    payload: InitInstallmentPayload,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Initialise le plan de paiement échelonné pour une commande."""
    order = db.query(Order).filter(
        Order.id == payload.order_id,
        Order.client_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    if order.statut != OrderStatut.EN_ATTENTE:
        raise HTTPException(status_code=400, detail="La commande n'est plus en attente")

    plan = db.query(PaymentPlan).filter(
        PaymentPlan.id == payload.payment_plan_id,
        PaymentPlan.is_active == True,
    ).first()
    if not plan or plan.shop_id != order.shop_id:
        raise HTTPException(status_code=404, detail="Plan de paiement introuvable")

    if order.montant < plan.montant_min:
        raise HTTPException(
            status_code=400,
            detail=f"Ce plan requiert un montant minimum de {plan.montant_min} FCFA",
        )
    if plan.montant_max and order.montant > plan.montant_max:
        raise HTTPException(
            status_code=400,
            detail=f"Ce plan est limité à {plan.montant_max} FCFA",
        )

    order_installment = OrderInstallment(
        order_id=order.id,
        payment_plan_id=plan.id,
        montant_total=order.montant,
        montant_paye=0,
        statut="en_cours",
    )
    db.add(order_installment)
    db.flush()

    tranches = _generate_tranches(order_installment.id, order.montant, plan, date.today())
    db.add_all(tranches)
    db.commit()
    db.refresh(order_installment)
    return order_installment


@router.get("/orders/{order_id}", response_model=OrderInstallmentOut)
def get_order_installment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Détail du plan de paiement d'une commande."""
    installment = db.query(OrderInstallment).join(Order).filter(
        OrderInstallment.order_id == order_id,
        Order.client_id == current_user.id,
    ).first()
    if not installment:
        raise HTTPException(status_code=404, detail="Aucun plan de paiement trouvé")
    return installment


@router.post("/tranches/{tranche_id}/confirm", response_model=OrderInstallmentOut)
def confirm_tranche_payment(
    tranche_id: int,
    payment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Confirme le paiement d'une tranche.
    Si toutes les tranches sont payées, déclenche la livraison automatiquement.
    """
    tranche = db.query(Tranche).filter(Tranche.id == tranche_id).first()
    if not tranche:
        raise HTTPException(status_code=404, detail="Tranche introuvable")

    tranche.statut = "paye"
    tranche.paye_le = date.today()
    tranche.payment_id = payment_id

    installment = db.query(OrderInstallment).filter(
        OrderInstallment.id == tranche.order_installment_id
    ).first()
    installment.montant_paye += tranche.montant

    if installment.is_complete:
        installment.statut = "complete"
        order = db.query(Order).filter(Order.id == installment.order_id).first()
        if order and order.statut == OrderStatut.EN_ATTENTE:
            order.statut = OrderStatut.ACCEPTEE
            # TODO: notification push Celery

    db.commit()
    db.refresh(installment)
    return installment
