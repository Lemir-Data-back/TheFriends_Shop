from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from datetime import datetime, timezone, timedelta

from app.db.base import get_db
from app.api.deps import get_current_active_user
from app.modules.utilisateurs.models import User, UserRole
from app.modules.commandes.models import Order, OrderStatut, CreationRequest, CreationRequestStatut
from app.modules.produits.models import Product
from app.modules.boutiques.models import Shop
from app.modules.outfits.models import Outfit
from app.modules.analytics.models import EventAnalytics
from app.modules.dashboard.schemas import (
    ClientDashboard, ClientStats,
    VendeurDashboard, VendeurStats,
    CouturierDashboard, CouturierStats,
    EvolutionMensuelle,
)
from app.modules.commandes.schemas import OrderResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_date_range(
    date_debut: str | None,
    date_fin: str | None,
) -> tuple[datetime, datetime]:
    """Parse date_debut / date_fin, avec défaut = mois en cours."""
    now = datetime.now(timezone.utc)
    if date_debut:
        try:
            debut = datetime.fromisoformat(date_debut).replace(
                hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc
            )
        except ValueError:
            debut = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        debut = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if date_fin:
        try:
            fin = datetime.fromisoformat(date_fin).replace(
                hour=23, minute=59, second=59, microsecond=999999, tzinfo=timezone.utc
            )
        except ValueError:
            fin = now
    else:
        fin = now

    return debut, fin


MOIS_LABELS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"]


def _evolution_mensuelle(
    toutes_commandes: list[Order],
    commandes_revenu: list[Order],
) -> list[EvolutionMensuelle]:
    """Regroupe commandes/revenu par mois, de janvier à décembre de l'année en cours."""
    y = datetime.now(timezone.utc).year

    result = []
    for m in range(1, 13):
        revenu = sum(o.montant for o in commandes_revenu if o.created_at.year == y and o.created_at.month == m)
        nb = sum(1 for o in toutes_commandes if o.created_at.year == y and o.created_at.month == m)
        result.append(EvolutionMensuelle(mois=f"{y}-{m:02d}", label=MOIS_LABELS_FR[m - 1], revenu=revenu, nb_commandes=nb))
    return result


# ── Dashboard Client ──────────────────────────────────────────────────────────

