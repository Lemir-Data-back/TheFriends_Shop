export type UserRole = "client" | "couturier" | "vendeur" | "admin";

export interface User {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  score_confiance: number;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
  role?: UserRole;
}
