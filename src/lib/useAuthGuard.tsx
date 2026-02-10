"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

interface AuthGuardContext {
  requireAuth: (action?: string) => boolean;
  requireAuthWithCallback: (action: string, callback: () => void) => boolean;
  showLoginModal: boolean;
  loginAction: string;
  closeLoginModal: () => void;
  openLoginModal: (action?: string) => void;
}

const AuthGuardCtx = createContext<AuthGuardContext | null>(null);

export function AuthGuardProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { authStatus } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState("");
  const pendingCallback = useRef<(() => void) | null>(null);

  const requireAuth = useCallback((action?: string): boolean => {
    if (authStatus !== "authenticated") {
      if (authStatus === "guest") {
        setLoginAction(action ?? "この機能を使う");
        setShowLoginModal(true);
      }
      pendingCallback.current = null;
      return false;
    }
    return true;
  }, [authStatus]);

  const requireAuthWithCallback = useCallback((action: string, callback: () => void): boolean => {
    if (authStatus !== "authenticated") {
      if (authStatus === "guest") {
        setLoginAction(action);
        setShowLoginModal(true);
        pendingCallback.current = callback;
      }
      return false;
    }
    return true;
  }, [authStatus]);

  const openLoginModal = useCallback((action?: string): void => {
    setLoginAction(action ?? "");
    setShowLoginModal(true);
    pendingCallback.current = null;
  }, []);

  const closeLoginModal = useCallback((): void => {
    // Execute pending callback if login succeeded (no longer guest)
    const cb = pendingCallback.current;
    pendingCallback.current = null;
    setShowLoginModal(false);
    setLoginAction("");
    if (cb && authStatus === "authenticated") {
      // Delay to let auth state settle
      setTimeout(cb, 100);
    }
  }, [authStatus]);

  return (
    <AuthGuardCtx.Provider value={{ requireAuth, requireAuthWithCallback, showLoginModal, loginAction, closeLoginModal, openLoginModal }}>
      {children}
    </AuthGuardCtx.Provider>
  );
}

export function useAuthGuard(): AuthGuardContext {
  const ctx = useContext(AuthGuardCtx);
  if (!ctx) throw new Error("useAuthGuard must be used within AuthGuardProvider");
  return ctx;
}
