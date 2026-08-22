"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Product } from "@/types/product";

async function fetchProduct(id: string): Promise<Product> {
  const { data } = await api.get(`/products/${id}`);
  return data;
}

/**
 * Ancienne route à plat, conservée pour les liens/favoris existants.
 * Redirige vers la fiche produit imbriquée sous sa boutique.
 */
export default function LegacyProductRedirect() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id),
  });

  useEffect(() => {
    if (product) {
      router.replace(`/boutique/${product.shop_id}/produits/${id}`);
    }
  }, [product, id, router]);

  return null;
}
