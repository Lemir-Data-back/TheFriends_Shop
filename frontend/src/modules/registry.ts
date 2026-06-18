/**
 * Registre des modules côté frontend.
 * Miroir du registre Python backend — toujours les garder synchronisés.
 */

export type AppliesTo = "shop" | "user" | "global"

export interface ModuleDefinition {
  slug: string
  name: string
  description: string
  phase: 1 | 2 | 3
  appliesTo: AppliesTo
  defaultActive: boolean
}

export const MODULES: Record<string, ModuleDefinition> = {
  // ── Phase 1 ──────────────────────────────────────────────────────────────
  escrow: {
    slug: "escrow",
    name: "Système Escrow",
    description: "Blocage et libération sécurisée des paiements",
    phase: 1,
    appliesTo: "shop",
    defaultActive: true,
  },
  jalons: {
    slug: "jalons",
    name: "Jalons de progression",
    description: "Suivi par étapes pour commandes > 50 000 FCFA",
    phase: 1,
    appliesTo: "shop",
    defaultActive: true,
  },
  messagerie: {
    slug: "messagerie",
    name: "Messagerie intégrée",
    description: "Conversations entre clients et vendeurs/couturiers",
    phase: 1,
    appliesTo: "shop",
    defaultActive: true,
  },
  notation: {
    slug: "notation",
    name: "Notation et avis",
    description: "Système d'évaluation délais/qualité/communication",
    phase: 1,
    appliesTo: "shop",
    defaultActive: true,
  },
  sur_mesure: {
    slug: "sur_mesure",
    name: "Commandes sur mesure",
    description: "Demandes de création avec upload tissu et modèle",
    phase: 1,
    appliesTo: "shop",
    defaultActive: true,
  },
  negociation: {
    slug: "negociation",
    name: "Négociation de prix",
    description: "Contre-offre jusqu'à -20% pour les couturiers",
    phase: 1,
    appliesTo: "shop",
    defaultActive: false,
  },

  // ── Phase 2 ──────────────────────────────────────────────────────────────
  shop_theming: {
    slug: "shop_theming",
    name: "Personnalisation boutique",
    description: "Couleurs, typographie et disposition personnalisées",
    phase: 2,
    appliesTo: "shop",
    defaultActive: false,
  },
  installment_payment: {
    slug: "installment_payment",
    name: "Paiement en tranches",
    description: "Plans de paiement échelonné — vendeurs PAP uniquement",
    phase: 2,
    appliesTo: "shop",
    defaultActive: false,
  },
  outfit_builder: {
    slug: "outfit_builder",
    name: "Outfit Builder",
    description: "Assemblage et partage de looks multi-vendeurs",
    phase: 2,
    appliesTo: "user",
    defaultActive: false,
  },
  visual_search: {
    slug: "visual_search",
    name: "Recherche par photo",
    description: "Trouver des articles similaires via IA",
    phase: 2,
    appliesTo: "global",
    defaultActive: false,
  },
  communaute: {
    slug: "communaute",
    name: "Communauté & Social",
    description: "Feed, likes, commentaires, achat depuis un look",
    phase: 2,
    appliesTo: "global",
    defaultActive: false,
  },
  score_confiance: {
    slug: "score_confiance",
    name: "Score de confiance client",
    description: "Sanctions automatiques et statuts clients",
    phase: 2,
    appliesTo: "user",
    defaultActive: false,
  },
  dashboard_analytics: {
    slug: "dashboard_analytics",
    name: "Dashboard analytique",
    description: "Statistiques avancées pour vendeurs et couturiers",
    phase: 2,
    appliesTo: "shop",
    defaultActive: false,
  },

  // ── Phase 3 ──────────────────────────────────────────────────────────────
  recommandations_ia: {
    slug: "recommandations_ia",
    name: "Recommandations IA",
    description: "Suggestions personnalisées morphologie/âge/historique",
    phase: 3,
    appliesTo: "user",
    defaultActive: false,
  },
  rapport_mensuel: {
    slug: "rapport_mensuel",
    name: "Rapport mensuel automatique",
    description: "Résumé automatique le 1er du mois",
    phase: 3,
    appliesTo: "global",
    defaultActive: false,
  },
}
