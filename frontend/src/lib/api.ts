/**
 * Centralized API client with credentials: "include" and automatic 401 refresh interceptor
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: ((tokenRefreshed: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (tokenRefreshed: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

export interface ApiError extends Error {
  status?: number;
}

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config: RequestInit = {
    ...options,
    headers: defaultHeaders,
    credentials: "include", // ALWAYS include cookies for httpOnly JWT
  };

  let response = await fetch(url, config);

  // If unauthorized and not already calling refresh or login/register
  if (
    response.status === 401 &&
    !endpoint.includes("/auth/login") &&
    !endpoint.includes("/auth/register") &&
    !endpoint.includes("/auth/refresh")
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed(true);
          // Retry the original request
          response = await fetch(url, config);
        } else {
          isRefreshing = false;
          onRefreshed(false);
        }
      } catch {
        isRefreshing = false;
        onRefreshed(false);
      }
    } else {
      // Wait for refresh to complete
      const refreshed = await new Promise<boolean>((resolve) => {
        subscribeTokenRefresh(resolve);
      });
      if (refreshed) {
        response = await fetch(url, config);
      }
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
    } catch {
      errorDetail = response.statusText || `${response.status} Error`;
    }
    const error: ApiError = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  // Handle empty 204 or 200 responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null as unknown as T;
}

export interface UserProfileDto {
  id: number;
  email?: string;
  name?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient<UserProfileDto>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiClient<UserProfileDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiClient<{ detail: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => apiClient<UserProfileDto>("/auth/me"),

  getGoogleLoginUrl: () => `${API_BASE}/auth/google/login`,
};
