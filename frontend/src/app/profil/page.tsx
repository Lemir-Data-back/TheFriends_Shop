"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User, Ruler, LogOut, Save, Store, Scissors, Package,
  Shield, CheckCircle, Smartphone, Heart, Sparkles, Lock,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Profil {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  role: string
  avatar_url: string | null
  score_confiance: number
  mensurations?: { poitrine?: number; taille?: number; hanches?: number; pointure?: number }
  morphologie?: string
  tranche_age?: string
  mobile_money?: { wave?: string; orange_money?: string; mtn_money?: string }
}

interface ShopData {
  id: number
  nom: string
  type: string
  description: string | null
  zone: string | null
  specialites: string[] | null
  score_delais: number
  score_qualite: number
  score_communication: number
  nb_avis: number
  nb_commandes: number
  is_validated: boolean
}

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  client: "Client", couturier: "Couturier", vendeur: "Vendeur PAP", admin: "Administrateur"
}

const SCORE_STATUTS: Record<string, { label: string; color: string }> = {
  premium:  { label: "Client Premium ⭐", color: "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark" },
  fiable:   { label: "Client Fiable ✓",  color: "bg-[#D8F3DC] text-[#2D6A4F]" },
  standard: { label: "Client Standard",   color: "bg-tf-gray-soft text-tf-text-muted" },
  surveille:{ label: "Surveillé ⚠️",       color: "bg-[#FFF3CD] text-[#B8892A]" },
  restreint:{ label: "Restreint ✕",        color: "bg-[#FFCCCC] text-[#C0392B]" },
}

function getStatut(score: number) {
  if (score >= 4.5) return "premium"
  if (score >= 3.5) return "fiable"
  if (score >= 2.5) return "standard"
  if (score >= 1.5) return "surveille"
  return "restreint"
}

const SPECIALITES_OPTIONS = [
  { group: "Tissus",      items: ["wax", "bazin", "kente", "coton", "soie", "lin"] },
  { group: "Occasions",   items: ["cérémonie", "casual", "bureau", "mariage", "sport"] },
]

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

// ── Section Mobile Money (couturier + vendeur) ────────────────────────────────

