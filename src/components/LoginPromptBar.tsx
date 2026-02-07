"use client";

import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Sparkles } from "lucide-react";

export default function LoginPromptBar(): React.ReactElement | null {
  const { isGuest, isLoading } = useAuth();
  const { openLoginModal } = useAuthGuard();

  if (isLoading || !isGuest) return null;

  return (
    <div className="mt-auto px-1 pb-1 pt-4">
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
        <p className="text-xs text-slate-400 leading-relaxed">
          ログインすれば無料ですべての機能が使えます
        </p>
        <button
          onClick={() => openLoginModal()}
          className="w-full flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-4 py-2.5 rounded-lg shadow-sm shadow-yellow-200/60 hover:shadow-yellow-300/60 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Sparkles className="w-4 h-4" />
          無料ではじめる
        </button>
      </div>
    </div>
  );
}
