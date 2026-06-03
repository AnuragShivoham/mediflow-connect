import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export type AppRole = "doctor" | "mr";

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: AppRole;
}

interface AuthContextValue {
  user: { id: string; email: string } | null;
  session: null; // kept for interface compat — JWT stored in localStorage
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.hasToken()) {
      setLoading(false);
      return;
    }
    api.get<{ profile: Profile }>("/auth/me")
      .then(({ profile: p }) => {
        setProfile(p);
        setUser({ id: p.id, email: p.email });
      })
      .catch(() => {
        // Token expired or invalid — clear it
        api.clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const signOut = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    api.clearToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, session: null, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
