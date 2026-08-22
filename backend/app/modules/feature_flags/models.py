from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Module(Base):
    """
    Registre en base de tous les modules disponibles.
    Synchronisé depuis registry.py via la commande d'initialisation.
    """
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(String(512), nullable=True)
    phase: Mapped[int] = mapped_column(Integer, default=1)
    applies_to: Mapped[str] = mapped_column(String(16), nullable=False)  # shop | user | global
    is_globally_active: Mapped[bool] = mapped_column(Boolean, default=True)
    default_active: Mapped[bool] = mapped_column(Boolean, default=True)
    config_schema: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    entity_activations: Mapped[list["EntityModule"]] = relationship(
        "EntityModule", back_populates="module", cascade="all, delete-orphan"
    )


class EntityModule(Base):
    """
    Activation d'un module pour une entité spécifique (shop ou user).
    Permet à l'admin d'activer/désactiver un module par entité.
    """
    __tablename__ = "entity_modules"
    __table_args__ = (
        UniqueConstraint("module_slug", "entity_type", "entity_id", name="uq_entity_module"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_slug: Mapped[str] = mapped_column(
        String(64), ForeignKey("modules.slug", ondelete="CASCADE"), nullable=False, index=True
    )
    entity_type: Mapped[str] = mapped_column(String(16), nullable=False)  # shop | user
    entity_id: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    config: Mapped[dict] = mapped_column(JSON, default=dict)
    updated_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    module: Mapped["Module"] = relationship("Module", back_populates="entity_activations")
