"use client";

import { cn } from "@/lib/utils";
import { type Phase, PHASES } from "@/lib/mock-data";
import { useState } from "react";

export function PhaseCompass({
  currentPhase,
  onPhaseChange,
}: {
  currentPhase?: Phase;
  onPhaseChange?: (phase: Phase) => void;
}): React.ReactElement {
  const [active, setActive] = useState<Phase>(currentPhase || "All");

  const handleClick = (p: Phase): void => {
    setActive(p);
    onPhaseChange?.(p);
  };

  return (
    <div className="w-full pb-4 pt-2">
      <div className="flex w-full items-center gap-1.5 px-1">
        {PHASES.map((phase) => {
          const isActive = active === phase.id;
          return (
            <div key={phase.id} className="flex flex-1 items-center justify-center group/phase relative">
              <button
                onClick={() => handleClick(phase.id)}
                className={cn(
                  "relative flex w-full flex-col items-center gap-0.5 rounded-[20px] py-2.5 transition-all duration-300 ease-out border",
                  isActive
                    ? "bg-slate-800 text-white shadow-lg shadow-slate-200 scale-105 border-slate-800 z-10"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-slate-100 hover:border-slate-200 scale-100"
                )}
              >
                <span className="text-lg filter drop-shadow-sm">{phase.icon}</span>
                <span className={cn("font-bold whitespace-nowrap text-xs tracking-wide transition-colors", isActive ? "text-white" : "text-slate-500")}>
                  {phase.label}
                </span>
                
                {isActive && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-400 border-2 border-slate-50 animate-bounce" />
                )}
              </button>

              {/* Tooltip with hint on hover */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/phase:opacity-100 transition-opacity pointer-events-none z-50">
                <span className="whitespace-nowrap bg-slate-800 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg">
                  {phase.hint}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
