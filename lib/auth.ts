import api, { cookieStore, parseApiError, tokenStore } from "./api";
import {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  TokenResponse,
  UserProfile,
} from "@/types/auth";

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/api/v1/auth/register", payload);
  return data;
}

export async function login(credentials: LoginRequest): Promise<UserProfile> {
  const { data } = await api.post<TokenResponse>("/api/v1/auth/login", credentials);

  tokenStore.set(data.access_token);
  tokenStore.setRefresh(data.refresh_token);
  cookieStore.set(data.access_token);

  const user = await getMe();
  if (typeof window !== "undefined") {
    localStorage.setItem("user", JSON.stringify(user));
  }

  return user;
}

export function logout(): void {
  tokenStore.clear();
  cookieStore.clear();
}

export async function getMe(): Promise<UserProfile> {
  const { data } = await api.get<UserProfile>("/api/v1/auth/me");
  return data;
}

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

export { parseApiError };
