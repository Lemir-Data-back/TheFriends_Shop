"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
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
  const [shopNom, setShopNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSeller = role === "couturier" || role === "vendeur";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!phone) {
      setError("Le numéro de téléphone est obligatoire");
      return;
    }
    if (isSeller && !shopNom.trim()) {
      setError(role === "couturier" ? "Le nom de l'atelier est obligatoire" : "Le nom de la boutique est obligatoire");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
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
        shop_nom: isSeller ? shopNom.trim() : undefined,
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
      setError(getApiErrorMessage(err, "Erreur lors de la création du compte. Réessaie."));
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
                aria-pressed={role === r.value}
                className={`w-full text-left p-4 rounded-lg border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tf-gold focus-visible:ring-offset-2 ${
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
                className="btn-outline flex-1"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-gold flex-1"
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

            {isSeller && (
              <div>
                <label htmlFor="register-shop-nom" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                  {role === "couturier" ? "Nom de l'atelier" : "Nom de la boutique"} <span className="text-tf-gold">*</span>
                </label>
                <input
                  id="register-shop-nom"
                  type="text"
                  className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                  placeholder={role === "couturier" ? "Atelier Awa Couture" : "Awa Boutique"}
                  value={shopNom}
                  onChange={(e) => setShopNom(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="register-fullname" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                {isSeller ? "Nom gérant" : "Nom complet"} <span className="text-tf-gold">*</span>
              </label>
              <input
                id="register-fullname"
                type="text"
                autoComplete="name"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="Awa Koné"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="register-phone" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Téléphone <span className="text-tf-gold">*</span>
              </label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="+225 07 00 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="register-email" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="awa@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="register-password" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Mot de passe <span className="text-tf-gold">*</span>
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-md text-tf-text-muted hover:text-tf-text transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="block font-sans text-[12px] font-medium text-tf-text uppercase tracking-widest mb-1.5">
                Confirmer le mot de passe <span className="text-tf-gold">*</span>
              </label>
              <input
                id="register-confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="w-full px-3 py-2.5 rounded-md border border-tf-border bg-white text-tf-text font-sans text-[14px] placeholder:text-tf-text-muted focus:outline-none focus:border-tf-gold transition-colors"
                placeholder="8 caractères minimum"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="btn-gold flex-1"
              >
                {loading ? "Création..." : "Créer mon compte"}
              </button>
            </div>
          </form>
        )}
      </div>
  );
}
