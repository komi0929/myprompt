"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Home, Flame, Lock, Globe, LogOut, User, Bell } from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useState } from "react";
import type { AppNotification } from "@/lib/prompt-store";

export function Sidebar({ className }: { className?: string }): React.ReactElement {
  const { view, setView, visibilityFilter, setVisibilityFilter, notifications, unreadCount, markAllNotificationsRead } = usePromptStore();
  const { isGuest, displayName, avatarUrl, signOut } = useAuth();
  const { openLoginModal } = useAuthGuard();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleToggleNotifications = (): void => {
    setShowNotifications(prev => !prev);
    if (!showNotifications) markAllNotificationsRead();
  };

  return (
    <div
      className={cn(
        "flex h-full w-[240px] flex-col border-r border-slate-200/80 bg-white p-5",
        className
      )}
    >
      {/* Logo Area */}
      <div className="mb-8 flex items-center justify-between px-1">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-400 font-bold text-slate-800 shadow-sm text-lg">
            M
          </div>
          <span className="text-lg font-semibold text-slate-800">MyPrompt</span>
        </div>
        {/* Notification bell */}
        <button
          onClick={handleToggleNotifications}
          className="relative p-1.5 rounded-md hover:bg-slate-100 transition-colors"
          title="通知"
        >
          <Bell className={cn("w-4 h-4", unreadCount > 0 ? "text-yellow-500" : "text-slate-400")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-pink-500 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notification Panel (inline) */}
      {showNotifications && (
        <NotificationPanel
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {/* User Info */}
      <div className="mb-5 px-1">
        {isGuest ? (
          <button
            onClick={() => openLoginModal()}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-700">ログインする</p>
              <p className="text-[10px] text-slate-400">全機能が使えます</p>
            </div>
          </button>
        ) : (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-8 w-8 rounded-lg" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-white text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{displayName || "ユーザー"}</p>
              <p className="text-[10px] text-slate-400">メンバー</p>
            </div>
            <button onClick={signOut} className="p-1.5 rounded-md hover:bg-slate-200/60 transition-colors" title="ログアウト">
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="space-y-1">
        <NavButton icon={Home} label="マイライブラリ" hint="自分のメモ＋お気に入り" active={view === "library"} onClick={() => setView("library")} />
        <NavButton icon={Flame} label="みんなのプロンプト" hint="公開されたプロンプト" active={view === "trend"} onClick={() => setView("trend")} />
      </div>

      <div className="my-6 h-px w-full bg-slate-200/60" />

      {/* Filters */}
      <div className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
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
      <div className="mt-auto pt-6 px-2">
        <p className="text-[10px] text-slate-300 font-mono">v0.3 — Made with ❤️</p>
      </div>
    </div>
  );
}

/* ─── Inline Notification Panel ─── */
function NotificationPanel({ notifications, onClose }: { notifications: AppNotification[]; onClose: () => void }): React.ReactElement {
  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">通知</span>
        <button onClick={onClose} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
          閉じる
        </button>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            まだ通知はありません
          </div>
        ) : (
          notifications.slice(0, 10).map(n => (
            <div
              key={n.id}
              className={cn(
                "px-3 py-2.5 border-b border-slate-50 last:border-0 text-xs transition-colors",
                !n.read && "bg-yellow-50/50"
              )}
            >
              <div className="flex items-start gap-2">
                <span className="text-sm mt-0.5">
                  {n.type === "like" ? "👍" : "⭐"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 leading-tight">
                    <span className="font-semibold">{n.actorName}</span>
                    {n.type === "like" ? " がいいね！しました" : " がお気に入りに追加しました"}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    「{n.promptTitle}」
                  </p>
                </div>
              </div>
              <p className="text-[9px] text-slate-300 mt-1 pl-6">
                {new Date(n.timestamp).toLocaleString("ja-JP")}
              </p>
            </div>
          ))
        )}
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
        "w-full justify-start gap-3 font-semibold rounded-lg h-auto py-2.5 text-sm flex-col items-start",
        active
          ? "bg-slate-50 text-slate-800 shadow-sm border-slate-200"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("h-[16px] w-[16px]", active ? "text-yellow-500" : "text-slate-400")} />
        {label}
      </div>
      {hint && (
        <span className="text-[10px] text-slate-400 font-normal pl-[28px] -mt-1">{hint}</span>
      )}
    </Button>
  );
}
