"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Home, Flame, User, Bell, Copy, Clock, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import Image from "next/image";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useState } from "react";
import type { AppNotification } from "@/lib/prompt-store";
import type { Prompt } from "@/lib/types";
import { copyToClipboard } from "@/components/ui/Toast";

export function Sidebar({ className }: { className?: string }): React.ReactElement {
  const { view, setView, notifications, unreadCount, markAllNotificationsRead, getRecentlyUsed, setSelectedPromptId, incrementUseCount } = usePromptStore();
  const { authStatus, displayName, avatarUrl } = useAuth();
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
        <Image
          src="/logo.png"
          alt="マイプロンプト"
          width={400}
          height={100}
          className="h-10 w-auto"
          priority
        />
        {/* Notification bell */}
        <button
          onClick={handleToggleNotifications}
          className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
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

      {/* Main Navigation */}
      <div className="space-y-1">
        <NavButton icon={Home} label="ライブラリ" hint="自分のメモとお気に入り" active={view === "library"} onClick={() => setView("library")} />
        <NavButton icon={Flame} label="みんなのプロンプト" hint="公開されたプロンプト" active={view === "trend"} onClick={() => setView("trend")} />
      </div>

      {/* Guide Link */}
      <div className="mt-3 px-1">
        <Link
          href="/guide"
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          <span>使い方ガイド</span>
        </Link>
      </div>

      {/* Feedback Link */}
      <div className="mt-1.5 px-1">
        <Link
          href="/feedback"
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 hover:text-yellow-700 hover:bg-yellow-50 border border-dashed border-slate-200 hover:border-yellow-300 transition-all"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>改善提案・バグ報告</span>
        </Link>
      </div>

      {/* Recently Used */}
      <RecentlyUsedSection
        getRecentlyUsed={getRecentlyUsed}
        onSelect={setSelectedPromptId}
        onCopy={incrementUseCount}
      />


      {/* Bottom: User Info pushed to bottom */}
      <div className="mt-auto pt-6 px-1">
        {authStatus === "loading" ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 animate-pulse">
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-3 w-16 rounded bg-slate-200" />
          </div>
        ) : authStatus === "guest" ? (
          <button
            onClick={() => openLoginModal()}
            className="flex items-center gap-3 w-full p-3 rounded-lg bg-yellow-50 border border-yellow-200 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-700">ログインする</p>
              <p className="text-[10px] text-slate-400">全機能が使えます</p>
            </div>
          </button>
        ) : (
          <Link href="/account" className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 hover:bg-slate-100 transition-colors w-full">
            <div className="relative">
              {avatarUrl ? (
                avatarUrl.startsWith("http") ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  </>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200 text-lg">
                    {avatarUrl}
                  </div>
                )
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-pink-500 border-2 border-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{displayName || "ユーザー"}</p>
              {unreadCount > 0 && (
                <p className="text-[10px] text-pink-500 font-medium">{unreadCount}件の通知</p>
              )}
            </div>
          </Link>
        )}
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
            <p>まだ通知はありません</p>
            <p className="mt-1 text-[10px] text-slate-300">プロンプトを公開するとリアクション通知が届きます ✨</p>
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
              <p className="text-[9px] text-slate-400 mt-1 pl-6">
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
        "w-full justify-start gap-3 font-semibold rounded-lg h-auto py-2.5 text-sm flex-col items-start relative",
        active
          ? "bg-slate-50 text-slate-800 shadow-sm border-slate-200 border-l-3 border-l-yellow-400"
          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn("w-4 h-4", active ? "text-yellow-500" : "text-slate-400")} />
        {label}
      </div>
      {hint && (
        <span className="text-[10px] text-slate-400 font-normal pl-7 -mt-1">{hint}</span>
      )}
    </Button>
  );
}

/* ─── Recently Used Section ─── */
function RecentlyUsedSection({
  getRecentlyUsed,
  onSelect,
  onCopy,
}: {
  getRecentlyUsed: () => Prompt[];
  onSelect: (id: string) => void;
  onCopy: (id: string) => void;
}): React.ReactElement {
  const recent = getRecentlyUsed();
  if (recent.length === 0) return <></>;

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">最近使った</span>
      </div>
      <div className="space-y-0.5">
        {recent.map(p => (
          <div
            key={p.id}
            className="group flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={() => onSelect(p.id)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-600 truncate">{p.title}</p>
              <p className="text-[10px] text-slate-400 truncate">{p.content.slice(0, 30)}</p>
            </div>
            <button
              onClick={e => {
                e.stopPropagation();
                copyToClipboard(p.content, "コピーしました ✨");
                onCopy(p.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 transition-all"
              title="コピー"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
