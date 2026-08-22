"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Search, ShoppingBag, Menu, X, MessageCircle } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { useCartStore } from "@/store/cart"
import { useSearchStore } from "@/store/search"
import { api } from "@/lib/api"

export interface TopNavShop {
  id: number
  nom: string
  logoUrl?: string | null
}

// Reprend les onglets déjà présents sur la sidebar client — Dashboard et Commandes
// pointent vers leurs onglets respectifs dans /profil (redirige vers la connexion si
// besoin) ; Panier et Messages restent en icônes. Looks retiré — pas encore disponible.
const NAV_LINKS = [
  { label: "Mon espace", href: "/profil?tab=apercu" },
  { label: "Shopping", href: "/shopping" },
  { label: "Commandes", href: "/profil?tab=commandes" },
]

// Ajoutés seulement en contexte boutique (deux ancres sur /boutique/[id], pas de nouvelle route)
function shopNavLinks(shop: TopNavShop) {
  return [
    { label: "Accueil", href: `/boutique/${shop.id}` },
    { label: "Catalogue", href: `/boutique/${shop.id}#catalogue` },
  ]
}

function Logo({ dark = false, className = "", shop }: { dark?: boolean; className?: string; shop?: TopNavShop }) {
  if (shop) {
    return (
      <span className={`flex items-center gap-2.5 shrink-0 ${className}`}>
        <Link href={`/boutique/${shop.id}`} className="flex items-center gap-2.5" aria-label={`${shop.nom} — accueil boutique`}>
          {shop.logoUrl ? (
            <span className="relative w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-tf-gray-soft">
              <Image src={shop.logoUrl} alt="" fill className="object-cover" />
            </span>
          ) : (
            <span className="monogram-tf w-8 h-8 text-[13px] shrink-0">{shop.nom[0]?.toUpperCase()}</span>
          )}
          <span className={`hidden sm:block font-serif text-[17px] leading-none truncate max-w-[160px] ${dark ? "text-white" : "text-tf-black"}`}>
            {shop.nom}
          </span>
        </Link>
      </span>
    )
  }

  return (
    <Link href="/" className={`flex items-center gap-2.5 shrink-0 ${className}`} aria-label="TheFriends Shopping — accueil">
      <span className="monogram-tf w-8 h-8 text-[13px] shrink-0">TF</span>
      <span className="hidden sm:block leading-none">
        <span className={`block font-serif text-[17px] leading-none ${dark ? "text-white" : "text-tf-black"}`}>
          TheFriends
        </span>
        <span className={`block font-sans text-[8px] tracking-[0.35em] uppercase mt-0.5 ${dark ? "text-white/60" : "text-tf-text-muted"}`}>
          Shopping
        </span>
      </span>
    </Link>
  )
}

