"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Home, LayoutDashboard, ShoppingBag, MessageCircle, User } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { useCartStore } from "@/store/cart"
import { api } from "@/lib/api"

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

/**
 * Navigation principale mobile pour l'invité et le client — mobile-first :
 * c'est le mode de navigation par défaut sur ~80% du trafic (PRODUCT.md).
 * Le pull en haut (TopNav) reste pour la marque/recherche/compte sur desktop.
 */
export function ClientBottomNav() {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()
  const { toggleCart, nbArticles } = useCartStore()
  const nbNonLus = useUnreadMessages()

  const items = [
    { id: "shopping", label: "Shopping", href: "/shopping", icon: Home, active: pathname === "/" || pathname.startsWith("/shopping") },
    { id: "dashboard", label: "Mon espace", href: isAuthenticated ? "/profil?tab=apercu" : "/auth/login", icon: LayoutDashboard, active: pathname.startsWith("/profil") },
    { id: "panier", label: "Panier", onClick: toggleCart, icon: ShoppingBag, active: false, badge: nbArticles },
    { id: "messages", label: "Messages", href: "/messages", icon: MessageCircle, active: pathname.startsWith("/messages"), dot: nbNonLus > 0 },
    { id: "compte", label: "Compte", href: isAuthenticated ? "/profil?tab=parametres" : "/auth/login", icon: User, active: pathname.startsWith("/auth") },
  ] as const

  return (
    <nav
      aria-label="Navigation principale"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-bottom-nav bg-white border-t border-tf-border flex items-stretch"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon
        const content = (
          <>
            <span className="relative">
              <Icon size={20} className={item.active ? "text-tf-gold" : ""} />
              {"badge" in item && item.badge! > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full bg-tf-gold text-tf-black font-mono font-bold text-[9px] flex items-center justify-center">
                  {item.badge! > 9 ? "9+" : item.badge}
                </span>
              )}
              {"dot" in item && item.dot && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-tf-gold" />
              )}
            </span>
            <span className="font-sans text-[8px] font-semibold text-center leading-tight px-0.5">{item.label}</span>
            {item.active && <span className="absolute bottom-0 w-8 h-0.5 bg-tf-gold rounded-full" />}
          </>
        )
        const className = `relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
          item.active ? "text-tf-black" : "text-tf-text-muted"
        }`

        return "href" in item ? (
          <Link key={item.id} href={item.href} className={className}>
            {content}
          </Link>
        ) : (
          <button key={item.id} onClick={item.onClick} className={className}>
            {content}
          </button>
        )
      })}
    </nav>
  )
}
