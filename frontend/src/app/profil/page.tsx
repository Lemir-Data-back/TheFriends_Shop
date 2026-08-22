"use client"

import { useState, useEffect, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import {
  User, Ruler, LogOut, Save, Package,
  Heart, Sparkles, Lock, LayoutDashboard, Settings,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { ClientDashboardTab } from "@/components/profil/ClientDashboardTab"
import { ClientCommandesTab } from "@/components/profil/ClientCommandesTab"

// ── Types ─────────────────────────────────────────────────────────────────────
// Cette page est réservée aux clients — vendeur/couturier/admin sont redirigés
// avant le rendu (voir ProfilContent), donc rien ici ne gère plus ces rôles.

interface Profil {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  role: string
  score_confiance: number
  mensurations?: { poitrine?: number; taille?: number; hanches?: number; pointure?: number }
  morphologie?: string
  tranche_age?: string
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SCORE_STATUTS: Record<string, { label: string; color: string }> = {
  premium:  { label: "Client Premium ⭐", color: "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark" },
  fiable:   { label: "Client Fiable ✓",  color: "bg-tf-success-bg text-tf-success" },
  standard: { label: "Client Standard",   color: "bg-tf-gray-soft text-tf-text-muted" },
  surveille:{ label: "Surveillé ⚠️",       color: "bg-tf-warning-bg text-tf-warning" },
  restreint:{ label: "Restreint ✕",        color: "bg-tf-error-bg text-tf-error" },
}

function getStatut(score: number) {
  if (score >= 4.5) return "premium"
  if (score >= 3.5) return "fiable"
  if (score >= 2.5) return "standard"
  if (score >= 1.5) return "surveille"
  return "restreint"
}

// ── Sous-composants ───────────────────────────────────────────────────────────

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)] transition-colors"
const labelClass = "block font-sans text-[12px] font-semibold text-tf-text-muted uppercase tracking-wider mb-1.5"

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-tf-border p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-tf-gold">{icon}</span>
        <h2 className="font-sans text-[15px] font-bold text-tf-text">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ── Système de badges ─────────────────────────────────────────────────────────

interface BadgeDef {
  id: string
  emoji: string
  label: string
  desc: string
  reqKey: "nb_commandes" | "nb_looks" | "nb_articles_likes"
  reqMin: number
  category: "commandes" | "looks" | "likes"
}

const BADGE_DEFINITIONS: BadgeDef[] = [
  // Commandes
  { id: "first_order", emoji: "🛍️", label: "Premier achat",     desc: "Passer sa première commande",     reqKey: "nb_commandes",     reqMin: 1,   category: "commandes" },
  { id: "regular",     emoji: "🛒", label: "Acheteur régulier", desc: "5 commandes passées",              reqKey: "nb_commandes",     reqMin: 5,   category: "commandes" },
  { id: "loyal",       emoji: "💎", label: "Client fidèle",     desc: "10 commandes passées",             reqKey: "nb_commandes",     reqMin: 10,  category: "commandes" },
  { id: "vip",         emoji: "🏆", label: "Client VIP",        desc: "25 commandes passées",             reqKey: "nb_commandes",     reqMin: 25,  category: "commandes" },
  { id: "legend",      emoji: "👑", label: "Légende",           desc: "50 commandes passées",             reqKey: "nb_commandes",     reqMin: 50,  category: "commandes" },
  // Looks
  { id: "first_look",  emoji: "📸", label: "Premier look",      desc: "Publier son premier look",         reqKey: "nb_looks",         reqMin: 1,   category: "looks" },
  { id: "creator",     emoji: "🎨", label: "Créateur",          desc: "5 looks publiés",                  reqKey: "nb_looks",         reqMin: 5,   category: "looks" },
  { id: "stylist",     emoji: "✨", label: "Styliste",          desc: "10 looks publiés",                 reqKey: "nb_looks",         reqMin: 10,  category: "looks" },
  // Likes articles
  { id: "explorer",    emoji: "❤️", label: "Explorateur",       desc: "Liker 10 articles",                reqKey: "nb_articles_likes", reqMin: 10,  category: "likes" },
  { id: "trendy",      emoji: "🔥", label: "Tendance",          desc: "Liker 50 articles",                reqKey: "nb_articles_likes", reqMin: 50,  category: "likes" },
  { id: "influencer",  emoji: "⭐", label: "Influenceur mode",  desc: "Liker 100 articles",               reqKey: "nb_articles_likes", reqMin: 100, category: "likes" },
  { id: "icon",        emoji: "💫", label: "Icône",             desc: "Liker 500 articles",               reqKey: "nb_articles_likes", reqMin: 500, category: "likes" },
]

const CATEGORY_LABELS: Record<string, string> = {
  commandes: "Commandes",
  looks:     "Looks",
  likes:     "Likes",
}

interface StatsData { nb_commandes: number; nb_looks: number; nb_likes_recus: number; nb_articles_likes: number }

function BadgesSection({ stats }: { stats: StatsData }) {
  const byCategory = ["commandes", "looks", "likes"] as const

  return (
    <div className="bg-white rounded-xl border border-tf-border p-5 mb-6">
      <h2 className="font-sans text-[15px] font-bold text-tf-text mb-4">Mes badges</h2>
      <div className="space-y-5">
        {byCategory.map((cat) => {
          const badges = BADGE_DEFINITIONS.filter(b => b.category === cat)
          return (
            <div key={cat}>
              <p className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider mb-2.5">
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="flex flex-wrap gap-3">
                {badges.map((b) => {
                  const unlocked = stats[b.reqKey] >= b.reqMin
                  return (
                    <div
                      key={b.id}
                      className={`relative flex flex-col items-center gap-1.5 w-20 text-center group ${
                        unlocked ? "" : "opacity-40 grayscale"
                      }`}
                      title={unlocked ? b.desc : `Débloque à ${b.reqMin} ${CATEGORY_LABELS[b.category].toLowerCase()}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[26px] border-2 transition-all ${
                        unlocked
                          ? "border-tf-gold bg-[rgba(201,168,76,0.1)] shadow-gold"
                          : "border-tf-border bg-tf-gray-soft"
                      }`}>
                        {unlocked ? b.emoji : <Lock size={18} className="text-tf-border" />}
                      </div>
                      <span className={`font-sans text-[10px] font-semibold leading-tight ${
                        unlocked ? "text-tf-text" : "text-tf-text-muted"
                      }`}>
                        {b.label}
                      </span>
                      {!unlocked && (
                        <span className="font-sans text-[9px] text-tf-text-muted">
                          {stats[b.reqKey]} / {b.reqMin}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Section mensurations ──────────────────────────────────────────────────────

function MensurationsSection({ profil, onChange }: {
  profil: Profil | undefined
  onChange: (v: Record<string, string>) => void
}) {
  const [vals, setVals] = useState({ poitrine: "", taille: "", hanches: "", pointure: "" })

  useEffect(() => {
    if (profil?.mensurations) {
      setVals({
        poitrine: profil.mensurations.poitrine?.toString() ?? "",
        taille:   profil.mensurations.taille?.toString()   ?? "",
        hanches:  profil.mensurations.hanches?.toString()  ?? "",
        pointure: profil.mensurations.pointure?.toString() ?? "",
      })
    }
  }, [profil])

  function update(key: string, val: string) {
    const next = { ...vals, [key]: val }
    setVals(next)
    onChange(next)
  }

  return (
    <Section icon={<Ruler size={16} />} title="Mes mensurations">
      <p className="font-sans text-[13px] text-tf-text-muted mb-5 leading-relaxed">
        Saisis tes mensurations une seule fois. L&apos;app te recommande automatiquement la bonne taille chez chaque vendeur.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: "poitrine", label: "Tour de poitrine (cm)", placeholder: "ex : 90" },
          { key: "taille",   label: "Tour de taille (cm)",   placeholder: "ex : 70" },
          { key: "hanches",  label: "Tour de hanches (cm)",  placeholder: "ex : 96" },
          { key: "pointure", label: "Pointure",               placeholder: "ex : 40" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label htmlFor={`mens-${key}`} className={labelClass}>{label}</label>
            <input
              id={`mens-${key}`}
              type="number" min={1}
              className={inputClass}
              placeholder={placeholder}
              value={vals[key as keyof typeof vals]}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </Section>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ProfilPage() {
  return (
    <Suspense fallback={null}>
      <ProfilContent />
    </Suspense>
  )
}

function ProfilContent() {
  const router     = useRouter()
  const qc         = useQueryClient()
  const searchParams = useSearchParams()
  const { user, logout, isAuthenticated, _hasHydrated } = useAuthStore()
  const [tab, setTab] = useState(searchParams.get("tab") ?? "apercu")

  // Réagit aux liens de la navbar (/profil?tab=...) même sans remontage de page
  useEffect(() => {
    setTab(searchParams.get("tab") ?? "apercu")
  }, [searchParams])

  // Invité — pas de profil sans compte, direction la connexion
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.replace("/auth/login")
    }
  }, [_hasHydrated, isAuthenticated, router])

  // États du formulaire
  const [fullName,    setFullName]    = useState(user?.full_name ?? "")
  const [phone,       setPhone]       = useState("")
  const [morphologie, setMorphologie] = useState("")
  const [trancheAge,  setTrancheAge]  = useState("")
  const [mensVals,    setMensVals]    = useState<Record<string, string>>({})
  const [saved,       setSaved]       = useState(false)
  const [phoneError,  setPhoneError]  = useState("")

  // ── Requêtes ────────────────────────────────────────────────────────────────

  const { data: profil } = useQuery<Profil>({
    queryKey: ["profil"],
    queryFn: async () => (await api.get("/dashboard/profil")).data,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (profil) {
      setFullName(profil.full_name ?? "")
      setPhone(profil.phone ?? "")
      setMorphologie(profil.morphologie ?? "")
      setTrancheAge(profil.tranche_age ?? "")
    }
  }, [profil])

  // ── Mutations ───────────────────────────────────────────────────────────────

  const updateProfil = useMutation({
    mutationFn: (payload: object) => api.patch("/dashboard/profil", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profil"] }),
  })

  async function handleSave() {
    setPhoneError("")

    const userPayload: Record<string, unknown> = {
      full_name: fullName || undefined,
      morphologie: morphologie || undefined,
      tranche_age: trancheAge || undefined,
    }

    if (phone && phone !== profil?.phone) {
      userPayload.phone = phone
    }

    const mens: Record<string, number> = {}
    if (mensVals.poitrine) mens.poitrine = parseFloat(mensVals.poitrine)
    if (mensVals.taille)   mens.taille   = parseFloat(mensVals.taille)
    if (mensVals.hanches)  mens.hanches  = parseFloat(mensVals.hanches)
    if (mensVals.pointure) mens.pointure = parseFloat(mensVals.pointure)
    if (Object.keys(mens).length) userPayload.mensurations = mens

    try {
      await updateProfil.mutateAsync(userPayload)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ""
      if (msg.includes("numéro")) {
        setPhoneError(msg)
        return
      }
      throw err
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleLogout() {
    logout()
    router.push("/")
  }

  const role    = profil?.role ?? user?.role ?? "client"
  const statut  = getStatut(profil?.score_confiance ?? 5)
  const isPending = updateProfil.isPending

  const { data: stats } = useQuery<{
    nb_commandes: number
    nb_looks: number
    nb_likes_recus: number
    nb_articles_likes: number
  }>({
    queryKey: ["profil-stats"],
    queryFn: async () => (await api.get("/dashboard/profil/stats")).data,
    enabled: !!profil,
  })

  // Invité — redirection déjà déclenchée par l'effet ci-dessus, on n'affiche rien entre-temps
  if (!_hasHydrated || !isAuthenticated) {
    return null
  }

  // L'admin n'a pas de page profil — redirection directe vers le panel
  if (role === "admin") {
    router.replace("/admin")
    return null
  }

  // Vendeur/couturier — le profil vit désormais dans Paramètres de leur dashboard
  if (role === "couturier" || role === "vendeur") {
    router.replace(role === "couturier" ? "/dashboard/couturier?tab=parametres" : "/dashboard/vendeur?tab=parametres")
    return null
  }

  // ── Rendu — uniquement des clients à partir d'ici ──────────────────────────

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="font-sans text-[13px] text-tf-text-muted">Mon espace</p>
        <h1 className="font-serif text-h1 text-tf-black">Mon profil</h1>
      </div>

      {/* Carte identité — pleine largeur */}
      <div className="bg-white rounded-xl border border-tf-border p-6 mb-6 flex items-center gap-5">
        {/* Avatar */}
        <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-tf-black flex items-center justify-center shrink-0">
          <span className="font-serif text-[24px] lg:text-[30px] text-tf-gold">
            {profil?.full_name?.[0]?.toUpperCase() ?? "?"}
          </span>
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-[20px] lg:text-[24px] text-tf-text leading-tight truncate">
            {profil?.full_name ?? user?.full_name}
          </h2>
          <p className="font-sans text-[13px] text-tf-text-muted mt-0.5">
            {profil?.phone ?? profil?.email ?? "—"}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-sans text-[11px] font-semibold text-tf-gold uppercase tracking-wider">
              Client
            </span>
            {profil && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${SCORE_STATUTS[statut].color}`}>
                {SCORE_STATUTS[statut].label}
              </span>
            )}
          </div>
        </div>

        {/* Score confiance */}
        {profil && (
          <div className="hidden lg:flex flex-col items-center shrink-0 px-4">
            <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-wider mb-1">Score confiance</p>
            <p className="font-mono text-[32px] font-bold tabular-nums text-tf-text leading-none">
              {profil.score_confiance.toFixed(1)}
            </p>
            <p className="font-sans text-[11px] text-tf-text-muted">/ 5</p>
          </div>
        )}
      </div>

      {/* Onglets — Vue d'ensemble / Commandes / Paramètres */}
      <DashboardTabs
        tabs={[
          { id: "apercu", label: "Vue d'ensemble", icon: <LayoutDashboard size={14} /> },
          { id: "commandes", label: "Commandes", icon: <Package size={14} /> },
          { id: "parametres", label: "Paramètres", icon: <Settings size={14} /> },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "apercu" && (
        <ClientDashboardTab onViewAllOrders={() => setTab("commandes")} />
      )}

      {tab === "commandes" && <ClientCommandesTab />}

      {/* Stats + Badges — onglet Paramètres ─────────────────────────── */}
      {stats && tab === "parametres" && (
        <>
          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Commandes",      value: stats.nb_commandes,     icon: <Package size={16} className="text-tf-gold" /> },
              { label: "Looks postés",   value: stats.nb_looks,         icon: <Sparkles size={16} className="text-tf-info" /> },
              { label: "Articles likés", value: stats.nb_articles_likes, icon: <Heart size={16} className="text-tf-error" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-tf-border p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">{icon}
                  <span className="font-sans text-[11px] text-tf-text-muted">{label}</span>
                </div>
                <p className="font-mono text-[22px] font-bold tabular-nums text-tf-black">{value}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <BadgesSection stats={stats} />
        </>
      )}

      {tab === "parametres" && (
      <>
      {/* Grille 2 colonnes sur desktop ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Colonne gauche — informations personnelles */}
        <Section icon={<User size={16} />} title="Informations personnelles">
          <div className="space-y-4">
            <div>
              <label htmlFor="profil-fullname" className={labelClass}>Nom complet</label>
              <input
                id="profil-fullname"
                type="text" className={inputClass}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ton nom complet"
              />
            </div>

            <div>
              <label htmlFor="profil-morphologie" className={labelClass}>Morphologie</label>
              <select id="profil-morphologie" className={inputClass} value={morphologie} onChange={e => setMorphologie(e.target.value)}>
                <option value="">Sélectionner</option>
                <option value="hourglass">Sablier</option>
                <option value="pear">Poire</option>
                <option value="apple">Pomme</option>
                <option value="rectangle">Rectangle</option>
                <option value="inverted_triangle">Triangle inversé</option>
              </select>
            </div>
            <div>
              <label htmlFor="profil-tranche-age" className={labelClass}>Tranche d&apos;âge</label>
              <select id="profil-tranche-age" className={inputClass} value={trancheAge} onChange={e => setTrancheAge(e.target.value)}>
                <option value="">Sélectionner</option>
                {["18-25", "26-35", "36-45", "46-55", "55+"].map(t => (
                  <option key={t} value={t}>{t} ans</option>
                ))}
              </select>
            </div>

            {/* Numéro personnel (identifiant de connexion) */}
            <div className="pt-3 border-t border-tf-border">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="profil-phone" className={labelClass}>Numéro personnel</label>
                <span className="font-sans text-[10px] text-tf-text-muted bg-tf-gray-soft px-2 py-0.5 rounded-full">
                  Utilisé pour la connexion
                </span>
              </div>
              <input
                id="profil-phone"
                type="tel"
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? "profil-phone-error" : undefined}
                className={`${inputClass} ${phoneError ? "border-tf-error ring-2 ring-[rgba(192,57,43,0.15)]" : ""}`}
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError("") }}
                placeholder="+225 07 00 00 00 00"
              />
              {phoneError && (
                <p id="profil-phone-error" className="font-sans text-[11px] text-tf-error mt-1">{phoneError}</p>
              )}
              <p className="font-sans text-[11px] text-tf-text-muted mt-1">
                C&apos;est aussi ton identifiant de connexion — modifie-le avec précaution.
              </p>
            </div>

            {/* Email (lecture seule si renseigné) */}
            {profil?.email && (
              <div className="flex items-center justify-between py-1">
                <span className="font-sans text-[12px] text-tf-text-muted">Email</span>
                <span className="font-sans text-[13px] font-medium text-tf-text">{profil.email}</span>
              </div>
            )}
          </div>
        </Section>

        {/* Colonne droite — mensurations */}
        <MensurationsSection profil={profil} onChange={setMensVals} />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="btn-gold flex-1 rounded-lg text-[14px] flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saved ? "Sauvegardé ✓" : isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </button>

        <button
          onClick={handleLogout}
          className="sm:w-auto px-6 py-3 border border-tf-border text-tf-text-muted rounded-lg font-sans font-medium text-[14px] hover:border-tf-error hover:text-tf-error transition-colors flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
      </>
      )}
    </div>
  )
}
