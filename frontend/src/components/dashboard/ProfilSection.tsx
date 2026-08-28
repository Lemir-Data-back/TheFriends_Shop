"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { User, Scissors, Store, Smartphone, Save, CheckCircle } from "lucide-react"
import { api, getApiErrorMessage } from "@/lib/api"

interface Profil {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  mobile_money?: { wave?: string; orange_money?: string; mtn_money?: string }
}

interface ShopData {
  id: number
  nom: string
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

const SPECIALITES_OPTIONS = [
  { group: "Tissus",    items: ["wax", "bazin", "kente", "coton", "soie", "lin"] },
  { group: "Occasions", items: ["cérémonie", "casual", "bureau", "mariage", "sport"] },
]

const inputClass = "w-full px-3 py-2.5 rounded-lg border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-tf-gold/20 transition-colors"
const labelClass = "block font-sans text-[12px] font-semibold text-tf-text-muted uppercase tracking-wider mb-1.5"

export function ProfilSection({ role }: { role: "couturier" | "vendeur" }) {
  const qc = useQueryClient()
  const isCouturier = role === "couturier"

  const { data: profil } = useQuery<Profil>({
    queryKey: ["profil"],
    queryFn: async () => (await api.get("/dashboard/profil")).data,
  })

  const { data: shop } = useQuery<ShopData>({
    queryKey: ["my-shop"],
    queryFn: async () => (await api.get("/shops/me/shop")).data,
  })

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [mm, setMm] = useState({ wave: "", orange_money: "", mtn_money: "" })
  const [shopNom, setShopNom] = useState("")
  const [zone, setZone] = useState("")
  const [desc, setDesc] = useState("")
  const [specs, setSpecs] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (profil) {
      setFullName(profil.full_name ?? "")
      setPhone(profil.phone ?? "")
      setMm({
        wave: profil.mobile_money?.wave ?? "",
        orange_money: profil.mobile_money?.orange_money ?? "",
        mtn_money: profil.mobile_money?.mtn_money ?? "",
      })
    }
  }, [profil])

  useEffect(() => {
    if (shop) {
      setShopNom(shop.nom ?? "")
      setZone(shop.zone ?? "")
      setDesc(shop.description ?? "")
      setSpecs(shop.specialites ?? [])
    }
  }, [shop])

  const updateProfil = useMutation({
    mutationFn: (payload: object) => api.patch("/dashboard/profil", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profil"] }),
  })

  const updateShop = useMutation({
    mutationFn: (payload: object) => api.patch(`/shops/${shop?.id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-shop"] }),
  })

  function toggleSpec(s: string) {
    setSpecs((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  async function handleSave() {
    setPhoneError("")
    const userPayload: Record<string, unknown> = { full_name: fullName || undefined }
    if (phone && phone !== profil?.phone) userPayload.phone = phone

    const mobileMoney: Record<string, string> = {}
    if (mm.wave) mobileMoney.wave = mm.wave
    if (mm.orange_money) mobileMoney.orange_money = mm.orange_money
    if (mm.mtn_money) mobileMoney.mtn_money = mm.mtn_money
    if (Object.keys(mobileMoney).length) userPayload.mobile_money = mobileMoney

    try {
      await updateProfil.mutateAsync(userPayload)
    } catch (err) {
      const msg = getApiErrorMessage(err)
      if (msg.includes("numéro")) {
        setPhoneError(msg)
        return
      }
      throw err
    }

    if (shop) {
      const shopPayload = isCouturier
        ? { zone, description: desc, specialites: specs }
        : { nom: shopNom, zone, description: desc }
      await updateShop.mutateAsync(shopPayload)
    }

    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const isPending = updateProfil.isPending || updateShop.isPending

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Informations personnelles */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-tf-gold" />
            <h3 className="font-sans text-[13px] font-bold text-tf-text">Mes informations</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label htmlFor="prof-fullname" className={labelClass}>{isCouturier ? "Nom complet" : "Nom du gérant"}</label>
              <input id="prof-fullname" type="text" className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ton nom complet" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="prof-phone" className={labelClass}>Numéro personnel</label>
                <span className="font-sans text-[10px] text-tf-text-muted bg-tf-gray-soft px-2 py-0.5 rounded-full">Connexion</span>
              </div>
              <input
                id="prof-phone"
                type="tel"
                className={`${inputClass} ${phoneError ? "border-tf-error ring-2 ring-tf-error/[0.15]" : ""}`}
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneError("") }}
                placeholder="+225 07 00 00 00 00"
              />
              {phoneError && <p role="alert" className="font-sans text-[11px] text-tf-error mt-1">{phoneError}</p>}
            </div>
            {profil?.email && (
              <div className="flex items-center justify-between py-1">
                <span className="font-sans text-[12px] text-tf-text-muted">Email</span>
                <span className="font-sans text-[13px] font-medium text-tf-text">{profil.email}</span>
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-tf-border">
              <div className="flex items-center gap-2">
                <Smartphone size={14} className="text-tf-gold" />
                <p className="font-sans text-[12px] font-bold text-tf-text uppercase tracking-wider">Mobile Money</p>
              </div>
              {[
                { key: "wave", label: "Wave" },
                { key: "orange_money", label: "Orange Money" },
                { key: "mtn_money", label: "MTN Money" },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label htmlFor={`prof-mm-${key}`} className={labelClass}>{label}</label>
                  <input
                    id={`prof-mm-${key}`}
                    type="tel"
                    className={inputClass}
                    placeholder="07 00 00 00 00"
                    value={mm[key as keyof typeof mm]}
                    onChange={(e) => setMm((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mon atelier / Ma boutique */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <div className="flex items-center gap-2 mb-4">
            {isCouturier ? <Scissors size={16} className="text-tf-gold" /> : <Store size={16} className="text-tf-gold" />}
            <h3 className="font-sans text-[13px] font-bold text-tf-text">{isCouturier ? "Mon atelier" : "Ma boutique"}</h3>
          </div>

          {shop && isCouturier && (
            <div className="flex items-center gap-4 mb-5 p-3 bg-tf-gray-soft rounded-lg">
              <div className="grid grid-cols-3 gap-3 flex-1 text-center">
                {[
                  { label: "Délais", score: shop.score_delais },
                  { label: "Qualité", score: shop.score_qualite },
                  { label: "Comm.", score: shop.score_communication },
                ].map(({ label, score }) => (
                  <div key={label}>
                    <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-wide">{label}</p>
                    <p className="font-mono text-[18px] font-bold tabular-nums text-tf-text">{score.toFixed(1)}</p>
                  </div>
                ))}
              </div>
              {shop.is_validated && <CheckCircle size={18} className="text-tf-success shrink-0" />}
            </div>
          )}

          {shop && !isCouturier && (
            <div className="flex items-center gap-3 mb-5 p-3 bg-tf-gray-soft rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-sans text-[13px] font-semibold text-tf-text">{shop.nom}</p>
                  {shop.is_validated && <CheckCircle size={14} className="text-tf-success" />}
                </div>
                <p className="font-sans text-[11px] text-tf-text-muted">{shop.nb_commandes} commandes · {shop.nb_avis} avis</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {!isCouturier && (
              <div>
                <label htmlFor="prof-shop-nom" className={labelClass}>Nom de la boutique</label>
                <input id="prof-shop-nom" type="text" className={inputClass} placeholder="ex : Awa Boutique" value={shopNom} onChange={(e) => setShopNom(e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor="prof-zone" className={labelClass}>Zone / Quartier</label>
              <input id="prof-zone" type="text" className={inputClass} placeholder="ex : Cocody, Yopougon..." value={zone} onChange={(e) => setZone(e.target.value)} />
            </div>
            <div>
              <label htmlFor="prof-desc" className={labelClass}>{isCouturier ? "Description de l'atelier" : "Description"}</label>
              <textarea
                id="prof-desc"
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder={isCouturier ? "Décris ton atelier, tes spécialités, ton expérience..." : "Décris ta boutique, tes marques, tes points forts..."}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {isCouturier && (
              <div>
                <label className={labelClass}>Spécialités</label>
                {SPECIALITES_OPTIONS.map(({ group, items }) => (
                  <div key={group} className="mb-3">
                    <p className="font-sans text-[10px] text-tf-text-muted uppercase tracking-widest mb-2">{group}</p>
                    <div className="flex flex-wrap gap-2">
                      {items.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleSpec(s)}
                          aria-pressed={specs.includes(s)}
                          className={`px-2.5 py-1 rounded-sm text-[12px] font-medium border transition-colors capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
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
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2.5 bg-tf-gold text-tf-black rounded-md font-bold text-[13px] hover:bg-tf-gold-light transition-colors disabled:opacity-50"
      >
        <Save size={15} />
        {saved ? "Enregistré ✓" : isPending ? "Enregistrement..." : "Enregistrer mes informations"}
      </button>
    </div>
  )
}
