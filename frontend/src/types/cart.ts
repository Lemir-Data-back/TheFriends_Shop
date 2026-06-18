export interface ProductSnapshot {
  id: number;
  titre: string;
  shop_id: number;
  shop_nom: string;
  cover_url: string | null;
  is_sur_mesure: boolean;
}

export interface CartItem {
  id: number;
  product_id: number;
  product: ProductSnapshot;
  taille: string | null;
  couleur: string | null;
  quantite: number;
  prix_unitaire: number;
  prix_promo: number | null;
  prix_effectif: number;
  sous_total: number;
  created_at: string;
}

export interface CartVendeurGroup {
  shop_id: number;
  shop_nom: string;
  items: CartItem[];
  sous_total_boutique: number;
}

export interface Cart {
  id: number;
  nb_articles: number;
  total: number;
  groupes: CartVendeurGroup[];
  updated_at: string;
}

export interface CartItemAdd {
  product_id: number;
  taille?: string;
  couleur?: string;
  quantite?: number;
}
