"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { TokenResponse, UserRole } from "@/types/auth";

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: "client", label: "Acheteur", description: "Je cherche et achète des vêtements" },
  { value: "couturier", label: "Couturier", description: "Je crée des pièces sur mesure" },
  { value: "vendeur", label: "Boutique / Marque", description: "Je vends du prêt-à-porter" },
];

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<UserRole>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email && !phone) {
      setError("Renseigne au moins un email ou un numéro de téléphone");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post<TokenResponse>("/auth/register", {
        full_name: fullName,
        email: email || undefined,
        phone: phone || undefined,
        password,
        role,
      });
      setAuth(data.user, data.access_token, data.refresh_token);
      router.push("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Erreur lors de la création du compte";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-tf-bg flex flex-col items-center justify-center px-4 py-8">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="font-brand text-[2rem] text-tf-black leading-none">TheFriends</h1>
        <p className="font-sans text-[11px] tracking-[0.5em] text-tf-gold-dark uppercase mt-1">
          SHOPPING
        </p>
      </div>

      <div className="w-full max-w-sm bg-white rounded-xl border border-tf-border p-8">
        <h2 className="font-sans text-h3 font-semibold text-tf-text mb-1">Créer un compte</h2>
        <p className="font-sans text-[13px] text-tf-text-muted mb-6">
          Étape {step} sur 2
        </p>

        {/* Étape 1 : Choix du rôle */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="font-sans text-[13px] font-medium text-tf-text mb-3">
              Tu es...
            </p>
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-150 ${
                  role === r.value
                    ? "border-tf-gold bg-[rgba(201,168,76,0.06)]"
                    : "border-tf-border hover:border-tf-text"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                      role === r.value ? "border-tf-gold bg-tf-gold" : "border-tf-border"
                    }`}
                  />
                  <span>
                    <span className="block font-sans text-[14px] font-semibold text-tf-text">
                      {r.label}
                    </span>
                    <span className="block font-sans text-micro text-tf-text-muted mt-0.5">
                      {r.description}
                    </span>
                  </span>
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => setStep(2)}
              className="btn-primary w-full mt-2"
            >
              Continuer
            </button>
          </div>
        )}

        {/* Étape 2 : Informations */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-tf-error-bg border border-tf-error rounded-md">
                <p className="font-sans text-[13px] text-tf-error">{error}</p>
              </div>
            )}

            <div>
              <label className="input-label">
                Nom complet <span className="text-tf-gold">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Awa Koné"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="input-label">Email</label>
              <input
                type="email"
                className="input-field"
                placeholder="awa@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">Téléphone</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+225 07 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">
                Mot de passe <span className="text-tf-gold">*</span>
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="8 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-outline flex-1"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center font-sans text-[13px] text-tf-text-muted">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-tf-gold-dark font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
