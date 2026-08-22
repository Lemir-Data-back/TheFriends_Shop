"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { TokenResponse } from "@/types/auth";

const DASHBOARD_LINKS: Record<string, string> = {
  client:    "/profil",
  couturier: "/dashboard/couturier",
  vendeur:   "/dashboard/vendeur",
  admin:     "/admin",
};

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, user } = useAuthStore();

  // Redirige si déjà connecté après réhydratation Zustand
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user) {
      router.replace(DASHBOARD_LINKS[user.role] ?? "/profil");
    }
  }, [_hasHydrated, isAuthenticated, user, router]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post<TokenResponse>("/auth/login", {
        identifier,
        password,
      });
      setAuth(data.user, data.access_token, data.refresh_token);
      const redirects: Record<string, string> = {
        client:    "/profil",
        couturier: "/dashboard/couturier",
        vendeur:   "/dashboard/vendeur",
        admin:     "/admin",
      };
      router.push(redirects[data.user.role] ?? "/profil");
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Identifiants incorrects."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-tf-border p-8">
      <h2 className="font-sans text-h3 font-semibold text-tf-text mb-6">Connexion</h2>

      {error && (
        <div className="mb-4 p-3 bg-tf-error-bg border border-tf-error rounded-md">
          <p className="font-sans text-[13px] text-tf-error">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-identifier" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
            Téléphone ou email
          </label>
          <input
            id="login-identifier"
            type="text"
            autoComplete="username"
            className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
            placeholder="+225 07 00 00 00 00 ou email..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />
        </div>

        <div>
          <label htmlFor="login-password" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="w-full px-3 py-2.5 pr-10 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-tf-text-muted hover:text-tf-text transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full mt-2"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-6 text-center font-sans text-[13px] text-tf-text-muted">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="text-tf-gold-dark font-medium hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
