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
                  "relative flex w-full flex-col items-center gap-0.5 rounded-lg py-2 transition-all duration-200 border",
                  isActive
                    ? "bg-slate-800 text-white shadow-md border-slate-800 z-10"
                    : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-slate-200/80 hover:border-slate-300"
                )}
              >
                <span className="text-base">{phase.icon}</span>
                <span className={cn("font-semibold whitespace-nowrap text-[11px] transition-colors", isActive ? "text-white" : "text-slate-500")}>
                  {phase.label}
                </span>
                
                {isActive && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-yellow-400 border-2 border-white" />
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
