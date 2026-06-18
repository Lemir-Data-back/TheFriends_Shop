"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone) {
      setError("Le numéro de téléphone est obligatoire");
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
      const redirects: Record<string, string> = {
        client:    "/dashboard",
        couturier: "/dashboard/couturier",
        vendeur:   "/dashboard/vendeur",
        admin:     "/admin",
      };
      router.push(redirects[data.user.role] ?? "/dashboard");
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

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 px-6 bg-transparent text-tf-text border border-tf-border rounded-md font-sans font-medium text-btn hover:border-tf-text transition-colors"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 py-3 px-6 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-btn hover:bg-tf-gold-light transition-colors"
              >
                Continuer
              </button>
            </div>
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
              <label className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Nom complet <span className="text-tf-gold">*</span>
              </label>
              <input
                type="text"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="Awa Koné"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Téléphone <span className="text-tf-gold">*</span>
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="+225 07 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="awa@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Mot de passe <span className="text-tf-gold">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2.5 pr-10 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tf-text-muted hover:text-tf-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-6 bg-transparent text-tf-text border border-tf-border rounded-md font-sans font-medium text-btn hover:border-tf-text transition-colors"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-6 bg-tf-gold text-tf-black rounded-md font-sans font-bold text-btn hover:bg-tf-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}

        <p className="mt-6 text-center font-sans text-[13px] text-tf-text-muted">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="text-tf-gold-dark font-medium hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
  );
}
