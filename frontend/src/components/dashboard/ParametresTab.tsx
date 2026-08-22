"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, LogOut, Lock, Eye, EyeOff } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { LogoutModal } from "@/components/layout/Sidebar"
import { VendeurThemeTab } from "@/components/dashboard/vendeur/ThemeTab"
import { ProfilSection } from "@/components/dashboard/ProfilSection"

interface ParametresTabProps {
  shopId: number
  role?: "vendeur" | "couturier"
}

function VisibiliteSection({ role }: { role: "vendeur" | "couturier" }) {
  const qc = useQueryClient()
  const nom = role === "couturier" ? "vitrine" : "boutique"

  const { data: shop } = useQuery<{ id: number; is_active: boolean }>({
    queryKey: ["my-shop"],
    queryFn: async () => (await api.get("/shops/me/shop")).data,
  })

  const toggleVisibilite = useMutation({
    mutationFn: (is_active: boolean) => api.patch(`/shops/${shop?.id}`, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-shop"] }),
  })

  if (!shop) return null
  const visible = shop.is_active

  return (
    <div className="bg-white rounded-xl border border-tf-border p-5">
      <div className="flex items-center gap-2 mb-3">
        {visible ? <Eye size={16} className="text-tf-gold" /> : <EyeOff size={16} className="text-tf-gold" />}
        <h3 className="font-sans text-[13px] font-bold text-tf-text">Visibilité de la {nom}</h3>
      </div>
      <div className="flex items-center justify-between gap-4">
        <p className="font-sans text-[13px] text-tf-text-muted max-w-md">
          {visible
            ? `Ta ${nom} est visible par les clients sur TheFriends — elle apparaît dans le catalogue et son lien direct fonctionne.`
            : `Ta ${nom} est masquée — elle n'apparaît plus dans le catalogue et son lien direct est inaccessible aux clients. Tu peux continuer à la gérer normalement en attendant.`}
        </p>
        <button
          type="button"
          onClick={() => toggleVisibilite.mutate(!visible)}
          disabled={toggleVisibilite.isPending}
          aria-pressed={visible}
          className={`shrink-0 px-4 py-2 rounded-full font-sans text-[13px] font-semibold transition-colors disabled:opacity-50 ${
            visible ? "bg-tf-success-bg text-tf-success" : "bg-tf-gray-soft text-tf-text-muted"
          }`}
        >
          {toggleVisibilite.isPending ? "..." : visible ? "Visible" : "Masquée"}
        </button>
      </div>
    </div>
  )
}

function ChangerMotDePasse() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const changePassword = useMutation({
    mutationFn: () =>
      api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setError("")
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }
    setError("")
    changePassword.mutate()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-tf-border p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Lock size={16} className="text-tf-gold" />
        <h3 className="font-sans text-[13px] font-bold text-tf-text">Changer le mot de passe</h3>
      </div>

      <div>
        <label className="input-label">Mot de passe actuel</label>
        <input
          type="password"
          className="input-field"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="input-label">Nouveau mot de passe</label>
          <input
            type="password"
            className="input-field"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="input-label">Confirmer le nouveau mot de passe</label>
          <input
            type="password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
      </div>

      {error && <p className="font-sans text-[13px] text-tf-error">{error}</p>}
      {success && <p className="font-sans text-[13px] text-tf-success">Mot de passe mis à jour ✓</p>}

      <button
        type="submit"
        disabled={changePassword.isPending}
        className="flex items-center gap-2 px-4 py-2.5 border border-tf-black rounded-lg font-sans text-[13px] font-semibold text-tf-black hover:bg-tf-gray-soft transition-colors disabled:opacity-50"
      >
        {changePassword.isPending && <Loader2 size={15} className="animate-spin" />}
        Mettre à jour le mot de passe
      </button>
    </form>
  )
}

export function ParametresTab({ shopId, role = "vendeur" }: ParametresTabProps) {
  const router = useRouter()
  const { logout } = useAuthStore()
  const [showLogout, setShowLogout] = useState(false)

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <div className="space-y-5">
      {showLogout && <LogoutModal onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}

      <div>
        <h2 className="font-serif text-h2 text-tf-black">Paramètres</h2>
        <p className="font-sans text-[13px] text-tf-text-muted">
          Configure l&apos;interface de ta boutique et gère ton compte.
        </p>
      </div>

      <ProfilSection role={role} />

      <VisibiliteSection role={role} />

      <VendeurThemeTab shopId={shopId} />

      <ChangerMotDePasse />

      <div className="bg-white rounded-xl border border-tf-border p-5">
        <button
          type="button"
          onClick={() => setShowLogout(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-tf-text-muted hover:bg-[#FFF0F0] hover:text-[#C0392B] transition-all group"
        >
          <LogOut size={18} className="shrink-0 group-hover:text-[#C0392B]" />
          <span className="font-sans text-[13px] font-medium">Se déconnecter</span>
        </button>
      </div>
    </div>
  )
}
