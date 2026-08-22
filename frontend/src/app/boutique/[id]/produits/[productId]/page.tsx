"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Heart, Share2, ChevronLeft, Check, Info } from "lucide-react";
import { api } from "@/lib/api";
import { cn, formatPrix, getRemisePercent } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Product, SizeRecommendation } from "@/types/product";

async function fetchProduct(id: string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

async function fetchSizeRec(id: string): Promise<SizeRecommendation> {
  const { data } = await api.get(`/products/${id}/size-recommendation`);
  return data;
}

const OCCASION_LABELS: Record<string, string> = {
  casual: "Casual", bureau: "Bureau", ceremonie: "Cérémonie",
  traditionnel: "Traditionnel", mariage: "Mariage", sport: "Sport",
};

export default function ProductPage() {
  const { id: shopId, productId } = useParams<{ id: string; productId: string }>();
  const [activeImg, setActiveImg] = useState(0);
  const [liked, setLiked] = useState(false);
  const [selectedTaille, setSelectedTaille] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => fetchProduct(productId),
  });

  const { data: sizeRec } = useQuery({
    queryKey: ["sizeRec", productId],
    queryFn: () => fetchSizeRec(productId),
    enabled: !!product,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tf-bg">
        <div className="max-w-screen-xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-[3/4] rounded-xl bg-tf-gray-soft animate-pulse" />
            <div className="space-y-4">
              {[32, 24, 16, 48].map((h, i) => (
                <div key={i} className={`h-${h/4} rounded bg-tf-gray-soft animate-pulse`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const hasPromo = product.prix_promo && product.prix_promo < product.prix;
  const remise = hasPromo ? getRemisePercent(product.prix, product.prix_promo!) : 0;
  const tailles = product.tailles_guide ? Object.keys(product.tailles_guide) : [];
  const enRupture = product.stock_statut === "rupture";

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-tf-bg">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-nav text-tf-text-muted">
          <Link href={`/boutique/${shopId}#catalogue`} className="flex items-center gap-1 hover:text-tf-text transition-colors">
            <ChevronLeft size={14} />
            Catalogue
          </Link>
          <span>/</span>
          <span className="text-tf-text truncate max-w-[200px]">{product.titre}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Galerie photos */}
          <div className="space-y-3">
            {/* Image principale */}
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-tf-gray-soft">
              {product.images[activeImg] ? (
                <Image
                  src={product.images[activeImg].url_cloudinary}
                  alt={`${product.titre} — vue ${activeImg + 1}`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-tf-text-muted text-micro uppercase tracking-widest">
                  Aucune photo
                </div>
              )}
              {(enRupture || product.stock_statut === "stock_faible" || hasPromo) && (
                <div className="absolute top-3 left-3">
                  {enRupture ? (
                    <Badge variant="rupture">Rupture</Badge>
                  ) : product.stock_statut === "stock_faible" ? (
                    <Badge variant="stock-faible">Stock faible</Badge>
                  ) : (
                    <Badge variant="promo">-{remise}%</Badge>
                  )}
                </div>
              )}
            </div>

            {/* Miniatures */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Voir la photo ${i + 1} de ${product.titre}`}
                    aria-pressed={activeImg === i}
                    className={cn(
                      "relative w-16 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2",
                      activeImg === i ? "border-tf-gold" : "border-transparent hover:border-tf-border"
                    )}
                  >
                    <Image src={img.url_cloudinary} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="space-y-5">
            {/* Titre */}
            <h1 className="font-serif text-h1 text-tf-text leading-tight">{product.titre}</h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.is_sur_mesure && <Badge variant="sur-mesure">Sur mesure</Badge>}
              {product.tissu && <Badge>{product.tissu}</Badge>}
              {product.occasion && <Badge>{OCCASION_LABELS[product.occasion] ?? product.occasion}</Badge>}
            </div>

            {/* Prix */}
            <div className="flex items-baseline gap-3">
              {hasPromo ? (
                <>
                  <span className="font-mono text-display text-tf-gold leading-none">
                    {formatPrix(product.prix_promo!)}
                  </span>
                  <span className="font-mono text-h3 text-tf-text-muted line-through">
                    {formatPrix(product.prix)}
                  </span>
                </>
              ) : (
                <span className="font-mono text-display text-tf-text leading-none">
                  {formatPrix(product.prix)}
                </span>
              )}
            </div>

            {/* Recommandation de taille */}
            {sizeRec && sizeRec.indice_confiance > 0 && (
              <div className={cn(
                "flex items-start gap-2 p-3 rounded-lg border text-nav",
                sizeRec.indice_confiance >= 0.8
                  ? "bg-tf-success-bg border-tf-success text-tf-success"
                  : "bg-tf-warning-bg border-tf-warning text-tf-warning"
              )}>
                <Info size={14} className="mt-0.5 shrink-0" />
                <p>{sizeRec.message}</p>
              </div>
            )}

            {/* Sélecteur de tailles */}
            {tailles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-label uppercase tracking-widest text-tf-text">Taille</p>
                  {selectedTaille && (
                    <span className="text-nav text-tf-text-muted">{selectedTaille} sélectionné</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {tailles.map((t) => {
                    const isRecommended = sizeRec?.taille_recommandee === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setSelectedTaille(selectedTaille === t ? null : t)}
                        aria-pressed={selectedTaille === t}
                        aria-label={`Taille ${t}${isRecommended ? " (recommandée)" : ""}`}
                        className={cn(
                          "relative px-4 py-2 rounded-md border text-nav font-medium transition-colors",
                          selectedTaille === t
                            ? "bg-tf-black text-white border-tf-black"
                            : isRecommended
                            ? "bg-tf-success-bg text-tf-success border-tf-success"
                            : "bg-white text-tf-text border-tf-border hover:border-tf-text"
                        )}
                      >
                        {t}
                        {isRecommended && (
                          <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-tf-gold rounded-full flex items-center justify-center">
                            <Check size={8} className="text-white stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={enRupture || (tailles.length > 0 && !selectedTaille)}
                className={cn(
                  "flex-1 py-3.5 rounded-md text-btn font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-black focus-visible:ring-offset-2",
                  addedToCart
                    ? "bg-tf-success text-white"
                    : "bg-tf-gold text-tf-black hover:bg-tf-gold-light",
                  (enRupture || (tailles.length > 0 && !selectedTaille)) && "opacity-50 cursor-not-allowed"
                )}
              >
                {enRupture ? "Rupture de stock" : addedToCart ? "Ajouté ✓" : "Ajouter au panier"}
              </button>
              <button
                onClick={() => setLiked(!liked)}
                aria-pressed={liked}
                aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-md border transition-colors",
                  liked ? "bg-tf-error-bg border-tf-error text-tf-error" : "bg-white border-tf-border text-tf-text-muted hover:border-tf-text"
                )}
              >
                <Heart size={18} className={liked ? "fill-tf-error" : ""} />
              </button>
              <button
                aria-label="Partager cet article"
                className="w-12 h-12 flex items-center justify-center rounded-md border border-tf-border text-tf-text-muted hover:border-tf-text bg-white transition-colors"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-4 border-t border-tf-border">
                <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Description</p>
                <p className="text-body text-tf-text leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-sm bg-tf-gray-soft text-micro uppercase tracking-widest text-tf-text-muted">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
