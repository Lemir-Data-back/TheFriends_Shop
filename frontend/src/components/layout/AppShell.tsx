"use client"

import { usePathname } from "next/navigation"
import { Sidebar, BottomNav } from "./Sidebar"

// Routes qui affichent la sidebar/bottom nav
const APP_PREFIXES = [
  "/dashboard", "/commandes", "/messages", "/profil", "/panier", "/admin",
  "/catalogue", "/shopping", "/produits", "/looks",
]

function isAppRoute(pathname: string) {
  return APP_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showNav = isAppRoute(pathname)

  if (!showNav) return <>{children}</>

  return (
    <div className="min-h-screen bg-tf-bg">
      {/* Sidebar gauche — desktop uniquement */}
      <Sidebar />

      {/* Contenu principal décalé à droite sur desktop, padding bas sur mobile */}
      <main className="lg:pl-60 pb-16 lg:pb-0">
        {children}
      </main>

      {/* Bottom nav — mobile uniquement */}
      <BottomNav />
    </div>
  )
}
