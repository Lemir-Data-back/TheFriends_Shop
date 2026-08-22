"use client";

import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";

export function CartButton() {
  const { toggleCart, nbArticles } = useCartStore();

  return (
    <button
      onClick={toggleCart}
      className="relative p-3 -m-1 rounded-full text-white/70 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold"
      aria-label="Ouvrir le panier"
    >
      <ShoppingBag size={20} />
      {nbArticles > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-tf-gold text-tf-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
          {nbArticles > 9 ? "9+" : nbArticles}
        </span>
      )}
    </button>
  );
}
