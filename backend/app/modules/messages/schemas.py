from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MessageCreate(BaseModel):
    contenu: str = Field(..., min_length=1, max_length=2000)
    image_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    contenu: str
    image_url: Optional[str] = None
    is_lu: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationCreate(BaseModel):
    shop_id: int
    order_id: Optional[int] = None
    premier_message: str = Field(..., min_length=1, max_length=2000)


class ConversationResponse(BaseModel):
    id: int
    client_id: int
    shop_id: int
    shop_nom: str
    order_id: Optional[int] = None
    dernier_message: Optional[str] = None
    dernier_message_at: Optional[datetime] = None
    nb_non_lus: int  # Adapté selon le rôle de l'appelant
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationDetailResponse(BaseModel):
    id: int
    client_id: int
    shop_id: int
    shop_nom: str
    order_id: Optional[int] = None
    messages: list[MessageResponse]
    created_at: datetime

    model_config = {"from_attributes": True}
