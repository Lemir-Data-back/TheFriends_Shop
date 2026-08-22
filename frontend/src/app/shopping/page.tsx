"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Search, SlidersHorizontal, X, Star, MapPin, Package, CheckCircle } from "lucide-react"
import { api } from "@/lib/api"
import { ProductCard } from "@/components/product/ProductCard"
import { cn } from "@/lib/utils"
import type { ProductFilters, ProductListResponse, ProductCategorie, ProductOccasion } from "@/types/product"
import type { Shop } from "@/types/shop"

// ── Constantes filtres ────────────────────────────────────────────────────────

const CATEGORIES: { value: ProductCategorie; label: string }[] = [
  { value: "femme",  label: "Femme" },
  { value: "homme",  label: "Homme" },
  { value: "enfant", label: "Enfant" },
]

const OCCASIONS: { value: ProductOccasion; label: string }[] = [
  { value: "casual",       label: "Casual" },
  { value: "bureau",       label: "Bureau" },
  { value: "ceremonie",    label: "Cérémonie" },
  { value: "traditionnel", label: "Traditionnel" },
  { value: "mariage",      label: "Mariage" },
  { value: "sport",        label: "Sport" },
]

const TISSUS = ["Wax", "Bazin", "Kente", "Coton", "Soie", "Lin"]

const SHOP_TYPES = [
  { value: "",           label: "Tous" },
  { value: "couturier",  label: "Couturiers" },
  { value: "boutique",   label: "Boutiques" },
  { value: "marque",     label: "Marques" },
]

// ── Carte boutique ────────────────────────────────────────────────────────────

