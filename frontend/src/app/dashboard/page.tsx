"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Le tableau de bord client vit désormais dans l'onglet "Vue d'ensemble" de /profil.
export default function DashboardRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/profil")
  }, [router])
  return null
}
