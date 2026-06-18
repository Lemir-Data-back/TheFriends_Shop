"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  LayoutDashboard, Users, Store, Puzzle, AlertTriangle,
  ShoppingBag, CheckCircle, XCircle, RefreshCw, Search,
  UserCheck, UserX, ChevronDown, Shield, TrendingUp,
} from "lucide-react"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth"
import { formatPrix } from "@/lib/utils"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlatformStats {
  nb_users_total: number
  nb_users_clients: number
  nb_users_couturiers: number
  nb_users_vendeurs: number
  nb_shops_total: number
  nb_shops_validees: number
  nb_shops_en_attente: number
  nb_commandes_total: number
  nb_commandes_en_cours: number
  nb_litiges_ouverts: number
  ca_total: number
  ca_mois: number
  nb_nouveaux_users_7j: number
}

interface UserAdmin {
  id: number
  full_name: string
  email: string | null
  phone: string | null
  role: string
  score_confiance: number
  is_active: boolean
  is_verified: boolean
  nb_commandes: number
  created_at: string
}

interface ShopAdmin {
  id: number
  nom: string
  type: string
  zone: string | null
  is_active: boolean
  is_validated: boolean
  nb_commandes: number
  nb_avis: number
  score_moyen: number
  owner_name: string
  owner_phone: string | null
  created_at: string
}

interface OrderAdmin {
  id: number
  reference: string
  client_nom: string
  shop_nom: string
  montant: number
  statut: string
  escrow_statut: string
  created_at: string
}

interface ModuleStatus {
  slug: string
  name: string
  is_globally_active: boolean
  phase: number
  applies_to: string
}

