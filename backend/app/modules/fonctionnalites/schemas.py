from datetime import datetime
from pydantic import BaseModel


class ModuleOut(BaseModel):
    slug: str
    name: str
    description: str | None
    phase: int
    applies_to: str
    is_globally_active: bool
    default_active: bool
    config_schema: dict

    class Config:
        from_attributes = True


class EntityModuleOut(BaseModel):
    id: int
    module_slug: str
    entity_type: str
    entity_id: int
    is_active: bool
    config: dict
    updated_at: datetime

    class Config:
        from_attributes = True


class EntityModuleUpdate(BaseModel):
    is_active: bool
    config: dict = {}


class ModuleStatusResponse(BaseModel):
    """Réponse légère pour le frontend : le module est-il actif ?"""
    slug: str
    is_active: bool
    config: dict
