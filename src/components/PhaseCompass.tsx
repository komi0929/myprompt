"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { type Phase, PHASES } from "@/lib/mock-data";

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
    <div className="w-full pb-3 pt-1">
      <div className="flex w-full items-center gap-1 px-0.5">
        {PHASES.map((phase) => {
          const isActive = active === phase.id;
          return (
            <div key={phase.id} className="flex flex-1 items-center justify-center group/phase relative">
              <button
                onClick={() => handleClick(phase.id)}
                className={cn(
                  "relative flex w-full flex-col items-center gap-0.5 rounded-xl py-2 transition-all duration-200 border",
                  isActive
                    ? "bg-yellow-50 text-yellow-700 shadow-sm border-yellow-300 z-10"
                    : "bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-600 border-transparent hover:border-slate-300"
                )}
              >
                <span className="text-base">{phase.icon}</span>
                <span className={cn("font-semibold whitespace-nowrap text-[11px] transition-colors", isActive ? "text-yellow-700" : "text-slate-500")}>
                  {phase.label}
                </span>
                
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-yellow-400 border border-white" />
                )}
              </button>

              {/* Tooltip */}
              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/phase:opacity-100 transition-opacity pointer-events-none z-50">
                <span className="whitespace-nowrap bg-slate-800 text-white text-[10px] px-2.5 py-1 rounded-md shadow-lg">
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
