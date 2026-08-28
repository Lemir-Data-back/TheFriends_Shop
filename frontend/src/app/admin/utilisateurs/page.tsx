"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { UserCheck, UserX, ChevronDown } from "lucide-react"
import { api } from "@/lib/api"
import { Badge, SearchBar } from "../_components/shared"
import type { UserAdmin } from "../_components/types"

const ROLE_COLORS: Record<string, string> = {
  client:    "bg-tf-gray-soft text-tf-text",
  couturier: "bg-tf-gold/[0.15] text-tf-gold-dark",
  vendeur:   "bg-tf-success-bg text-tf-success",
  admin:     "bg-tf-black text-white",
}

const ROLE_PILLS = [
  { value: "",          label: "Tous" },
  { value: "client",    label: "Clients" },
  { value: "couturier", label: "Couturiers" },
  { value: "vendeur",   label: "Vendeurs" },
  { value: "admin",     label: "Admins" },
]

const STATUS_PILLS = [
  { value: "",      label: "Tous statuts" },
  { value: "true",  label: "Actifs" },
  { value: "false", label: "Suspendus" },
]

export default function UtilisateursPage() {
  const qc = useQueryClient()
  const [search, setSearch]           = useState("")
  const [roleFilter, setRoleFilter]   = useState("")
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("")
  const [selected, setSelected]       = useState<UserAdmin | null>(null)

  const params = new URLSearchParams()
  if (roleFilter)       params.set("role",      roleFilter)
  if (activeFilter !== "") params.set("is_active", activeFilter)
  if (search)           params.set("search",    search)

  const { data: users, isLoading } = useQuery<UserAdmin[]>({
    queryKey: ["admin-users", roleFilter, activeFilter, search],
    queryFn:  async () => (await api.get(`/admin/users?${params}`)).data,
  })

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: object }) =>
      api.patch(`/admin/users/${id}`, payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      setSelected(null)
    },
  })

  return (
    <div className="space-y-4">
      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher par nom, email, téléphone..." />
        </div>
        <div role="radiogroup" aria-label="Filtrer par rôle" className="flex gap-1 bg-tf-gray-soft rounded-lg p-1 shrink-0">
          {ROLE_PILLS.map(r => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              role="radio"
              aria-checked={roleFilter === r.value}
              className={`px-3 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${roleFilter === r.value ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div role="radiogroup" aria-label="Filtrer par statut" className="flex gap-1 bg-tf-gray-soft rounded-lg p-1 shrink-0">
          {STATUS_PILLS.map(s => (
            <button
              key={s.value}
              onClick={() => setActiveFilter(s.value as "" | "true" | "false")}
              role="radio"
              aria-checked={activeFilter === s.value}
              className={`px-3 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${activeFilter === s.value ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-tf-border overflow-hidden">
        <div className="overflow-x-auto">
        <div className="min-w-[720px]">
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-tf-bg border-b border-tf-border">
          {["Utilisateur", "Rôle", "Score", "Commandes", "Statut", "Actions"].map((h, i) => (
            <span key={h} className={`font-sans text-[10px] font-bold text-tf-text-muted uppercase ${i === 0 ? "col-span-4" : i === 5 ? "col-span-2" : "col-span-1"}`}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-tf-gray-soft rounded animate-pulse" />)}</div>
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
                  <span className={`font-mono text-[12px] font-bold tabular-nums ${u.score_confiance < 2.5 ? "text-tf-error" : u.score_confiance >= 4.5 ? "text-tf-success" : "text-tf-text"}`}>
                    {u.score_confiance.toFixed(1)}
                  </span>
                </div>
                <div className="col-span-1">
                  <span className="font-mono text-[12px] tabular-nums text-tf-text">{u.nb_commandes}</span>
                </div>
                <div className="col-span-1">
                  {u.is_active
                    ? <Badge color="bg-tf-success-bg text-tf-success">Actif</Badge>
                    : <Badge color="bg-tf-error-bg text-tf-error">Suspendu</Badge>
                  }
                </div>
                <div className="col-span-2 flex gap-1.5">
                  <button
                    onClick={() => updateUser.mutate({ id: u.id, payload: { is_active: !u.is_active } })}
                    className={`p-1.5 rounded-md border transition-colors ${u.is_active ? "border-tf-error text-tf-error hover:bg-tf-error-bg" : "border-tf-success text-tf-success hover:bg-tf-success-bg"}`}
                    title={u.is_active ? "Suspendre" : "Réactiver"}
                    aria-label={u.is_active ? "Suspendre cet utilisateur" : "Réactiver cet utilisateur"}
                  >
                    {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                  </button>
                  <button
                    onClick={() => setSelected(u)}
                    className="p-1.5 rounded-md border border-tf-border text-tf-text-muted hover:bg-tf-gray-soft transition-colors"
                    title="Modifier"
                    aria-label="Modifier cet utilisateur"
                  >
                    <ChevronDown size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>

      {/* Modal modification */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="modifier-user-title" className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 id="modifier-user-title" className="font-sans text-[16px] font-bold text-tf-text">Modifier — {selected.full_name}</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="role-select" className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Rôle</label>
                <select
                  defaultValue={selected.role}
                  id="role-select"
                  className="w-full px-3 py-2 border border-tf-border rounded-lg font-sans text-[13px] text-tf-text focus:outline-none focus:border-tf-gold"
                >
                  {["client", "couturier", "vendeur", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="score-input" className="font-sans text-[11px] font-bold text-tf-text-muted uppercase tracking-wider block mb-1.5">Score de confiance (0-5)</label>
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
                  const role  = (document.getElementById("role-select") as HTMLSelectElement)?.value
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
