"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ─── */
export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

interface FeatureFlagsContext {
  flags: Record<string, boolean>;
  isEnabled: (flagId: string) => boolean;
  isLoading: boolean;
}

const FlagsCtx = createContext<FeatureFlagsContext>({
  flags: {},
  isEnabled: () => true, // Default to true if provider not mounted
  isLoading: true,
});

/* ─── Provider ─── */
export function FeatureFlagsProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const { data } = await supabase
          .from("feature_flags" as "profiles")
          .select("id, enabled") as unknown as { data: { id: string; enabled: boolean }[] | null };
        if (!cancelled && data) {
          const map: Record<string, boolean> = {};
          for (const row of data) {
            map[row.id] = row.enabled;
          }
          setFlags(map);
        }
      } catch {
        // Silently fail — default to all enabled
      }
      if (!cancelled) setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const isEnabled = (flagId: string): boolean => {
    // If flag not found, default to true (safe default)
    return flags[flagId] ?? true;
  };

  return (
    <FlagsCtx.Provider value={{ flags, isEnabled, isLoading }}>
      {children}
    </FlagsCtx.Provider>
  );
}

/* ─── Hook ─── */
export function useFeatureFlags(): FeatureFlagsContext {
  return useContext(FlagsCtx);
}