function MobileMoneySection({ profil, onChange }: {
  profil: Profil | undefined
  onChange: (v: Record<string, string>) => void
}) {
  const [vals, setVals] = useState({ wave: "", orange_money: "", mtn_money: "" })

  useEffect(() => {
    if (profil?.mobile_money) {
      setVals({
        wave:         profil.mobile_money.wave         ?? "",
        orange_money: profil.mobile_money.orange_money ?? "",
        mtn_money:    profil.mobile_money.mtn_money    ?? "",
      })
    }
  }, [profil])

  function update(key: string, val: string) {
    const next = { ...vals, [key]: val }
    setVals(next)
    onChange(next)
  }

  const OPERATORS = [
    { key: "wave",         label: "Wave",         placeholder: "07 00 00 00 00", color: "bg-blue-50 border-blue-200" },
    { key: "orange_money", label: "Orange Money",  placeholder: "05 00 00 00 00", color: "bg-orange-50 border-orange-200" },
    { key: "mtn_money",    label: "MTN Money",     placeholder: "06 00 00 00 00", color: "bg-yellow-50 border-yellow-200" },
  ]

  return (
    <div className="space-y-3 pt-2 border-t border-tf-border">
      <div className="flex items-center gap-2">
        <Smartphone size={14} className="text-tf-gold" />
        <p className="font-sans text-[12px] font-bold text-tf-text uppercase tracking-wider">
          Numéros Mobile Money
        </p>
      </div>
      <p className="font-sans text-[12px] text-tf-text-muted">
        Utilisés pour les virements de paiement escrow.
      </p>
      {OPERATORS.map(({ key, label, placeholder, color }) => (
        <div key={key}>
          <label className={labelClass}>{label}</label>
          <input
            type="tel"
            className={inputClass}
            placeholder={placeholder}
            value={vals[key as keyof typeof vals]}
            onChange={(e) => update(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  )
}

// ── Section mensurations (client uniquement) ──────────────────────────────────

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
        Saisis tes mensurations une seule fois. L'app te recommande automatiquement la bonne taille chez chaque vendeur.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {[
          { key: "poitrine", label: "Tour de poitrine (cm)", placeholder: "ex : 90" },
          { key: "taille",   label: "Tour de taille (cm)",   placeholder: "ex : 70" },
          { key: "hanches",  label: "Tour de hanches (cm)",  placeholder: "ex : 96" },
          { key: "pointure", label: "Pointure",               placeholder: "ex : 40" },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className={labelClass}>{label}</label>
            <input
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

// ── Section atelier (couturier) ───────────────────────────────────────────────

function AtelierSection({ shop, onChange }: {
  shop: ShopData | undefined
  onChange: (v: { zone?: string; description?: string; specialites?: string[] }) => void
}) {
  const [zone, setZone]         = useState("")
  const [desc, setDesc]         = useState("")
  const [specs, setSpecs]       = useState<string[]>([])

  useEffect(() => {
    if (shop) {
      setZone(shop.zone ?? "")
      setDesc(shop.description ?? "")
      setSpecs(shop.specialites ?? [])
    }
  }, [shop])

  function toggleSpec(s: string) {
    const next = specs.includes(s) ? specs.filter(x => x !== s) : [...specs, s]
    setSpecs(next)
    onChange({ zone, description: desc, specialites: next })
  }

  function update(field: string, val: string) {
    const z = field === "zone" ? val : zone
    const d = field === "desc" ? val : desc
    if (field === "zone") setZone(val)
    if (field === "desc") setDesc(val)
    onChange({ zone: z, description: d, specialites: specs })
  }

  return (
    <Section icon={<Scissors size={16} />} title="Mon atelier">
      {shop && (
        <div className="flex items-center gap-4 mb-5 p-3 bg-tf-gray-soft rounded-lg">
          <div className="grid grid-cols-3 gap-3 flex-1 text-center">
            {[
              { label: "Délais",   score: shop.score_delais },
              { label: "Qualité",  score: shop.score_qualite },
              { label: "Comm.",    score: shop.score_communication },
            ].map(({ label, score }) => (
              <div key={label}>
                <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-wide">{label}</p>
                <p className="font-sans text-[18px] font-bold tabular-nums text-tf-text">{score.toFixed(1)}</p>
              </div>
            ))}
          </div>
          {shop.is_validated && (
            <CheckCircle size={18} className="text-[#2D6A4F] shrink-0" />
          )}
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Zone / Quartier</label>
          <input type="text" className={inputClass} placeholder="ex : Cocody, Yopougon..." value={zone} onChange={e => update("zone", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Description de l'atelier</label>
          <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Décris ton atelier, tes spécialités, ton expérience..." value={desc} onChange={e => update("desc", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Spécialités</label>
          {SPECIALITES_OPTIONS.map(({ group, items }) => (
            <div key={group} className="mb-3">
              <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-widest mb-2">{group}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpec(s)}
                    className={`px-2.5 py-1 rounded-sm text-[12px] font-medium border transition-colors capitalize ${
                      specs.includes(s) ? "bg-tf-black text-white border-tf-black" : "bg-white text-tf-text-muted border-tf-border hover:border-tf-text"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

// ── Section boutique (vendeur) ────────────────────────────────────────────────

function BoutiqueSection({ shop, onChange }: {
  shop: ShopData | undefined
  onChange: (v: { nom?: string; zone?: string; description?: string }) => void
}) {
  const [nom,  setNom]  = useState("")
  const [zone, setZone] = useState("")
  const [desc, setDesc] = useState("")

  useEffect(() => {
    if (shop) {
      setNom(shop.nom ?? "")
      setZone(shop.zone ?? "")
      setDesc(shop.description ?? "")
    }
  }, [shop])

  function update(field: string, val: string) {
    const n = field === "nom"  ? val : nom
    const z = field === "zone" ? val : zone
    const d = field === "desc" ? val : desc
    if (field === "nom")  setNom(val)
    if (field === "zone") setZone(val)
    if (field === "desc") setDesc(val)
    onChange({ nom: n, zone: z, description: d })
  }

  return (
    <Section icon={<Store size={16} />} title="Ma boutique">
      {shop && (
        <div className="flex items-center gap-3 mb-5 p-3 bg-tf-gray-soft rounded-lg">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-sans text-[13px] font-semibold text-tf-text">{shop.nom}</p>
              {shop.is_validated && <CheckCircle size={14} className="text-[#2D6A4F]" />}
            </div>
            <p className="font-sans text-[11px] text-tf-text-muted">{shop.nb_commandes} commandes · {shop.nb_avis} avis</p>
          </div>
          <Link href="/dashboard/vendeur" className="font-sans text-[12px] text-tf-gold hover:underline font-semibold">
            Dashboard →
          </Link>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Nom de la boutique</label>
          <input type="text" className={inputClass} placeholder="ex : Awa Coutures" value={nom} onChange={e => update("nom", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Zone / Quartier</label>
          <input type="text" className={inputClass} placeholder="ex : Marcory, Adjamé..." value={zone} onChange={e => update("zone", e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <textarea rows={3} className={`${inputClass} resize-none`} placeholder="Décris ta boutique, tes marques, tes points forts..." value={desc} onChange={e => update("desc", e.target.value)} />
        </div>
      </div>
    </Section>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function ProfilPage() {
  const router     = useRouter()
  const qc         = useQueryClient()
  const { user, logout } = useAuthStore()

  // États du formulaire
  const [fullName,    setFullName]    = useState(user?.full_name ?? "")
  const [phone,       setPhone]       = useState("")
  const [morphologie, setMorphologie] = useState("")
  const [trancheAge,  setTrancheAge]  = useState("")
  const [mensVals,    setMensVals]    = useState<Record<string, string>>({})
  const [shopVals,    setShopVals]    = useState<Record<string, any>>({})
  const [mmVals,      setMmVals]      = useState<Record<string, string>>({})
  const [saved,       setSaved]       = useState(false)
  const [phoneError,  setPhoneError]  = useState("")

  // ── Requêtes ────────────────────────────────────────────────────────────────

  const { data: profil } = useQuery<Profil>({
    queryKey: ["profil"],
    queryFn: async () => (await api.get("/dashboard/profil")).data,
  })

  const { data: shop } = useQuery<ShopData>({
    queryKey: ["my-shop"],
    queryFn: async () => (await api.get("/shops/me/shop")).data,
    enabled: profil?.role === "couturier" || profil?.role === "vendeur",
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

  const updateShop = useMutation({
    mutationFn: (payload: object) => api.patch(`/shops/${shop?.id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-shop"] }),
  })

  async function handleSave() {
    setPhoneError("")
    const role = profil?.role

    // Construire le payload complet avant d'envoyer
    const userPayload: Record<string, any> = {
      full_name: fullName || undefined,
    }

    // Numéro personnel (identifiant de connexion)
    if (phone && phone !== profil?.phone) {
      userPayload.phone = phone
    }

    // Champs client uniquement
    if (role === "client") {
      userPayload.morphologie = morphologie || undefined
      userPayload.tranche_age = trancheAge  || undefined
      const mens: Record<string, number> = {}
      if (mensVals.poitrine) mens.poitrine = parseFloat(mensVals.poitrine)
      if (mensVals.taille)   mens.taille   = parseFloat(mensVals.taille)
      if (mensVals.hanches)  mens.hanches  = parseFloat(mensVals.hanches)
      if (mensVals.pointure) mens.pointure = parseFloat(mensVals.pointure)
      if (Object.keys(mens).length) userPayload.mensurations = mens
    }

    // Mobile money (couturier + vendeur) — ajouté au payload AVANT la mutation
    if (role === "couturier" || role === "vendeur") {
      const mm: Record<string, string> = {}
      if (mmVals.wave)         mm.wave         = mmVals.wave
      if (mmVals.orange_money) mm.orange_money = mmVals.orange_money
      if (mmVals.mtn_money)    mm.mtn_money    = mmVals.mtn_money
      if (Object.keys(mm).length) userPayload.mobile_money = mm
    }

    try {
      await updateProfil.mutateAsync(userPayload)
    } catch (err: any) {
      const msg = err?.response?.data?.detail ?? ""
      if (msg.includes("numéro")) {
        setPhoneError(msg)
        return
      }
      throw err
    }

    // Mise à jour boutique pour couturier/vendeur
    if (shop && Object.keys(shopVals).length) {
      await updateShop.mutateAsync(shopVals)
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
  const isPending = updateProfil.isPending || updateShop.isPending

  // Stats profil — toujours appelé (règles des hooks), activé seulement si client
  const { data: stats } = useQuery<{
    nb_commandes: number
    nb_looks: number
    nb_likes_recus: number
    nb_articles_likes: number
  }>({
    queryKey: ["profil-stats"],
    queryFn: async () => (await api.get("/dashboard/profil/stats")).data,
    enabled: role === "client" && !!profil,
  })

  // L'admin n'a pas de page profil — redirection directe vers le panel
  if (role === "admin") {
    router.replace("/admin")
    return null
  }

  // ── Rendu ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="font-sans text-[13px] text-tf-text-muted">Paramètres</p>
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
              {ROLE_LABELS[role] ?? role}
            </span>
            {role === "client" && profil && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${SCORE_STATUTS[statut].color}`}>
                {SCORE_STATUTS[statut].label}
              </span>
            )}
            {role === "admin" && (
              <span className="flex items-center gap-1 text-[11px] text-tf-text-muted">
                <Shield size={11} /> Accès complet
              </span>
            )}
          </div>
        </div>

        {/* Score confiance client */}
        {role === "client" && profil && (
          <div className="hidden lg:flex flex-col items-center shrink-0 px-4">
            <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-wider mb-1">Score confiance</p>
            <p className="font-sans text-[32px] font-bold tabular-nums text-tf-text leading-none">
              {profil.score_confiance.toFixed(1)}
            </p>
            <p className="font-sans text-[11px] text-tf-text-muted">/ 5</p>
          </div>
        )}
      </div>

      {/* Stats + Badges — clients uniquement ───────────────────────── */}
      {role === "client" && stats && (
        <>
          {/* Compteurs */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Commandes",      value: stats.nb_commandes,     icon: <Package size={16} className="text-tf-gold" /> },
              { label: "Looks postés",   value: stats.nb_looks,         icon: <Sparkles size={16} className="text-[#185FA5]" /> },
              { label: "Articles likés", value: stats.nb_articles_likes, icon: <Heart size={16} className="text-[#C0392B]" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="bg-white rounded-xl border border-tf-border p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">{icon}
                  <span className="font-sans text-[11px] text-tf-text-muted">{label}</span>
                </div>
                <p className="font-sans text-[22px] font-bold tabular-nums text-tf-black">{value}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          <BadgesSection stats={stats} />
        </>
      )}

      {/* Grille 2 colonnes sur desktop ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Colonne gauche — informations personnelles */}
        <Section icon={<User size={16} />} title="Informations personnelles">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nom complet</label>
              <input
                type="text" className={inputClass}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ton nom complet"
              />
            </div>

            {/* Morphologie + tranche d'âge — clients uniquement */}
            {role === "client" && (
              <>
                <div>
                  <label className={labelClass}>Morphologie</label>
                  <select className={inputClass} value={morphologie} onChange={e => setMorphologie(e.target.value)}>
                    <option value="">Sélectionner</option>
                    <option value="hourglass">Sablier</option>
                    <option value="pear">Poire</option>
                    <option value="apple">Pomme</option>
                    <option value="rectangle">Rectangle</option>
                    <option value="inverted_triangle">Triangle inversé</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tranche d'âge</label>
                  <select className={inputClass} value={trancheAge} onChange={e => setTrancheAge(e.target.value)}>
                    <option value="">Sélectionner</option>
                    {["18-25", "26-35", "36-45", "46-55", "55+"].map(t => (
                      <option key={t} value={t}>{t} ans</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Numéro personnel (identifiant de connexion) */}
            <div className="pt-3 border-t border-tf-border">
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelClass}>Numéro personnel</label>
                <span className="font-sans text-[10px] text-tf-text-muted bg-tf-gray-soft px-2 py-0.5 rounded-full">
                  Utilisé pour la connexion
                </span>
              </div>
              <input
                type="tel"
                className={`${inputClass} ${phoneError ? "border-[#C0392B] ring-2 ring-[rgba(192,57,43,0.15)]" : ""}`}
                value={phone}
                onChange={e => { setPhone(e.target.value); setPhoneError("") }}
                placeholder="+225 07 00 00 00 00"
              />
              {phoneError && (
                <p className="font-sans text-[11px] text-[#C0392B] mt-1">{phoneError}</p>
              )}
              <p className="font-sans text-[11px] text-tf-text-muted mt-1">
                C'est aussi ton identifiant de connexion — modifie-le avec précaution.
              </p>
            </div>

            {/* Email (lecture seule si renseigné) */}
            {profil?.email && (
              <div className="flex items-center justify-between py-1">
                <span className="font-sans text-[12px] text-tf-text-muted">Email</span>
                <span className="font-sans text-[13px] font-medium text-tf-text">{profil.email}</span>
              </div>
            )}

            {/* Mobile Money — couturier et vendeur uniquement */}
            {(role === "couturier" || role === "vendeur") && (
              <MobileMoneySection profil={profil} onChange={setMmVals} />
            )}
          </div>
        </Section>

        {/* Colonne droite — selon le rôle */}
        {role === "client" && (
          <MensurationsSection profil={profil} onChange={setMensVals} />
        )}
        {role === "couturier" && (
          <AtelierSection shop={shop} onChange={setShopVals} />
        )}
        {role === "vendeur" && (
          <BoutiqueSection shop={shop} onChange={setShopVals} />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex-1 py-3 bg-tf-gold text-tf-black rounded-lg font-sans font-bold text-[14px] hover:bg-tf-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={16} />
          {saved ? "Sauvegardé ✓" : isPending ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </button>

        <button
          onClick={handleLogout}
          className="sm:w-auto px-6 py-3 border border-tf-border text-tf-text-muted rounded-lg font-sans font-medium text-[14px] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
