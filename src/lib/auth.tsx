"use client";

import { apiRequest, isSuccess } from "@/lib/api";
import { asEnvelope } from "@/lib/envelope";
import { failureEnvelope, type Envelope } from "@/types/envelope";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface AuthContextValue {
  session: Envelope | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<Envelope>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<Envelope | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Envelope | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const envelope = await apiRequest("/auth/me", { redirectOnUnauthorized: false });
    if (isSuccess(envelope) && envelope.user) {
      setSession(envelope);
      return envelope;
    }
    setSession(null);
    return null;
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest("/auth/me", { redirectOnUnauthorized: false }).then((envelope) => {
      if (!active) return;
      if (isSuccess(envelope) && envelope.user) setSession(envelope);
      else setSession(null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onUnauthorized(event: Event) {
      const next = event instanceof CustomEvent && typeof event.detail === "string" ? event.detail : "/dashboard";
      router.replace(`/signin?next=${encodeURIComponent(next)}`);
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    let response: Response;
    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return failureEnvelope(503, "Não foi possível falar com o servidor.", "HTTP_503");
    }
    let parsed: unknown = null;
    try {
      parsed = await response.json();
    } catch {
      parsed = null;
    }
    const envelope = asEnvelope(parsed, response.status);
    if (isSuccess(envelope)) await refreshSession();
    return envelope;
  }, [refreshSession]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    setSession(null);
    router.replace("/signin");
  }, [router]);

  const value = useMemo(
    () => ({ session, loading, login, logout, refreshSession }),
    [session, loading, login, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth precisa estar dentro de AuthProvider.");
  return value;
}
