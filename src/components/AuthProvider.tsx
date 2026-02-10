"use client";

import { createContext, useCallback, useContext, useEffect, useState, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

export type AuthStatus = "loading" | "guest" | "authenticated";

interface AuthState {
  user: User | null;
  session: Session | null;
  /** 三値状態: loading（初期化中）| guest（未認証）| authenticated（認証済み） */
  authStatus: AuthStatus;
  /** @deprecated authStatus === "loading" を使用 */
  isLoading: boolean;
  /** @deprecated authStatus === "guest" を使用 */
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
  updateProfile: (name: string, avatarUrl: string) => Promise<{ error: string | null }>;
}

type AuthContext = AuthState & AuthActions;

const AuthCtx = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [email, setEmail] = useState("");

  // 三値状態を user と initialized から導出（Single Source of Truth）
  const authStatus: AuthStatus = useMemo(() => {
    if (!initialized) return "loading";
    return user ? "authenticated" : "guest";
  }, [initialized, user]);

  // 後方互換（@deprecated）
  const isLoading = authStatus === "loading";
  const isGuest = authStatus === "guest";

  const extractUserMeta = (u: User): void => {
    const meta = u.user_metadata ?? {};
    setDisplayName(meta.user_name ?? meta.full_name ?? meta.name ?? u.email?.split("@")[0] ?? "");
    setAvatarUrl(meta.avatar_url ?? "");
    setEmail(u.email ?? "");
  };



  useEffect(() => {
    let cancelled = false;

    const ensureProfile = async (u: User, forceMetaFallback = false): Promise<void> => {
      try {
        // 1. Check if profile exists (Check "error" to distinguish network issues)
        const { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle();

        if (error) {
          console.error("Profile check error:", error.message);
          // On DB error, do NOT overwrite with metadata if we already have state
          // Only fallback if we have nothing or forced
          if (forceMetaFallback) {
             extractUserMeta(u);
          }
          return;
        }
        
        if (data) {
          // Profile exists, update local state
          setDisplayName(data.display_name || "");
          setAvatarUrl(data.avatar_url || "");
          return;
        }

        // 2. Profile missing (data is null, error is null) -> Create it
        console.warn("Profile missing for user, creating manually (Self-Healing)...");
        const metaName = u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "User";
        const metaAvatar = u.user_metadata?.avatar_url || "";
        
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({ id: u.id, display_name: metaName, avatar_url: metaAvatar });
          
        if (insertError) {
           console.error("Manual profile creation failed:", insertError.message);
           // Fallback to metadata for UI
           setDisplayName(metaName);
           setAvatarUrl(metaAvatar);
        } else {
           setDisplayName(metaName);
           setAvatarUrl(metaAvatar);
        }
      } catch (e) {
        console.error("ensureProfile error:", e);
        if (forceMetaFallback) extractUserMeta(u);
      }
    };

    const init = async (): Promise<void> => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          // Don't extract meta immediately, trust ensureProfile to fetch truth
          // (Only fallback if needed)
          await ensureProfile(data.session.user, true);
        }
      } catch (e) {
        const name = (e as Error)?.name ?? "";
        if (name === "AbortError" || cancelled) return;
      }
      if (!cancelled) setInitialized(true);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      // INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED, SIGNED_OUT, PASSWORD_RECOVERY
      // console.log("Auth event:", event);

      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        // Handle events smartly
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
             // Fetch fresh
             await ensureProfile(newSession.user, true);
        } else if (event === 'TOKEN_REFRESHED') {
             // Don't overwrite state blindly, just ensure consistency in background
             // Pass false to forceMetaFallback to keep existing state on error
             await ensureProfile(newSession.user, false);
        } else {
             // USER_UPDATED etc.
             await ensureProfile(newSession.user, false);
        }
      } else if (event === 'SIGNED_OUT') {
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
    try {
      await supabase.auth.signOut();
    } catch {
      // signOut失敗時もクライアント側の状態をクリア
    }
    // 確実にUIをリセット（onAuthStateChangeが発火しなかった場合のフォールバック）
    setUser(null);
    setSession(null);
    setDisplayName("");
    setAvatarUrl("");
    setEmail("");
  }, []);

  const updateProfile = useCallback(async (name: string, newAvatarUrl: string): Promise<{ error: string | null }> => {
    if (!user) return { error: "ログインが必要です" };

    // Try update first (works when profile exists, which is the common case)
    const { error: updateError, data: updateData } = await supabase
      .from("profiles")
      .update({ display_name: name, avatar_url: newAvatarUrl })
      .eq("id", user.id)
      .select("id");

    if (updateError) {
      // If update fails, try upsert as fallback (creates profile if missing)
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: name, avatar_url: newAvatarUrl }, { onConflict: "id" });
      if (upsertError) return { error: upsertError.message };
    } else if (!updateData || updateData.length === 0) {
      // Profile row doesn't exist yet — insert it
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: name, avatar_url: newAvatarUrl });
      if (insertError) return { error: insertError.message };
    }

    setDisplayName(name);
    setAvatarUrl(newAvatarUrl);
    return { error: null };
  }, [user]);

  const value: AuthContext = {
    user, session, authStatus, isLoading, isGuest,
    displayName, avatarUrl, email,
    signInWithEmail, signUpWithEmail, signInWithGitHub, signInWithGoogle, signOut, updateProfile,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
