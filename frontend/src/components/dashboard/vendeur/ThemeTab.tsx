"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import {
  useShopThemeDraft,
  useUpdateShopTheme,
  usePublishShopTheme,
  usePoliceOptions,
  ShopTheme,
  DEFAULT_THEME,
} from "@/features/shop-theming/useShopTheme"
import { ShopThemePreview } from "@/features/shop-theming/ThemeProvider"

const PRESETS = [
  { label: "TheFriends (défaut)", couleur_principale: "#C9A84C", couleur_fond: "#FDFCFA", couleur_texte: "#111111", couleur_secondaire: "#111111" },
  { label: "Élégance nuit",       couleur_principale: "#E8C97A", couleur_fond: "#111111", couleur_texte: "#FFFFFF", couleur_secondaire: "#1C1C1C" },
  { label: "Wax & terre",         couleur_principale: "#C0592B", couleur_fond: "#FBF6F0", couleur_texte: "#2C1A10", couleur_secondaire: "#2C1A10" },
  { label: "Kente vert",          couleur_principale: "#2D6A4F", couleur_fond: "#F0FAF4", couleur_texte: "#1A3A2A", couleur_secondaire: "#1A3A2A" },
]

interface ThemeTabProps {
  shopId: number
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="font-sans text-[13px] text-tf-text">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-sans text-[11px] font-mono text-tf-text-muted uppercase">{value}</span>
        <label className="cursor-pointer">
          <div
            className="w-8 h-8 rounded-lg border-2 border-tf-border cursor-pointer"
            style={{ backgroundColor: value }}
          />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
        </label>
      </div>
    </div>
  )
}

