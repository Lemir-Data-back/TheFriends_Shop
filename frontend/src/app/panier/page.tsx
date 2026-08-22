"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, Trash2, Plus, Minus, MapPin, ChevronRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth";
import { formatPrix } from "@/lib/utils";
import { api } from "@/lib/api";
import { CartVendeurGroup } from "@/types/cart";

export default function PanierPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { cart, isLoading, updateItem, removeItem, clearCart } = useCart();
  const [commandeEnCours, setCommandeEnCours] = useState<number | null>(null);

  async function handleCommander(groupe: CartVendeurGroup) {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    setCommandeEnCours(groupe.shop_id);
    try {
      const { data } = await api.post("/orders", {
        shop_id: groupe.shop_id,
        adresse_livraison: {
          nom: "À compléter",
          telephone: "À compléter",
          quartier: "À compléter",
          commune: "Abidjan",
          ville: "Abidjan",
        },
      });
      router.push(`/commandes/${data.id}`);
    } catch {
      alert("Erreur lors de la commande. Réessaie.");
    } finally {
      setCommandeEnCours(null);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tf-bg">
        <div className="max-w-screen-md mx-auto px-4 py-10">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-tf-border" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !cart || cart.nb_articles === 0;

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className="max-w-screen-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/shopping" aria-label="Retour au shopping" className="text-tf-text-muted hover:text-tf-text transition-colors rounded-sm">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="font-sans text-h2 font-bold text-tf-text">Mon panier</h1>
          {!isEmpty && (
            <span className="bg-tf-gold text-tf-black text-[12px] font-bold px-2 py-0.5 rounded-full">
              {cart.nb_articles}
            </span>
          )}
        </div>

        {isEmpty ? (
          /* Panier vide */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShoppingBag size={64} className="text-tf-border mb-6" />
            <p className="font-sans text-[18px] font-semibold text-tf-text mb-2">Ton panier est vide</p>
            <p className="font-sans text-[14px] text-tf-text-muted mb-8">
              Explore le shopping et ajoute des articles
            </p>
            <Link
              href="/shopping"
              className="btn-gold"
            >
              Aller en shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Articles */}
            <div className="lg:col-span-2 space-y-6">
              {cart.groupes.map((groupe) => (
                <div key={groupe.shop_id} className="bg-white rounded-xl border border-tf-border overflow-hidden">
                  {/* En-tête boutique */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-tf-border bg-tf-bg">
                    <Link
                      href={`/boutique/${groupe.shop_id}`}
                      className="font-sans text-[13px] font-semibold text-tf-text hover:text-tf-gold transition-colors flex items-center gap-1"
                    >
                      {groupe.shop_nom}
                      <ChevronRight size={14} />
                    </Link>
                    <span className="font-sans text-[12px] text-tf-text-muted">
                      {groupe.items.length} article{groupe.items.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Articles */}
                  <div className="divide-y divide-tf-border">
                    {groupe.items.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="w-20 h-24 bg-tf-gray-soft rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.cover_url ? (
                            <Image
                              src={item.product.cover_url}
                              alt={item.product.titre}
                              width={80}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-tf-gray-soft" />
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[14px] font-medium text-tf-text">{item.product.titre}</p>
                          {(item.taille || item.couleur) && (
                            <p className="font-sans text-[12px] text-tf-text-muted mt-0.5">
                              {[item.taille, item.couleur].filter(Boolean).join(" · ")}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            {/* Quantité */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateItem.mutate({ id: item.id, quantite: item.quantite - 1 })}
                                disabled={item.quantite <= 1}
                                aria-label="Diminuer la quantité"
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-tf-border hover:border-tf-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Minus size={13} />
                              </button>
                              <span className="font-sans text-[14px] font-medium w-5 text-center" aria-live="polite">
                                {item.quantite}
                              </span>
                              <button
                                onClick={() => updateItem.mutate({ id: item.id, quantite: item.quantite + 1 })}
                                disabled={item.quantite >= 10}
                                aria-label="Augmenter la quantité"
                                className="w-7 h-7 flex items-center justify-center rounded-md border border-tf-border hover:border-tf-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Plus size={13} />
                              </button>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-sans text-[15px] font-bold text-tf-black">
                                {formatPrix(item.sous_total)}
                              </span>
                              <button
                                onClick={() => removeItem.mutate(item.id)}
                                aria-label={`Retirer ${item.product.titre} du panier`}
                                className="p-1.5 -m-1.5 rounded-md text-tf-text-muted hover:text-tf-error transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer boutique */}
                  <div className="flex items-center justify-between px-5 py-3 border-t border-tf-border">
                    <span className="font-sans text-[13px] text-tf-text-muted">
                      Sous-total
                    </span>
                    <span className="font-sans text-[14px] font-bold text-tf-text">
                      {formatPrix(groupe.sous_total_boutique)}
                    </span>
                  </div>

                  {/* Bouton commander cette boutique */}
                  <div className="px-5 pb-4">
                    <button
                      onClick={() => handleCommander(groupe)}
                      disabled={commandeEnCours === groupe.shop_id}
                      className="btn-primary w-full"
                    >
                      {commandeEnCours === groupe.shop_id ? "Commande en cours..." : `Commander chez ${groupe.shop_nom}`}
                    </button>
                  </div>
                </div>
              ))}

              {/* Vider le panier */}
              <button
                onClick={() => clearCart.mutate()}
                className="text-[13px] text-tf-text-muted hover:text-tf-error transition-colors flex items-center gap-1.5 rounded-sm"
              >
                <Trash2 size={14} />
                Vider le panier
              </button>
            </div>

            {/* Récapitulatif */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-tf-border p-5 sticky top-6">
                <h2 className="font-sans text-[15px] font-bold text-tf-text mb-4">Récapitulatif</h2>

                <div className="space-y-2 mb-4">
                  {cart.groupes.map((g) => (
                    <div key={g.shop_id} className="flex justify-between">
                      <span className="font-sans text-[13px] text-tf-text-muted truncate max-w-[140px]">{g.shop_nom}</span>
                      <span className="font-sans text-[13px] text-tf-text">{formatPrix(g.sous_total_boutique)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-tf-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-sans text-[14px] font-semibold text-tf-text">Total</span>
                    <span className="font-mono text-[20px] font-bold text-tf-black">{formatPrix(cart.total)}</span>
                  </div>
                  <p className="font-sans text-[11px] text-tf-text-muted mt-1">Livraison calculée à la commande</p>
                </div>

                <div className="mt-5 p-3 bg-tf-bg rounded-lg border border-tf-border flex gap-2">
                  <MapPin size={16} className="text-tf-gold flex-shrink-0 mt-0.5" />
                  <p className="font-sans text-[12px] text-tf-text-muted">
                    L&apos;adresse de livraison sera demandée lors de chaque commande par boutique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
