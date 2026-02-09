"use client";

import { cn } from "@/lib/utils";
import { Library, TrendingUp, Plus, User, HelpCircle } from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import Link from "next/link";

export default function BottomNav(): React.ReactElement {
  const { view, setView, openEditor } = usePromptStore();
  const { isGuest } = useAuth();
  const { requireAuth } = useAuthGuard();

  const handleCreate = (): void => {
    if (requireAuth("プロンプトのメモ")) {
      openEditor();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 px-2 py-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <NavItem
          icon={<Library className="w-5 h-5" />}
          label="ライブラリ"
          active={view === "library"}
          onClick={() => setView("library")}
        />
        <NavItem
          icon={<TrendingUp className="w-5 h-5" />}
          label="みんなの"
          active={view === "trend"}
          onClick={() => setView("trend")}
        />
        {/* Center create button */}
        {!isGuest && (
          <button
            onClick={handleCreate}
            className="flex items-center justify-center w-12 h-12 -mt-4 rounded-full bg-yellow-400 text-white shadow-lg shadow-yellow-200 hover:bg-yellow-500 active:scale-95 transition-all"
          >
            <Plus className="w-6 h-6 text-slate-800" />
          </button>
        )}
        <Link href="/guide" className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px]">
          <HelpCircle className="w-5 h-5 text-slate-400" />
          <span className="text-[11px] text-slate-400">ガイド</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px]">
          <User className="w-5 h-5 text-slate-400" />
          <span className="text-[11px] text-slate-400">アカウント</span>
        </Link>
      </div>
    </nav>
  );
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] rounded-xl transition-colors relative",
        active ? "text-yellow-600" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      <span className={cn("text-[11px]", active && "font-semibold")}>{label}</span>
      {active && (
        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-yellow-500" />
      )}
    </button>
  );
}
