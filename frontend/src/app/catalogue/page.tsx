"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { ProductFilters, ProductListResponse, ProductCategorie, ProductOccasion } from "@/types/product";

const CATEGORIES: { value: ProductCategorie; label: string }[] = [
  { value: "femme", label: "Femme" },
  { value: "homme", label: "Homme" },
  { value: "enfant", label: "Enfant" },
];

const OCCASIONS: { value: ProductOccasion; label: string }[] = [
  { value: "casual", label: "Casual" },
  { value: "bureau", label: "Bureau" },
  { value: "ceremonie", label: "Cérémonie" },
  { value: "traditionnel", label: "Traditionnel" },
  { value: "mariage", label: "Mariage" },
  { value: "sport", label: "Sport" },
];

const TISSUS = ["Wax", "Bazin", "Kente", "Coton", "Soie", "Lin"];

async function fetchProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  });
  const { data } = await api.get<ProductListResponse>(`/products?${params}`);
  return data;
}

export default function CataloguePage() {
  const [filters, setFilters] = useState<ProductFilters>({ page: 1, limit: 20 });
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });

  const applySearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  }, [search]);

  const setCategorie = (cat: ProductCategorie | undefined) =>
    setFilters((f) => ({ ...f, categorie: cat, page: 1 }));

  const setOccasion = (occ: ProductOccasion | undefined) =>
    setFilters((f) => ({ ...f, occasion: occ, page: 1 }));

  const setTissu = (t: string | undefined) =>
    setFilters((f) => ({ ...f, tissu: t?.toLowerCase(), page: 1 }));

  const clearFilters = () => {
    setFilters({ page: 1, limit: 20 });
    setSearch("");
  };

  const hasActiveFilters = !!(filters.categorie || filters.occasion || filters.tissu || filters.search);

  return (
    <div className="min-h-screen bg-tf-bg">
      {/* Header catalogue */}
      <div className="bg-white border-b border-tf-border sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
          {/* Barre de recherche */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-tf-gray-soft rounded-md px-3 py-2 border border-tf-border focus-within:border-tf-gold focus-within:ring-2 focus-within:ring-[rgba(201,168,76,0.2)] transition-all">
              <Search size={16} className="text-tf-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Rechercher un article, un tissu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                className="flex-1 bg-transparent text-body text-tf-text placeholder:text-tf-text-muted outline-none"
              />
              {search && (
                <button onClick={() => { setSearch(""); setFilters((f) => ({ ...f, search: undefined })); }}>
                  <X size={14} className="text-tf-text-muted hover:text-tf-text" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-md border text-nav font-medium transition-colors",
                showFilters
                  ? "bg-tf-black text-white border-tf-black"
                  : "bg-white text-tf-text border-tf-border hover:border-tf-text"
              )}
            >
              <SlidersHorizontal size={14} />
              <span className="hidden sm:inline">Filtres</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-tf-gold" />
              )}
            </button>
          </div>

          {/* Filtres catégories (pills) */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setCategorie(undefined)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-nav font-medium border transition-colors",
                !filters.categorie
                  ? "bg-tf-black text-white border-tf-black"
                  : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
              )}
            >
              Tout
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategorie(filters.categorie === cat.value ? undefined : cat.value)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-nav font-medium border transition-colors",
                  filters.categorie === cat.value
                    ? "bg-tf-black text-white border-tf-black"
                    : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Panneau filtres avancés */}
        {showFilters && (
          <div className="border-t border-tf-border bg-white px-4 sm:px-6 py-4">
            <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Occasion */}
              <div>
                <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Occasion</p>
                <div className="flex flex-wrap gap-1.5">
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.value}
                      onClick={() => setOccasion(filters.occasion === occ.value ? undefined : occ.value)}
                      className={cn(
                        "px-2.5 py-1 rounded-sm text-nav border transition-colors",
                        filters.occasion === occ.value
                          ? "bg-tf-black text-white border-tf-black"
                          : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                      )}
                    >
                      {occ.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tissu */}
              <div>
                <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Tissu</p>
                <div className="flex flex-wrap gap-1.5">
                  {TISSUS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTissu(filters.tissu?.toLowerCase() === t.toLowerCase() ? undefined : t)}
                      className={cn(
                        "px-2.5 py-1 rounded-sm text-nav border transition-colors",
                        filters.tissu?.toLowerCase() === t.toLowerCase()
                          ? "bg-tf-black text-white border-tf-black"
                          : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sur mesure */}
              <div>
                <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Type</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, is_sur_mesure: f.is_sur_mesure === true ? undefined : true, page: 1 }))}
                    className={cn(
                      "px-2.5 py-1 rounded-sm text-nav border transition-colors",
                      filters.is_sur_mesure === true
                        ? "bg-tf-black text-white border-tf-black"
                        : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                    )}
                  >
                    Sur mesure
                  </button>
                  <button
                    onClick={() => setFilters((f) => ({ ...f, is_sur_mesure: f.is_sur_mesure === false ? undefined : false, page: 1 }))}
                    className={cn(
                      "px-2.5 py-1 rounded-sm text-nav border transition-colors",
                      filters.is_sur_mesure === false
                        ? "bg-tf-black text-white border-tf-black"
                        : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                    )}
                  >
                    Prêt-à-porter
                  </button>
                </div>
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-nav text-tf-text-muted hover:text-tf-text underline underline-offset-2">
                Effacer tous les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grille produits */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
        {/* Compteur */}
        <p className="text-nav text-tf-text-muted mb-4">
          {isLoading ? "Chargement..." : `${data?.total ?? 0} article${(data?.total ?? 0) > 1 ? "s" : ""}`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-tf-gray-soft animate-pulse" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-serif text-h2 text-tf-text mb-2">Aucun article trouvé</p>
            <p className="text-body text-tf-text-muted mb-6">Essayez d'autres filtres ou une autre recherche</p>
            <button onClick={clearFilters} className="px-4 py-2 bg-tf-black text-white rounded-md text-btn">
              Effacer les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {data?.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: data.pages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                className={cn(
                  "w-9 h-9 rounded-md text-nav font-medium border transition-colors",
                  filters.page === i + 1
                    ? "bg-tf-black text-white border-tf-black"
                    : "bg-white text-tf-text border-tf-border hover:border-tf-text"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
