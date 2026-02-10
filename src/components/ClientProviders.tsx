"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuardProvider } from "@/lib/useAuthGuard";
import ToastContainer from "@/components/ui/Toast";

/**
 * Single shared AuthProvider + AuthGuardProvider for the entire app.
 * This ensures auth state is consistent across all routes.
 * Previously, each page had its own AuthProvider, which caused
 * session state inconsistency between pages.
 */
export function ClientProviders({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <AuthProvider>
      <AuthGuardProvider>
        {children}
        <ToastContainer />
      </AuthGuardProvider>
    </AuthProvider>
  );
}
