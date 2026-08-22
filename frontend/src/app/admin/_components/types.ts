export interface PlatformStats {
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

export interface UserAdmin {
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

export interface ShopAdmin {
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
  badges: Record<string, boolean> | null
  created_at: string
}

export interface OrderAdmin {
  id: number
  reference: string
  client_nom: string
  shop_nom: string
  montant: number
  statut: string
  escrow_statut: string
  created_at: string
}

export interface ModuleStatus {
  slug: string
  name: string
  is_globally_active: boolean
  phase: number
  applies_to: string
}

export interface EntityModuleStatus {
  slug: string
  is_active: boolean
  config: Record<string, unknown>
}

export interface DailyPoint { date: string; value: number }
export interface StatsSeries {
  ca: DailyPoint[]
  nouveaux_users: DailyPoint[]
  commandes: DailyPoint[]
}

export interface LogEntry {
  id: number
  action: string
  ip_address: string | null
  details: Record<string, unknown> | null
  created_at: string
  user_id: number | null
  user_name: string | null
  user_role: string | null
}
