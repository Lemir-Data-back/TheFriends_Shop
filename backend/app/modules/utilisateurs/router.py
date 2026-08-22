from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.modules.utilisateurs.models import User
from app.modules.utilisateurs.schemas import ProfileUpdate, UserResponse

router = APIRouter(prefix="/dashboard", tags=["Utilisateurs"])


@router.get("/profil", response_model=UserResponse)
def get_profil(current_user: User = Depends(get_current_active_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/profil", response_model=UserResponse)
def update_profil(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.phone and payload.phone != current_user.phone:
        conflict = db.query(User).filter(
            User.phone == payload.phone,
            User.id != current_user.id,
        ).first()
        if conflict:
            raise HTTPException(status_code=400, detail="Ce numéro est déjà utilisé par un autre compte")
        current_user.phone = payload.phone
    if payload.morphologie:
        current_user.morphologie = payload.morphologie
    if payload.tranche_age:
        current_user.tranche_age = payload.tranche_age
    if payload.mensurations:
        existing = current_user.mensurations or {}
        existing.update(payload.mensurations.model_dump(exclude_none=True))
        current_user.mensurations = existing
    if payload.mobile_money:
        existing_mm = current_user.mobile_money or {}
        existing_mm.update(payload.mobile_money.model_dump(exclude_none=True))
        current_user.mobile_money = existing_mm

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
