"use client";

import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Sparkles } from "lucide-react";

export default function LoginPromptBar(): React.ReactElement | null {
  const { isGuest, isLoading } = useAuth();
  const { openLoginModal } = useAuthGuard();

  if (isLoading || !isGuest) return null;

  return (
    <div className="fixed bottom-6 left-6 z-70 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <span className="text-lg">↩</span>
        <span className="leading-tight text-xs">
          ログインすれば無料で<br />もっと使えます
        </span>
      </div>
      <button
        onClick={() => openLoginModal()}
        className="flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-5 py-2.5 rounded-lg shadow-md shadow-yellow-200/60 hover:shadow-yellow-300/60 transition-all hover:scale-105 active:scale-[0.97] text-sm"
      >
        <Sparkles className="w-4 h-4" />
        無料ではじめる
      </button>
    </div>
  );
}
