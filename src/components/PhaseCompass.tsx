"use client";

import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { type Phase, PHASES } from "@/lib/mock-data";

const emptySubscribe = (): (() => void) => () => {};

export function PhaseCompass({
  currentPhase,
  onPhaseChange,
}: {
  currentPhase?: Phase;
  onPhaseChange?: (phase: Phase) => void;
}): React.ReactElement {
  // Hydration-safe: SSR returns "All", client returns currentPhase after hydration
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const active = mounted ? (currentPhase || "All") : "All";

  const handleClick = (p: Phase): void => {
    onPhaseChange?.(p);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2">
      {PHASES.map((phase) => {
        const isActive = active === phase.id;
        return (
          <button
            key={phase.id}
            onClick={() => handleClick(phase.id)}
            className={cn(
              "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap",
              isActive
                ? "bg-yellow-400 text-slate-800 shadow-sm"
                : "bg-white text-slate-500 border border-slate-200 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300"
            )}
            title={phase.hint}
            suppressHydrationWarning
          >
            <span className="text-sm leading-none">{phase.icon}</span>
            {phase.label}
          </button>
        );
      })}
    </div>
  );
}
