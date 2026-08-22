"use client";

import { X, Trash2, Plus, Minus, ShoppingBag, LogIn } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/auth";
import { formatPrix } from "@/lib/utils";

export function CartDrawer() {
  const { isOpen, closeCart } = useCartStore();
  const { cart, isLoading, updateItem, removeItem } = useCart();
  const { user } = useAuthStore();
  const isSeller = user?.role === "couturier" || user?.role === "vendeur";

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Drawer — glisse depuis la droite sur desktop, depuis le bas sur mobile */}
      <div
        className={`fixed z-50 bg-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
          inset-x-0 bottom-0 h-[85vh] rounded-t-2xl
          sm:top-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-full sm:max-w-sm sm:rounded-none
          ${isOpen ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}
        `}
      >
        {/* Poignée de fermeture — mobile uniquement */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <button
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="w-10 h-1.5 rounded-full bg-tf-border"
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tf-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-tf-black" />
            <span className="font-sans font-semibold text-[15px] text-tf-text">
              Mon panier
            </span>
            {cart && cart.nb_articles > 0 && (
              <span className="bg-tf-gold text-tf-black text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                {cart.nb_articles}
              </span>
            )}
          </div>
          <button onClick={closeCart} aria-label="Fermer le panier" className="hidden sm:block text-tf-text-muted hover:text-tf-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {isSeller ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <LogIn size={48} className="text-tf-border mb-4" />
              <p className="font-sans text-[15px] font-medium text-tf-text mb-1">Aperçu vendeur</p>
              <p className="font-sans text-[13px] text-tf-text-muted mb-6">
                Connecte-toi avec un compte client pour utiliser le panier.
              </p>
              <Link
                href="/auth/login"
                onClick={closeCart}
                className="px-5 py-2.5 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
              >
                Se connecter
              </Link>
            </div>
          ) : isLoading ? (
            <div className="p-5 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-tf-gray-soft rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !cart || cart.nb_articles === 0 ? (
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <ShoppingBag size={48} className="text-tf-border mb-4" />
              <p className="font-sans text-[15px] font-medium text-tf-text mb-1">Panier vide</p>
              <p className="font-sans text-[13px] text-tf-text-muted mb-6">
                Ajoute des articles depuis le shopping
              </p>
              <Link
                href="/shopping"
                onClick={closeCart}
                className="px-5 py-2.5 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
              >
                Aller en shopping
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {cart.groupes.map((groupe) => (
                <div key={groupe.shop_id}>
                  {/* Nom boutique */}
                  <p className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-widest mb-3">
                    {groupe.shop_nom}
                  </p>

                  <div className="space-y-3">
                    {groupe.items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-tf-bg rounded-lg border border-tf-border">
                        {/* Image */}
                        <div className="w-16 h-20 bg-tf-gray-soft rounded-md overflow-hidden flex-shrink-0">
                          {item.product.cover_url ? (
                            <Image
                              src={item.product.cover_url}
                              alt={item.product.titre}
                              width={64}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-tf-gray-soft" />
                          )}
                        </div>

                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p className="font-sans text-[13px] font-medium text-tf-text truncate">
                            {item.product.titre}
                          </p>
                          {(item.taille || item.couleur) && (
                            <p className="font-sans text-[11px] text-tf-text-muted mt-0.5">
                              {[item.taille, item.couleur].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <p className="font-sans text-[13px] font-bold text-tf-gold mt-1">
                            {formatPrix(item.prix_effectif)}
                          </p>

                          {/* Quantité + supprimer */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateItem.mutate({ id: item.id, quantite: item.quantite - 1 })}
                              aria-label="Diminuer la quantité"
                              className="relative w-6 h-6 flex items-center justify-center rounded border border-tf-border text-tf-text hover:border-tf-gold transition-colors before:absolute before:-inset-2.5 before:content-['']"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-sans text-[13px] font-medium w-4 text-center" aria-live="polite">
                              {item.quantite}
                            </span>
                            <button
                              onClick={() => updateItem.mutate({ id: item.id, quantite: item.quantite + 1 })}
                              disabled={item.quantite >= 10}
                              aria-label="Augmenter la quantité"
                              className="relative w-6 h-6 flex items-center justify-center rounded border border-tf-border text-tf-text hover:border-tf-gold transition-colors disabled:opacity-40 before:absolute before:-inset-2.5 before:content-['']"
                            >
                              <Plus size={12} />
                            </button>
                            <button
                              onClick={() => removeItem.mutate(item.id)}
                              aria-label={`Retirer ${item.product.titre} du panier`}
                              className="relative ml-auto w-6 h-6 flex items-center justify-center text-tf-text-muted hover:text-red-500 transition-colors before:absolute before:-inset-2.5 before:content-['']"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-2 px-1">
                    <span className="font-sans text-[12px] text-tf-text-muted">Sous-total {groupe.shop_nom}</span>
                    <span className="font-sans text-[12px] font-semibold text-tf-text">
                      {formatPrix(groupe.sous_total_boutique)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer total + CTA */}
        {cart && cart.nb_articles > 0 && (
          <div className="border-t border-tf-border p-5 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-sans text-[14px] font-semibold text-tf-text">Total</span>
              <span className="font-mono text-[18px] font-bold text-tf-black">
                {formatPrix(cart.total)}
              </span>
            </div>
            <div className="flex gap-2">
              <Link
                href="/panier"
                onClick={closeCart}
                className="flex-1 text-center py-3 border border-tf-border rounded-md font-sans font-bold text-[13px] text-tf-text hover:border-tf-gold transition-colors"
              >
                Voir le panier
              </Link>
              <Link
                href="/panier"
                onClick={closeCart}
                className="flex-1 text-center py-3 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
              >
                Passer ma commande
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
