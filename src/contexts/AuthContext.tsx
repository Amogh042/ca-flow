import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function init() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase!.auth.getSession();
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
      } catch (_) {
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }

      const { subscription } = supabase!.auth.onAuthStateChange((event, newSession) => {
        setSession(newSession ?? null);
        setUser(newSession?.user ?? null);
      }) as any;

      return () => {
        mounted = false;
        try {
          subscription?.unsubscribe();
        } catch (_) {}
      };
    }

    const unsub = init();
    return () => {
      try {
        (unsub as any)?.();
      } catch (_) {}
    };
  }, []);

  async function signUp(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    setLoading(true);
    try {
      const { data, error } = await supabase!.auth.signUp({ email, password });
      if (error) {
        toast({ title: "Sign up failed", description: error.message });
        throw error;
      }
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
    setLoading(true);
    try {
      const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Sign in failed", description: error.message });
        throw error;
      }
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured()) return;
    setLoading(true);
    try {
      const { error } = await supabase!.auth.signOut();
      if (error) {
        toast({ title: "Sign out failed", description: error.message });
        throw error;
      }
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export default AuthContext;
