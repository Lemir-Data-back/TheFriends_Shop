"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Badge } from "../_components/shared"
import type { ModuleStatus, EntityModuleStatus } from "../_components/types"

const PHASE_COLOR = ["", "bg-tf-gray-soft text-tf-text", "bg-[rgba(201,168,76,0.15)] text-tf-gold-dark", "bg-tf-success-bg text-tf-success"]

export default function ModulesPage() {
  const qc = useQueryClient()
  const [shopId, setShopId] = useState("")

  const { data: modules } = useQuery<ModuleStatus[]>({
    queryKey: ["admin-modules"],
    queryFn:  async () => (await api.get("/modules/")).data,
  })

  const { data: shopModules } = useQuery({
    queryKey: ["admin-shop-modules", shopId],
    queryFn:  async () => (await api.get(`/modules/entity/shop/${shopId}`)).data,
    enabled:  !!shopId,
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
                  <p className="font-sans text-[11px] text-tf-text-muted capitalize">Cible : {m.applies_to}</p>
                </div>
                <button
                  onClick={() => toggleGlobal.mutate({ slug: m.slug, active: !m.is_globally_active })}
                  disabled={toggleGlobal.isPending}
                  role="switch"
                  aria-checked={m.is_globally_active}
                  aria-label={`Activer le module ${m.name ?? m.slug}`}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${m.is_globally_active ? "bg-tf-success" : "bg-tf-border"}`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${m.is_globally_active ? "translate-x-6" : "translate-x-1"}`} />
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
            {(shopModules as EntityModuleStatus[]).map(m => (
              <div key={m.slug} className="px-4 py-3 flex items-center justify-between">
                <p className="font-sans text-[13px] text-tf-text">{m.slug}</p>
                <button
                  onClick={() => toggleEntity.mutate({ slug: m.slug, active: !m.is_active })}
                  role="switch"
                  aria-checked={m.is_active}
                  aria-label={`Activer le module ${m.slug} pour cette boutique`}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${m.is_active ? "bg-tf-success" : "bg-tf-border"}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${m.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
