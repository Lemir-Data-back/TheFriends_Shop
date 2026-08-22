import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.modules.utilisateurs.models import User, UserRole
from app.modules.panier.models import Cart, CartItem
from app.modules.commandes.models import Order, OrderStatut, OrderType, EscrowStatut, CreationRequest
from app.modules.paiements.models import Payment, PaymentStatut, PaymentOperateur
from app.modules.produits.models import Product
from app.modules.commandes.schemas import (
    OrderCreateFromCart,
    OrderResponse,
    OrderListResponse,
    OrderUpdateStatut,
    OrderNegotiationAction,
    PaymentInitRequest,
    PaymentInitResponse,
    CinetPayWebhookPayload,
    CreationRequestCreate,
    CreationRequestResponse,
    DevisReponse,
)
from app.modules.paiements import cinetpay_service
from app.core.config import settings

router = APIRouter(prefix="/orders", tags=["Commandes"])


def _generate_reference() -> str:
    return f"TF-{uuid.uuid4().hex[:8].upper()}"


# ─── Commandes ────────────────────────────────────────────────────────────────

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreateFromCart,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Crée une commande depuis les articles du panier pour une boutique donnée."""
    cart = db.query(Cart).filter(Cart.client_id == current_user.id).first()
    if not cart:
        raise HTTPException(status_code=400, detail="Panier vide")

    items = (
        db.query(CartItem)
        .join(Product)
        .filter(CartItem.cart_id == cart.id, Product.shop_id == payload.shop_id)
        .all()
    )
    if not items:
        raise HTTPException(status_code=400, detail="Aucun article pour cette boutique")

    montant = sum(i.sous_total for i in items)
    is_sur_mesure = any(i.product.is_sur_mesure for i in items)

    order = Order(
        reference=_generate_reference(),
        client_id=current_user.id,
        shop_id=payload.shop_id,
        type=OrderType.SUR_MESURE if is_sur_mesure else OrderType.PRET_A_PORTER,
        statut=OrderStatut.EN_ATTENTE,
        escrow_statut=EscrowStatut.EN_ATTENTE,
        montant=montant,
        items=[
            {
                "product_id": i.product_id,
                "titre": i.product.titre,
                "taille": i.taille,
                "couleur": i.couleur,
                "quantite": i.quantite,
                "prix": i.prix_effectif,
            }
            for i in items
        ],
        adresse_livraison=payload.adresse_livraison.model_dump(),
        note_client=payload.note_client,
    )
    db.add(order)

    # Retirer les articles commandés du panier
    for item in items:
        db.delete(item)

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.get("", response_model=OrderListResponse)
def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    statut: OrderStatut | None = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(joinedload(Order.client))

    # Client voit ses commandes, vendeur voit celles de sa boutique
    if current_user.role == UserRole.CLIENT:
        query = query.filter(Order.client_id == current_user.id)
    elif current_user.role in (UserRole.VENDEUR, UserRole.COUTURIER):
        if not current_user.shop:
            raise HTTPException(status_code=404, detail="Boutique introuvable")
        query = query.filter(Order.shop_id == current_user.shop.id)

    if statut:
        query = query.filter(Order.statut == statut)

    total = query.count()
    orders = query.order_by(Order.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return OrderListResponse(
        items=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    # Vérifier accès
    if current_user.role == UserRole.CLIENT and order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    if current_user.role in (UserRole.VENDEUR, UserRole.COUTURIER):
        if not current_user.shop or order.shop_id != current_user.shop.id:
            raise HTTPException(status_code=403, detail="Accès refusé")

    return OrderResponse.model_validate(order)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _derniere_offre_live(order: Order) -> dict | None:
    """Retourne la dernière entrée de négociation si elle représente une offre en attente de réponse."""
    if not order.negociations:
        return None
    derniere = order.negociations[-1]
    return derniere if derniere.get("action") in ("proposer", "contre") else None


@router.patch("/{order_id}/statut", response_model=OrderResponse)
def update_order_statut(
    order_id: int,
    payload: OrderUpdateStatut,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    # Règles de transition
    if current_user.role == UserRole.CLIENT:
        # Le client peut seulement confirmer la réception
        if payload.statut != OrderStatut.CONFIRME:
            raise HTTPException(status_code=403, detail="Action non autorisée")
        if order.statut != OrderStatut.LIVRE:
            raise HTTPException(status_code=400, detail="La commande n'a pas encore été livrée")
        # Libérer l'escrow
        order.escrow_statut = EscrowStatut.LIBERE
        if order.payment:
            order.payment.statut = PaymentStatut.SUCCES

    elif current_user.role in (UserRole.VENDEUR, UserRole.COUTURIER):
        if not current_user.shop or order.shop_id != current_user.shop.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if order.statut != OrderStatut.EN_ATTENTE and payload.statut in (OrderStatut.ACCEPTEE, OrderStatut.ANNULE):
            raise HTTPException(status_code=400, detail="Cette commande a déjà été traitée")

        offre_live = _derniere_offre_live(order)

        if payload.statut == OrderStatut.ACCEPTEE:
            # Accepter implicitement l'offre négociée si elle est encore en attente
            if offre_live:
                order.montant = offre_live["prix"]
                order.negociations = order.negociations + [{
                    "auteur": "shop", "action": "accepter", "prix": None, "message": None,
                    "created_at": _now_iso(),
                }]
            if payload.delai_jours:
                order.delai_confection_jours = payload.delai_jours
                order.date_livraison_promise = datetime.now(timezone.utc) + timedelta(days=payload.delai_jours)

        if payload.statut == OrderStatut.ANNULE:
            # Refus de la commande → remboursement du client
            order.escrow_statut = EscrowStatut.REMBOURSE
            if order.payment:
                order.payment.statut = PaymentStatut.REMBOURSE
            if offre_live:
                order.negociations = order.negociations + [{
                    "auteur": "shop", "action": "refuser", "prix": None, "message": None,
                    "created_at": _now_iso(),
                }]

        if payload.statut == OrderStatut.LIVRE:
            order.date_livraison_reelle = datetime.now(timezone.utc)

    order.statut = payload.statut
    if payload.note:
        if current_user.role == UserRole.CLIENT:
            order.note_client = payload.note
        else:
            order.note_vendeur = payload.note

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


@router.post("/{order_id}/negociation", response_model=OrderResponse)
def negocier(
    order_id: int,
    payload: OrderNegotiationAction,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Conversation de négociation libre sur une commande sur mesure : proposer, contre-offrir,
    accepter ou refuser — client et couturier peuvent enchaîner les tours librement."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    if current_user.role == UserRole.CLIENT:
        if order.client_id != current_user.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
        auteur = "client"
    elif current_user.role in (UserRole.VENDEUR, UserRole.COUTURIER):
        if not current_user.shop or order.shop_id != current_user.shop.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
        auteur = "shop"
    else:
        raise HTTPException(status_code=403, detail="Accès refusé")

    if order.type != OrderType.SUR_MESURE:
        raise HTTPException(status_code=400, detail="La négociation n'est possible que pour le sur mesure")
    if order.statut != OrderStatut.EN_ATTENTE:
        raise HTTPException(status_code=400, detail="Cette commande ne peut plus être négociée")

    negociations = order.negociations or []
    derniere = negociations[-1] if negociations else None
    if derniere and derniere.get("action") == "accepter":
        raise HTTPException(status_code=400, detail="La négociation est déjà conclue")
    offre_live_de = derniere.get("auteur") if derniere and derniere.get("action") in ("proposer", "contre") else None

    if payload.action in ("proposer", "contre"):
        if payload.prix is None or payload.prix <= 0:
            raise HTTPException(status_code=400, detail="Un prix est requis pour proposer ou contre-offrir")

        if not negociations:
            if payload.action != "proposer" or auteur != "client":
                raise HTTPException(status_code=400, detail="La négociation doit être ouverte par le client")
        elif offre_live_de is not None:
            if offre_live_de == auteur:
                raise HTTPException(status_code=400, detail="Une offre de ta part est déjà en attente de réponse")
            # sinon : l'autre partie contre l'offre en attente — équivaut à un refus + nouvelle offre
        # si la dernière offre a été refusée, les deux parties peuvent relancer librement

        if auteur == "client":
            if payload.prix >= order.montant:
                raise HTTPException(status_code=400, detail="La contre-offre doit être inférieure au prix affiché")
            plancher = None
            if order.items:
                product = db.query(Product).filter(Product.id == order.items[0].get("product_id")).first()
                if product and product.prix_plancher_negociation:
                    plancher = product.prix_plancher_negociation
            if plancher is not None and payload.prix < plancher:
                raise HTTPException(
                    status_code=400,
                    detail=f"Le prix proposé doit être d'au moins {plancher} FCFA",
                )

        negociations = negociations + [{
            "auteur": auteur, "action": payload.action,
            "prix": payload.prix, "message": payload.message,
            "created_at": _now_iso(),
        }]
        order.negociations = negociations

    elif payload.action in ("accepter", "refuser"):
        if offre_live_de is None:
            raise HTTPException(status_code=400, detail="Aucune offre en attente de réponse")
        if offre_live_de == auteur:
            raise HTTPException(status_code=400, detail="Tu ne peux pas répondre à ta propre offre")

        if payload.action == "accepter":
            order.montant = derniere["prix"]

        negociations = negociations + [{
            "auteur": auteur, "action": payload.action,
            "prix": None, "message": payload.message,
            "created_at": _now_iso(),
        }]
        order.negociations = negociations

    db.commit()
    db.refresh(order)
    return OrderResponse.model_validate(order)


# ─── Paiement CinetPay ────────────────────────────────────────────────────────

@router.post("/payment/init", response_model=PaymentInitResponse)
async def init_payment(
    payload: PaymentInitRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(
        Order.id == payload.order_id,
        Order.client_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    if order.statut != OrderStatut.EN_ATTENTE:
        raise HTTPException(status_code=400, detail="Commande déjà payée ou annulée")

    transaction_id = cinetpay_service._generate_transaction_id(order.reference)
    return_url = f"{settings.FRONTEND_URL}/commandes/{order.id}?payment=success"
    notify_url = f"http://localhost:8000/api/v1/orders/payment/webhook"

    try:
        result = await cinetpay_service.initier_paiement(
            transaction_id=transaction_id,
            montant=order.montant,
            description=f"Commande {order.reference} - TheFriends Shopping",
            return_url=return_url,
            notify_url=notify_url,
            telephone=payload.telephone,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    # Enregistrer le paiement en attente
    operateur_map = {
        "wave": PaymentOperateur.WAVE,
        "orange_money": PaymentOperateur.ORANGE_MONEY,
        "mtn_money": PaymentOperateur.MTN_MONEY,
        "carte": PaymentOperateur.CARTE,
    }
    payment = Payment(
        order_id=order.id,
        montant=order.montant,
        operateur=operateur_map.get(payload.operateur, PaymentOperateur.WAVE),
        statut=PaymentStatut.EN_ATTENTE,
        ref_cinetpay=transaction_id,
    )
    db.add(payment)
    order.escrow_statut = EscrowStatut.EN_ATTENTE
    db.commit()

    return PaymentInitResponse(
        payment_url=result["payment_url"],
        transaction_id=transaction_id,
        reference=order.reference,
        montant=order.montant,
    )


@router.post("/payment/webhook", status_code=status.HTTP_200_OK)
async def cinetpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Callback CinetPay après paiement."""
    body = await request.json()

    transaction_id = body.get("cpm_trans_id")
    if not transaction_id:
        return {"message": "ignored"}

    payment = db.query(Payment).filter(Payment.ref_cinetpay == transaction_id).first()
    if not payment:
        return {"message": "payment not found"}

    # Vérifier le paiement auprès de CinetPay
    verification = await cinetpay_service.verifier_paiement(transaction_id)
    code = verification.get("code")

    if code == "00":  # Paiement réussi
        payment.statut = PaymentStatut.SUCCES
        payment.paid_at = datetime.now(timezone.utc)
        payment.order.statut = OrderStatut.ACCEPTEE
        payment.order.escrow_statut = EscrowStatut.BLOQUE
    else:
        payment.statut = PaymentStatut.ECHEC

    db.commit()
    return {"message": "ok"}


