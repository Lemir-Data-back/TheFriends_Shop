"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, ShoppingBag, Package, MessageCircle,
  User, Scissors, Store, LogOut, X, AlertTriangle,
  Shield, ShoppingCart, Archive, Settings, Home,
} from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { useCartStore } from "@/store/cart"
import { api } from "@/lib/api"

// ── Types nav ─────────────────────────────────────────────────────────────────

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  exact?: boolean
  showIcon?: boolean  // false = pas d'icône (profil)
  badgeKey?: "cart" | "messages"
  bottomNav?: boolean  // true = visible dans la barre mobile en bas (sinon desktop uniquement)
}

// Marqueur résolu à l'affichage vers /boutique/{id} du vendeur/couturier connecté
const SHOP_HOME_HREF = "__SHOP_HOME__"

// ── Navigation par rôle ───────────────────────────────────────────────────────

const NAV_CLIENT: NavItem[] = [
  { label: "Mon espace",      href: "/dashboard",  icon: <LayoutDashboard size={18} />, exact: true },
  { label: "Shopping",        href: "/shopping",   icon: <ShoppingBag size={18} /> },
  { label: "Panier",          href: "/panier",     icon: <ShoppingCart size={18} />, badgeKey: "cart" },
  { label: "Mes commandes",   href: "/commandes",  icon: <Package size={18} /> },
  { label: "Messages",        href: "/messages",   icon: <MessageCircle size={18} />, badgeKey: "messages" },
  { label: "Mon profil",      href: "/profil",     icon: <User size={18} />, showIcon: false },
]

const NAV_COUTURIER: NavItem[] = [
  { label: "Mon atelier",  href: "/dashboard/couturier",                  icon: <Scissors size={18} />, exact: true, bottomNav: true },
  { label: "Ma vitrine",   href: SHOP_HOME_HREF,                          icon: <Home size={18} /> },
  { label: "Catalogue",    href: "/dashboard/couturier?tab=catalogue",    icon: <Archive size={18} />, bottomNav: true },
  { label: "Shopping",     href: "/shopping",                             icon: <ShoppingBag size={18} />, bottomNav: true },
  { label: "Commandes",    href: "/commandes",                            icon: <Package size={18} />, bottomNav: true },
  { label: "Messages",     href: "/messages",                             icon: <MessageCircle size={18} />, badgeKey: "messages", bottomNav: true },
  { label: "Paramètres",   href: "/dashboard/couturier?tab=parametres",   icon: <Settings size={18} /> },
]

const NAV_ADMIN: NavItem[] = [
  { label: "Administration", href: "/admin",           icon: <Shield size={18} />, exact: true },
  { label: "Utilisateurs",   href: "/admin#users",    icon: <User size={18} /> },
  { label: "Boutiques",      href: "/admin#shops",    icon: <Store size={18} /> },
  { label: "Modules",        href: "/admin#modules",  icon: <LayoutDashboard size={18} /> },
  { label: "Commandes",      href: "/admin#disputes", icon: <Package size={18} /> },
]

const NAV_VENDEUR: NavItem[] = [
  { label: "Ma boutique",         href: "/dashboard/vendeur",                icon: <Store size={18} />, exact: true, bottomNav: true },
  { label: "Ma vitrine",          href: SHOP_HOME_HREF,                      icon: <Home size={18} /> },
  { label: "Stock et catalogue",  href: "/dashboard/vendeur?tab=catalogue",  icon: <Archive size={18} />, bottomNav: true },
  { label: "Shopping",            href: "/shopping",                         icon: <ShoppingBag size={18} />, bottomNav: true },
  { label: "Commandes",           href: "/commandes",                        icon: <Package size={18} />, bottomNav: true },
  { label: "Messages",            href: "/messages",                         icon: <MessageCircle size={18} />, badgeKey: "messages", bottomNav: true },
  { label: "Paramètres",          href: "/dashboard/vendeur?tab=parametres", icon: <Settings size={18} /> },
]

function getNav(role?: string): NavItem[] {
  if (role === "couturier") return NAV_COUTURIER
  if (role === "vendeur")   return NAV_VENDEUR
  if (role === "admin")     return NAV_ADMIN
  return NAV_CLIENT
}

// Les items "Catalogue"/"Paramètres" pointent vers la même page que l'item racine
// (ex. "Mon atelier") avec un ?tab= différent — usePathname() seul ne voit pas le tab,
// donc on compare aussi le paramètre courant pour savoir lequel est réellement actif.
function isItemActive(item: NavItem, pathname: string, currentTab: string | null, nav: NavItem[]): boolean {
  if (item.href.includes("?tab=")) {
    const [base, query] = item.href.split("?")
    return pathname === base && currentTab === new URLSearchParams(query).get("tab")
  }
  if (item.exact) {
    if (pathname !== item.href) return false
    // Actif par défaut (ex. onglet "Clients", qui n'a pas son propre lien) — sauf si
    // le tab courant est explicitement revendiqué par un autre item (Catalogue, Paramètres...).
    const claimedTabs = nav
      .filter((i) => i.href.startsWith(`${item.href}?tab=`))
      .map((i) => new URLSearchParams(i.href.split("?")[1]).get("tab"))
    return !currentTab || !claimedTabs.includes(currentTab)
  }
  return pathname.startsWith(item.href)
}

// ── Déconnexion confirmation ───────────────────────────────────────────────────

