"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Layers } from "lucide-react"
import { api } from "@/lib/api"
import { Badge } from "../_components/shared"
import type { ModuleStatus } from "../_components/types"

const PLATFORM_SECTIONS = [
  {
    phase: 1,
    phaseLabel: "Phase 1 — MVP",
    phaseColor: "bg-tf-success-bg text-tf-success",
    title: "Fonctionnel maintenant",
    sections: [
      {
        slug: null as null,
        name: "Inscription & Profils",
        desc: "Création de compte client, vendeur et couturier. Profil complet avec mensurations.",
        includes: ["3 rôles distincts", "Mensurations client", "Score de confiance visible"],
        icon: "👤",
      },
      {
        slug: null as null,
        name: "Catalogue & Shopping",
        desc: "Navigation, recherche par zone et type, fiches produit, panier.",
        includes: ["Catalogue produits", "Filtres & recherche", "Fiche produit détaillée"],
        icon: "🛍️",
      },
      {
        slug: "escrow",
        name: "Commandes & Escrow",
        desc: "Commandes standard et sur mesure, paiement sécurisé, acceptation/refus, négociation.",
        includes: ["Commandes sur mesure", "Escrow sécurisé", "Négociation prix (–20% max)"],
        icon: "📦",
      },
      {
        slug: "messagerie",
        name: "Messagerie",
        desc: "Conversations entre clients et prestataires, initiées par toutes les parties.",
        includes: ["Conversations par commande", "Initié par toutes les parties"],
        icon: "💬",
      },
    ],
  },
  {
    phase: 2,
    phaseLabel: "Phase 2 — Différenciation",
    phaseColor: "bg-tf-gold/[0.15] text-tf-gold-dark",
    title: "En développement — actuellement caché",
    sections: [
      {
        slug: "communaute",
        name: "Espace Looks & Communauté",
        desc: "Fil social, partage de tenues, likes, commentaires, badges et achat depuis un look.",
        includes: ["Feed social", "Partage de looks", "Likes & commentaires", "Badges popularité", "Achat depuis un post"],
        icon: "✨",
      },
      {
        slug: "dashboard_analytics",
        name: "Dashboard analytique avancé",
        desc: "Stats détaillées : articles les plus vus, taux de conversion, stock à renouveler.",
        includes: ["Statistiques ventes", "Taux de conversion", "Alertes stock"],
        icon: "📊",
      },
      {
        slug: "score_confiance",
        name: "Score de confiance automatique",
        desc: "Pénalités automatiques sur retard, déductions pour comportement, statuts clients.",
        includes: ["Grille pénalités 5→30%", "Déductions comportement", "Statuts clients"],
        icon: "⭐",
      },
      {
        slug: "installment_payment",
        name: "Paiement en tranches",
        desc: "Plans de paiement échelonné 2x, 3x, 6x pour vendeurs PAP.",
        includes: ["2x, 3x, 6x", "Déclenchement auto", "PAP uniquement"],
        icon: "💳",
      },
    ],
  },
  {
    phase: 3,
    phaseLabel: "Phase 3 — Intelligence IA",
    phaseColor: "bg-tf-gray-soft text-tf-text-muted",
    title: "À venir — actuellement caché",
    sections: [
      {
        slug: "recommandations_ia",
        name: "IA Conseil avancé",
        desc: "Recommandations personnalisées par morphologie, âge et historique. Suggestions de looks complets.",
        includes: ["Reco morphologie", "Tendances Abidjan", "Suggestion looks complets"],
        icon: "🤖",
      },
      {
        slug: "rapport_mensuel",
        name: "Rapport mensuel automatique",
        desc: "Résumé automatique le 1er du mois pour vendeurs et couturiers.",
        includes: ["Envoi mensuel auto", "CA, commandes, avis", "Opportunités à saisir"],
        icon: "📋",
      },
      {
        slug: "visual_search",
        name: "Recherche par photo",
        desc: "Trouver des articles similaires en uploadant une photo via IA.",
        includes: ["Upload photo", "Matching IA", "Articles similaires"],
        icon: "📷",
      },
    ],
  },
]

export default function FonctionnalitesPage() {
  const qc = useQueryClient()

  const { data: modules } = useQuery<ModuleStatus[]>({
    queryKey: ["admin-modules"],
    queryFn:  async () => (await api.get("/modules/")).data,
  })

  const toggle = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      api.patch(`/modules/${slug}/global?is_active=${active}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-modules"] }),
  })

  function isActive(slug: string | null): boolean {
    if (!slug) return true
    return modules?.find(m => m.slug === slug)?.is_globally_active ?? false
  }

  return (
    <div className="space-y-8">
      <div className="bg-tf-black rounded-xl px-5 py-4 flex items-start gap-3">
        <Layers size={16} className="text-tf-gold mt-0.5 shrink-0" />
        <div>
          <p className="font-sans text-[13px] font-semibold text-white leading-snug">Sections de la plateforme</p>
          <p className="font-sans text-[12px] text-white/60 mt-0.5 leading-relaxed">
            Les sections des phases 2 et 3 sont actuellement cachées aux utilisateurs.
            Activez-les ici quand elles seront prêtes à être exposées.
          </p>
        </div>
      </div>

      {PLATFORM_SECTIONS.map(group => (
        <div key={group.phase}>
          <div className="flex items-center gap-3 mb-4">
            <Badge color={group.phaseColor}>{group.phaseLabel}</Badge>
            <span className="font-sans text-[12px] text-tf-text-muted">{group.title}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.sections.map(section => {
              const active = isActive(section.slug)
              return (
                <div
                  key={section.name}
                  className={`bg-white border rounded-xl p-5 flex flex-col gap-3 transition-all ${
                    active ? "border-tf-success/30 shadow-sm" : "border-tf-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px] leading-none">{section.icon}</span>
                      <p className="font-sans text-[14px] font-bold text-tf-text leading-snug">{section.name}</p>
                    </div>
                    {active
                      ? <Badge color="bg-tf-success-bg text-tf-success">Actif</Badge>
                      : <Badge color="bg-tf-gray-soft text-tf-text-muted">Caché</Badge>
                    }
                  </div>

                  <p className="font-sans text-[12px] text-tf-text-muted leading-relaxed">{section.desc}</p>

                  <div className="flex flex-wrap gap-1.5">
                    {section.includes.map(inc => (
                      <span key={inc} className="px-2 py-0.5 bg-tf-bg border border-tf-border rounded-md font-sans text-[10px] text-tf-text-muted">
                        {inc}
                      </span>
                    ))}
                  </div>

                  {section.slug ? (
                    <button
                      onClick={() => toggle.mutate({ slug: section.slug!, active: !active })}
                      disabled={toggle.isPending}
                      className={`mt-auto w-full py-2 rounded-lg font-sans text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold disabled:opacity-50 ${
                        active
                          ? "border border-tf-error text-tf-error hover:bg-tf-error-bg"
                          : "bg-tf-gold text-tf-black hover:bg-tf-gold-light"
                      }`}
                    >
                      {active ? "Masquer cette section" : "Activer cette section"}
                    </button>
                  ) : (
                    <p className="mt-auto font-sans text-[11px] text-tf-text-muted text-center py-1.5 border border-tf-border rounded-lg">
                      Fondation plateforme — toujours actif
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
