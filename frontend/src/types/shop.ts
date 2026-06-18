export type ShopType = "couturier" | "boutique" | "marque";

export interface Shop {
  id: number;
  nom: string;
  type: ShopType;
  description?: string;
  photo_url?: string;
  zone?: string;
  specialites?: string[];
  badges?: Record<string, boolean>;
  score_delais: number;
  score_qualite: number;
  nb_avis: number;
}
