"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/* ─── Public API ─── */
export type CelebrationType = "save" | "share";

interface CelebrationMessage {
  id: number;
  type: CelebrationType;
}

let celebrationId = 0;
const listeners: Array<(msg: CelebrationMessage) => void> = [];

export function showCelebration(type: CelebrationType): void {
  const msg: CelebrationMessage = { id: celebrationId++, type };
  listeners.forEach(fn => fn(msg));
}

/* ─── Particle System ─── */
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  delay: number;
  duration: number;
  shape: "circle" | "square" | "star";
}

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
  "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * -50 - 10,
    size: Math.random() * 8 + 4,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    delay: Math.random() * 0.5,
    duration: Math.random() * 1.5 + 1.5,
    shape: (["circle", "square", "star"] as const)[Math.floor(Math.random() * 3)],
  }));
}

/* ─── Component ─── */
export default function SuccessCelebration(): React.ReactElement | null {
  const [celebration, setCelebration] = useState<CelebrationMessage | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setIsFading(true);
    timerRef.current = setTimeout(() => {
      setCelebration(null);
      setIsVisible(false);
      setIsFading(false);
    }, 500);
  }, []);

  const handleCelebration = useCallback((msg: CelebrationMessage) => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);
    setParticles(generateParticles(40));
    setCelebration(msg);
    setIsVisible(true);
    setIsFading(false);
    // Auto-dismiss after 3s
    timerRef.current = setTimeout(dismiss, 3000);
  }, [dismiss]);

  useEffect(() => {
    listeners.push(handleCelebration);
    return () => {
      const idx = listeners.indexOf(handleCelebration);
      if (idx >= 0) listeners.splice(idx, 1);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleCelebration]);

  if (!celebration || !isVisible) return null;

  const isSave = celebration.type === "save";

  return (
    <div
      className={cn(
        "fixed inset-0 z-9999 flex items-center justify-center transition-opacity duration-500",
        isFading ? "opacity-0" : "opacity-100"
      )}
      onClick={dismiss}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* Confetti particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute animate-confetti-fall"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.shape !== "star" ? p.color : "transparent",
              borderRadius: p.shape === "circle" ? "50%" : p.shape === "square" ? "2px" : "0",
              transform: `rotate(${p.rotation}deg)`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              ...(p.shape === "star" ? {
                clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
                backgroundColor: p.color,
              } : {}),
            }}
          />
        ))}
      </div>

      {/* Main celebration card */}
      <div
        className={cn(
          "relative z-10 flex flex-col items-center gap-4 px-8 py-10 md:px-12 md:py-12 rounded-3xl shadow-2xl max-w-sm mx-4",
          "animate-celebration-pop",
          isSave
            ? "bg-linear-to-br from-yellow-50 via-white to-amber-50 border-2 border-yellow-200"
            : "bg-linear-to-br from-pink-50 via-white to-rose-50 border-2 border-pink-200"
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Emoji with pulse */}
        <div className="relative">
          <span className="text-6xl md:text-7xl block animate-celebration-bounce">
            {isSave ? "🎉" : "🙏"}
          </span>
          {/* Sparkle ring */}
          <div className={cn(
            "absolute inset-0 rounded-full animate-ping-slow",
            isSave ? "bg-yellow-200/30" : "bg-pink-200/30"
          )} style={{ transform: "scale(2)" }} />
        </div>

        {/* Title */}
        <h2 className={cn(
          "text-xl md:text-2xl font-extrabold tracking-tight text-center",
          isSave ? "text-yellow-700" : "text-pink-700"
        )}>
          {isSave ? "メモ完了！" : "シェアありがとうございます！"}
        </h2>

        {/* Message */}
        <p className={cn(
          "text-sm md:text-base font-medium text-center leading-relaxed",
          isSave ? "text-yellow-600/80" : "text-pink-600/80"
        )}>
          {isSave
            ? "ぜひご活用ください！✨"
            : "みんなの参考になります！🌟"}
        </p>

        {/* Decorative sparkles */}
        <div className="flex items-center gap-2 mt-1">
          {[0, 1, 2, 3, 4].map(i => (
            <span
              key={i}
              className="animate-twinkle text-lg"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {isSave ? "⭐" : "💕"}
            </span>
          ))}
        </div>

        {/* Hint */}
        <p className="text-[10px] text-slate-400 mt-2">タップで閉じる</p>
      </div>
    </div>
  );
}
