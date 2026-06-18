"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { TokenResponse } from "@/types/auth";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
      router.push("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Identifiants incorrects";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-tf-bg flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-brand text-[2rem] text-tf-black leading-none">TheFriends</h1>
        <p className="font-sans text-[11px] tracking-[0.5em] text-tf-gold-dark uppercase mt-1">
          SHOPPING
        </p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl border border-tf-border p-8">
        <h2 className="font-sans text-h3 font-semibold text-tf-text mb-6">Connexion</h2>

        {error && (
          <div className="mb-4 p-3 bg-tf-error-bg border border-tf-error rounded-md">
            <p className="font-sans text-[13px] text-tf-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">
              Email ou téléphone
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="email@exemple.com ou +22507..."
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">
              Mot de passe
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center font-sans text-[13px] text-tf-text-muted">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-tf-gold-dark font-medium hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>

      <p className="mt-6 font-sans text-micro text-tf-text-muted">
        Ta mode, ton style.
      </p>
    </div>
  );
}
