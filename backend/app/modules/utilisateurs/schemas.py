from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.modules.utilisateurs.models import UserRole


class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., pattern=r"^\+?[0-9]{8,15}$", description="Numéro de téléphone obligatoire")
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8)
    role: UserRole = UserRole.CLIENT
    # Obligatoire pour couturier/vendeur — la création du compte ouvre directement
    # la boutique/l'atelier, la personnalisation (description, slogan...) vient après.
    shop_nom: Optional[str] = Field(None, min_length=2, max_length=255)


class UserLoginRequest(BaseModel):
    identifier: str = Field(..., description="Email ou numéro de téléphone")
    password: str


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None
    score_confiance: float
    is_verified: bool
    mobile_money: Optional[dict] = None
    mensurations: Optional[dict] = None
    morphologie: Optional[str] = None
    tranche_age: Optional[str] = None

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class MensurationsUpdate(BaseModel):
    poitrine: Optional[float] = Field(None, gt=0, description="Tour de poitrine en cm")
    taille: Optional[float] = Field(None, gt=0, description="Tour de taille en cm")
    hanches: Optional[float] = Field(None, gt=0, description="Tour de hanches en cm")
    pointure: Optional[float] = Field(None, gt=0, description="Pointure")


class MobileMoneyUpdate(BaseModel):
    wave: Optional[str] = Field(None, pattern=r"^\+?[0-9]{8,15}$")
    orange_money: Optional[str] = Field(None, pattern=r"^\+?[0-9]{8,15}$")
    mtn_money: Optional[str] = Field(None, pattern=r"^\+?[0-9]{8,15}$")


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = Field(None, pattern=r"^\+?[0-9]{8,15}$")
    morphologie: Optional[str] = None
    tranche_age: Optional[str] = None
    mensurations: Optional[MensurationsUpdate] = None
    mobile_money: Optional[MobileMoneyUpdate] = None
