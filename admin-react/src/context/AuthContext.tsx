import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    login as apiLogin,
    logout as apiLogout,
    clearSession,
    getStoredUser,
    getToken,
    me,
    type AuthUser,
} from "../lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [token, setToken] = useState<string | null>(getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function bootstrap() {
      if (!getToken()) {
        if (alive) setLoading(false);
        return;
      }

      try {
        const payload = await me();
        if (alive && payload.user) {
          setUser(payload.user);
          setToken(getToken());
        }
      } catch {
        clearSession();
        if (alive) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    bootstrap();

    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login: async (email: string, password: string) => {
        const payload = await apiLogin(email, password);
        setUser(payload.user);
        setToken(payload.token);
      },
      logout: () => {
        apiLogout();
        setUser(null);
        setToken(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
