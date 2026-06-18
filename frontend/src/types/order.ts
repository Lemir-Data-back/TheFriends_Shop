export type OrderStatut =
  | "en_attente"
  | "acceptee"
  | "en_cours"
  | "expedie"
  | "livre"
  | "confirme"
  | "litige"
  | "annule"
  | "rembourse";

export type EscrowStatut = "en_attente" | "bloque" | "libere" | "rembourse" | "litige";
export type OrderType = "pret_a_porter" | "sur_mesure";

export interface OrderItem {
  product_id: number;
  titre: string;
  taille: string | null;
  couleur: string | null;
  quantite: number;
  prix: number;
}

export interface AdresseLivraison {
  nom: string;
  telephone: string;
  quartier: string;
  commune: string;
  ville: string;
  details?: string;
}

export interface Order {
  id: number;
  reference: string;
  type: OrderType;
  statut: OrderStatut;
  escrow_statut: EscrowStatut;
  montant: number;
  penalite: number;
  items: OrderItem[];
  adresse_livraison: AdresseLivraison | null;
  date_livraison_promise: string | null;
  date_livraison_reelle: string | null;
  note_client: string | null;
  note_vendeur: string | null;
  shop_id: number;
  client_id: number;
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export const STATUT_LABELS: Record<OrderStatut, string> = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  en_cours: "En cours",
  expedie: "Expédiée",
  livre: "Livrée",
  confirme: "Confirmée",
  litige: "Litige",
  annule: "Annulée",
  rembourse: "Remboursée",
};

export const STATUT_COLORS: Record<OrderStatut, string> = {
  en_attente: "bg-yellow-50 text-yellow-700 border-yellow-200",
  acceptee: "bg-blue-50 text-blue-700 border-blue-200",
  en_cours: "bg-blue-50 text-blue-700 border-blue-200",
  expedie: "bg-purple-50 text-purple-700 border-purple-200",
  livre: "bg-orange-50 text-orange-700 border-orange-200",
  confirme: "bg-green-50 text-green-700 border-green-200",
  litige: "bg-red-50 text-red-700 border-red-200",
  annule: "bg-gray-50 text-gray-500 border-gray-200",
  rembourse: "bg-gray-50 text-gray-500 border-gray-200",
};