export function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fade-in">
        <button onClick={onCancel} className="absolute top-4 right-4 text-tf-text-muted hover:text-tf-text">
          <X size={18} />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-tf-error-soft flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-tf-error" />
          </div>
          <h3 className="font-sans text-[16px] font-bold text-tf-text">Se déconnecter ?</h3>
        </div>
        <p className="font-sans text-[13px] text-tf-text-muted leading-relaxed mb-6">
          Tu vas être déconnecté de ton compte. Tes données sont sauvegardées et tu pourras te reconnecter à tout moment.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-tf-border rounded-lg font-sans font-semibold text-[13px] text-tf-text hover:bg-tf-gray-soft transition-colors">
            Annuler
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-tf-error rounded-lg font-sans font-bold text-[13px] text-white hover:bg-tf-error-dark transition-colors">
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Hook badges dynamiques ────────────────────────────────────────────────────

function useBadgeCounts() {
  const { isAuthenticated } = useAuthStore()
  const cartCount = useCartStore((s) => s.nbArticles)

  const { data: conversations } = useQuery<{ nb_non_lus: number }[]>({
    queryKey: ["conversations-unread"],
    queryFn: async () => (await api.get("/messages")).data,
    enabled: isAuthenticated,
    staleTime: 30_000,
    select: (data) => data,
  })

  const messagesCount = conversations?.reduce((sum, c: { nb_non_lus?: number }) => sum + (c.nb_non_lus ?? 0), 0) ?? 0

  return { cart: cartCount, messages: messagesCount }
}

// ── Item de navigation ────────────────────────────────────────────────────────

function NavLink({ item, badges, nav }: { item: NavItem; badges: Record<string, number>; nav: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const active = isItemActive(item, pathname, searchParams.get("tab"), nav)
  const showIcon = item.showIcon !== false
  const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
        active ? "bg-tf-black text-white" : "text-tf-text-muted hover:bg-tf-gray-soft hover:text-tf-text"
      }`}
      title={item.label}
    >
      {/* Icône avec badge — sauf profil */}
      {showIcon && (
        <div className="relative shrink-0">
          <span className={active ? "text-tf-gold" : "group-hover:text-tf-text"}>
            {item.icon}
          </span>
          {badgeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-tf-gold text-tf-black font-sans font-bold text-[9px] flex items-center justify-center leading-none">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </div>
      )}

      {/* Label */}
      <span className="font-sans text-[13px] font-medium truncate">{item.label}</span>

      {/* Indicateur actif */}
      {active && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-tf-gold shrink-0" />
      )}
    </Link>
  )
}

// ── Sidebar desktop ───────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, logout, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [showLogout, setShowLogout] = useState(false)
  const badges = useBadgeCounts()

  const { data: myShop } = useQuery<{ id: number }>({
    queryKey: ["my-shop"],
    queryFn: async () => (await api.get("/shops/me/shop")).data,
    enabled: user?.role === "couturier" || user?.role === "vendeur",
  })

  if (!_hasHydrated || !user) return null

  const nav = getNav(user.role).map((item) =>
    item.href === SHOP_HOME_HREF && myShop ? { ...item, href: `/boutique/${myShop.id}` } : item
  )

  function handleLogout() { logout(); router.push("/") }

  return (
    <>
      {showLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}

      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-60 bg-white border-r border-tf-border z-40">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-tf-border shrink-0">
          <Link href="/">
            <p className="font-serif text-[1.15rem] text-tf-black leading-none">TheFriends</p>
            <p className="font-sans text-[8px] tracking-[0.45em] text-tf-gold uppercase mt-0.5">Shopping</p>
          </Link>
        </div>

        {/* Profil */}
        <div className="px-5 py-4 border-b border-tf-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-tf-black flex items-center justify-center shrink-0">
              <span className="font-serif text-[14px] text-tf-gold">
                {user.full_name?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{user.full_name}</p>
              <p className="font-sans text-[11px] text-tf-text-muted capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {nav.map((item) => (
            <NavLink key={item.href} item={item} badges={badges} nav={nav} />
          ))}
        </nav>

        {/* Déconnexion */}
        <div className="px-3 py-4 border-t border-tf-border shrink-0">
          <button
            onClick={() => setShowLogout(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-tf-text-muted hover:bg-tf-error-soft hover:text-tf-error transition-all group"
          >
            <LogOut size={18} className="shrink-0 group-hover:text-tf-error" />
            <span className="font-sans text-[13px] font-medium">Se déconnecter</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Bottom nav mobile ─────────────────────────────────────────────────────────

export function BottomNav() {
  const { user, _hasHydrated } = useAuthStore()
  const pathname = usePathname()
  const badges = useBadgeCounts()

  if (!_hasHydrated || !user) return null

  const nav = getNav(user.role).filter(i => i.bottomNav)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-tf-border flex items-stretch h-16">
      {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const badgeCount = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                active ? "text-tf-black" : "text-tf-text-muted"
              }`}
            >
              {/* Icône avec badge */}
              <div className="relative">
                <span className={active ? "text-tf-gold" : ""}>{item.icon}</span>
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-tf-gold text-tf-black font-bold text-[8px] flex items-center justify-center">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </div>
              <span className="font-sans text-[8px] font-semibold text-center leading-tight px-0.5">
                {item.label}
              </span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-tf-gold rounded-full" />}
            </Link>
          )
        })}
    </nav>
  )
}
