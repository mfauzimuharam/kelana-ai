"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { ApiError, clearToken, getErrorMessage, getToken, setToken, subscribeToken } from "@/services/api";
import * as authService from "@/services/authService";
import type { Profile } from "@/types";

type AuthStatus = "loading" | "authenticated" | "guest" | "error";

interface AuthContextValue {
  status: AuthStatus;
  user: Profile | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// undefined on the server / during hydration = "we don't know yet".
const getServerToken = () => undefined;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useSyncExternalStore<string | null | undefined>(subscribeToken, getToken, getServerToken);
  const [profile, setProfile] = useState<{ token: string; user: Profile } | null>(null);
  const [failure, setFailure] = useState<{ token: string; message: string } | null>(null);

  const loadUser = useCallback((currentToken: string, isCancelled: () => boolean = () => false) => {
    return authService
      .getMe()
      .then((user) => {
        if (isCancelled()) return;
        setProfile({ token: currentToken, user });
        setFailure(null);
      })
      .catch((error) => {
        if (isCancelled()) return;
        if (error instanceof ApiError && error.status === 401) {
          clearToken();
        } else {
          setFailure({ token: currentToken, message: getErrorMessage(error) });
        }
      });
  }, []);

  // Whenever the stored token changes, load the profile that belongs to it.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    loadUser(token, () => cancelled);
    return () => {
      cancelled = true;
    };
  }, [token, loadUser]);

  const user = token && profile?.token === token ? profile.user : null;
  const error = token && failure?.token === token ? failure.message : null;

  let status: AuthStatus;
  if (token === undefined) status = "loading";
  else if (token === null) status = "guest";
  else if (user) status = "authenticated";
  else if (error) status = "error";
  else status = "loading";

  const login = useCallback(async (email: string, password: string) => {
    const result = await authService.login(email, password);
    setToken(result.access_token);
  }, []);

  const logout = useCallback(() => {
    // JWT is stateless — logging out simply forgets the token on the client.
    clearToken();
    setProfile(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = getToken();
    if (current) await loadUser(current);
  }, [loadUser]);

  const value = useMemo(
    () => ({ status, user, error, login, logout, refreshUser }),
    [status, user, error, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