# ─── Commandes sur mesure ─────────────────────────────────────────────────────

@router.post("/sur-mesure", response_model=CreationRequestResponse, status_code=201)
def create_creation_request(
    payload: CreationRequestCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    req = CreationRequest(
        client_id=current_user.id,
        description=payload.description,
        mensurations=payload.mensurations or current_user.mensurations,
        option_diffusion=payload.option_diffusion,
        couturier_favori_id=payload.couturier_favori_id,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return CreationRequestResponse.model_validate(req)


@router.get("/sur-mesure", response_model=list[CreationRequestResponse])
def list_creation_requests(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.CLIENT:
        reqs = db.query(CreationRequest).filter(
            CreationRequest.client_id == current_user.id
        ).order_by(CreationRequest.created_at.desc()).all()
    elif current_user.role == UserRole.COUTURIER:
        # Le couturier voit les demandes ouvertes diffusées à tous
        reqs = db.query(CreationRequest).filter(
            CreationRequest.option_diffusion == "tous"
        ).order_by(CreationRequest.created_at.desc()).limit(50).all()
    else:
        reqs = []
    return [CreationRequestResponse.model_validate(r) for r in reqs]


@router.post("/sur-mesure/{request_id}/devis", response_model=CreationRequestResponse)
def soumettre_devis(
    request_id: int,
    payload: DevisReponse,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.COUTURIER or not current_user.shop:
        raise HTTPException(status_code=403, detail="Réservé aux couturiers")

    req = db.query(CreationRequest).filter(CreationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    devis = list(req.devis or [])
    # Remplacer si déjà soumis par ce couturier
    devis = [d for d in devis if d.get("shop_id") != current_user.shop.id]
    devis.append({
        "shop_id": current_user.shop.id,
        "shop_nom": current_user.shop.nom,
        "prix": payload.prix,
        "delai_jours": payload.delai_jours,
        "message": payload.message,
    })
    req.devis = devis
    db.commit()
    db.refresh(req)
    return CreationRequestResponse.model_validate(req)