export function VendeurThemeTab({ shopId }: ThemeTabProps) {
  const { data: draft, isLoading } = useShopThemeDraft(shopId)
  const { data: polices } = usePoliceOptions()
  const updateTheme = useUpdateShopTheme(shopId)
  const publishTheme = usePublishShopTheme(shopId)
  const [preview, setPreview] = useState(false)
  const [localTheme, setLocalTheme] = useState<Partial<ShopTheme>>({})
  const [saved, setSaved] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border" />)}
      </div>
    )
  }

  const theme = { ...(draft ?? DEFAULT_THEME), ...localTheme }

  function update(patch: Partial<ShopTheme>) {
    setLocalTheme((prev) => ({ ...prev, ...patch }))
    setSaved(false)
  }

  async function handleSave() {
    await updateTheme.mutateAsync(localTheme)
    setSaved(true)
    setLocalTheme({})
  }

  async function handlePublish() {
    if (Object.keys(localTheme).length > 0) await updateTheme.mutateAsync(localTheme)
    await publishTheme.mutateAsync()
    setLocalTheme({})
    setSaved(true)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Panneau de configuration */}
      <div className="space-y-4">

        {/* Presets */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-3">Ambiances prédéfinies</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => update({
                  couleur_principale: p.couleur_principale,
                  couleur_fond: p.couleur_fond,
                  couleur_texte: p.couleur_texte,
                  couleur_secondaire: p.couleur_secondaire,
                })}
                aria-pressed={theme.couleur_principale === p.couleur_principale && theme.couleur_fond === p.couleur_fond}
                className="flex items-center gap-2 p-2.5 border border-tf-border rounded-lg hover:border-[rgba(201,168,76,0.5)] transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold"
              >
                <div className="flex gap-1 shrink-0">
                  <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: p.couleur_secondaire }} />
                  <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: p.couleur_fond }} />
                  <div className="w-4 h-8 rounded-sm" style={{ backgroundColor: p.couleur_principale }} />
                </div>
                <span className="font-sans text-[11px] font-medium text-tf-text leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Couleurs */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-1">Couleurs</h3>
          <div className="divide-y divide-tf-border">
            {[
              { label: "Couleur principale",  key: "couleur_principale"  as const },
              { label: "Couleur secondaire",  key: "couleur_secondaire"  as const },
              { label: "Fond de page",        key: "couleur_fond"        as const },
              { label: "Texte",               key: "couleur_texte"       as const },
              { label: "Accent",              key: "couleur_accent"      as const },
            ].map(({ label, key }) => (
              <ColorInput
                key={key}
                label={label}
                value={theme[key] as string}
                onChange={(v) => update({ [key]: v })}
              />
            ))}
          </div>
        </div>

        {/* Typographie */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-3">Typographie</h3>
          <div className="space-y-3">
            {[
              { label: "Police des titres", key: "police_titres" as const, options: polices?.titres ?? [] },
              { label: "Police du texte",   key: "police_corps"  as const, options: polices?.corps  ?? [] },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <p className="font-sans text-[12px] font-semibold text-tf-text mb-1.5">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((f) => (
                    <button
                      key={f}
                      onClick={() => update({ [key]: f })}
                      aria-pressed={theme[key] === f}
                      style={{ fontFamily: `'${f}', serif` }}
                      className={`px-3 py-1.5 rounded-lg border text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                        theme[key] === f
                          ? "border-tf-black bg-tf-black text-white"
                          : "border-tf-border text-tf-text hover:border-tf-gold"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contenu éditorial */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-3">Contenu</h3>
          <div className="space-y-3">
            {[
              { label: "Slogan",          key: "slogan"          as const, placeholder: "Ta mode, ton style.", multiline: false },
              { label: "Message d'accueil", key: "message_accueil" as const, placeholder: "Bienvenue dans ma boutique...", multiline: false },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="font-sans text-[12px] font-semibold text-tf-text block mb-1">{label}</label>
                <input
                  type="text"
                  value={(theme[key] as string) ?? ""}
                  onChange={(e) => update({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)]"
                />
              </div>
            ))}
            <div>
              <label className="font-sans text-[12px] font-semibold text-tf-text block mb-1">À propos</label>
              <textarea
                value={(theme.a_propos as string) ?? ""}
                onChange={(e) => update({ a_propos: e.target.value })}
                placeholder="Décris ton atelier, tes spécialités, ton histoire..."
                rows={3}
                className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)] resize-none"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-3">Contact</h3>
          <div className="space-y-3">
            {[
              { label: "Téléphone",  key: "telephone_contact" as const, placeholder: "+225 07 00 00 00 00" },
              { label: "WhatsApp",   key: "whatsapp"           as const, placeholder: "+225 07 00 00 00 00" },
              { label: "Instagram",  key: "instagram"          as const, placeholder: "@ma_boutique" },
              { label: "TikTok",     key: "tiktok"             as const, placeholder: "@ma_boutique" },
              { label: "Horaires",   key: "horaires"           as const, placeholder: "Lun–Sam, 9h–19h" },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="font-sans text-[12px] font-semibold text-tf-text block mb-1">{label}</label>
                <input
                  type="text"
                  value={(theme[key] as string) ?? ""}
                  onChange={(e) => update({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Disposition */}
        <div className="bg-white rounded-xl border border-tf-border p-5">
          <h3 className="font-sans text-[13px] font-bold text-tf-text mb-3">Disposition</h3>
          <div className="space-y-3">
            <div>
              <p className="font-sans text-[12px] font-semibold text-tf-text mb-2">Style hero</p>
              <div className="flex gap-2">
                {[
                  { id: "full",    label: "Plein écran" },
                  { id: "split",   label: "Côte à côte" },
                  { id: "minimal", label: "Minimal" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => update({ layout_config: { ...theme.layout_config, hero_style: s.id as "full" | "split" | "minimal" } })}
                    aria-pressed={theme.layout_config?.hero_style === s.id}
                    className={`flex-1 px-2 py-2 rounded-lg border text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                      theme.layout_config?.hero_style === s.id
                        ? "border-tf-black bg-tf-black text-white"
                        : "border-tf-border text-tf-text hover:border-tf-gold"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-sans text-[12px] font-semibold text-tf-text mb-2">Grille produits</p>
              <div className="flex gap-2">
                {[
                  { id: "2col", label: "2 colonnes" },
                  { id: "3col", label: "3 colonnes" },
                  { id: "masonry", label: "Mosaïque" },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => update({ layout_config: { ...theme.layout_config, grid_style: g.id as "2col" | "3col" | "masonry" } })}
                    aria-pressed={theme.layout_config?.grid_style === g.id}
                    className={`flex-1 px-2 py-2 rounded-lg border text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                      theme.layout_config?.grid_style === g.id
                        ? "border-tf-black bg-tf-black text-white"
                        : "border-tf-border text-tf-text hover:border-tf-gold"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => setPreview((p) => !p)}
            className="flex items-center gap-2 px-4 py-2.5 border border-tf-border rounded-lg font-sans text-[13px] font-semibold text-tf-text hover:border-tf-gold transition-colors"
          >
            {preview ? <EyeOff size={15} /> : <Eye size={15} />}
            {preview ? "Masquer" : "Prévisualiser"}
          </button>
          <button
            onClick={handleSave}
            disabled={updateTheme.isPending || Object.keys(localTheme).length === 0}
            className="flex-1 px-4 py-2.5 border border-tf-black rounded-lg font-sans text-[13px] font-semibold text-tf-black hover:bg-tf-gray-soft transition-colors disabled:opacity-50"
          >
            {updateTheme.isPending ? "Enregistrement..." : saved ? "✓ Enregistré" : "Enregistrer le brouillon"}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishTheme.isPending}
            className="flex-1 px-4 py-2.5 bg-tf-gold text-tf-black rounded-lg font-sans text-[13px] font-bold hover:bg-tf-gold-light transition-colors disabled:opacity-50"
          >
            {publishTheme.isPending ? "Publication..." : draft?.is_published ? "✓ Republier" : "Publier"}
          </button>
        </div>

        {draft?.is_published && (
          <p className="font-sans text-[12px] text-tf-success text-center">
            ✓ Thème actuellement publié — visible par tes visiteurs
          </p>
        )}
      </div>

      {/* Panneau prévisualisation */}
      {preview && (
        <div className="lg:sticky lg:top-6">
          <p className="font-sans text-[12px] font-bold text-tf-text-muted uppercase tracking-wider mb-3">Prévisualisation</p>
          <ShopThemePreview theme={theme as ShopTheme}>
            <div className="rounded-xl overflow-hidden border border-tf-border">
              {/* Hero preview */}
              <div
                className="px-6 py-8"
                style={{ backgroundColor: theme.couleur_secondaire }}
              >
                <p
                  className="text-2xl mb-1"
                  style={{
                    fontFamily: `'${theme.police_titres}', Georgia, serif`,
                    color: theme.couleur_principale,
                  }}
                >
                  Ma Boutique
                </p>
                <p
                  className="text-sm opacity-70"
                  style={{
                    fontFamily: `'${theme.police_corps}', Inter, sans-serif`,
                    color: theme.couleur_principale,
                  }}
                >
                  {theme.slogan ?? "Ta mode, ton style."}
                </p>
              </div>
              {/* Catalogue preview */}
              <div
                className="p-4"
                style={{ backgroundColor: theme.couleur_fond }}
              >
                <p
                  className="text-sm font-semibold mb-3"
                  style={{ color: theme.couleur_texte, fontFamily: `'${theme.police_corps}', Inter, sans-serif` }}
                >
                  Articles
                </p>
                <div className={`grid gap-2 ${theme.layout_config?.grid_style === "3col" ? "grid-cols-3" : "grid-cols-2"}`}>
                  {Array.from({ length: theme.layout_config?.grid_style === "3col" ? 3 : 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[3/4] rounded-lg flex items-end p-2"
                      style={{ backgroundColor: `${theme.couleur_principale}20` }}
                    >
                      <div className="w-full">
                        <div className="h-2 rounded mb-1" style={{ backgroundColor: `${theme.couleur_texte}30`, width: "70%" }} />
                        <div
                          className="h-2 rounded text-[9px] flex items-center font-bold"
                          style={{ color: theme.couleur_principale, fontFamily: "Georgia, serif" }}
                        >
                          12 000 F
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ShopThemePreview>
        </div>
      )}
    </div>
  )
}
