"""
Registre central de tous les modules de la plateforme.
Chaque module a un slug unique, une phase, et une entité cible.
L'admin peut activer/désactiver chaque module globalement ou par entité.
"""
from dataclasses import dataclass, field
from typing import Literal


AppliesTo = Literal["shop", "user", "global"]


@dataclass
class ModuleDefinition:
    slug: str
    name: str
    description: str
    phase: int                          # 1, 2 ou 3 selon le roadmap
    applies_to: AppliesTo               # qui peut avoir ce module
    default_active: bool = True         # actif par défaut à la création
    is_globally_active: bool = True     # master switch admin
    config_schema: dict = field(default_factory=dict)  # schéma de config JSON


# ─── Registre complet ──────────────────────────────────────────────────────────

MODULES: dict[str, ModuleDefinition] = {

    # ── Phase 1 ─────────────────────────────────────────────────────────────────

    "escrow": ModuleDefinition(
        slug="escrow",
        name="Système Escrow",
        description="Blocage et libération sécurisée des paiements",
        phase=1,
        applies_to="shop",
        default_active=True,
    ),

    "jalons": ModuleDefinition(
        slug="jalons",
        name="Jalons de progression",
        description="Suivi par étapes pour commandes > 50 000 FCFA",
        phase=1,
        applies_to="shop",
        default_active=True,
        config_schema={
            "seuil_montant": {"type": "integer", "default": 50000}
        },
    ),

    "messagerie": ModuleDefinition(
        slug="messagerie",
        name="Messagerie intégrée",
        description="Conversations entre clients et vendeurs/couturiers",
        phase=1,
        applies_to="shop",
        default_active=True,
    ),

    "notation": ModuleDefinition(
        slug="notation",
        name="Notation et avis",
        description="Système d'évaluation délais/qualité/communication",
        phase=1,
        applies_to="shop",
        default_active=True,
    ),

    "sur_mesure": ModuleDefinition(
        slug="sur_mesure",
        name="Commandes sur mesure",
        description="Demandes de création avec upload tissu et modèle",
        phase=1,
        applies_to="shop",
        default_active=True,
    ),

    "negociation": ModuleDefinition(
        slug="negociation",
        name="Négociation de prix",
        description="Contre-offre jusqu'à -20% pour les couturiers uniquement",
        phase=1,
        applies_to="shop",
        default_active=False,
        config_schema={
            "remise_max_percent": {"type": "integer", "default": 20, "max": 30},
            "delai_reponse_heures": {"type": "integer", "default": 24},
        },
    ),

    # ── Phase 2 ─────────────────────────────────────────────────────────────────

    "shop_theming": ModuleDefinition(
        slug="shop_theming",
        name="Personnalisation boutique",
        description="Couleurs, typographie, bannière et disposition personnalisées",
        phase=2,
        applies_to="shop",
        default_active=False,
        config_schema={
            "polices_autorisees_titres": {
                "type": "array",
                "values": ["Georgia", "Playfair Display", "Cormorant Garamond", "Libre Baskerville"],
            },
            "polices_autorisees_corps": {
                "type": "array",
                "values": ["Inter", "Lato", "Poppins", "Open Sans", "Nunito"],
            },
        },
    ),

    "installment_payment": ModuleDefinition(
        slug="installment_payment",
        name="Paiement en tranches",
        description="Plans de paiement échelonné — vendeurs PAP uniquement",
        phase=2,
        applies_to="shop",
        default_active=False,
        config_schema={
            "nb_tranches_max": {"type": "integer", "default": 6},
            "acompte_min_percent": {"type": "integer", "default": 20},
        },
    ),

    "outfit_builder": ModuleDefinition(
        slug="outfit_builder",
        name="Outfit Builder",
        description="Assemblage et partage de looks multi-vendeurs",
        phase=2,
        applies_to="user",
        default_active=False,
    ),

    "visual_search": ModuleDefinition(
        slug="visual_search",
        name="Recherche par photo",
        description="Trouver des articles similaires via Google Vision API",
        phase=2,
        applies_to="global",
        default_active=False,
    ),

    "communaute": ModuleDefinition(
        slug="communaute",
        name="Communauté & Social",
        description="Feed communautaire, likes, commentaires, achat depuis un look",
        phase=2,
        applies_to="global",
        default_active=False,
    ),

    "score_confiance": ModuleDefinition(
        slug="score_confiance",
        name="Score de confiance client",
        description="Sanctions automatiques et statuts clients",
        phase=2,
        applies_to="user",
        default_active=False,
    ),

    "dashboard_analytics": ModuleDefinition(
        slug="dashboard_analytics",
        name="Dashboard analytique",
        description="Statistiques avancées pour vendeurs et couturiers",
        phase=2,
        applies_to="shop",
        default_active=False,
    ),

    # ── Phase 3 ─────────────────────────────────────────────────────────────────

    "recommandations_ia": ModuleDefinition(
        slug="recommandations_ia",
        name="Recommandations IA",
        description="Suggestions personnalisées morphologie/âge/historique",
        phase=3,
        applies_to="user",
        default_active=False,
    ),

    "rapport_mensuel": ModuleDefinition(
        slug="rapport_mensuel",
        name="Rapport mensuel automatique",
        description="Résumé automatique le 1er du mois pour tous les acteurs",
        phase=3,
        applies_to="global",
        default_active=False,
    ),
}


def get_module(slug: str) -> ModuleDefinition | None:
    return MODULES.get(slug)


def get_modules_by_phase(phase: int) -> list[ModuleDefinition]:
    return [m for m in MODULES.values() if m.phase == phase]


def get_modules_for_entity(applies_to: AppliesTo) -> list[ModuleDefinition]:
    return [m for m in MODULES.values() if m.applies_to in (applies_to, "global")]
