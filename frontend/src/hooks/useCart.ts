"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { Cart, CartItemAdd } from "@/types/cart";
import { useCartStore } from "@/store/cart";

export function useCart() {
  const queryClient = useQueryClient();
  const { setNbArticles } = useCartStore();

  const { data: cart, isLoading } = useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get("/cart");
      return data;
    },
    staleTime: 30_000,
  });

  useEffect(() => {
    if (cart) setNbArticles(cart.nb_articles);
  }, [cart, setNbArticles]);

  const addItem = useMutation({
    mutationFn: (payload: CartItemAdd) => api.post("/cart/items", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const updateItem = useMutation({
    mutationFn: ({ id, quantite }: { id: number; quantite: number }) =>
      api.patch(`/cart/items/${id}`, { quantite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: (id: number) => api.delete(`/cart/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: () => api.delete("/cart"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  return { cart, isLoading, addItem, updateItem, removeItem, clearCart };
}
