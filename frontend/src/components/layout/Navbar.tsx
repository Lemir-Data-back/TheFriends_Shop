"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, LayoutDashboard, User } from "lucide-react"
import { useAuthStore } from "@/store/auth"
import { CartButton } from "@/components/cart/CartButton"

const DASHBOARD_LINKS: Record<string, string> = {
  client:    "/dashboard",
  couturier: "/dashboard/couturier",
  vendeur:   "/dashboard/vendeur",
  admin:     "/admin",
}

export function Navbar() {
  const { isAuthenticated, user, logout, _hasHydrated } = useAuthStore()
  const router = useRouter()

  function handleLogout() {
    logout()
    router.push("/")
  }

  // Pendant la réhydratation Zustand, on affiche un skeleton neutre
  // pour éviter le flash "Se connecter" → "Mon compte"
  if (!_hasHydrated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-tf-black/80 backdrop-blur-sm">
        <Logo />
        <div className="w-40 h-8 rounded-md bg-white/10 animate-pulse" />
      </nav>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-tf-black/80 backdrop-blur-sm">
      <Logo />

      <div className="flex items-center gap-3">
        <CartButton />

        {isAuthenticated && user ? (
          <>
            {/* Nom + rôle */}
            <span className="hidden sm:block font-sans text-[13px] text-white/70">
              {user.full_name.split(" ")[0]}
            </span>

            {/* Lien dashboard */}
            <Link
              href={DASHBOARD_LINKS[user.role] ?? "/dashboard"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-white/20 font-sans text-[13px] text-white/80 hover:text-white hover:border-white/40 transition-colors"
            >
              <LayoutDashboard size={14} />
              <span className="hidden sm:inline">Mon espace</span>
            </Link>

            {/* Déconnexion */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-md font-sans text-[13px] text-white/60 hover:text-white transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={14} />
            </button>
          </>
        ) : (
          <>
            <Link
              href="/auth/register"
              className="font-sans text-[13px] text-white/70 hover:text-white transition-colors"
            >
              Créer un compte
            </Link>
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-[13px] hover:bg-tf-gold-light transition-colors"
            >
              Se connecter
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

function Logo() {
  return (
    <Link href="/">
      <p className="font-serif text-[1.1rem] text-tf-gold leading-none">TheFriends</p>
      <p className="font-sans text-[9px] tracking-[0.4em] text-tf-gold/60 uppercase mt-0.5">Shopping</p>
    </Link>
  )
}
