import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        // On stocke dans Zustand (persist l'écrit dans localStorage sous "tf-auth")
        // ET on écrit la clé directe lue par api.ts
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "tf-auth",
      // Après la réhydratation depuis localStorage, on resynchronise
      // la clé "access_token" utilisée par api.ts
      onRehydrateStorage: () => (state) => {
        // Appelé après réhydratation, que state existe ou non
        if (state) {
          // Resynchronise la clé directe lue par api.ts
          if (state.accessToken) {
            localStorage.setItem("access_token",  state.accessToken);
            localStorage.setItem("refresh_token", state.refreshToken ?? "");
          }
          state.setHasHydrated(true);
        } else {
          // Aucun état persisté (nouvel utilisateur) — débloquer la navbar quand même
          useAuthStore.setState({ _hasHydrated: true });
        }
      },
    }
  )
);
