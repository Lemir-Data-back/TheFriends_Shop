import { create } from "zustand";

interface CartStore {
  isOpen: boolean;
  nbArticles: number;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setNbArticles: (n: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  isOpen: false,
  nbArticles: 0,
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  setNbArticles: (n) => set({ nbArticles: n }),
}));