function ShopCard({ shop }: { shop: Shop }) {
  const score = ((shop.score_delais + shop.score_qualite) / 2).toFixed(1)
  const isFiable = shop.badges?.couturier_fiable

  return (
    <Link
      href={`/boutique/${shop.id}`}
      className="bg-white border border-tf-border rounded-xl overflow-hidden hover:border-[rgba(201,168,76,0.5)] hover:shadow-card transition-all duration-200 group"
    >
      {/* Photo boutique */}
      <div className="aspect-[3/2] bg-tf-black relative overflow-hidden">
        {shop.photo_url ? (
          <Image src={shop.photo_url} alt={shop.nom} fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-serif text-[2.5rem] text-tf-gold opacity-60">
              {shop.nom.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {/* Badge type */}
        <div className="absolute top-2 left-2">
          <span className="font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-black/60 text-white/80 rounded-sm backdrop-blur-sm">
            {shop.type === "couturier" ? "Couturier" : shop.type === "boutique" ? "Boutique" : "Marque"}
          </span>
        </div>
        {isFiable && (
          <div className="absolute top-2 right-2">
            <CheckCircle size={16} className="text-tf-gold drop-shadow" />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="p-3.5">
        <p className="font-sans text-[14px] font-semibold text-tf-text truncate mb-1">{shop.nom}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-tf-text-muted">
            {shop.zone && (
              <span className="flex items-center gap-0.5 font-sans text-[11px]">
                <MapPin size={10} /> {shop.zone}
              </span>
            )}
            <span className="flex items-center gap-0.5 font-sans text-[11px]">
              <Star size={10} className="fill-tf-gold text-tf-gold" />
              <span className="font-semibold text-tf-text">{score}</span>
              <span>({shop.nb_avis})</span>
            </span>
          </div>
        </div>

        {/* Spécialités */}
        {shop.specialites && shop.specialites.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {shop.specialites.slice(0, 3).map((s) => (
              <span key={s} className="font-sans text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-tf-gray-soft text-tf-text-muted rounded-sm">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ShoppingPage() {
  return (
    <Suspense fallback={null}>
      <ShoppingContent />
    </Suspense>
  )
}

function ShoppingContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<"articles" | "boutiques">("articles")
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "")
  const [shopSearch, setShopSearch] = useState("")
  const [shopType, setShopType] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>(() => ({
    page: 1,
    limit: 20,
    categorie: (searchParams.get("categorie") as ProductCategorie) || undefined,
    search: searchParams.get("search") || undefined,
  }))

  // Réagit aux liens de la navbar (catégorie/recherche) après le montage initial
  useEffect(() => {
    const categorie = (searchParams.get("categorie") as ProductCategorie) || undefined
    const searchQuery = searchParams.get("search") || undefined
    setFilters((f) => ({ ...f, categorie, search: searchQuery, page: 1 }))
    setSearch(searchQuery ?? "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // ── Requêtes ──────────────────────────────────────────────────────────────

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.set(k, String(v))
      })
      return (await api.get<ProductListResponse>(`/products?${params}`)).data
    },
    enabled: activeTab === "articles",
  })

  const shopParams = new URLSearchParams()
  if (shopType)   shopParams.set("type",   shopType)
  if (shopSearch) shopParams.set("search", shopSearch)

  const { data: shops, isLoading: loadingShops } = useQuery<Shop[]>({
    queryKey: ["shops-list", shopType, shopSearch],
    queryFn: async () => (await api.get(`/shops?${shopParams}`)).data,
    enabled: activeTab === "boutiques",
  })

  // ── Handlers produits ─────────────────────────────────────────────────────

  const applySearch = useCallback(() => {
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }))
  }, [search])

  const hasActiveFilters = !!(filters.categorie || filters.occasion || filters.tissu || filters.search)

  function clearFilters() {
    setFilters({ page: 1, limit: 20 })
    setSearch("")
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-tf-bg">

      {/* Header sticky */}
      <div className="bg-white border-b border-tf-border sticky top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">

          {/* Onglets Articles / Boutiques */}
          <div role="tablist" className="flex border-b border-tf-border -mb-px">
            {[
              { id: "articles",  label: "Articles" },
              { id: "boutiques", label: "Boutiques" },
            ].map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={activeTab === t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`px-5 py-3.5 font-sans text-[14px] font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                  activeTab === t.id
                    ? "border-tf-black text-tf-black"
                    : "border-transparent text-tf-text-muted hover:text-tf-text"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Barre de recherche + filtres selon l'onglet */}
          <div className="py-3">
            {activeTab === "articles" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-tf-gray-soft rounded-md px-3 py-2 border border-tf-border focus-within:border-tf-gold focus-within:ring-2 focus-within:ring-[rgba(201,168,76,0.2)] transition-all">
                    <Search size={15} className="text-tf-text-muted shrink-0" />
                    <input
                      type="text"
                      aria-label="Rechercher un article, un tissu..."
                      placeholder="Rechercher un article, un tissu..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && applySearch()}
                      className="flex-1 bg-transparent text-body text-tf-text placeholder:text-tf-text-muted outline-none"
                    />
                    {search && (
                      <button
                        onClick={() => { setSearch(""); setFilters((f) => ({ ...f, search: undefined })) }}
                        aria-label="Effacer la recherche"
                        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold"
                      >
                        <X size={13} className="text-tf-text-muted hover:text-tf-text" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-label="Afficher les filtres avancés"
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-md border text-nav font-medium transition-colors",
                      showFilters ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text border-tf-border hover:border-tf-text"
                    )}
                  >
                    <SlidersHorizontal size={14} />
                    <span className="hidden sm:inline">Filtres</span>
                    {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-tf-gold" />}
                  </button>
                </div>

                {/* Pills catégories */}
                <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-0.5 scrollbar-none">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, categorie: undefined, page: 1 }))}
                    aria-pressed={!filters.categorie}
                    className={cn("shrink-0 px-3 py-1 rounded-full text-nav font-medium border transition-colors",
                      !filters.categorie ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                    )}
                  >
                    Tout
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button key={cat.value}
                      onClick={() => setFilters((f) => ({ ...f, categorie: f.categorie === cat.value ? undefined : cat.value, page: 1 }))}
                      aria-pressed={filters.categorie === cat.value}
                      className={cn("shrink-0 px-3 py-1 rounded-full text-nav font-medium border transition-colors",
                        filters.categorie === cat.value ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeTab === "boutiques" && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-48 flex items-center gap-2 bg-tf-gray-soft rounded-md px-3 py-2 border border-tf-border focus-within:border-tf-gold focus-within:ring-2 focus-within:ring-[rgba(201,168,76,0.2)] transition-all">
                  <Search size={15} className="text-tf-text-muted shrink-0" />
                  <input
                    type="text"
                    aria-label="Rechercher une boutique..."
                    placeholder="Rechercher une boutique..."
                    value={shopSearch}
                    onChange={(e) => setShopSearch(e.target.value)}
                    className="flex-1 bg-transparent text-body text-tf-text placeholder:text-tf-text-muted outline-none"
                  />
                  {shopSearch && (
                    <button
                      onClick={() => setShopSearch("")}
                      aria-label="Effacer la recherche"
                      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold"
                    >
                      <X size={13} className="text-tf-text-muted hover:text-tf-text" />
                    </button>
                  )}
                </div>
                {/* Filtres type boutique */}
                <div className="flex gap-1">
                  {SHOP_TYPES.map((t) => (
                    <button key={t.value} onClick={() => setShopType(t.value)}
                      aria-pressed={shopType === t.value}
                      className={cn("px-3 py-1.5 rounded-full text-nav font-medium border transition-colors text-[12px]",
                        shopType === t.value ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filtres avancés articles */}
          {activeTab === "articles" && showFilters && (
            <div className="border-t border-tf-border pb-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Occasion</p>
                  <div className="flex flex-wrap gap-1.5">
                    {OCCASIONS.map((occ) => (
                      <button key={occ.value}
                        onClick={() => setFilters((f) => ({ ...f, occasion: f.occasion === occ.value ? undefined : occ.value, page: 1 }))}
                        aria-pressed={filters.occasion === occ.value}
                        className={cn("px-2.5 py-1 rounded-sm text-nav border transition-colors",
                          filters.occasion === occ.value ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                        )}
                      >
                        {occ.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Tissu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TISSUS.map((t) => (
                      <button key={t}
                        onClick={() => setFilters((f) => ({ ...f, tissu: f.tissu?.toLowerCase() === t.toLowerCase() ? undefined : t.toLowerCase(), page: 1 }))}
                        aria-pressed={filters.tissu?.toLowerCase() === t.toLowerCase()}
                        className={cn("px-2.5 py-1 rounded-sm text-nav border transition-colors",
                          filters.tissu?.toLowerCase() === t.toLowerCase() ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-label uppercase tracking-widest text-tf-text-muted mb-2">Type</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "Sur mesure",     value: true  },
                      { label: "Prêt-à-porter",  value: false },
                    ].map(({ label, value }) => (
                      <button key={label}
                        onClick={() => setFilters((f) => ({ ...f, is_sur_mesure: f.is_sur_mesure === value ? undefined : value, page: 1 }))}
                        aria-pressed={filters.is_sur_mesure === value}
                        className={cn("px-2.5 py-1 rounded-sm text-nav border transition-colors",
                          filters.is_sur_mesure === value ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                        )}
                      >
                        {label}
                      </button>
                    ))}
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
      </div>

      {/* Contenu */}
      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Articles ───────────────────────────────────────────────────── */}
        {activeTab === "articles" && (
          <>
            <p className="text-nav text-tf-text-muted mb-4" aria-live="polite">
              {loadingProducts ? "Chargement..." : `${products?.total ?? 0} article${(products?.total ?? 0) > 1 ? "s" : ""}`}
            </p>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-xl bg-tf-gray-soft animate-pulse" />
                ))}
              </div>
            ) : products?.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-serif text-h2 text-tf-text mb-2">Aucun article trouvé</p>
                <p className="text-body text-tf-text-muted mb-6">Essayez d&apos;autres filtres</p>
                <button onClick={clearFilters} className="btn-primary px-4 py-2">
                  Effacer les filtres
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                  {products?.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {products && products.pages > 1 && (
                  <div className="flex justify-center gap-2 mt-10">
                    {Array.from({ length: products.pages }).map((_, i) => (
                      <button key={i}
                        onClick={() => setFilters((f) => ({ ...f, page: i + 1 }))}
                        aria-current={filters.page === i + 1 ? "page" : undefined}
                        aria-label={`Page ${i + 1}`}
                        className={cn("w-9 h-9 rounded-md text-nav font-medium border transition-colors",
                          filters.page === i + 1 ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text border-tf-border hover:border-tf-text"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── Boutiques ──────────────────────────────────────────────────── */}
        {activeTab === "boutiques" && (
          <>
            <p className="text-nav text-tf-text-muted mb-4" aria-live="polite">
              {loadingShops ? "Chargement..." : `${shops?.length ?? 0} boutique${(shops?.length ?? 0) > 1 ? "s" : ""}`}
            </p>

            {loadingShops ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] rounded-xl bg-tf-gray-soft animate-pulse" />
                ))}
              </div>
            ) : !shops?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package size={48} className="text-tf-border mb-4" />
                <p className="font-serif text-h2 text-tf-text mb-2">Aucune boutique trouvée</p>
                <p className="text-body text-tf-text-muted">
                  {shopType || shopSearch ? "Essayez d'autres critères" : "Les boutiques apparaîtront ici après validation"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
