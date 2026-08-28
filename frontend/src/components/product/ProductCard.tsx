"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { useState } from "react";
import { cn, formatPrix, getRemisePercent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { ProductListItem } from "@/types/product";

interface ProductCardProps {
  product: ProductListItem;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const coverImage = product.images.find((i) => i.ordre === 0) ?? product.images[0];
  const hasPromo = product.prix_promo && product.prix_promo < product.prix;
  const remise = hasPromo ? getRemisePercent(product.prix, product.prix_promo!) : 0;

  return (
    <article
      className={cn(
        "group relative bg-white rounded-xl border border-tf-border overflow-hidden",
        "transition-all duration-150 ease hover:border-tf-gold/40 hover:shadow-card",
        "hover:-translate-y-0.5",
        className
      )}
    >
      {/* Image */}
      <Link href={`/boutique/${product.shop_id}/produits/${product.id}`} className="block relative aspect-[3/4] overflow-hidden bg-tf-gray-soft">
        {coverImage ? (
          <Image
            src={coverImage.url_cloudinary}
            alt={product.titre}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-tf-text-muted text-micro uppercase tracking-widest">
            Aucune photo
          </div>
        )}

        {/* Badges superposés */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.stock_statut === "rupture" ? (
            <Badge variant="rupture">Rupture</Badge>
          ) : product.stock_statut === "stock_faible" ? (
            <Badge variant="stock-faible">Stock faible</Badge>
          ) : hasPromo ? (
            <Badge variant="promo">-{remise}%</Badge>
          ) : null}
          {product.is_sur_mesure && (
            <Badge variant="sur-mesure">Sur mesure</Badge>
          )}
        </div>

        {/* Bouton like */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold before:absolute before:-inset-1.5 before:content-['']"
          aria-pressed={liked}
          aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart
            size={15}
            className={cn("transition-colors", liked ? "fill-tf-error stroke-tf-error" : "stroke-tf-text-muted")}
          />
        </button>
      </Link>

      {/* Infos */}
      <div className="p-3">
        {/* Tags tissu */}
        {product.tissu && (
          <p className="text-micro uppercase tracking-widest text-tf-text-muted mb-1">
            {product.tissu}
          </p>
        )}

        {/* Titre */}
        <Link href={`/boutique/${product.shop_id}/produits/${product.id}`}>
          <h3 className="font-sans text-[13px] font-medium text-tf-text leading-snug line-clamp-2 hover:text-tf-gold transition-colors">
            {product.titre}
          </h3>
        </Link>

        {/* Prix */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="font-mono text-price text-tf-text">
                {formatPrix(product.prix_promo!)}
              </span>
              <span className="font-mono text-[13px] text-tf-text-muted line-through">
                {formatPrix(product.prix)}
              </span>
            </>
          ) : (
            <span className="font-mono text-price text-tf-text">
              {formatPrix(product.prix)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
