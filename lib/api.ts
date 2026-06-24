import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { ApiError } from "@/types/common";

// ─── Token Store (localStorage) ───────────────────────────────────────────────
// Used by axios interceptor at request time

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
  },
  set(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("access_token", token);
  },
  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  },
  getRefresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  },
  setRefresh(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("refresh_token", token);
  },
};

// ─── Cookie Store ─────────────────────────────────────────────────────────────
// Next.js middleware reads access_token cookie for SSR route protection

export const cookieStore = {
  set(token: string): void {
    if (typeof document === "undefined") return;
    // Secure in prod, SameSite=Lax, no httpOnly (must be readable by JS for refresh)
    const isProd = process.env.NODE_ENV === "production";
    const secure = isProd ? "; Secure" : "";
    document.cookie = `access_token=${token}; path=/${secure}; SameSite=Lax`;
  },
  clear(): void {
    if (typeof document === "undefined") return;
    document.cookie =
      "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  },
};

// ─── Axios Instance ───────────────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ─── Request Interceptor — attach Bearer token ────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── 401 Refresh Logic ────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ─── Response Interceptor — handle 401, queue concurrent requests ─────────────

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Skip refresh for auth endpoints — a 401 there means wrong credentials
    const isAuthEndpoint = originalRequest?.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = tokenStore.getRefresh();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newAccessToken: string = data.access_token;
        tokenStore.set(newAccessToken);
        cookieStore.set(newAccessToken);
        if (data.refresh_token) tokenStore.setRefresh(data.refresh_token);

        onTokenRefreshed(newAccessToken);
        isRefreshing = false;

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        tokenStore.clear();
        cookieStore.clear();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Error Helpers ────────────────────────────────────────────────────────────

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiError | undefined;
    if (!data) return "Network error. Please check your connection.";

    if (typeof data.detail === "string") return data.detail;

    if (Array.isArray(data.detail)) {
      return data.detail.map((e) => e.msg).join(", ");
    }
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred.";
}

export { api };
export default api;
