"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"
import { api } from "@/lib/api"
import { formatPrix } from "@/lib/utils"
import { StatCard, ChartCard, fmtDate, fmtCaShort, CHART_GOLD, CHART_SUCCESS, CHART_BLUE, CHART_GRAY } from "./_components/shared"
import type { PlatformStats, StatsSeries, DailyPoint } from "./_components/types"

const PERIOD_LABELS: Record<string, string> = { "7d": "7 jours", "30d": "30 jours", "90d": "90 jours" }

function tickInterval(arr?: DailyPoint[]) {
  return Math.max(1, Math.floor((arr?.length ?? 1) / 4))
}

export default function AdminPage() {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d")

  const { data, isLoading } = useQuery<PlatformStats>({
    queryKey: ["admin-stats"],
    queryFn:  async () => (await api.get("/admin/stats")).data,
    refetchInterval: 30_000,
  })

  const { data: series } = useQuery<StatsSeries>({
    queryKey: ["admin-stats-series", period],
    queryFn:  async () => (await api.get(`/admin/stats/series?period=${period}`)).data,
    refetchInterval: 60_000,
  })

  const roleData = [
    { name: "Clients",    value: data?.nb_users_clients    ?? 0, color: CHART_GRAY    },
    { name: "Couturiers", value: data?.nb_users_couturiers ?? 0, color: CHART_GOLD    },
    { name: "Vendeurs",   value: data?.nb_users_vendeurs   ?? 0, color: CHART_SUCCESS },
  ]

  if (isLoading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-tf-border" />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">

      {/* Filtre période */}
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-[14px] font-bold text-tf-text">Vue d&apos;ensemble</h2>
        <div className="flex gap-1 bg-tf-gray-soft rounded-lg p-1">
          {(["7d", "30d", "90d"] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              aria-pressed={period === p}
              className={`px-3 py-1.5 rounded-md font-sans text-[12px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold ${
                period === p ? "bg-white text-tf-black shadow-sm" : "text-tf-text-muted hover:text-tf-text"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Hero CA + alertes rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-tf-black rounded-xl p-6 text-white">
          <p className="font-sans text-[12px] text-white/50 uppercase tracking-wider mb-1">CA total plateforme</p>
          <p className="font-mono text-[36px] font-bold tabular-nums text-tf-gold">
            {formatPrix(data?.ca_total ?? 0)}
          </p>
          <p className="font-sans text-[13px] text-white/60 mt-1">
            Ce mois :&nbsp;<span className="text-white font-semibold">{formatPrix(data?.ca_mois ?? 0)}</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Litiges ouverts"   value={data?.nb_litiges_ouverts    ?? 0} color={data?.nb_litiges_ouverts    ? "text-tf-error"   : "text-tf-black"} />
          <StatCard label="Cmds en cours"     value={data?.nb_commandes_en_cours ?? 0} />
          <StatCard label="Boutiques attente" value={data?.nb_shops_en_attente   ?? 0} color="text-tf-warning" />
          <StatCard label="Nouveaux users 7j" value={data?.nb_nouveaux_users_7j  ?? 0} color="text-tf-success" />
        </div>
      </div>

      {/* Chart CA + Donut rôles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="Chiffre d'affaires" period={PERIOD_LABELS[period]} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={series?.ca ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_GOLD} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_GOLD} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--tf-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_GRAY }} tickFormatter={fmtDate} interval={tickInterval(series?.ca)} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART_GRAY }} tickFormatter={fmtCaShort} tickLine={false} axisLine={false} width={36} />
              <Tooltip
                formatter={(v) => [typeof v === "number" ? formatPrix(v) : "—", "CA"]}
                labelFormatter={(l) => fmtDate(String(l))}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--tf-border)", boxShadow: "0 4px 12px rgba(0,0,0,.08)" }}
              />
              <Area type="monotone" dataKey="value" stroke={CHART_GOLD} strokeWidth={2} fill="url(#goldGrad)" dot={false} activeDot={{ r: 4, fill: CHART_GOLD, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Répartition rôles */}
        <div className="bg-white border border-tf-border rounded-xl p-5 flex flex-col">
          <p className="font-sans text-[13px] font-bold text-tf-text mb-3">Répartition utilisateurs</p>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {roleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v) => [v ?? 0, ""]} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--tf-border)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-1">
            {roleData.map(r => (
              <div key={r.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                  <span className="font-sans text-[12px] text-tf-text-muted">{r.name}</span>
                </div>
                <span className="font-mono text-[12px] font-bold tabular-nums text-tf-text">{r.value}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1.5 border-t border-tf-border">
              <span className="font-sans text-[11px] text-tf-text-muted">Total</span>
              <span className="font-mono text-[12px] font-bold tabular-nums text-tf-text">{data?.nb_users_total ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Nouveaux utilisateurs + Commandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="Nouveaux utilisateurs" period={PERIOD_LABELS[period]}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={series?.nouveaux_users ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={CHART_SUCCESS} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={CHART_SUCCESS} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--tf-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_GRAY }} tickFormatter={fmtDate} interval={tickInterval(series?.nouveaux_users)} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART_GRAY }} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
              <Tooltip formatter={(v) => [v ?? 0, "utilisateurs"]} labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--tf-border)" }} />
              <Area type="monotone" dataKey="value" stroke={CHART_SUCCESS} strokeWidth={2} fill="url(#greenGrad)" dot={false} activeDot={{ r: 4, fill: CHART_SUCCESS, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Commandes par jour" period={PERIOD_LABELS[period]}>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={series?.commandes ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 4 }} barSize={period === "7d" ? 22 : period === "30d" ? 8 : 4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--tf-border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: CHART_GRAY }} tickFormatter={fmtDate} interval={tickInterval(series?.commandes)} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: CHART_GRAY }} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
              <Tooltip formatter={(v) => [v ?? 0, "commandes"]} labelFormatter={(l) => fmtDate(String(l))} contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--tf-border)" }} />
              <Bar dataKey="value" fill={CHART_BLUE} fillOpacity={0.85} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Agrégats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Utilisateurs total"  value={data?.nb_users_total    ?? 0} />
        <StatCard label="Boutiques validées"  value={data?.nb_shops_validees ?? 0} color="text-tf-success" />
        <StatCard label="Commandes total"     value={data?.nb_commandes_total ?? 0} />
        <StatCard label="Boutiques total"     value={data?.nb_shops_total    ?? 0} />
      </div>
    </div>
  )
}
