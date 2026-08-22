"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard, Users, Store, Puzzle, AlertTriangle,
  Layers, ScrollText, Menu, LogOut, Shield, X,
} from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { api } from "@/lib/api"
import type { PlatformStats } from "./types"

const ROUTE_TITLES: Record<string, string> = {
  "/admin":               "Vue d'ensemble",
  "/admin/utilisateurs":  "Utilisateurs",
  "/admin/boutiques":     "Boutiques",
  "/admin/fonctionnalites": "Fonctionnalités",
  "/admin/modules":       "Modules",
  "/admin/litiges":       "Litiges",
  "/admin/logs":          "Journal des logs",
}

interface NavItem {
  href: string
  label: string
  Icon: React.ElementType
  exact?: boolean
  badgeKey?: keyof Pick<PlatformStats, "nb_shops_en_attente" | "nb_litiges_ouverts" | "nb_nouveaux_users_7j">
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/admin",               label: "Vue d'ensemble",   Icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "Gestion",
    items: [
      { href: "/admin/utilisateurs",  label: "Utilisateurs",     Icon: Users,           badgeKey: "nb_nouveaux_users_7j" },
      { href: "/admin/boutiques",     label: "Boutiques",        Icon: Store,           badgeKey: "nb_shops_en_attente" },
      { href: "/admin/litiges",       label: "Litiges",          Icon: AlertTriangle,   badgeKey: "nb_litiges_ouverts" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { href: "/admin/fonctionnalites", label: "Fonctionnalités", Icon: Puzzle },
      { href: "/admin/modules",         label: "Modules",          Icon: Layers },
      { href: "/admin/logs",            label: "Journal des logs", Icon: ScrollText },
    ],
  },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
    refetchInterval: 30_000,
  })

  const pageTitle = ROUTE_TITLES[pathname] ?? "Administration"

  function handleLogout() {
    logout()
    router.push("/")
  }

  function isActive(item: NavItem) {
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
  }

  function getBadge(item: NavItem): number {
    if (!item.badgeKey || !stats) return 0
    return stats[item.badgeKey] ?? 0
  }

  return (
    <div className="flex min-h-screen bg-tf-bg">

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-60 bg-tf-black flex flex-col transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        aria-label="Navigation administration"
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-tf-gold/10 flex items-center justify-center shrink-0">
                <Shield size={15} className="text-tf-gold" />
              </div>
              <div>
                <p className="font-serif text-[15px] text-tf-gold leading-none">TheFriends</p>
                <p className="font-sans text-[9px] text-white/35 tracking-[0.35em] uppercase mt-0.5">Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 text-white/40 hover:text-white transition-colors rounded-md"
              aria-label="Fermer le menu"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4" aria-label="Menu admin">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 pb-1.5 font-sans text-[9px] font-bold text-white/30 uppercase tracking-[0.18em]">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item)
                  const badge = getBadge(item)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold/50 ${
                        active ? "bg-tf-gold text-tf-black" : "text-white/60 hover:text-white hover:bg-white/8"
                      }`}
                    >
                      <item.Icon size={15} className="shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {badge > 0 && (
                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums ${active ? "bg-tf-black/20 text-tf-black" : "bg-tf-gold/20 text-tf-gold"}`}>
                          {badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-tf-gold/15 flex items-center justify-center shrink-0">
              <span className="font-serif text-tf-gold text-[12px]">
                {user?.full_name?.[0]?.toUpperCase() ?? "A"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-sans text-[12px] font-semibold text-white truncate">{user?.full_name ?? "Admin"}</p>
              <p className="font-sans text-[10px] text-white/40">Administrateur</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors font-sans text-[13px] font-medium"
          >
            <LogOut size={15} className="shrink-0" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">

        {/* Header mobile */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-white border-b border-tf-border">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="p-2 -ml-1 text-tf-text-muted hover:text-tf-text transition-colors rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold"
          >
            <Menu size={18} />
          </button>
          <h1 className="font-serif text-[16px] text-tf-black">{pageTitle}</h1>
        </header>

        {/* Header desktop */}
        <div className="hidden lg:block px-8 pt-8 pb-2">
          <h1 className="font-serif text-h1 text-tf-black">{pageTitle}</h1>
        </div>

        <main className="flex-1 px-4 lg:px-8 py-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
