import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore, type User } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setSession: (token: string, user: User) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const setSession = (token: string, u: User) => {
    tokenStore.set(token);
    setUser(u);
  };

  const refresh = async () => {
    try { const r = await api.auth.me(); setUser(r.user); } catch { tokenStore.clear(); setUser(null); }
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch { /* ignore */ }
    tokenStore.clear();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, isAuthenticated: !!user, setSession, refresh, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
