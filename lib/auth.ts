import api, { tokenStore, cookieStore, parseApiError } from "./api";
import { LoginRequest, TokenResponse, UserProfile } from "@/types/auth";

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(credentials: LoginRequest): Promise<UserProfile> {
  const { data } = await api.post<TokenResponse>("/api/v1/auth/login", credentials);

  // Persist tokens — both stores must stay in sync
  tokenStore.set(data.access_token);
  tokenStore.setRefresh(data.refresh_token);
  cookieStore.set(data.access_token);

  // Persist hospital_id for HospitalContext
  if (typeof window !== "undefined") {
    localStorage.setItem("hospital_id", credentials.hospital_id);
  }

  // Fetch and cache user profile
  const user = await getMe();
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return user;
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export function logout(): void {
  tokenStore.clear();
  cookieStore.clear();
  // tokenStore.clear() already clears all relevant localStorage keys
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/v1/auth/me");
  return data;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshToken(): Promise<string> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) throw new Error("No refresh token available");

  const { data } = await api.post<TokenResponse>("/api/v1/auth/refresh", {
    refresh_token: refresh,
  });

  tokenStore.set(data.access_token);
  cookieStore.set(data.access_token);
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token);

  return data.access_token;
}

// ─── Auth State Checks ────────────────────────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!tokenStore.get();
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function getStoredHospitalId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hospital_id");
}

export { parseApiError };