@router.get("/client", response_model=ClientDashboard)
def dashboard_client(
    date_debut: str | None = Query(None),
    date_fin:   str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.CLIENT:
        raise HTTPException(status_code=403, detail="Réservé aux clients")

    debut, fin = _parse_date_range(date_debut, date_fin)

    commandes_all = db.query(Order).filter(Order.client_id == current_user.id).all()
    confirmees    = [o for o in commandes_all if o.statut == OrderStatut.CONFIRME]
    en_cours      = [o for o in commandes_all if o.statut not in (
        OrderStatut.CONFIRME, OrderStatut.ANNULE, OrderStatut.REMBOURSE
    )]

    total_depense = sum(o.montant for o in confirmees)

    # Période sélectionnée
    commandes_periode = [
        o for o in confirmees
        if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin
    ] if confirmees else []
    depense_periode = sum(o.montant for o in commandes_periode)

    # Likes cumulés
    nb_likes_cumules = db.query(EventAnalytics).filter(
        EventAnalytics.user_id == current_user.id,
        EventAnalytics.event_type == "product_like",
    ).count()

    # Article le + cher et le - cher (parmi tous les items de toutes les commandes confirmées)
    article_plus_cher  = None
    article_moins_cher = None
    prix_max, prix_min = 0, float("inf")

    for o in confirmees:
        for item in (o.items or []):
            prix = item.get("prix", 0)
            if prix > prix_max:
                prix_max = prix
                article_plus_cher = {"titre": item.get("titre", ""), "prix": prix}
            if prix < prix_min and prix > 0:
                prix_min = prix
                article_moins_cher = {"titre": item.get("titre", ""), "prix": prix}

    # Dernières commandes de la période
    dernieres = sorted(
        [o for o in commandes_all if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin],
        key=lambda o: o.created_at, reverse=True
    )[:5] or sorted(commandes_all, key=lambda o: o.created_at, reverse=True)[:5]

    return ClientDashboard(
        stats=ClientStats(
            nb_commandes=len(commandes_all),
            nb_commandes_en_cours=len(en_cours),
            nb_commandes_mois=len(commandes_periode),
            total_depense=total_depense,
            depense_mois=depense_periode,
            score_confiance=current_user.score_confiance,
            nb_likes_cumules=nb_likes_cumules,
            article_plus_cher=article_plus_cher,
            article_moins_cher=article_moins_cher,
        ),
        dernieres_commandes=[OrderResponse.model_validate(o) for o in dernieres],
    )


# ── Dashboard Vendeur ─────────────────────────────────────────────────────────

@router.get("/vendeur", response_model=VendeurDashboard)
def dashboard_vendeur(
    date_debut: str | None = Query(None),
    date_fin:   str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.VENDEUR:
        raise HTTPException(status_code=403, detail="Réservé aux vendeurs")
    if not current_user.shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")

    debut, fin = _parse_date_range(date_debut, date_fin)
    shop = current_user.shop
    commandes = db.query(Order).filter(Order.shop_id == shop.id).all()

    en_attente = [o for o in commandes if o.statut == OrderStatut.EN_ATTENTE]
    en_cours   = [o for o in commandes if o.statut in (
        OrderStatut.ACCEPTEE, OrderStatut.EN_COURS, OrderStatut.EXPEDIE
    )]
    confirmees = [o for o in commandes if o.statut == OrderStatut.CONFIRME]
    revenu_total  = sum(o.montant for o in confirmees)
    revenu_periode = sum(
        o.montant for o in confirmees
        if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin
    )

    nb_produits = db.query(Product).filter(
        Product.shop_id == shop.id, Product.actif == True
    ).count()
    produits_pop = db.query(Product).filter(
        Product.shop_id == shop.id, Product.actif == True
    ).order_by(Product.nb_commandes.desc()).limit(5).all()

    recentes = sorted(
        [o for o in commandes if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin],
        key=lambda o: o.created_at, reverse=True
    )[:10] or sorted(commandes, key=lambda o: o.created_at, reverse=True)[:10]

    score_moyen = (
        (shop.score_delais + shop.score_qualite + shop.score_communication) / 3
        if shop.nb_avis > 0 else 0.0
    )

    return VendeurDashboard(
        stats=VendeurStats(
            nb_commandes_total=len(commandes),
            nb_commandes_en_attente=len(en_attente),
            nb_commandes_en_cours=len(en_cours),
            nb_produits_actifs=nb_produits,
            revenu_total=revenu_total,
            revenu_mois=revenu_periode,
            score_moyen=round(score_moyen, 2),
            nb_avis=shop.nb_avis,
        ),
        commandes_recentes=[OrderResponse.model_validate(o) for o in recentes],
        produits_populaires=[
            {"id": p.id, "titre": p.titre, "nb_commandes": p.nb_commandes, "prix": p.prix}
            for p in produits_pop
        ],
        evolution_mensuelle=_evolution_mensuelle(commandes, confirmees),
        shop_id=shop.id,
    )


# ── Dashboard Couturier ───────────────────────────────────────────────────────

@router.get("/couturier", response_model=CouturierDashboard)
def dashboard_couturier(
    date_debut: str | None = Query(None),
    date_fin:   str | None = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.COUTURIER:
        raise HTTPException(status_code=403, detail="Réservé aux couturiers")
    if not current_user.shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")

    debut, fin = _parse_date_range(date_debut, date_fin)
    shop = current_user.shop
    commandes = db.query(Order).filter(Order.shop_id == shop.id).all()

    en_cours  = [o for o in commandes if o.statut in (OrderStatut.ACCEPTEE, OrderStatut.EN_COURS)]
    terminees = [o for o in commandes if o.statut == OrderStatut.CONFIRME]
    revenu_total   = sum(o.montant for o in terminees)
    revenu_periode = sum(
        o.montant for o in terminees
        if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin
    )

    demandes_ouvertes = db.query(CreationRequest).filter(
        CreationRequest.option_diffusion == "tous",
        CreationRequest.statut == CreationRequestStatut.OUVERTE,
    ).order_by(CreationRequest.created_at.desc()).limit(20).all()

    nb_devis = sum(
        1 for d in db.query(CreationRequest).all()
        for devis in (d.devis or [])
        if devis.get("shop_id") == shop.id
    )
    nb_selectionnes = db.query(CreationRequest).filter(
        CreationRequest.couturier_selectionne_id == shop.id
    ).count()
    taux = (nb_selectionnes / nb_devis * 100) if nb_devis > 0 else 0.0

    score_moyen = (
        (shop.score_delais + shop.score_qualite + shop.score_communication) / 3
        if shop.nb_avis > 0 else 0.0
    )

    en_cours_periode = [
        o for o in en_cours
        if debut <= o.created_at.replace(tzinfo=timezone.utc) <= fin
    ] or en_cours

    return CouturierDashboard(
        stats=CouturierStats(
            nb_demandes_ouvertes=len(demandes_ouvertes),
            nb_devis_envoyes=nb_devis,
            nb_commandes_en_cours=len(en_cours),
            nb_commandes_terminees=len(terminees),
            revenu_total=revenu_total,
            revenu_mois=revenu_periode,
            score_moyen=round(score_moyen, 2),
            taux_acceptation=round(taux, 1),
        ),
        demandes_recentes=[
            {
                "id": d.id,
                "description": d.description[:80] + "..." if len(d.description) > 80 else d.description,
                "statut": d.statut,
                "nb_devis": len(d.devis or []),
                "created_at": d.created_at.isoformat(),
            }
            for d in demandes_ouvertes[:5]
        ],
        commandes_en_cours=[OrderResponse.model_validate(o) for o in en_cours_periode],
        evolution_mensuelle=_evolution_mensuelle(commandes, terminees),
        shop_id=shop.id,
    )


# ── Stats profil client ───────────────────────────────────────────────────────

@router.get("/profil/stats")
def get_profil_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    nb_commandes = db.query(Order).filter(Order.client_id == current_user.id).count()
    nb_looks = db.query(Outfit).filter(Outfit.user_id == current_user.id).count()
    nb_likes_recus = db.query(
        sqlfunc.coalesce(sqlfunc.sum(Outfit.nb_likes), 0)
    ).filter(Outfit.user_id == current_user.id).scalar() or 0
    nb_articles_likes = db.query(EventAnalytics).filter(
        EventAnalytics.user_id == current_user.id,
        EventAnalytics.event_type == "product_like",
    ).count()
    return {
        "nb_commandes":      nb_commandes,
        "nb_looks":          nb_looks,
        "nb_likes_recus":    int(nb_likes_recus),
        "nb_articles_likes": nb_articles_likes,
    }


# ── Alertes client ────────────────────────────────────────────────────────────

@router.get("/alertes")
def get_alertes(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Alertes personnalisées pour le client : nouvelles boutiques, couturiers."""
    sept_jours = datetime.now(timezone.utc) - timedelta(days=7)

    nouvelles_boutiques = db.query(Shop).filter(
        Shop.created_at >= sept_jours,
        Shop.is_validated == True,
        Shop.is_active == True,
        Shop.type != "couturier",
    ).order_by(Shop.created_at.desc()).limit(5).all()

    nouveaux_couturiers = db.query(Shop).filter(
        Shop.created_at >= sept_jours,
        Shop.is_validated == True,
        Shop.is_active == True,
        Shop.type == "couturier",
    ).order_by(Shop.created_at.desc()).limit(5).all()

    alertes = []

    for s in nouvelles_boutiques:
        alertes.append({
            "type":    "nouvelle_boutique",
            "titre":   f"Nouvelle boutique : {s.nom}",
            "desc":    f"{s.zone or 'Abidjan'} — {s.type}",
            "href":    f"/boutique/{s.id}",
            "shop_id": s.id,
        })

    for s in nouveaux_couturiers:
        alertes.append({
            "type":    "nouveau_couturier",
            "titre":   f"Nouveau couturier : {s.nom}",
            "desc":    f"{s.zone or 'Abidjan'}",
            "href":    f"/boutique/{s.id}",
            "shop_id": s.id,
        })

    return {"alertes": alertes, "nb_total": len(alertes)}
