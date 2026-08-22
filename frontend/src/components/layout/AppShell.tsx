"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Sidebar, BottomNav } from "./Sidebar"
import { TopNav } from "./TopNav"
import { ClientBottomNav } from "./ClientBottomNav"
import { Footer } from "./Footer"
import { useAuthStore } from "@/store/auth"

// Routes qui affichent une navigation (top nav client OU sidebar vendeur/couturier)
const APP_PREFIXES = [
  "/dashboard", "/commandes", "/messages", "/profil", "/panier",
  "/shopping", "/produits", "/looks",
  "/boutique/ajouter-produit", "/boutique/produits",
]

// Routes avec leur propre layout complet (ex: admin avec sa propre sidebar)
const STANDALONE_PREFIXES = ["/admin"]

// Routes réservées aux back-offices vendeur/couturier — toujours sidebar, jamais top nav
const SELLER_ONLY_PREFIXES = ["/dashboard/vendeur", "/dashboard/couturier", "/boutique/ajouter-produit", "/boutique/produits"]

const SELLER_ROLES = ["vendeur", "couturier"]

function isAppRoute(pathname: string) {
  return APP_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isStandaloneRoute(pathname: string) {
  return STANDALONE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isSellerOnlyRoute(pathname: string) {
  return SELLER_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, _hasHydrated } = useAuthStore()

  // Routes réservées au back-office vendeur/couturier : jamais accessibles déconnecté
  // (ex. déconnexion pendant qu'on est sur /dashboard/couturier — sans ce garde-fou,
  // la sidebar disparaît mais la page reste affichée).
  useEffect(() => {
    if (_hasHydrated && !user && isSellerOnlyRoute(pathname)) {
      router.replace("/auth/login")
    }
  }, [_hasHydrated, user, pathname, router])

  // Redirection en cours vers la connexion — ne pas laisser la page protégée s'afficher
  // pendant que le router.replace() ci-dessus se déclenche.
  if (_hasHydrated && !user && isSellerOnlyRoute(pathname)) return null

  // Pages avec layout complet autonome (ex: admin avec sa propre sidebar)
  if (isStandaloneRoute(pathname)) return <>{children}</>

  if (!isAppRoute(pathname)) return <>{children}</>

  // Vendeur/couturier : toujours la sidebar back-office, sur leurs routes dédiées
  // ou sur les routes partagées (commandes, messages, profil) une fois connectés.
  const isSeller = _hasHydrated && !!user && SELLER_ROLES.includes(user.role)
  const useSidebar = isSellerOnlyRoute(pathname) || isSeller

  if (useSidebar) {
    return (
      <div className="min-h-screen bg-tf-bg">
        <Sidebar />
        <main className="lg:pl-60 pb-16 lg:pb-0">
          {children}
        </main>
        <BottomNav />
      </div>
    )
  }

  // Invité + client : mobile-first — nav bar en bas par défaut (pouce, ~80% du trafic),
  // la pilule en haut prend le relais sur desktop.
  return (
    <div className="min-h-screen bg-tf-bg">
      <TopNav />
      <div className="pt-20 sm:pt-24 pb-bottom-nav lg:pb-0">
        <main>{children}</main>
        <Footer />
      </div>
      <ClientBottomNav />
    </div>
  )
}
