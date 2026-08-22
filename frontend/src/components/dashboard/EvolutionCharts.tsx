"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatPrix } from "@/lib/utils"

export interface EvolutionPoint {
  mois: string
  label: string
  revenu: number
  nb_commandes: number
}

const axisTick = { fontSize: 11, fill: "var(--tf-text-muted)" }
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid var(--tf-border)" }

export function EvolutionCharts({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Évolution du chiffre d&apos;affaires</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tf-border)" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "var(--tf-border)" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(value) => formatPrix(Number(value))} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="revenu" stroke="var(--tf-gold)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--tf-gold)" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Évolution des commandes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--tf-border)" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "var(--tf-border)" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="nb_commandes" name="Commandes" fill="var(--tf-black)" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
