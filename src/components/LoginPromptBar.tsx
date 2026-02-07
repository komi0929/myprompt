"use client";

import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Sparkles } from "lucide-react";

export default function LoginPromptBar(): React.ReactElement | null {
  const { isGuest, isLoading } = useAuth();
  const { openLoginModal } = useAuthGuard();

  if (isLoading || !isGuest) return null;

  return (
    <div className="fixed bottom-8 left-8 z-70 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
      {/* Hint text */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-lg">↩</span>
        <span className="leading-tight">
          ログインすれば無料で<br />もっと使えます
        </span>
      </div>
      {/* CTA Button */}
      <button
        onClick={() => openLoginModal()}
        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-bold px-6 py-3.5 rounded-[20px] shadow-lg shadow-yellow-200/60 hover:shadow-yellow-300/60 transition-all hover:scale-105 active:scale-95 text-sm"
      >
        <Sparkles className="w-4 h-4" />
        無料ではじめる
      </button>
    </div>
  );
}
