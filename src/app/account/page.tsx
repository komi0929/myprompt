"use client";

import { useAuth } from "@/components/AuthProvider";
import { usePromptStore, PromptStoreProvider } from "@/lib/prompt-store";
import type { AppNotification } from "@/lib/prompt-store";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, Trash2, Bell, ChevronRight, ArrowLeft, AlertTriangle, Pencil } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { showToast } from "@/components/ui/Toast";
import AvatarPicker from "@/components/AvatarPicker";

function AccountContent(): React.ReactElement {
  const { user, isGuest, displayName, avatarUrl, email, signOut, updateProfile } = useAuth();
  const { notifications, unreadCount, markAllNotificationsRead } = usePromptStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Mark all as read on mount
  useEffect(() => {
    if (unreadCount > 0) {
      markAllNotificationsRead();
    }
  }, [unreadCount, markAllNotificationsRead]);

  if (isGuest) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">ログインが必要です</h1>
          <p className="text-sm text-slate-500 mb-4">アカウント設定にアクセスするにはログインしてください。</p>
          <Link href="/" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast("JPEG, PNG, WebP, GIF形式の画像のみアップロードできます");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("画像サイズは2MB以下にしてください");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      showToast("アップロードに失敗しました");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error } = await updateProfile(displayName, newUrl);
    setUploading(false);
    if (error) {
      showToast("プロフィールの更新に失敗しました");
    } else {
      showToast("アバターを更新しました ✨");
    }
  };

  const handleSelectEmoji = async (emoji: string): Promise<void> => {
    const { error } = await updateProfile(displayName, emoji);
    if (error) {
      showToast("アイコンの更新に失敗しました");
    } else {
      showToast("アイコンを更新しました ✨");
    }
  };

  const handleNameSave = async (): Promise<void> => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      showToast("名前を入力してください");
      return;
    }
    setSaving(true);
    const { error } = await updateProfile(trimmed, avatarUrl);
    setSaving(false);
    if (error) {
      showToast("更新に失敗しました");
    } else {
      showToast("名前を更新しました ✨");
      setEditingName(false);
    }
  };

  const handleDeleteAccount = async (): Promise<void> => {
    setDeleting(true);
    try {
      if (user?.id) {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          showToast("認証情報を取得できませんでした。再ログイン後にお試しください");
          setDeleting(false);
          return;
        }
        const res = await fetch("/api/delete-account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!res.ok) {
          showToast("アカウント削除に失敗しました");
          setDeleting(false);
          return;
        }
      }
      await signOut();
      window.location.href = "/";
    } catch {
      showToast("エラーが発生しました");
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          マイプロンプトに戻る
        </Link>

        {/* Profile Card - Editable */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            {/* Avatar Picker */}
            <AvatarPicker
              currentAvatar={avatarUrl}
              displayName={displayName}
              uploading={uploading}
              onSelectEmoji={handleSelectEmoji}
              onUploadPhoto={handleAvatarUpload}
            />

            {/* Name + Email */}
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleNameSave(); }}
                    className="flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-slate-800 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {saving ? "..." : "保存"}
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameInput(displayName); }}
                    className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-800">{displayName || "ユーザー"}</h1>
                  <button
                    onClick={() => { setNameInput(displayName); setEditingName(true); }}
                    className="p-1 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    title="名前を編集"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-sm text-slate-400 mt-0.5">{email}</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-slate-700">通知</span>
              {notifications.length > 0 && (
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {notifications.length}件
                </span>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">まだ通知はありません</p>
                <p className="text-[10px] text-slate-300 mt-1">他のユーザーがいいね！やお気に入りをすると通知が届きます</p>
              </div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} />
              ))
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Logout */}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">ログアウト</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>

          {/* Delete Account */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-500">アカウントを削除</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-300" />
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">アカウントの削除</h2>
              </div>
              <p className="text-sm text-slate-500 mb-2">
                アカウントを削除すると、以下のデータがすべて削除されます：
              </p>
              <ul className="text-sm text-slate-500 space-y-1 mb-6 pl-4">
                <li>• 作成したプロンプト</li>
                <li>• お気に入り</li>
                <li>• プロフィール情報</li>
              </ul>
              <p className="text-xs text-red-500 font-medium mb-4">この操作は取り消せません。</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? "削除中..." : "削除する"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotificationItem({ notification: n }: { notification: AppNotification }): React.ReactElement {
  const icon = n.type === "like" ? "👍" : "⭐";
  const action = n.type === "like"
    ? "がいいね！しました"
    : "がお気に入りに追加しました";

  return (
    <div className="px-6 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-base mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-600 leading-snug">
            <span className="font-semibold text-slate-700">{n.actorName}</span>
            {action}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            「{n.promptTitle}」
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            {new Date(n.timestamp).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage(): React.ReactElement {
  return (
    <PromptStoreProvider>
      <AccountContent />
    </PromptStoreProvider>
  );
}
