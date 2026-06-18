from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ─── Dashboard Client ─────────────────────────────────────────────────────────

class ClientStats(BaseModel):
    nb_commandes: int
    nb_commandes_en_cours: int
    nb_commandes_mois: int
    total_depense: int
    depense_mois: int
    score_confiance: float
    nb_likes_cumules: int = 0
    article_plus_cher: Optional[dict] = None
    article_moins_cher: Optional[dict] = None


class ClientDashboard(BaseModel):
    stats: ClientStats
    dernieres_commandes: list


# ─── Dashboard Vendeur ────────────────────────────────────────────────────────

class VendeurStats(BaseModel):
    nb_commandes_total: int
    nb_commandes_en_attente: int
    nb_commandes_en_cours: int
    nb_produits_actifs: int
    revenu_total: int
    revenu_mois: int
    score_moyen: float
    nb_avis: int


class VendeurDashboard(BaseModel):
    stats: VendeurStats
    commandes_recentes: list
    produits_populaires: list
    shop_id: Optional[int] = None


# ─── Dashboard Couturier ──────────────────────────────────────────────────────

class CouturierStats(BaseModel):
    nb_demandes_ouvertes: int
    nb_devis_envoyes: int
    nb_commandes_en_cours: int
    nb_commandes_terminees: int
    revenu_total: int
    revenu_mois: int
    score_moyen: float
    taux_acceptation: float  # % de devis acceptés


class CouturierDashboard(BaseModel):
    stats: CouturierStats
    demandes_recentes: list
    commandes_en_cours: list


# ─── Avis ─────────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    order_id: int
    score_delais: float
    score_qualite: float
    score_communication: float
    commentaire: Optional[str] = None


class ReviewResponse(BaseModel):
    id: int
    order_id: int
    reviewer_id: int
    shop_id: int
    score_delais: float
    score_qualite: float
    score_communication: float
    score_moyen: float
    commentaire: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
