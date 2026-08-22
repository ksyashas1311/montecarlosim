"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, UserProfileDto } from "../lib/api";
import { planStore } from "../store/planStore";

interface AuthContextType {
  user: UserProfileDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get("auth_error");
      return errorParam ? decodeURIComponent(errorParam) : null;
    }
    return null;
  });

  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await authApi.getMe();
      if (profile) {
        setUser(profile);
        if (profile.name) {
          planStore.updateProfile({ name: profile.name }, false);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("auth_error")) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const profile = await authApi.login({ email, password });
      setUser(profile);
      if (profile.name) {
        planStore.updateProfile({ name: profile.name }, false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to log in";
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const profile = await authApi.register({ name, email, password });
      setUser(profile);
      if (profile.name) {
        planStore.updateProfile({ name: profile.name }, false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register account";
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const loginWithGoogle = () => {
    window.location.href = authApi.getGoogleLoginUrl();
  };

  const clearError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        authError,
        login,
        register,
        logout,
        loginWithGoogle,
        clearError,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
