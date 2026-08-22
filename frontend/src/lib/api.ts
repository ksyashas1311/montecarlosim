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

export interface RiskFactorDto {
  type: "positive" | "negative" | "neutral";
  title: string;
  description: string;
}

export interface GoalRiskDto {
  name: string;
  target_amount: number;
  target_age: number;
  horizon_years: number;
  priority: string;
  category: string;
  posture: string;
  suggested_equity_pct: number;
  suggested_debt_pct: number;
  strategy_guidance: string;
}

export interface RecommendedAllocationDto {
  equity: number;
  debt: number;
  gold: number;
  cash: number;
}

export interface RiskProfileDto {
  id?: number;
  user_id: number;
  risk_tolerance_score: number;
  risk_capacity_score: number;
  overall_score: number;
  risk_category: "Conservative" | "Moderately Conservative" | "Moderate" | "Moderately Aggressive" | "Aggressive";
  investment_horizon_years: number;
  questionnaire_version: string;
  responses: {
    market_decline: number;
    investment_objective: number;
    volatility_comfort: number;
    return_preference: number;
    financial_stability: number;
  };
  factors: RiskFactorDto[];
  narrative: string;
  recommended_allocation: RecommendedAllocationDto;
  goal_assessments: GoalRiskDto[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOptionDto {
  value: number;
  label: string;
  score: number;
}

export interface QuestionItemDto {
  id: string;
  title: string;
  question: string;
  options: QuestionOptionDto[];
  weight: number;
}

export interface QuestionnaireMetadataDto {
  version: string;
  questions: QuestionItemDto[];
  risk_categories: { min: number; max: number; name: string }[];
}

export const riskApi = {
  getQuestions: () => apiClient<QuestionnaireMetadataDto>("/risk-profile/questions"),
  
  getProfile: () => apiClient<RiskProfileDto>("/risk-profile"),
  
  submitQuestionnaire: (responses: {
    market_decline: number;
    investment_objective: number;
    volatility_comfort: number;
    return_preference: number;
    financial_stability: number;
  }) =>
    apiClient<RiskProfileDto>("/risk-profile", {
      method: "POST",
      body: JSON.stringify(responses),
    }),

  updateQuestionnaire: (responses: {
    market_decline: number;
    investment_objective: number;
    volatility_comfort: number;
    return_preference: number;
    financial_stability: number;
  }) =>
    apiClient<RiskProfileDto>("/risk-profile", {
      method: "PUT",
      body: JSON.stringify(responses),
    }),
};