// ── Composants utilitaires ────────────────────────────────────────────────────

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${color}`}>
      {children}
    </span>
  )
}

function StatCard({ label, value, sub, color = "text-tf-black" }: {
  label: string; value: string | number; sub?: string; color?: string
}) {
  return (
    <div className="bg-white border border-tf-border rounded-xl p-4">
      <p className="font-sans text-[11px] font-semibold text-tf-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-sans text-[22px] font-bold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="font-sans text-[11px] text-tf-text-muted mt-0.5">{sub}</p>}
    </div>
  )
}

function SearchBar({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tf-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold focus:ring-2 focus:ring-[rgba(201,168,76,0.2)] bg-white"
      />
    </div>
  )
}

// ── Onglet Vue d'ensemble ─────────────────────────────────────────────────────

function StatsTab() {
  const { data, isLoading } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
    refetchInterval: 30_000,
  })

  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array.from({length:8}).map((_,i)=><div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border"/>)}</div>

  return (
    <div className="space-y-6">
      {/* Revenus */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-tf-black rounded-xl p-6 text-white">
          <p className="font-sans text-[12px] text-white/50 uppercase tracking-wider mb-1">CA total plateforme</p>
          <p className="font-serif text-[36px] font-bold tabular-nums text-tf-gold">
            {formatPrix(data?.ca_total ?? 0)}
          </p>
          <p className="font-sans text-[13px] text-white/60 mt-1">
            Ce mois : <span className="text-white font-semibold">{formatPrix(data?.ca_mois ?? 0)}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Litiges ouverts" value={data?.nb_litiges_ouverts ?? 0} color={data?.nb_litiges_ouverts ? "text-[#C0392B]" : "text-tf-black"} />
          <StatCard label="Cmds en cours" value={data?.nb_commandes_en_cours ?? 0} />
          <StatCard label="Boutiques en attente" value={data?.nb_shops_en_attente ?? 0} color="text-[#B8892A]" />
          <StatCard label="Nouveaux users 7j" value={data?.nb_nouveaux_users_7j ?? 0} color="text-[#2D6A4F]" />
        </div>
      </div>

      {/* Utilisateurs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs total"  value={data?.nb_users_total ?? 0} />
        <StatCard label="Clients"   value={data?.nb_users_clients ?? 0}    sub={`${Math.round((data?.nb_users_clients ?? 0) / Math.max(1, data?.nb_users_total ?? 1) * 100)}%`} />
        <StatCard label="Couturiers" value={data?.nb_users_couturiers ?? 0} sub={`${Math.round((data?.nb_users_couturiers ?? 0) / Math.max(1, data?.nb_users_total ?? 1) * 100)}%`} />
        <StatCard label="Vendeurs"  value={data?.nb_users_vendeurs ?? 0}    sub={`${Math.round((data?.nb_users_vendeurs ?? 0) / Math.max(1, data?.nb_users_total ?? 1) * 100)}%`} />
      </div>

      {/* Boutiques + commandes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Boutiques total"   value={data?.nb_shops_total ?? 0} />
        <StatCard label="Boutiques validées" value={data?.nb_shops_validees ?? 0} color="text-[#2D6A4F]" />
        <StatCard label="Commandes total" value={data?.nb_commandes_total ?? 0} />
        <StatCard label="Boutiques en attente" value={data?.nb_shops_en_attente ?? 0} color="text-[#B8892A]" />
      </div>
    </div>
  )
}

// ── Onglet Utilisateurs ───────────────────────────────────────────────────────

function UsersTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("")
  const [selected, setSelected] = useState<UserAdmin | null>(null)

  const params = new URLSearchParams()
  if (roleFilter) params.set("role", roleFilter)
  if (activeFilter !== "") params.set("is_active", activeFilter)
  if (search) params.set("search", search)

  const { data: users, isLoading } = useQuery<UserAdmin[]>({
    queryKey: ["admin-users", roleFilter, activeFilter, search],
    queryFn: async () => (await api.get(`/admin/users?${params}`)).data,
  })

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: object }) =>
      api.patch(`/admin/users/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      setSelected(null)
    },
  })

  const ROLE_COLORS: Record<string, string> = {
    client: "bg-tf-gray-soft text-tf-text",
    couturier: "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark",
    vendeur: "bg-[#D8F3DC] text-[#2D6A4F]",
    admin: "bg-tf-black text-white",
  }

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, email, téléphone..." />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text bg-white focus:outline-none focus:border-tf-gold"
        >
          <option value="">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="couturier">Couturiers</option>
          <option value="vendeur">Vendeurs</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={activeFilter}
          onChange={e => setActiveFilter(e.target.value as "" | "true" | "false")}
          className="px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text bg-white focus:outline-none focus:border-tf-gold"
        >
          <option value="">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Suspendus</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-tf-bg border-b border-tf-border">
          {["Utilisateur", "Rôle", "Score", "Commandes", "Statut", "Actions"].map((h, i) => (
            <span key={h} className={`font-sans text-[10px] font-bold text-tf-text-muted uppercase ${i === 0 ? "col-span-4" : i === 5 ? "col-span-2" : "col-span-1"}`}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 bg-tf-gray-soft rounded animate-pulse"/>)}</div>
        ) : !users?.length ? (
          <p className="p-8 text-center font-sans text-[13px] text-tf-text-muted">Aucun utilisateur trouvé</p>
        ) : (
          <div className="divide-y divide-tf-border">
            {users.map(u => (
              <div key={u.id} className="grid grid-cols-12 gap-2 px-5 py-3.5 items-center hover:bg-tf-bg transition-colors">
                <div className="col-span-4 min-w-0">
                  <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{u.full_name}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted truncate">{u.phone ?? u.email ?? "—"}</p>
                </div>
                <div className="col-span-1">
                  <Badge color={ROLE_COLORS[u.role] ?? "bg-tf-gray-soft text-tf-text"}>{u.role}</Badge>
                </div>
                <div className="col-span-1">
                  <span className={`font-sans text-[12px] font-bold tabular-nums ${u.score_confiance < 2.5 ? "text-[#C0392B]" : u.score_confiance >= 4.5 ? "text-[#2D6A4F]" : "text-tf-text"}`}>
                    {u.score_confiance.toFixed(1)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="font-sans text-[12px] tabular-nums text-tf-text">{u.nb_commandes}</span>
                </div>
                <div className="col-span-1">
                  {u.is_active
                    ? <Badge color="bg-[#D8F3DC] text-[#2D6A4F]">Actif</Badge>
                    : <Badge color="bg-[#FFCCCC] text-[#C0392B]">Suspendu</Badge>
                  }
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <button
                    onClick={() => updateUser.mutate({ id: u.id, payload: { is_active: !u.is_active } })}
                    className={`p-1.5 rounded-md border transition-colors ${u.is_active ? "border-[#C0392B] text-[#C0392B] hover:bg-[#FFF0F0]" : "border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#D8F3DC]"}`}
                    title={u.is_active ? "Suspendre" : "Réactiver"}
                  >
                    {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                  </button>
                  <button
                    onClick={() => setSelected(u)}
                    className="p-1.5 rounded-md border border-tf-border text-tf-text-muted hover:bg-tf-gray-soft transition-colors"
                    title="Modifier"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal modification */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-sans text-[16px] font-bold text-tf-text">Modifier — {selected.full_name}</h3>
            <div className="space-y-3">
              <div>
                <label className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Rôle</label>
                <select
                  defaultValue={selected.role}
                  id="role-select"
                  className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text focus:outline-none focus:border-tf-gold"
                >
                  {["client","couturier","vendeur","admin"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Score de confiance (0-5)</label>
                <input
                  id="score-input"
                  type="number"
                  min={0} max={5} step={0.1}
                  defaultValue={selected.score_confiance}
                  className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text focus:outline-none focus:border-tf-gold"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setSelected(null)} className="flex-1 py-2.5 border border-tf-border rounded-lg font-sans text-[13px] font-semibold text-tf-text hover:bg-tf-gray-soft transition-colors">
                Annuler
              </button>
              <button
                onClick={() => {
                  const role = (document.getElementById("role-select") as HTMLSelectElement)?.value
                  const score = parseFloat((document.getElementById("score-input") as HTMLInputElement)?.value)
                  updateUser.mutate({ id: selected.id, payload: { role, score_confiance: score } })
                }}
                className="flex-1 py-2.5 bg-tf-gold text-tf-black rounded-lg font-sans text-[13px] font-bold hover:bg-tf-gold-light transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Onglet Boutiques ──────────────────────────────────────────────────────────

function ShopsTab() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "active">("pending")

  const params = new URLSearchParams()
  if (filter === "pending") params.set("is_validated", "false")
  if (filter === "active")  params.set("is_validated", "true")
  if (search) params.set("search", search)

  const { data: shops, isLoading } = useQuery<ShopAdmin[]>({
    queryKey: ["admin-shops", filter, search],
    queryFn: async () => (await api.get(`/admin/shops?${params}`)).data,
  })

  const validateShop = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/shops/${id}/validate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shops"] }),
  })
  const suspendShop = useMutation({
    mutationFn: (id: number) => api.patch(`/admin/shops/${id}/suspend`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shops"] }),
  })

  const TYPE_LABELS: Record<string, string> = { couturier: "Couturier", boutique: "Boutique", marque: "Marque" }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une boutique..." />
        </div>
        <div className="flex gap-1 bg-tf-gray-soft rounded-lg p-1">
          {[
            { id: "pending", label: "En attente" },
            { id: "active",  label: "Actives" },
            { id: "all",     label: "Toutes" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id as typeof filter)}
              className={`px-4 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors ${filter === f.id ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({length:4}).map((_,i)=><div key={i} className="h-16 bg-tf-gray-soft rounded animate-pulse"/>)}</div>
        ) : !shops?.length ? (
          <div className="p-8 text-center">
            <p className="font-sans text-[14px] font-medium text-tf-text mb-1">
              {filter === "pending" ? "Aucune boutique en attente de validation 🎉" : "Aucune boutique trouvée"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-tf-border">
            {shops.map(s => (
              <div key={s.id} className="px-5 py-4 flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-tf-black flex items-center justify-center shrink-0">
                  <span className="font-serif text-[14px] text-tf-gold">{s.nom[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-sans text-[13px] font-semibold text-tf-text truncate">{s.nom}</p>
                    <Badge color="bg-tf-gray-soft text-tf-text-muted">{TYPE_LABELS[s.type] ?? s.type}</Badge>
                    {!s.is_validated && <Badge color="bg-[#FFF3CD] text-[#B8892A]">En attente</Badge>}
                    {s.is_validated && !s.is_active && <Badge color="bg-[#FFCCCC] text-[#C0392B]">Suspendue</Badge>}
                  </div>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    {s.owner_name} · {s.zone ?? "Zone inconnue"} · {s.nb_commandes} commandes · Score {s.score_moyen.toFixed(1)}/5
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!s.is_validated && (
                    <button
                      onClick={() => validateShop.mutate(s.id)}
                      disabled={validateShop.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2D6A4F] text-white rounded-lg font-sans font-bold text-[11px] hover:bg-[#25593f] transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={12} /> Valider
                    </button>
                  )}
                  {s.is_active && (
                    <button
                      onClick={() => suspendShop.mutate(s.id)}
                      disabled={suspendShop.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-[#C0392B] text-[#C0392B] rounded-lg font-sans font-bold text-[11px] hover:bg-[#FFF0F0] transition-colors disabled:opacity-50"
                    >
                      <XCircle size={12} /> Suspendre
                    </button>
                  )}
                  {!s.is_active && s.is_validated && (
                    <button
                      onClick={() => validateShop.mutate(s.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-tf-gold text-tf-black rounded-lg font-sans font-bold text-[11px] hover:bg-tf-gold-light transition-colors"
                    >
                      <RefreshCw size={12} /> Réactiver
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onglet Modules ────────────────────────────────────────────────────────────

function ModulesTab() {
  const qc = useQueryClient()
  const [shopId, setShopId] = useState("")

  const { data: modules, isLoading } = useQuery<ModuleStatus[]>({
    queryKey: ["admin-modules"],
    queryFn: async () => (await api.get("/modules/")).data,
  })

  const { data: shopModules } = useQuery({
    queryKey: ["admin-shop-modules", shopId],
    queryFn: async () => (await api.get(`/modules/entity/shop/${shopId}`)).data,
    enabled: !!shopId,
  })

  const toggleGlobal = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      api.patch(`/modules/${slug}/global?is_active=${active}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-modules"] }),
  })

  const toggleEntity = useMutation({
    mutationFn: ({ slug, active }: { slug: string; active: boolean }) =>
      api.patch(`/modules/entity/shop/${shopId}/${slug}`, { is_active: active, config: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shop-modules", shopId] }),
  })

  const PHASE_COLOR = ["", "bg-tf-gray-soft text-tf-text", "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark", "bg-[#D8F3DC] text-[#2D6A4F]"]

  const byPhase = [1, 2, 3].map(phase => ({
    phase,
    modules: (modules ?? []).filter(m => m.phase === phase),
  }))

  return (
    <div className="space-y-6">
      {/* Switches globaux */}
      {byPhase.map(({ phase, modules: mods }) => mods.length > 0 && (
        <div key={phase} className="bg-white rounded-xl border border-tf-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-tf-border flex items-center gap-2">
            <Badge color={PHASE_COLOR[phase]}>Phase {phase}</Badge>
            <span className="font-sans text-[13px] font-bold text-tf-text">
              {phase === 1 ? "Modules MVP" : phase === 2 ? "Modules Différenciation" : "Modules Intelligence IA"}
            </span>
          </div>
          <div className="divide-y divide-tf-border">
            {mods.map(m => (
              <div key={m.slug} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-sans text-[13px] font-semibold text-tf-text">{m.name ?? m.slug}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted capitalize">
                    Cible : {m.applies_to}
                  </p>
                </div>
                <button
                  onClick={() => toggleGlobal.mutate({ slug: m.slug, active: !m.is_globally_active })}
                  disabled={toggleGlobal.isPending}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
                    m.is_globally_active ? "bg-[#2D6A4F]" : "bg-tf-border"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    m.is_globally_active ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modules par boutique */}
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h3 className="font-sans text-[14px] font-bold text-tf-text mb-3">Modules par boutique</h3>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            placeholder="ID de la boutique..."
            value={shopId}
            onChange={e => setShopId(e.target.value)}
            className="flex-1 px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text focus:outline-none focus:border-tf-gold"
          />
        </div>
        {shopModules && (
          <div className="divide-y divide-tf-border border border-tf-border rounded-lg overflow-hidden">
            {(shopModules as any[]).map((m: any) => (
              <div key={m.slug} className="px-4 py-3 flex items-center justify-between">
                <p className="font-sans text-[13px] text-tf-text">{m.slug}</p>
                <button
                  onClick={() => toggleEntity.mutate({ slug: m.slug, active: !m.is_active })}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    m.is_active ? "bg-[#2D6A4F]" : "bg-tf-border"
                  }`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                    m.is_active ? "translate-x-4" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onglet Litiges ────────────────────────────────────────────────────────────

function DisputesTab() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<OrderAdmin | null>(null)
  const [note, setNote] = useState("")

  const { data: disputes, isLoading } = useQuery<OrderAdmin[]>({
    queryKey: ["admin-disputes"],
    queryFn: async () => (await api.get("/admin/disputes")).data,
    refetchInterval: 60_000,
  })

  const resolve = useMutation({
    mutationFn: ({ id, verdict }: { id: number; verdict: string }) =>
      api.patch(`/admin/disputes/${id}/resolve`, { verdict, note_admin: note || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-disputes"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
      setSelected(null)
      setNote("")
    },
  })

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">{Array.from({length:3}).map((_,i)=><div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border"/>)}</div>
      ) : !disputes?.length ? (
        <div className="bg-white rounded-xl border border-tf-border p-12 text-center">
          <CheckCircle size={40} className="text-[#2D6A4F] mx-auto mb-3" />
          <p className="font-sans text-[15px] font-bold text-tf-text mb-1">Aucun litige ouvert 🎉</p>
          <p className="font-sans text-[13px] text-tf-text-muted">La plateforme fonctionne sans accroc.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
          <div className="px-5 py-3.5 border-b border-tf-border flex items-center gap-2">
            <AlertTriangle size={15} className="text-[#C0392B]" />
            <span className="font-sans text-[14px] font-bold text-tf-text">{disputes.length} litige{disputes.length > 1 ? "s" : ""} en cours</span>
          </div>
          <div className="divide-y divide-tf-border">
            {disputes.map(d => (
              <div key={d.id} className="px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[13px] font-semibold text-tf-text">{d.reference}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    Client : <strong>{d.client_nom}</strong> · Boutique : <strong>{d.shop_nom}</strong>
                  </p>
                  <p className="font-sans text-[11px] text-tf-text-muted">
                    Ouvert le {new Date(d.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-serif text-[16px] font-bold tabular-nums text-tf-black">{formatPrix(d.montant)}</p>
                  <p className="font-sans text-[10px] text-tf-text-muted">Escrow : {d.escrow_statut}</p>
                </div>
                <button
                  onClick={() => setSelected(d)}
                  className="px-3 py-2 bg-tf-black text-white rounded-lg font-sans font-bold text-[12px] hover:bg-tf-charbon transition-colors shrink-0"
                >
                  Arbitrer
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal arbitrage */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-sans text-[16px] font-bold text-tf-text">Arbitrage — {selected.reference}</h3>
            <div className="bg-tf-gray-soft rounded-lg p-3 space-y-1">
              <p className="font-sans text-[12px] text-tf-text">Client : <strong>{selected.client_nom}</strong></p>
              <p className="font-sans text-[12px] text-tf-text">Boutique : <strong>{selected.shop_nom}</strong></p>
              <p className="font-sans text-[12px] text-tf-text">Montant en jeu : <strong>{formatPrix(selected.montant)}</strong></p>
            </div>
            <div className="space-y-2">
              {[
                { verdict: "rembourser_client", label: "Rembourser le client", sub: "100% retourné au client", color: "border-[#C0392B] hover:bg-[#FFF0F0]", text: "text-[#C0392B]" },
                { verdict: "payer_vendeur",     label: "Payer le vendeur",     sub: "100% libéré au vendeur", color: "border-[#2D6A4F] hover:bg-[#D8F3DC]", text: "text-[#2D6A4F]" },
                { verdict: "partager",          label: "Partage 50/50",        sub: "Remboursement partiel des deux côtés", color: "border-tf-gold hover:bg-[rgba(201,168,76,0.06)]", text: "text-tf-gold-dark" },
              ].map(v => (
                <button
                  key={v.verdict}
                  onClick={() => resolve.mutate({ id: selected.id, verdict: v.verdict })}
                  disabled={resolve.isPending}
                  className={`w-full text-left p-3.5 border rounded-xl transition-colors ${v.color}`}
                >
                  <p className={`font-sans text-[13px] font-bold ${v.text}`}>{v.label}</p>
                  <p className="font-sans text-[11px] text-tf-text-muted mt-0.5">{v.sub}</p>
                </button>
              ))}
            </div>
            <div>
              <label className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Note admin (optionnel)</label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Justification de la décision..."
                rows={2}
                className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text placeholder-tf-text-muted focus:outline-none focus:border-tf-gold resize-none"
              />
            </div>
            <button onClick={() => setSelected(null)} className="w-full py-2.5 border border-tf-border rounded-lg font-sans text-[13px] font-semibold text-tf-text hover:bg-tf-gray-soft transition-colors">
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState("stats")

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  })

  // Protection route admin
  if (_hasHydrated && (!user || user.role !== "admin")) {
    router.replace("/")
    return null
  }

  const TABS = [
    { id: "stats",    label: "Vue d'ensemble", icon: <LayoutDashboard size={14} /> },
    { id: "users",    label: "Utilisateurs",   icon: <Users size={14} />,    badge: undefined },
    { id: "shops",    label: "Boutiques",       icon: <Store size={14} />,    badge: stats?.nb_shops_en_attente },
    { id: "modules",  label: "Modules",         icon: <Puzzle size={14} /> },
    { id: "disputes", label: "Litiges",         icon: <AlertTriangle size={14} />, badge: stats?.nb_litiges_ouverts },
  ]

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-tf-black flex items-center justify-center">
          <Shield size={18} className="text-tf-gold" />
        </div>
        <div>
          <p className="font-sans text-[12px] text-tf-text-muted">Administration</p>
          <h1 className="font-serif text-h1 text-tf-black">TheFriends Shopping</h1>
        </div>
      </div>

      <DashboardTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "stats"    && <StatsTab />}
      {tab === "users"    && <UsersTab />}
      {tab === "shops"    && <ShopsTab />}
      {tab === "modules"  && <ModulesTab />}
      {tab === "disputes" && <DisputesTab />}
    </div>
  )
}
