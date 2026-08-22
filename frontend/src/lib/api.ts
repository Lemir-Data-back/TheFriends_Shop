import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface PydanticValidationError {
  type: string;
  loc: (string | number)[];
  msg: string;
  ctx?: Record<string, unknown>;
}

const FIELD_LABELS: Record<string, string> = {
  full_name: "Nom complet",
  email: "Email",
  phone: "Téléphone",
  password: "Mot de passe",
  identifier: "Téléphone ou email",
  role: "Rôle",
};

function translateValidationMessage(err: PydanticValidationError): string {
  const field = String(err.loc[err.loc.length - 1] ?? "");
  const label = FIELD_LABELS[field] ?? field;

  if (err.type === "missing") return `${label} : ce champ est obligatoire.`;
  if (err.type === "string_too_short") {
    const min = err.ctx?.min_length;
    return `${label} : doit contenir au moins ${min ?? "quelques"} caractères.`;
  }
  if (err.type === "string_too_long") {
    const max = err.ctx?.max_length;
    return `${label} : ne doit pas dépasser ${max ?? "la limite de"} caractères.`;
  }
  if (err.msg.includes("valid email address")) return `${label} : l'adresse email n'est pas valide.`;
  if (err.type === "enum") return `${label} : valeur non reconnue.`;

  return `${label} : ${err.msg}.`;
}

/**
 * Extrait un message d'erreur lisible depuis une réponse API (Axios/FastAPI).
 * `detail` peut être une chaîne (erreur métier) ou un tableau d'erreurs de
 * validation Pydantic — les deux formes doivent aboutir à un texte affichable.
 */
export function getApiErrorMessage(err: unknown, fallback = "Une erreur est survenue. Réessaie."): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return "Impossible de contacter le serveur. Vérifie ta connexion et réessaie.";
    }
    const detail = err.response.data?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((d: PydanticValidationError) => translateValidationMessage(d)).join(" ");
    }
  }
  return fallback;
}

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Injecter le token automatiquement
api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresh token automatique si 401 — avec verrou pour éviter les refreshs concurrents
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function processQueue(token: string) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      // Une autre requête est déjà en train de refresher — on attend le résultat
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      original.headers.Authorization = `Bearer ${data.access_token}`;
      processQueue(data.access_token);
      return api(original);
    } catch {
      refreshQueue = [];
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("tf-auth");
      // Laisser SessionExpiredHandler décider de la redirection selon la route courante
      const PROTECTED_PATHS = ["/dashboard", "/admin", "/commandes", "/panier", "/profil", "/messages", "/looks"];
      const isProtected = PROTECTED_PATHS.some(
        (p) => window.location.pathname === p || window.location.pathname.startsWith(p + "/")
      );
      window.dispatchEvent(new CustomEvent("tf:session-expired", { detail: { redirect: isProtected } }));
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
