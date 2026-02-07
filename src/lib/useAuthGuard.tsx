"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

interface AuthGuardContext {
  requireAuth: (action?: string) => boolean;
  showLoginModal: boolean;
  loginAction: string;
  closeLoginModal: () => void;
  openLoginModal: (action?: string) => void;
}

const AuthGuardCtx = createContext<AuthGuardContext | null>(null);

export function AuthGuardProvider({ children }: { children: ReactNode }): React.ReactElement {
  const { isGuest } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginAction, setLoginAction] = useState("");

  const requireAuth = useCallback((action?: string): boolean => {
    if (isGuest) {
      setLoginAction(action ?? "この機能を使う");
      setShowLoginModal(true);
      return false;
    }
    return true;
  }, [isGuest]);

  const openLoginModal = useCallback((action?: string): void => {
    setLoginAction(action ?? "");
    setShowLoginModal(true);
  }, []);

  const closeLoginModal = useCallback((): void => {
    setShowLoginModal(false);
    setLoginAction("");
  }, []);

  return (
    <AuthGuardCtx.Provider value={{ requireAuth, showLoginModal, loginAction, closeLoginModal, openLoginModal }}>
      {children}
    </AuthGuardCtx.Provider>
  );
}

export function useAuthGuard(): AuthGuardContext {
  const ctx = useContext(AuthGuardCtx);
  if (!ctx) throw new Error("useAuthGuard must be used within AuthGuardProvider");
  return ctx;
}
