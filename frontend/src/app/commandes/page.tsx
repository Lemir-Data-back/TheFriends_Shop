"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, ChevronRight, User, Ruler, Star, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Order, OrderListResponse, STATUT_LABELS, STATUT_COLORS } from "@/types/order";
import { formatPrix } from "@/lib/utils";

const MENSURATION_LABELS: Record<string, string> = {
  poitrine: "Poitrine",
  taille: "Taille",
  hanches: "Hanches",
  pointure: "Pointure",
};

function scoreBadgeClass(score: number): string {
  if (score >= 4.5) return "bg-tf-gold/[0.15] text-tf-gold-dark";
  if (score >= 3.5) return "bg-tf-success-bg text-tf-success";
  if (score >= 2.5) return "bg-tf-gray-soft text-tf-text-muted";
  return "bg-tf-error-bg text-tf-error";
}

/**
 * Carte commande pour le couturier/vendeur — l'essentiel pour repérer la commande
 * d'un coup d'œil (client, score, mensurations, articles, montant). Clic → détail
 * pour les actions (accepter/refuser, négociation, délai, discuter, suivi).
 */
function OrderCardSeller({ order }: { order: Order }) {
  const mensurations = order.client?.mensurations
    ? Object.entries(order.client.mensurations).filter(([, v]) => v != null)
    : [];
  const derniereOffre = order.negociations?.[order.negociations.length - 1];
  const negociationEnAttente = derniereOffre?.action === "proposer" || derniereOffre?.action === "contre";

  return (
    <Link
      href={`/commandes/${order.id}`}
      className="block bg-white rounded-xl border border-tf-border p-4 hover:border-tf-gold/40 hover:shadow-card transition-all"
    >
      {/* Référence + statut */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="font-sans text-[13px] font-bold text-tf-text">{order.reference}</span>
        <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
          {STATUT_LABELS[order.statut]}
        </span>
      </div>

      {/* Client */}
      {order.client && (
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-tf-border">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-tf-gray-soft flex items-center justify-center shrink-0">
              <User size={14} className="text-tf-text-muted" />
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{order.client.full_name}</p>
              {order.client.phone && (
                <p className="font-sans text-[11px] text-tf-text-muted truncate">{order.client.phone}</p>
              )}
            </div>
          </div>
          <span className={`flex items-center gap-1 font-sans text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${scoreBadgeClass(order.client.score_confiance)}`}>
            <Star size={10} className="fill-current" />
            {order.client.score_confiance.toFixed(1)}
          </span>
        </div>
      )}

      {/* Mensurations */}
      {mensurations.length > 0 && (
        <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
          <Ruler size={12} className="text-tf-text-muted shrink-0" />
          {mensurations.map(([key, value]) => (
            <span key={key} className="font-sans text-[11px] text-tf-text-muted bg-tf-gray-soft px-1.5 py-0.5 rounded-sm">
              {MENSURATION_LABELS[key] ?? key} {String(value)}{key !== "pointure" ? " cm" : ""}
            </span>
          ))}
        </div>
      )}

      {/* Négociation en attente — signal visuel seulement, action dans le détail */}
      {negociationEnAttente && (
        <div className="flex items-center gap-1.5 mb-2.5 font-sans text-[11px] font-semibold text-tf-gold-dark">
          <Tag size={12} />
          Prix proposé : {formatPrix(derniereOffre!.prix ?? 0)}
        </div>
      )}

      {/* Articles + date */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[12px] text-tf-text-muted">
            {order.items.length} article{order.items.length > 1 ? "s" : ""} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <p className="font-sans text-[12px] text-tf-text-muted truncate mt-0.5">
            {order.items.map((i) => i.titre).join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-mono text-[15px] font-bold text-tf-black">{formatPrix(order.montant)}</span>
          <ChevronRight size={16} className="text-tf-text-muted" />
        </div>
      </div>
    </Link>
  );
}

const ROLE_CONTENT: Record<string, {
  title: string;
  emptyTitle: string;
  emptyDesc: string;
  ctaLabel: string;
  ctaHref: string;
}> = {
  client: {
    title: "Mes commandes",
    emptyTitle: "Aucune commande",
    emptyDesc: "Tes commandes apparaîtront ici après ton premier achat",
    ctaLabel: "Aller en shopping",
    ctaHref: "/shopping",
  },
  couturier: {
    title: "Commandes reçues",
    emptyTitle: "Aucune commande reçue",
    emptyDesc: "Les commandes passées par tes clients apparaîtront ici",
    ctaLabel: "Aller à mon atelier",
    ctaHref: "/dashboard/couturier",
  },
  vendeur: {
    title: "Commandes reçues",
    emptyTitle: "Aucune commande reçue",
    emptyDesc: "Les commandes passées par tes clients apparaîtront ici",
    ctaLabel: "Aller à ma boutique",
    ctaHref: "/dashboard/vendeur",
  },
};

export default function CommandesPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated } = useAuthStore();
  const content = ROLE_CONTENT[user?.role ?? "client"] ?? ROLE_CONTENT.client;
  const isSeller = user?.role === "couturier" || user?.role === "vendeur";

  // Le rôle client gère désormais ses commandes dans l'onglet "Commandes" de /profil.
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user?.role === "client") {
      router.replace("/profil?tab=commandes");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const { data, isLoading } = useQuery<OrderListResponse>({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/orders?limit=50");
      return data;
    },
    enabled: isAuthenticated && (!_hasHydrated || user?.role !== "client"),
  });

  if (_hasHydrated && isAuthenticated && user?.role === "client") {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-tf-bg flex flex-col items-center justify-center text-center px-4">
        <Package size={48} className="text-tf-border mb-4" />
        <p className="font-sans text-[16px] font-semibold text-tf-text mb-2">Connecte-toi pour voir tes commandes</p>
        <Link href="/auth/login" className="btn-gold mt-4">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className={`mx-auto px-4 py-8 ${isSeller ? "max-w-screen-lg" : "max-w-screen-md"}`}>
        <h1 className="font-sans text-h2 font-bold text-tf-text mb-6">{content.title}</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-tf-border" />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={56} className="text-tf-border mb-4" />
            <p className="font-sans text-[16px] font-semibold text-tf-text mb-2">{content.emptyTitle}</p>
            <p className="font-sans text-[13px] text-tf-text-muted mb-6">
              {content.emptyDesc}
            </p>
            <Link href={content.ctaHref} className="btn-gold">
              {content.ctaLabel}
            </Link>
          </div>
        ) : isSeller ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.items.map((order: Order) => (
              <OrderCardSeller key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((order: Order) => (
              <Link
                key={order.id}
                href={`/commandes/${order.id}`}
                className="block bg-white rounded-xl border border-tf-border p-4 hover:border-tf-gold/40 hover:shadow-card transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-sans text-[13px] font-bold text-tf-text">{order.reference}</span>
                      <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded border ${STATUT_COLORS[order.statut]}`}>
                        {STATUT_LABELS[order.statut]}
                      </span>
                    </div>
                    <p className="font-sans text-[12px] text-tf-text-muted">
                      {order.items.length} article{order.items.length > 1 ? "s" : ""} · {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    <p className="font-sans text-[12px] text-tf-text-muted truncate mt-0.5">
                      {order.items.map((i) => i.titre).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-mono text-[15px] font-bold text-tf-black">{formatPrix(order.montant)}</span>
                    <ChevronRight size={16} className="text-tf-text-muted" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
