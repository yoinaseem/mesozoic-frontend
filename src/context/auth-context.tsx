"use client";

import { apiRequest, configureApiClient } from "@/lib/api-client";
import { clearStoredToken, readStoredToken, writeStoredToken } from "@/lib/auth-storage";
import { AuthResponse, AuthUser } from "@/types/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function redirectToLogin() {
  if (typeof window === "undefined") {
    return;
  }

  const isOnAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
  if (!isOnAuthPage) {
    const nextPath = `${window.location.pathname}${window.location.search ?? ""}`;
    const safeNextPath = nextPath.startsWith("/") ? nextPath : "/";
    window.location.assign(`/login?next=${encodeURIComponent(safeNextPath)}`);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  const applySession = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    tokenRef.current = nextToken;
    setUser(nextUser);
    writeStoredToken(nextToken);
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    tokenRef.current = null;
    setUser(null);
    clearStoredToken();
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      try {
        const response = await apiRequest<AuthResponse>("/auth/login", {
          method: "POST",
          body: payload,
          skipAuth: true,
        });

        applySession(response.token, response.user);
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      try {
        const response = await apiRequest<AuthResponse>("/auth/register", {
          method: "POST",
          body: payload,
          skipAuth: true,
        });

        applySession(response.token, response.user);
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (tokenRef.current) {
        await apiRequest<{ message: string }>("/auth/logout", {
          method: "POST",
        });
      }
    } catch {
      // Local auth state must still be cleared even when the API call fails.
    } finally {
      clearAuth();
      setLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    configureApiClient({
      getToken: () => tokenRef.current,
      onUnauthorized: () => {
        clearAuth();
        redirectToLogin();
      },
    });
  }, [clearAuth]);

  useEffect(() => {
    const storedToken = readStoredToken();

    if (!storedToken) {
      setLoading(false);
      return;
    }

    setToken(storedToken);
    tokenRef.current = storedToken;

    const hydrateUser = async () => {
      try {
        const currentUser = await apiRequest<AuthUser>("/auth/me", {
          method: "GET",
          tokenOverride: storedToken,
        });

        setUser(currentUser);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    void hydrateUser();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      logout,
      clearAuth,
    }),
    [token, user, loading, login, register, logout, clearAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
