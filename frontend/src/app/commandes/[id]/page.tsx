"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Truck, Package, AlertCircle, CreditCard } from "lucide-react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Order, OrderStatut, STATUT_LABELS, STATUT_COLORS } from "@/types/order";
import { formatPrix } from "@/lib/utils";

const ETAPES: { statut: OrderStatut; label: string; icon: ReactNode }[] = [
  { statut: "en_attente", label: "Commande passée", icon: <Clock size={14} /> },
  { statut: "acceptee", label: "Acceptée", icon: <CheckCircle size={14} /> },
  { statut: "en_cours", label: "En préparation", icon: <Package size={14} /> },
  { statut: "expedie", label: "Expédiée", icon: <Truck size={14} /> },
  { statut: "livre", label: "Livrée", icon: <CheckCircle size={14} /> },
  { statut: "confirme", label: "Confirmée", icon: <CheckCircle size={14} /> },
];

const ORDRE_STATUT = ["en_attente", "acceptee", "en_cours", "expedie", "livre", "confirme"];

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
  });

  const confirmerReception = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/statut`, { statut: "confirme" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["order", id] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tf-bg">
        <div className="max-w-screen-md mx-auto px-4 py-8 space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-tf-border" />)}
        </div>
      </div>
    );
  }

  if (!order) return null;

  const indexActuel = ORDRE_STATUT.indexOf(order.statut);
  const peutConfirmer = order.statut === "livre" && user?.role === "client";

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className="max-w-screen-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/commandes" className="text-tf-text-muted hover:text-tf-text transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-sans text-h3 font-bold text-tf-text">{order.reference}</h1>
            <p className="font-sans text-[12px] text-tf-text-muted">
              {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className={`ml-auto font-sans text-[12px] font-medium px-3 py-1 rounded-full border ${STATUT_COLORS[order.statut]}`}>
            {STATUT_LABELS[order.statut]}
          </span>
        </div>

        {/* Timeline */}
        {!["annule", "rembourse", "litige"].includes(order.statut) && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-4">Suivi de commande</h2>
            <div className="flex items-start gap-0">
              {ETAPES.map((etape, idx) => {
                const done = ORDRE_STATUT.indexOf(etape.statut) <= indexActuel;
                const active = etape.statut === order.statut;
                return (
                  <div key={etape.statut} className="relative flex-1 flex flex-col items-center">
                    {/* Connecteur horizontal entre étapes */}
                    {idx < ETAPES.length - 1 && (
                      <div className={`absolute top-3.5 left-1/2 w-full h-0.5 ${done ? "bg-tf-gold" : "bg-tf-border"}`} />
                    )}
                    <div className={`relative z-10 w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] transition-all ${
                      done ? "bg-tf-gold border-tf-gold text-tf-black" : "bg-white border-tf-border text-tf-text-muted"
                    } ${active ? "ring-2 ring-tf-gold/30" : ""}`}>
                      {etape.icon}
                    </div>
                    <p className={`font-sans text-[10px] text-center mt-1.5 leading-tight ${done ? "text-tf-text" : "text-tf-text-muted"}`}>
                      {etape.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Articles */}
        <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
          <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-3">Articles commandés</h2>
          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div>
                  <p className="font-sans text-[13px] font-medium text-tf-text">{item.titre}</p>
                  {(item.taille || item.couleur) && (
                    <p className="font-sans text-[11px] text-tf-text-muted">
                      {[item.taille, item.couleur].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  <p className="font-sans text-[11px] text-tf-text-muted">Qté : {item.quantite}</p>
                </div>
                <span className="font-sans text-[14px] font-bold text-tf-black">
                  {formatPrix(item.prix * item.quantite)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-tf-border mt-4 pt-3 flex justify-between">
            <span className="font-sans text-[14px] font-semibold text-tf-text">Total</span>
            <span className="font-serif text-[18px] font-bold text-tf-black">{formatPrix(order.montant)}</span>
          </div>
        </div>

        {/* Adresse livraison */}
        {order.adresse_livraison && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-3">Adresse de livraison</h2>
            <p className="font-sans text-[13px] text-tf-text">{order.adresse_livraison.nom}</p>
            <p className="font-sans text-[13px] text-tf-text-muted">{order.adresse_livraison.telephone}</p>
            <p className="font-sans text-[13px] text-tf-text-muted">
              {order.adresse_livraison.quartier}, {order.adresse_livraison.commune}, {order.adresse_livraison.ville}
            </p>
          </div>
        )}

        {/* Escrow */}
        <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={16} className="text-tf-gold" />
            <h2 className="font-sans text-[13px] font-semibold text-tf-text">Paiement sécurisé (Escrow)</h2>
          </div>
          <p className="font-sans text-[12px] text-tf-text-muted">
            {order.escrow_statut === "bloque"
              ? "Ton paiement est bloqué en sécurité. Il sera libéré au vendeur quand tu confirmeras la réception."
              : order.escrow_statut === "libere"
              ? "Paiement libéré au vendeur après confirmation de réception."
              : "En attente de paiement."}
          </p>
        </div>

        {/* Action : confirmer réception */}
        {peutConfirmer && (
          <button
            onClick={() => confirmerReception.mutate()}
            disabled={confirmerReception.isPending}
            className="w-full py-4 bg-tf-gold text-tf-black rounded-xl font-sans font-bold text-[15px] hover:bg-tf-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {confirmerReception.isPending ? "Confirmation..." : "Confirmer la réception"}
          </button>
        )}

        {/* Litige */}
        {order.statut === "litige" && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-[13px] font-semibold text-red-700">Litige en cours</p>
              <p className="font-sans text-[12px] text-red-600 mt-0.5">
                Notre équipe examine votre dossier. Vous serez contacté sous 24h.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

