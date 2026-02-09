"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

/* ─── Props ─── */
interface OnboardingTooltipProps {
  tipId: string; // unique key for localStorage
  message: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  delay?: number; // ms before showing
  forceShow?: boolean; // override localStorage check (for testing)
}

const emptySubscribe = (): (() => void) => () => {};

export default function OnboardingTooltip({
  tipId,
  message,
  position = "bottom",
  children,
  delay = 800,
  forceShow = false,
}: OnboardingTooltipProps): React.ReactElement {
  const storageKey = `ob_tip_${tipId}`;

  const alreadySeen = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem(storageKey) === "true",
    () => true // SSR: pretend seen
  );

  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alreadySeen && !forceShow) return;
    const timer = setTimeout(() => {
      setMounted(true);
      // Small delay for entrance animation
      requestAnimationFrame(() => setVisible(true));
    }, delay);
    return () => clearTimeout(timer);
  }, [alreadySeen, delay, forceShow]);

  const dismiss = (): void => {
    setVisible(false);
    localStorage.setItem(storageKey, "true");
    setTimeout(() => setMounted(false), 200);
  };

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const arrowClasses: Record<string, string> = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-yellow-400 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-yellow-400 border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-yellow-400 border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-yellow-400 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div ref={containerRef} className="relative inline-flex">
      {children}
      {mounted && (
        <div
          className={cn(
            "absolute z-[100] transition-all duration-200",
            positionClasses[position],
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <div className="relative bg-yellow-400 text-slate-800 rounded-xl px-3.5 py-2.5 shadow-lg shadow-yellow-200/50 max-w-[260px] min-w-[180px]">
            {/* Arrow */}
            <div
              className={cn(
                "absolute w-0 h-0 border-[6px]",
                arrowClasses[position]
              )}
            />
            <div className="flex items-start gap-2">
              <p className="text-xs font-medium leading-relaxed flex-1">
                {message}
              </p>
              <button
                onClick={dismiss}
                className="shrink-0 p-0.5 rounded-md hover:bg-yellow-500/50 transition-colors mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={dismiss}
              className="mt-1.5 text-[10px] font-bold text-yellow-800/80 hover:text-yellow-900 transition-colors"
            >
              了解！👍
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
