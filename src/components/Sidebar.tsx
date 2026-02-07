"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Home, Flame, Star, Lock, Globe, LogOut, User } from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";

export function Sidebar({ className }: { className?: string }): React.ReactElement {
  const { view, setView, visibilityFilter, setVisibilityFilter } = usePromptStore();
  const { isGuest, displayName, avatarUrl, signOut } = useAuth();
  const { openLoginModal } = useAuthGuard();

  return (
    <div
      className={cn(
        "flex h-full w-[240px] flex-col border-r border-slate-100 bg-slate-50/50 p-6",
        className
      )}
    >
      {/* Logo Area */}
      <div className="mb-10 flex items-center space-x-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 font-bold text-slate-800 shadow-sm text-xl shadow-yellow-200">
          M
        </div>
        <span className="text-xl font-bold text-slate-700 tracking-tight">MyPrompt</span>
      </div>

      {/* User Info */}
      <div className="mb-6 px-2">
        {isGuest ? (
          <button
            onClick={() => openLoginModal()}
            className="flex items-center gap-3 w-full p-3 rounded-[16px] bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-600">ログインする</p>
              <p className="text-[10px] text-slate-400">全機能が使えます</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-[16px] bg-white border border-slate-100">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{displayName || "ユーザー"}</p>
              <p className="text-[10px] text-slate-400">メンバー</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" title="ログアウト">
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="space-y-2">
        <NavButton icon={Home} label="マイライブラリ" hint="自分のプロンプト" active={view === "library"} onClick={() => setView("library")} />
        <NavButton icon={Flame} label="みんなのプロンプト" hint="公開されたプロンプト" active={view === "trend"} onClick={() => setView("trend")} />
        <NavButton icon={Star} label="お気に入り" hint="☆をつけたもの" active={view === "favorites"} onClick={() => setView("favorites")} />
      </div>

      <div className="my-8 h-px w-full bg-slate-200/60" />

      {/* Filters */}
      <div className="px-4 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        絞り込み
      </div>
      <div className="space-y-1">
        <NavButton
          icon={Lock}
          label="自分のみ"
          active={visibilityFilter === "Private"}
          onClick={() => setVisibilityFilter(visibilityFilter === "Private" ? "all" : "Private")}
          className="opacity-70 hover:opacity-100"
        />
        <NavButton
          icon={Globe}
          label="みんなに公開"
          active={visibilityFilter === "Public"}
          onClick={() => setVisibilityFilter(visibilityFilter === "Public" ? "all" : "Public")}
          className="opacity-70 hover:opacity-100"
        />
      </div>

      {/* Bottom credit */}
      <div className="mt-auto pt-6 px-3">
        <p className="text-[10px] text-slate-300 font-mono">v0.2 — Made with ❤️</p>
      </div>
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  hint,
  active,
  onClick,
  className,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}): React.ReactElement {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start gap-3 font-bold rounded-[20px] h-auto py-3 text-sm flex-col items-start",
        active
          ? "bg-white text-slate-800 shadow-sm border-slate-100 shadow-slate-100"
          : "text-slate-500 hover:text-slate-800 hover:bg-white/80",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-[18px] w-[18px]", active ? "text-yellow-500 fill-yellow-500" : "text-slate-400")} />
        {label}
      </div>
      {hint && (
        <span className="text-[10px] text-slate-400 font-normal pl-[30px] -mt-1">{hint}</span>
      )}
    </Button>
  );
}
