"""
Routes de gestion des modules — réservées aux administrateurs.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.db.base import get_db
from app.modules.models import EntityModule, Module
from app.modules.registry import MODULES
from app.modules.schemas import EntityModuleOut, EntityModuleUpdate, ModuleOut, ModuleStatusResponse

router = APIRouter(prefix="/modules", tags=["modules"])


@router.get("/", response_model=list[ModuleOut])
def list_modules(
    phase: int | None = None,
    applies_to: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Liste tous les modules disponibles avec leur statut global."""
    query = db.query(Module)
    if phase:
        query = query.filter(Module.phase == phase)
    if applies_to:
        query = query.filter(Module.applies_to == applies_to)
    return query.all()


@router.patch("/{slug}/global", response_model=ModuleOut)
def toggle_module_global(
    slug: str,
    is_active: bool,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Active ou désactive un module globalement (master switch)."""
    module = db.query(Module).filter(Module.slug == slug).first()
    if not module:
        raise HTTPException(status_code=404, detail="Module introuvable")
    module.is_globally_active = is_active
    db.commit()
    db.refresh(module)
    return module


@router.get("/entity/{entity_type}/{entity_id}", response_model=list[ModuleStatusResponse])
def get_entity_modules(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """Retourne le statut de tous les modules pour une entité."""
    overrides = {
        em.module_slug: em
        for em in db.query(EntityModule).filter(
            EntityModule.entity_type == entity_type,
            EntityModule.entity_id == entity_id,
        ).all()
    }

    statuses = []
    for slug, module_def in MODULES.items():
        if module_def.applies_to not in (entity_type, "global"):
            continue
        override = overrides.get(slug)
        statuses.append(ModuleStatusResponse(
            slug=slug,
            is_active=override.is_active if override else module_def.default_active,
            config=override.config if override else {},
        ))
    return statuses


@router.patch("/entity/{entity_type}/{entity_id}/{slug}", response_model=EntityModuleOut)
def update_entity_module(
    entity_type: str,
    entity_id: int,
    slug: str,
    payload: EntityModuleUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    """Active/désactive un module pour une entité spécifique."""
    if slug not in MODULES:
        raise HTTPException(status_code=404, detail="Module introuvable dans le registre")

    entity_module = db.query(EntityModule).filter(
        EntityModule.module_slug == slug,
        EntityModule.entity_type == entity_type,
        EntityModule.entity_id == entity_id,
    ).first()

    if entity_module:
        entity_module.is_active = payload.is_active
        entity_module.config = payload.config
        entity_module.updated_by = current_user.id
    else:
        entity_module = EntityModule(
            module_slug=slug,
            entity_type=entity_type,
            entity_id=entity_id,
            is_active=payload.is_active,
            config=payload.config,
            updated_by=current_user.id,
        )
        db.add(entity_module)

    db.commit()
    db.refresh(entity_module)
    return entity_module


@router.get("/shop/{shop_id}/active", response_model=list[ModuleStatusResponse])
def get_shop_active_modules(
    shop_id: int,
    db: Session = Depends(get_db),
):
    """
    Endpoint public : retourne les modules actifs d'une boutique.
    Utilisé par le frontend pour afficher/masquer les features.
    """
    overrides = {
        em.module_slug: em
        for em in db.query(EntityModule).filter(
            EntityModule.entity_type == "shop",
            EntityModule.entity_id == shop_id,
        ).all()
    }

    global_status = {
        m.slug: m.is_globally_active
        for m in db.query(Module).all()
    }

    statuses = []
    for slug, module_def in MODULES.items():
        if module_def.applies_to not in ("shop", "global"):
            continue
        if not global_status.get(slug, module_def.is_globally_active):
            continue
        override = overrides.get(slug)
        is_active = override.is_active if override else module_def.default_active
        if is_active:
            statuses.append(ModuleStatusResponse(
                slug=slug,
                is_active=True,
                config=override.config if override else {},
            ))
    return statuses
