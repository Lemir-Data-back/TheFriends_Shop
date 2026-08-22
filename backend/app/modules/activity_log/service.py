"""Helpers pour journaliser les événements de la plateforme."""
from fastapi import Request
from sqlalchemy.orm import Session
from app.modules.activity_log.models import ActivityLog


def get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def log_activity(
    db: Session,
    action: str,
    *,
    user_id: int | None = None,
    ip: str | None = None,
    details: dict | None = None,
) -> None:
    """Ajoute une entrée au journal sans jamais interrompre le flux principal."""
    try:
        db.add(ActivityLog(
            user_id=user_id,
            action=action,
            ip_address=ip,
            details=details,
        ))
    except Exception:
        pass
