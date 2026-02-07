"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isGuest: boolean;
  displayName: string;
  avatarUrl: string;
  email: string;
}

interface AuthActions {
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

type AuthContext = AuthState & AuthActions;

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  const extractUserMeta = (u: User): void => {
    const meta = u.user_metadata ?? {};
    setDisplayName(meta.user_name ?? meta.full_name ?? meta.name ?? u.email?.split("@")[0] ?? "");
    setAvatarUrl(meta.avatar_url ?? "");
    setEmail(u.email ?? "");
  };

  const fetchProfile = async (userId: string): Promise<void> => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();
    if (data) {
      if (data.display_name) setDisplayName(data.display_name);
      if (data.avatar_url) setAvatarUrl(data.avatar_url);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const init = async (): Promise<void> => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          extractUserMeta(data.session.user);
          await fetchProfile(data.session.user.id);
        }
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
      if (!cancelled) setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        extractUserMeta(newSession.user);
        await fetchProfile(newSession.user.id);
      } else {
        setDisplayName("");
        setAvatarUrl("");
        setEmail("");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signInWithGitHub = useCallback(async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "read:user user:email",
      },
    });
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  const isGuest = !isLoading && !user;

  const value: AuthContext = {
    user, session, isLoading, isGuest,
    displayName, avatarUrl, email,
    signInWithEmail, signUpWithEmail, signInWithGitHub, signInWithGoogle, signOut,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
