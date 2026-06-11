import { UserRole } from "./common";

// ─── Requests ─────────────────────────────────────────────────────────────────

export interface LoginRequest {
  hospital_id: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

// ─── Responses ────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  user_id: string;
  email: string;
  role: UserRole;
  hospital_id: string;
  first_name?: string;
  last_name?: string;
}

// ─── Stored Auth State ────────────────────────────────────────────────────────

export interface StoredAuth {
  access_token: string;
  refresh_token: string;
  hospital_id: string;
  user: UserProfile;
}
