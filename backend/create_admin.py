"""
Script de création du compte administrateur.
Usage : python create_admin.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.base import SessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password

PHONE    = "07000003"
PASSWORD = "Admin2468"
NOM      = "Administrateur"


def create_admin():
    db = SessionLocal()
    try:
        # Vérifier si le compte existe déjà
        existing = db.query(User).filter(User.phone == PHONE).first()
        if existing:
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                existing.is_active = True
                existing.is_verified = True
                db.commit()
                print(f"[OK] Compte existant mis a jour en ADMIN (id={existing.id})")
            else:
                print(f"[OK] Compte admin deja existant (id={existing.id})")
            return

        admin = User(
            full_name=NOM,
            phone=PHONE,
            hashed_password=hash_password(PASSWORD),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True,
            score_confiance=5.0,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"[OK] Compte admin cree avec succes (id={admin.id})")
        print(f"  Telephone : {PHONE}")
        print(f"  Mot de passe : {PASSWORD}")
        print(f"  Role : {admin.role}")

    except Exception as e:
        db.rollback()
        print(f"[ERREUR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
