"""
Endpoints de personnalisation de boutique.
"""
import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.modules.boutiques.theme_models import ShopTheme, POLICES_TITRES, POLICES_CORPS, HERO_STYLES, GRID_STYLES
from app.modules.boutiques.models import Shop

router = APIRouter(prefix="/shop-theme", tags=["shop-theme"])

HEX_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


# ── Schémas ────────────────────────────────────────────────────────────────────

class LayoutConfig(BaseModel):
    hero_style: str = "full"
    grid_style: str = "2col"
    sections: list[str] = ["banner", "featured", "catalog", "about"]
    show_reviews: bool = True
    show_stats: bool = True

    @field_validator("hero_style")
    @classmethod
    def valid_hero(cls, v):
        if v not in HERO_STYLES:
            raise ValueError(f"hero_style doit être parmi {HERO_STYLES}")
        return v

    @field_validator("grid_style")
    @classmethod
    def valid_grid(cls, v):
        if v not in GRID_STYLES:
            raise ValueError(f"grid_style doit être parmi {GRID_STYLES}")
        return v


class ShopThemeUpdate(BaseModel):
    couleur_principale: str | None = None
    couleur_secondaire: str | None = None
    couleur_fond: str | None = None
    couleur_texte: str | None = None
    couleur_accent: str | None = None
    police_titres: str | None = None
    police_corps: str | None = None
    slogan: str | None = None
    message_accueil: str | None = None
    a_propos: str | None = None
    telephone_contact: str | None = None
    whatsapp: str | None = None
    instagram: str | None = None
    tiktok: str | None = None
    horaires: str | None = None
    layout_config: LayoutConfig | None = None
    is_published: bool | None = None

    @field_validator("couleur_principale", "couleur_secondaire", "couleur_fond",
                     "couleur_texte", "couleur_accent", mode="before")
    @classmethod
    def valid_hex(cls, v):
        if v is not None and not HEX_PATTERN.match(v):
            raise ValueError("La couleur doit être un code hex valide (#RRGGBB)")
        return v

    @field_validator("police_titres")
    @classmethod
    def valid_police_titres(cls, v):
        if v is not None and v not in POLICES_TITRES:
            raise ValueError(f"police_titres doit être parmi {POLICES_TITRES}")
        return v

    @field_validator("police_corps")
    @classmethod
    def valid_police_corps(cls, v):
        if v is not None and v not in POLICES_CORPS:
            raise ValueError(f"police_corps doit être parmi {POLICES_CORPS}")
        return v


class ShopThemeOut(BaseModel):
    id: int
    shop_id: int
    couleur_principale: str
    couleur_secondaire: str
    couleur_fond: str
    couleur_texte: str
    couleur_accent: str
    police_titres: str
    police_corps: str
    banniere_url: str | None
    logo_url: str | None
    slogan: str | None
    message_accueil: str | None
    a_propos: str | None
    telephone_contact: str | None
    whatsapp: str | None
    instagram: str | None
    tiktok: str | None
    horaires: str | None
    layout_config: dict
    is_published: bool

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_shop_or_403(shop_id: int, user_id: int, db: Session) -> Shop:
    shop = db.query(Shop).filter(Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    if shop.user_id != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")
    return shop


def _get_or_create_theme(shop_id: int, db: Session) -> ShopTheme:
    theme = db.query(ShopTheme).filter(ShopTheme.shop_id == shop_id).first()
    if not theme:
        theme = ShopTheme(shop_id=shop_id)
        db.add(theme)
        db.flush()
    return theme


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/options/polices", response_model=dict)
def get_police_options():
    """Retourne les listes de polices autorisées."""
    return {"titres": POLICES_TITRES, "corps": POLICES_CORPS}


@router.get("/{shop_id}", response_model=ShopThemeOut)
def get_shop_theme(shop_id: int, db: Session = Depends(get_db)):
    """Endpoint public : retourne le thème publié d'une boutique."""
    theme = db.query(ShopTheme).filter(
        ShopTheme.shop_id == shop_id,
        ShopTheme.is_published == True,
    ).first()

    if not theme:
        # Thème par défaut si rien de publié
        return ShopTheme(
            id=0,
            shop_id=shop_id,
            couleur_principale="#C9A84C",
            couleur_secondaire="#111111",
            couleur_fond="#FDFCFA",
            couleur_texte="#111111",
            couleur_accent="#C9A84C",
            police_titres="Georgia",
            police_corps="Inter",
            layout_config={
                "hero_style": "full",
                "grid_style": "2col",
                "sections": ["banner", "featured", "catalog", "about"],
                "show_reviews": True,
                "show_stats": True,
            },
            is_published=False,
        )
    return theme


@router.get("/{shop_id}/draft", response_model=ShopThemeOut)
def get_shop_theme_draft(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Retourne le brouillon en cours d'édition (dashboard)."""
    _get_shop_or_403(shop_id, current_user.id, db)
    theme = _get_or_create_theme(shop_id, db)
    db.commit()
    return theme


@router.patch("/{shop_id}", response_model=ShopThemeOut)
def update_shop_theme(
    shop_id: int,
    payload: ShopThemeUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Met à jour le brouillon du thème."""
    _get_shop_or_403(shop_id, current_user.id, db)
    theme = _get_or_create_theme(shop_id, db)

    update_data = payload.model_dump(exclude_none=True)
    if "layout_config" in update_data and hasattr(update_data["layout_config"], "model_dump"):
        update_data["layout_config"] = update_data["layout_config"].model_dump()

    for field, value in update_data.items():
        setattr(theme, field, value)

    db.commit()
    db.refresh(theme)
    return theme


@router.post("/{shop_id}/publish", response_model=ShopThemeOut)
def publish_shop_theme(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Publie le thème — les visiteurs voient la nouvelle version."""
    _get_shop_or_403(shop_id, current_user.id, db)
    theme = _get_or_create_theme(shop_id, db)
    theme.is_published = True
    db.commit()
    db.refresh(theme)
    return theme


@router.post("/{shop_id}/unpublish", response_model=ShopThemeOut)
def unpublish_shop_theme(
    shop_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Dépublie le thème — retour au thème par défaut."""
    _get_shop_or_403(shop_id, current_user.id, db)
    theme = _get_or_create_theme(shop_id, db)
    theme.is_published = False
    db.commit()
    db.refresh(theme)
    return theme
