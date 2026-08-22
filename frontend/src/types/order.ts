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

export type NegociationAuteur = "client" | "shop";
export type NegociationAction = "proposer" | "contre" | "accepter" | "refuser";

export interface NegociationEntry {
  auteur: NegociationAuteur;
  action: NegociationAction;
  prix: number | null;
  message: string | null;
  created_at: string;
}

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

export interface OrderClientInfo {
  id: number;
  full_name: string;
  phone: string | null;
  mensurations: Record<string, number> | null;
  score_confiance: number;
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
  client: OrderClientInfo | null;
  negociations: NegociationEntry[];
  delai_confection_jours: number | null;
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
  en_attente: "bg-tf-warning-bg text-tf-warning border-tf-warning",
  acceptee: "bg-tf-info-bg text-tf-info border-tf-info",
  en_cours: "bg-tf-info-bg text-tf-info border-tf-info",
  expedie: "bg-tf-info-bg text-tf-info border-tf-info",
  livre: "bg-tf-warning-bg text-tf-warning border-tf-warning",
  confirme: "bg-tf-success-bg text-tf-success border-tf-success",
  litige: "bg-tf-error-bg text-tf-error border-tf-error",
  annule: "bg-tf-gray-soft text-tf-text-muted border-tf-border",
  rembourse: "bg-tf-gray-soft text-tf-text-muted border-tf-border",
};
