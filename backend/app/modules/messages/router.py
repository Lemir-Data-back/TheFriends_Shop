from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.modules.utilisateurs.models import User, UserRole
from app.modules.messages.models import Conversation, Message
from app.modules.boutiques.models import Shop
from app.modules.commandes.models import Order
from app.modules.messages.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
)

router = APIRouter(prefix="/messages", tags=["Messagerie"])


def _get_shop_for_user(user: User, db: Session) -> Shop | None:
    return db.query(Shop).filter(Shop.user_id == user.id).first()


def _nb_non_lus(conv: Conversation, user: User) -> int:
    if user.role == UserRole.CLIENT:
        return conv.nb_non_lus_client
    return conv.nb_non_lus_shop


@router.get("", response_model=list[ConversationResponse])
def list_conversations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role == UserRole.CLIENT:
        convs = (
            db.query(Conversation)
            .filter(Conversation.client_id == current_user.id)
            .order_by(Conversation.dernier_message_at.desc().nullslast())
            .all()
        )
    else:
        shop = _get_shop_for_user(current_user, db)
        if not shop:
            return []
        convs = (
            db.query(Conversation)
            .filter(Conversation.shop_id == shop.id)
            .order_by(Conversation.dernier_message_at.desc().nullslast())
            .all()
        )

    result = []
    for conv in convs:
        shop = db.query(Shop).filter(Shop.id == conv.shop_id).first()
        result.append(ConversationResponse(
            id=conv.id,
            client_id=conv.client_id,
            shop_id=conv.shop_id,
            shop_nom=shop.nom if shop else "Boutique",
            order_id=conv.order_id,
            dernier_message=conv.dernier_message,
            dernier_message_at=conv.dernier_message_at,
            nb_non_lus=_nb_non_lus(conv, current_user),
            created_at=conv.created_at,
        ))
    return result


@router.post("", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    payload: ConversationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    shop = db.query(Shop).filter(Shop.id == payload.shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")

    if current_user.role == UserRole.CLIENT:
        client_id = current_user.id
    elif current_user.role in (UserRole.VENDEUR, UserRole.COUTURIER):
        if not current_user.shop or shop.id != current_user.shop.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
        if payload.order_id:
            order = db.query(Order).filter(Order.id == payload.order_id, Order.shop_id == shop.id).first()
            if not order:
                raise HTTPException(status_code=404, detail="Commande introuvable")
            client_id = order.client_id
        elif payload.client_id:
            client_id = payload.client_id
        else:
            raise HTTPException(status_code=400, detail="client_id ou order_id requis pour initier une conversation")
    else:
        raise HTTPException(status_code=403, detail="Accès refusé")

    # Vérifier si conversation existante pour cette commande
    existing = db.query(Conversation).filter(
        Conversation.client_id == client_id,
        Conversation.shop_id == payload.shop_id,
        Conversation.order_id == payload.order_id,
    ).first()

    if existing:
        # Ajouter le message à la conversation existante
        _add_message(existing, current_user.id, payload.premier_message, db)
        db.refresh(existing)
        return _build_detail(existing, shop, db)

    is_client_sender = current_user.role == UserRole.CLIENT
    conv = Conversation(
        client_id=client_id,
        shop_id=payload.shop_id,
        order_id=payload.order_id,
        dernier_message=payload.premier_message[:100],
        dernier_message_at=datetime.now(timezone.utc),
        nb_non_lus_shop=1 if is_client_sender else 0,
        nb_non_lus_client=0 if is_client_sender else 1,
    )
    db.add(conv)
    db.flush()

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user.id,
        contenu=payload.premier_message,
    )
    db.add(msg)
    db.commit()
    db.refresh(conv)
    return _build_detail(conv, shop, db)


@router.get("/{conv_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conv_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).options(
        joinedload(Conversation.messages)
    ).filter(Conversation.id == conv_id).first()

    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    _check_access(conv, current_user, db)

    # Marquer comme lus
    if current_user.role == UserRole.CLIENT:
        conv.nb_non_lus_client = 0
    else:
        conv.nb_non_lus_shop = 0

    for msg in conv.messages:
        if msg.sender_id != current_user.id:
            msg.is_lu = True

    db.commit()
    db.refresh(conv)

    shop = db.query(Shop).filter(Shop.id == conv.shop_id).first()
    return _build_detail(conv, shop, db)


@router.post("/{conv_id}/messages", response_model=MessageResponse, status_code=201)
def send_message(
    conv_id: int,
    payload: MessageCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    conv = db.query(Conversation).filter(Conversation.id == conv_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation introuvable")

    _check_access(conv, current_user, db)

    msg = _add_message(conv, current_user.id, payload.contenu, db, payload.image_url)
    db.commit()
    db.refresh(msg)
    return MessageResponse.model_validate(msg)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _check_access(conv: Conversation, user: User, db: Session):
    if user.role == UserRole.CLIENT:
        if conv.client_id != user.id:
            raise HTTPException(status_code=403, detail="Accès refusé")
    else:
        shop = _get_shop_for_user(user, db)
        if not shop or conv.shop_id != shop.id:
            raise HTTPException(status_code=403, detail="Accès refusé")


def _add_message(
    conv: Conversation,
    sender_id: int,
    contenu: str,
    db: Session,
    image_url: str | None = None,
) -> Message:
    msg = Message(
        conversation_id=conv.id,
        sender_id=sender_id,
        contenu=contenu,
        image_url=image_url,
    )
    db.add(msg)

    conv.dernier_message = contenu[:100]
    conv.dernier_message_at = datetime.now(timezone.utc)

    # Incrémenter non-lus pour le destinataire
    if sender_id == conv.client_id:
        conv.nb_non_lus_shop += 1
    else:
        conv.nb_non_lus_client += 1

    return msg


def _build_detail(conv: Conversation, shop, db: Session) -> ConversationDetailResponse:
    messages = db.query(Message).filter(
        Message.conversation_id == conv.id
    ).order_by(Message.created_at).all()

    return ConversationDetailResponse(
        id=conv.id,
        client_id=conv.client_id,
        shop_id=conv.shop_id,
        shop_nom=shop.nom if shop else "Boutique",
        order_id=conv.order_id,
        messages=[MessageResponse.model_validate(m) for m in messages],
        created_at=conv.created_at,
    )
