from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.models.user import User
from app.schemas.user import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    RefreshTokenRequest,
    ProfileUpdate,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegisterRequest, db: Session = Depends(get_db)):
    # Vérifier unicité email
    if payload.email:
        existing = db.query(User).filter(User.email == payload.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    # Vérifier unicité téléphone
    if payload.phone:
        existing = db.query(User).filter(User.phone == payload.phone).first()
        if existing:
            raise HTTPException(status_code=400, detail="Ce numéro est déjà utilisé")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLoginRequest, db: Session = Depends(get_db)):
    # Chercher par email ou téléphone
    user = (
        db.query(User)
        .filter(
            (User.email == payload.identifier) | (User.phone == payload.identifier)
        )
        .first()
    )

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiants incorrects",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Compte désactivé")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Refresh token invalide")

    user = db.query(User).filter(User.id == int(token_data["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if payload.full_name:
        current_user.full_name = payload.full_name
    if payload.morphologie:
        current_user.morphologie = payload.morphologie
    if payload.tranche_age:
        current_user.tranche_age = payload.tranche_age
    if payload.mensurations:
        current_user.mensurations = payload.mensurations.model_dump(exclude_none=True)

    db.commit()
    db.refresh(current_user)
    return UserResponse.model_validate(current_user)
