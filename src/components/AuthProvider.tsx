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
  signInWithGitHub: () => Promise<void>;
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

  // Extract user metadata from GitHub OAuth
  const extractUserMeta = (u: User): void => {
    const meta = u.user_metadata ?? {};
    setDisplayName(meta.user_name ?? meta.full_name ?? meta.name ?? u.email?.split("@")[0] ?? "");
    setAvatarUrl(meta.avatar_url ?? "");
    setEmail(u.email ?? "");
  };

  // Initial session check
  useEffect(() => {
    const init = async (): Promise<void> => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        extractUserMeta(data.session.user);
        await fetchProfile(data.session.user.id);
      }
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
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

    return () => subscription.unsubscribe();
  }, []);

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

  const signInWithGitHub = useCallback(async (): Promise<void> => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/`,
        scopes: "read:user user:email",
      },
    });
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
  }, []);

  const value: AuthContext = {
    user,
    session,
    isLoading,
    isGuest: !user,
    displayName,
    avatarUrl,
    email,
    signInWithGitHub,
    signOut,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
