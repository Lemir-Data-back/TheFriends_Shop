from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    order_id: int
    score_delais: float
    score_qualite: float
    score_communication: float
    commentaire: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    reviewer_id: int
    shop_id: int
    score_delais: float
    score_qualite: float
    score_communication: float
    score_moyen: float
    commentaire: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
