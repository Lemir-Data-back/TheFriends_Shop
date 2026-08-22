export type ProductCategorie = "homme" | "femme" | "enfant";
export type ProductOccasion = "casual" | "bureau" | "ceremonie" | "traditionnel" | "sport" | "mariage";
export type StockStatut = "rupture" | "stock_faible";

export interface ProductImage {
  id: number;
  url_cloudinary: string;
  ordre: number;
  angle?: string;
}

export interface Product {
  id: number;
  shop_id: number;
  titre: string;
  description?: string;
  categorie: ProductCategorie;
  occasion?: ProductOccasion;
  style?: string;
  tissu?: string;
  prix: number;
  prix_promo?: number;
  stock?: Record<string, Record<string, number>>;
  tailles_guide?: Record<string, Record<string, string>>;
  tags?: string[];
  is_sur_mesure: boolean;
  prix_plancher_negociation?: number;
  mensurations_ref?: Record<string, string>;
  seuil_stock_faible?: number;
  stock_total?: number | null;
  stock_statut?: StockStatut | null;
  actif: boolean;
  nb_vues: number;
  nb_likes: number;
  nb_commandes: number;
  images: ProductImage[];
  created_at: string;
}

export interface ProductListItem {
  id: number;
  shop_id: number;
  titre: string;
  categorie: ProductCategorie;
  occasion?: ProductOccasion;
  tissu?: string;
  prix: number;
  prix_promo?: number;
  tags?: string[];
  is_sur_mesure: boolean;
  nb_likes: number;
  stock_statut?: StockStatut | null;
  images: ProductImage[];
}

export interface ProductListResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  items: ProductListItem[];
}

export interface SizeRecommendation {
  taille_recommandee?: string;
  message: string;
  indice_confiance: number;
  details?: string;
}

export interface ProductFilters {
  search?: string;
  categorie?: ProductCategorie;
  occasion?: ProductOccasion;
  tissu?: string;
  prix_min?: number;
  prix_max?: number;
  is_sur_mesure?: boolean;
  page?: number;
  limit?: number;
}
