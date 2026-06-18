import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrix(prix: number): string {
  return new Intl.NumberFormat("fr-FR").format(prix) + " FCFA";
}

export function getRemisePercent(prix: number, prixPromo: number): number {
  return Math.round(((prix - prixPromo) / prix) * 100);
}
