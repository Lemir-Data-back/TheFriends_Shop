"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"

export interface PaymentPlan {
  id: number
  shop_id: number
  nom: string
  nb_tranches: number
  acompte_percent: number
  intervalle_jours: number
  montant_min: number
  montant_max: number | null
  frais_percent: number
  is_active: boolean
}

export interface Tranche {
  id: number
  numero: number
  montant: number
  echeance: string
  paye_le: string | null
  statut: "en_attente" | "paye" | "en_retard" | "annule"
}

export interface OrderInstallment {
  id: number
  order_id: number
  payment_plan_id: number
  montant_total: number
  montant_paye: number
  reste_a_payer: number
  progression_percent: number
  statut: "en_cours" | "complete" | "defaut" | "annule"
  tranches: Tranche[]
}

/** Plans de paiement disponibles pour une boutique (public) */
export function usePaymentPlans(shopId: number) {
  return useQuery<PaymentPlan[]>({
    queryKey: ["payment-plans", shopId],
    queryFn: async () => {
      const { data } = await api.get<PaymentPlan[]>(`/installments/plans/shop/${shopId}`)
      return data
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Plans de ma boutique (dashboard vendeur) */
export function useMyPaymentPlans(shopId: number) {
  return useQuery<PaymentPlan[]>({
    queryKey: ["my-payment-plans", shopId],
    queryFn: async () => {
      const { data } = await api.get<PaymentPlan[]>(`/installments/plans/shop/${shopId}`)
      return data
    },
  })
}

export type PaymentPlanCreate = Omit<PaymentPlan, "id" | "shop_id" | "is_active">

/** Crée un plan de paiement (dashboard vendeur PAP) */
export function useCreatePaymentPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: PaymentPlanCreate) =>
      api.post<PaymentPlan>("/installments/plans", payload).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-payment-plans", data.shop_id] })
    },
  })
}

/** Supprime (désactive) un plan */
export function useDeletePaymentPlan(shopId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (planId: number) => api.delete(`/installments/plans/${planId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-payment-plans", shopId] })
    },
  })
}

/** Initialise un plan de paiement échelonné pour une commande (client) */
export function useInitInstallment() {
  return useMutation({
    mutationFn: ({ orderId, planId }: { orderId: number; planId: number }) =>
      api
        .post<OrderInstallment>("/installments/orders/init", {
          order_id: orderId,
          payment_plan_id: planId,
        })
        .then((r) => r.data),
  })
}

/** Suivi du plan de paiement d'une commande */
export function useOrderInstallment(orderId: number) {
  return useQuery<OrderInstallment>({
    queryKey: ["order-installment", orderId],
    queryFn: async () => {
      const { data } = await api.get<OrderInstallment>(`/installments/orders/${orderId}`)
      return data
    },
    refetchInterval: (data) =>
      data?.statut === "en_cours" ? 30_000 : false,
  })
}

/** Formate un montant en FCFA */
export function formatFCFA(amount: number): string {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
  }).format(amount)
}
