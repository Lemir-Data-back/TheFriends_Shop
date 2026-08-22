"use client"

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { formatPrix } from "@/lib/utils"

export interface EvolutionPoint {
  mois: string
  label: string
  revenu: number
  nb_commandes: number
}

const axisTick = { fontSize: 11, fill: "#7A766F" }
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #E8E4DC" }

export function EvolutionCharts({ data }: { data: EvolutionPoint[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Évolution du chiffre d&apos;affaires</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "#E8E4DC" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip formatter={(value) => formatPrix(Number(value))} contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="revenu" stroke="#C9A84C" strokeWidth={2.5} dot={{ r: 3, fill: "#C9A84C" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-tf-border p-5">
        <h3 className="font-sans text-[14px] font-bold text-tf-text mb-4">Évolution des commandes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" vertical={false} />
            <XAxis dataKey="label" tick={axisTick} axisLine={{ stroke: "#E8E4DC" }} tickLine={false} />
            <YAxis tick={axisTick} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="nb_commandes" name="Commandes" fill="#111111" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
