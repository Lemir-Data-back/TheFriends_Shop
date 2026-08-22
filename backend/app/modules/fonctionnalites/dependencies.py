"""
Dépendances FastAPI pour vérifier si un module est actif.
Usage dans un endpoint :

    @router.post("/negocier")
    async def negocier(
        shop_id: int,
        _: None = Depends(require_module("negociation", entity_type="shop")),
    ):
        ...
"""
from typing import Literal

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.modules.fonctionnalites.models import EntityModule, Module
from app.modules.fonctionnalites.registry import MODULES


EntityType = Literal["shop", "user", "global"]


def _is_module_active(
    slug: str,
    entity_type: EntityType,
    entity_id: int | None,
    db: Session,
) -> tuple[bool, dict]:
    """
    Retourne (is_active, config) pour un module et une entité.
    Priorité : override entité > défaut global registre.
    """
    module_def = MODULES.get(slug)
    if not module_def:
        return False, {}

    # 1. Vérifier le master switch global
    module_row = db.query(Module).filter(Module.slug == slug).first()
    if module_row and not module_row.is_globally_active:
        return False, {}

    # 2. Chercher l'override spécifique à l'entité
    if entity_id is not None:
        entity_module = db.query(EntityModule).filter(
            EntityModule.module_slug == slug,
            EntityModule.entity_type == entity_type,
            EntityModule.entity_id == entity_id,
        ).first()
        if entity_module is not None:
            return entity_module.is_active, entity_module.config or {}

    # 3. Fallback sur le défaut du registre
    return module_def.default_active, {}


def require_module(slug: str, entity_type: EntityType = "global"):
    """
    Dépendance FastAPI qui lève 403 si le module est désactivé.
    """
    def _check(entity_id: int | None = None, db: Session = Depends(get_db)):
        active, _ = _is_module_active(slug, entity_type, entity_id, db)
        if not active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Le module '{slug}' n'est pas activé pour cette entité.",
            )
    return _check


def get_module_status(
    slug: str,
    entity_type: EntityType,
    entity_id: int | None,
    db: Session,
) -> dict:
    """Retourne le statut complet d'un module pour une entité."""
    active, config = _is_module_active(slug, entity_type, entity_id, db)
    return {"slug": slug, "is_active": active, "config": config}