function useUnreadMessages() {
  const { isAuthenticated } = useAuthStore()
  const { data } = useQuery<{ nb_non_lus: number }[]>({
    queryKey: ["conversations-unread"],
    queryFn: async () => (await api.get("/messages")).data,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
  return data?.reduce((sum, c) => sum + (c.nb_non_lus ?? 0), 0) ?? 0
}

function SearchField({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const query = q.trim()
    router.push(query ? `/shopping?search=${encodeURIComponent(query)}` : "/shopping")
    onClose()
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-1 min-w-0">
      <Search size={16} className="text-tf-text-muted shrink-0" />
      <input
        ref={inputRef}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un article, une boutique..."
        className="flex-1 min-w-0 bg-transparent font-sans text-[14px] text-tf-text placeholder:text-tf-text-muted focus:outline-none"
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer la recherche"
        className="p-1 text-tf-text-muted hover:text-tf-text transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </form>
  )
}

function AccountArea({ onNavigate, dark = false }: { onNavigate?: () => void; dark?: boolean }) {
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  if (!_hasHydrated) {
    return <div className="w-24 h-9 rounded-full bg-tf-gray-soft animate-pulse" />
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/auth/login"
        onClick={onNavigate}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-sans text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
          dark ? "bg-white text-tf-black hover:bg-white/90" : "bg-tf-black text-white hover:bg-tf-charbon"
        }`}
      >
        Connexion
      </Link>
    )
  }

  return (
    <Link
      href="/profil"
      onClick={onNavigate}
      className={`flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
        dark ? "border-white/30 hover:border-white" : "border-tf-border hover:border-tf-gold"
      }`}
    >
      <span className="w-6 h-6 rounded-full bg-tf-black text-tf-gold flex items-center justify-center font-serif text-[11px] shrink-0">
        {user.full_name?.[0]?.toUpperCase() ?? "?"}
      </span>
      <span className={`font-sans text-[13px] font-medium ${dark ? "text-white" : "text-tf-text"}`}>
        {user.full_name.split(" ")[0]}
      </span>
    </Link>
  )
}

function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > threshold)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [threshold])
  return scrolled
}

/**
 * `heroVariant` : à passer uniquement sur les pages dont le haut est un fond sombre
 * plein écran (ex. le hero de l'accueil) — le texte reste clair tant qu'on n'a pas
 * scrollé, puis bascule sur le voile clair habituel une fois le fond dépassé.
 */
export function TopNav({ heroVariant = false, shop }: { heroVariant?: boolean; shop?: TopNavShop }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { toggleCart, nbArticles } = useCartStore()
  const { isOpen: searchOpen, open: openSearch, close: closeSearch } = useSearchStore()
  const nbNonLus = useUnreadMessages()
  const scrolled = useScrolled()
  const navLinks = shop ? [...shopNavLinks(shop), ...NAV_LINKS] : NAV_LINKS

  useEffect(() => {
    setMenuOpen(false)
    closeSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const onDark = heroVariant && !scrolled && !searchOpen

  return (
    <>
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-24px)] max-w-6xl">
        <div
          className={`flex items-center gap-3 rounded-full px-3 py-2 sm:px-5 sm:py-2.5 transition-all duration-300 ${
            scrolled || searchOpen
              ? "bg-white/90 backdrop-blur-md border border-tf-border shadow-card"
              : "bg-transparent border border-transparent shadow-none"
          }`}
        >
          {searchOpen ? (
            <SearchField onClose={closeSearch} />
          ) : (
            <>
              {/* Menu — mobile uniquement, à gauche */}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Ouvrir le menu"
                className={`p-2.5 -ml-1 rounded-full transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                  onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft"
                }`}
              >
                <Menu size={18} />
              </button>

              <Logo dark={onDark} shop={shop} className="mx-auto lg:mx-0" />

              {/* Liens de navigation — desktop */}
              <nav aria-label="Navigation" className="hidden lg:flex items-center gap-7 mx-auto">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-sans text-[13px] font-medium transition-colors ${
                      onDark ? "text-white/75 hover:text-white" : "text-tf-text-muted hover:text-tf-black"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Recherche — mobile uniquement, à droite */}
              <button
                onClick={openSearch}
                aria-label="Rechercher"
                className={`p-2.5 -mr-1 rounded-full transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                  onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft"
                }`}
              >
                <Search size={18} />
              </button>

              <div className="hidden lg:flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={openSearch}
                  aria-label="Rechercher"
                  className={`p-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                    onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft"
                  }`}
                >
                  <Search size={18} />
                </button>

                <Link
                  href="/messages"
                  aria-label="Messages"
                  className={`relative hidden lg:flex p-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                    onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft"
                  }`}
                >
                  <MessageCircle size={18} />
                  {nbNonLus > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-tf-gold" />
                  )}
                </Link>

                <button
                  onClick={toggleCart}
                  aria-label="Ouvrir le panier"
                  className={`relative hidden lg:flex p-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                    onDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft"
                  }`}
                >
                  <ShoppingBag size={18} />
                  {nbArticles > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-tf-gold text-tf-black text-[10px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                      {nbArticles > 9 ? "9+" : nbArticles}
                    </span>
                  )}
                </button>

                <AccountArea dark={onDark} />
              </div>
            </>
          )}
        </div>
      </header>

      {/* Menu plein écran — mobile/tablette */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-white lg:hidden animate-fade-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-tf-border">
            <Logo shop={shop} />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer le menu"
              className="p-2 -mr-2 rounded-full text-tf-text-muted hover:text-tf-black hover:bg-tf-gray-soft transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <nav aria-label="Navigation" className="flex flex-col px-5 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3.5 border-b border-tf-border font-serif text-[22px] text-tf-black"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="py-3.5 border-b border-tf-border font-serif text-[22px] text-tf-black flex items-center gap-2"
            >
              Messages
              {nbNonLus > 0 && (
                <span className="w-2 h-2 rounded-full bg-tf-gold" />
              )}
            </Link>
          </nav>
          <div className="px-5 py-4 mt-auto">
            <AccountArea onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
