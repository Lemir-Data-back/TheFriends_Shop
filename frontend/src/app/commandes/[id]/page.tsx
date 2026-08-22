"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Truck, Package, AlertCircle, CreditCard, User, Star, Ruler, ExternalLink, MessageCircle, Check, X, Tag, ArrowLeftRight } from "lucide-react";
import type { ReactNode } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Order, OrderStatut, NegociationAction, STATUT_LABELS, STATUT_COLORS } from "@/types/order";
import { formatPrix } from "@/lib/utils";

const MENSURATION_LABELS: Record<string, string> = {
  poitrine: "Poitrine",
  taille: "Taille",
  hanches: "Hanches",
  pointure: "Pointure",
};

function scoreBadgeClass(score: number): string {
  if (score >= 4.5) return "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark";
  if (score >= 3.5) return "bg-tf-success-bg text-tf-success";
  if (score >= 2.5) return "bg-tf-gray-soft text-tf-text-muted";
  return "bg-tf-error-bg text-tf-error";
}

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
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [delaiJours, setDelaiJours] = useState("7");
  const [montantOffre, setMontantOffre] = useState("");
  const [messageOffre, setMessageOffre] = useState("");
  const [negoError, setNegoError] = useState("");
  const [showNegoForm, setShowNegoForm] = useState(false);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`);
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["order", id] });

  const confirmerReception = useMutation({
    mutationFn: () => api.patch(`/orders/${id}/statut`, { statut: "confirme" }),
    onSuccess: invalidate,
  });

  const updateStatut = useMutation({
    mutationFn: (payload: { statut: string; delai_jours?: number }) => api.patch(`/orders/${id}/statut`, payload),
    onSuccess: invalidate,
  });

  const negocier = useMutation({
    mutationFn: (payload: { action: NegociationAction; prix?: number; message?: string }) =>
      api.post(`/orders/${id}/negociation`, payload),
    onSuccess: () => {
      invalidate();
      setShowNegoForm(false);
      setMontantOffre("");
      setMessageOffre("");
      setNegoError("");
    },
    onError: (err) => setNegoError(getApiErrorMessage(err)),
  });

  const startConversation = useMutation({
    mutationFn: () => {
      if (!order) throw new Error("Commande non chargée");
      return api.post("/messages", {
        shop_id: order.shop_id,
        order_id: order.id,
        premier_message: `Bonjour, je vous contacte au sujet de la commande ${order.reference}.`,
      });
    },
    onSuccess: ({ data }) => router.push(`/messages/${data.id}`),
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
  const isSeller = user?.role === "couturier" || user?.role === "vendeur";
  const monRole: "client" | "shop" = isSeller ? "shop" : "client";

  const negociations = order.negociations ?? [];
  const derniereOffre = negociations[negociations.length - 1];
  const negociationAcceptee = derniereOffre?.action === "accepter";
  const offreLiveDe =
    derniereOffre && (derniereOffre.action === "proposer" || derniereOffre.action === "contre")
      ? derniereOffre.auteur
      : null;
  const negociationActive = order.type === "sur_mesure" && order.statut === "en_attente" && !negociationAcceptee;
  const jePeuxRepondre = negociationActive && offreLiveDe !== null && offreLiveDe !== monRole;
  const jePeuxProposer =
    negociationActive &&
    offreLiveDe === null &&
    (negociations.length === 0 ? monRole === "client" : true);

  const peutTraiterCommande = isSeller && order.statut === "en_attente" && offreLiveDe === null;
  const mensurations = order.client?.mensurations
    ? Object.entries(order.client.mensurations).filter(([, v]) => v != null)
    : [];

  function handleEnvoyerOffre() {
    const prix = parseInt(montantOffre, 10);
    if (!prix || prix <= 0) {
      setNegoError("Entre un montant valide.");
      return;
    }
    negocier.mutate({
      action: negociations.length === 0 ? "proposer" : "contre",
      prix,
      message: messageOffre.trim() || undefined,
    });
  }

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className="max-w-screen-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/commandes" aria-label="Retour aux commandes" className="text-tf-text-muted hover:text-tf-text transition-colors rounded-sm">
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

        {/* Discuter */}
        <button
          onClick={() => startConversation.mutate()}
          disabled={startConversation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 mb-4 border border-tf-border rounded-md font-sans text-[12px] font-semibold text-tf-text hover:border-tf-gold transition-colors disabled:opacity-50"
        >
          <MessageCircle size={13} />
          {isSeller ? "Discuter avec le client" : "Discuter avec le vendeur"}
        </button>

        {/* Client (vue vendeur/couturier) */}
        {isSeller && order.client && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-3">Client</h2>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-full bg-tf-gray-soft flex items-center justify-center shrink-0">
                  <User size={15} className="text-tf-text-muted" />
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
            {mensurations.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-tf-border">
                <Ruler size={12} className="text-tf-text-muted shrink-0" />
                {mensurations.map(([key, value]) => (
                  <span key={key} className="font-sans text-[11px] text-tf-text-muted bg-tf-gray-soft px-1.5 py-0.5 rounded-sm">
                    {MENSURATION_LABELS[key] ?? key} {String(value)}{key !== "pointure" ? " cm" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline */}
        {!["annule", "rembourse", "litige"].includes(order.statut) && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-4">Suivi de commande</h2>
            <div className="flex items-start gap-0" role="list" aria-label="Étapes de la commande">
              {ETAPES.map((etape, idx) => {
                const done = ORDRE_STATUT.indexOf(etape.statut) <= indexActuel;
                const active = etape.statut === order.statut;
                return (
                  <div key={etape.statut} role="listitem" aria-current={active ? "step" : undefined} className="relative flex-1 flex flex-col items-center">
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
                  <Link
                    href={`/boutique/${order.shop_id}/produits/${item.product_id}`}
                    className="inline-flex items-center gap-1 font-sans text-[13px] font-medium text-tf-text hover:text-tf-gold transition-colors"
                  >
                    {item.titre}
                    <ExternalLink size={11} className="text-tf-text-muted" />
                  </Link>
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
            <span className="font-mono text-[18px] font-bold text-tf-black">{formatPrix(order.montant)}</span>
          </div>

          {order.delai_confection_jours && (
            <p className="font-sans text-[12px] text-tf-text-muted mt-2 flex items-center gap-1.5">
              <Clock size={12} /> Délai de confection convenu : {order.delai_confection_jours} jour{order.delai_confection_jours > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Négociation — fil de discussion */}
        {(negociations.length > 0 || jePeuxProposer) && order.type === "sur_mesure" && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Tag size={15} className="text-tf-gold" />
              <h2 className="font-sans text-[13px] font-semibold text-tf-text">Négociation</h2>
            </div>

            {negociations.length > 0 && (
              <div className="space-y-2 mb-4">
                {negociations.map((n, idx) => {
                  const estMoi = n.auteur === monRole;
                  return (
                    <div key={idx} className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                          n.action === "accepter"
                            ? "bg-tf-success-bg text-tf-success"
                            : n.action === "refuser"
                            ? "bg-tf-error-bg text-tf-error"
                            : estMoi
                            ? "bg-tf-black text-white"
                            : "bg-tf-gray-soft text-tf-text"
                        }`}
                      >
                        {(n.action === "proposer" || n.action === "contre") && (
                          <p className="font-sans text-[13px] font-bold">
                            {formatPrix(n.prix ?? 0)}
                          </p>
                        )}
                        {n.action === "accepter" && (
                          <p className="font-sans text-[12px] font-semibold flex items-center gap-1">
                            <Check size={12} /> Offre acceptée
                          </p>
                        )}
                        {n.action === "refuser" && (
                          <p className="font-sans text-[12px] font-semibold flex items-center gap-1">
                            <X size={12} /> Offre refusée
                          </p>
                        )}
                        {n.message && (
                          <p className="font-sans text-[12px] mt-0.5 opacity-90">{n.message}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {negociationAcceptee && (
              <p className="font-sans text-[12px] text-tf-success flex items-center gap-1.5">
                <Check size={13} /> Prix négocié accepté — total mis à jour : {formatPrix(order.montant)}
              </p>
            )}

            {jePeuxRepondre && (
              <div className="pt-2 border-t border-tf-border space-y-2">
                <p className="font-sans text-[12px] text-tf-text-muted">
                  {isSeller ? "Le client attend ta réponse." : "Réponds à la proposition du couturier."}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => negocier.mutate({ action: "accepter" })}
                    disabled={negocier.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-tf-success text-white rounded-md font-sans text-[12px] font-bold hover:bg-[#25593f] transition-colors disabled:opacity-50"
                  >
                    <Check size={13} /> Accepter
                  </button>
                  <button
                    onClick={() => negocier.mutate({ action: "refuser" })}
                    disabled={negocier.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-tf-error text-tf-error rounded-md font-sans text-[12px] font-bold hover:bg-tf-error-bg transition-colors disabled:opacity-50"
                  >
                    <X size={13} /> Refuser
                  </button>
                  <button
                    onClick={() => setShowNegoForm((v) => !v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-tf-border text-tf-text rounded-md font-sans text-[12px] font-bold hover:border-tf-gold transition-colors"
                  >
                    <ArrowLeftRight size={13} /> Contre-offrir
                  </button>
                </div>
              </div>
            )}

            {!jePeuxRepondre && offreLiveDe === monRole && (
              <p className="font-sans text-[12px] text-tf-text-muted pt-2 border-t border-tf-border">
                {isSeller ? "Ta proposition est en attente de réponse du client." : "Ta proposition est en attente de réponse du couturier."}
              </p>
            )}

            {(jePeuxProposer || (jePeuxRepondre && showNegoForm)) && (
              <div className="pt-3 mt-1">
                {!showNegoForm && jePeuxProposer ? (
                  <button onClick={() => setShowNegoForm(true)} className="btn-outline text-[12px] py-2">
                    Proposer un prix
                  </button>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={montantOffre}
                        onChange={(e) => { setMontantOffre(e.target.value); setNegoError(""); }}
                        placeholder="Montant en FCFA"
                        className="flex-1 px-3 py-2 border border-tf-border rounded-md font-sans text-[13px] text-tf-text focus:outline-none focus:border-tf-gold"
                      />
                      <button
                        onClick={handleEnvoyerOffre}
                        disabled={negocier.isPending}
                        className="btn-gold text-[12px] px-4"
                      >
                        Envoyer
                      </button>
                    </div>
                    <input
                      type="text"
                      value={messageOffre}
                      onChange={(e) => setMessageOffre(e.target.value)}
                      placeholder="Un mot pour accompagner ton offre (optionnel)"
                      className="w-full mt-2 px-3 py-2 border border-tf-border rounded-md font-sans text-[12px] text-tf-text focus:outline-none focus:border-tf-gold"
                    />
                    {negoError && <p className="font-sans text-[11px] text-tf-error mt-2">{negoError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Examiner la commande : accepter / refuser */}
        {peutTraiterCommande && (
          <div className="bg-white rounded-xl border border-tf-border p-5 mb-4">
            <h2 className="font-sans text-[13px] font-semibold text-tf-text mb-3">Examiner la commande</h2>
            {order.type === "sur_mesure" && (
              <div className="flex items-center gap-2 mb-3">
                <label htmlFor="delai-confection" className="font-sans text-[12px] text-tf-text-muted shrink-0">Délai de confection</label>
                <input
                  id="delai-confection"
                  type="number"
                  min={1}
                  value={delaiJours}
                  onChange={(e) => setDelaiJours(e.target.value)}
                  className="w-16 px-2 py-1.5 border border-tf-border rounded-md text-[13px] text-center focus:outline-none focus:border-tf-gold"
                />
                <span className="font-sans text-[12px] text-tf-text-muted">jour{parseInt(delaiJours, 10) > 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => updateStatut.mutate({ statut: "acceptee", delai_jours: order.type === "sur_mesure" ? parseInt(delaiJours, 10) : undefined })}
                disabled={updateStatut.isPending}
                className="btn-gold flex-1 flex items-center justify-center gap-2"
              >
                <Check size={15} /> Accepter
              </button>
              <button
                onClick={() => updateStatut.mutate({ statut: "annule" })}
                disabled={updateStatut.isPending}
                className="flex-1 flex items-center justify-center gap-2 border border-tf-error text-tf-error rounded-md font-sans text-[13px] font-bold hover:bg-tf-error-bg transition-colors disabled:opacity-50"
              >
                <X size={15} /> Refuser
              </button>
            </div>
          </div>
        )}

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
            {user?.role === "client"
              ? order.escrow_statut === "bloque"
                ? "Ton paiement est bloqué en sécurité. Il sera libéré au vendeur quand tu confirmeras la réception."
                : order.escrow_statut === "libere"
                ? "Paiement libéré au vendeur après confirmation de réception."
                : "En attente de paiement."
              : order.escrow_statut === "bloque"
                ? "Le paiement du client est bloqué en sécurité. Il te sera libéré dès que le client confirmera la réception."
                : order.escrow_statut === "libere"
                ? "Paiement libéré sur ton compte après confirmation de réception du client."
                : "En attente de paiement du client."}
          </p>
        </div>

        {/* Action : confirmer réception */}
        {peutConfirmer && (
          <button
            onClick={() => confirmerReception.mutate()}
            disabled={confirmerReception.isPending}
            className="btn-gold w-full rounded-xl text-[15px] flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            {confirmerReception.isPending ? "Confirmation..." : "Confirmer la réception"}
          </button>
        )}

        {/* Litige */}
        {order.statut === "litige" && (
          <div className="p-4 bg-tf-error-bg border border-tf-error rounded-xl flex gap-3">
            <AlertCircle size={18} className="text-tf-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-sans text-[13px] font-semibold text-tf-error">Litige en cours</p>
              <p className="font-sans text-[12px] text-tf-error mt-0.5">
                Notre équipe examine votre dossier. Vous serez contacté sous 24h.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

