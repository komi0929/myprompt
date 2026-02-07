"use client";

import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { X, Github, Check, Lock, Eye, Copy, Pencil, Star, GitBranch, History, Zap, Shield } from "lucide-react";

export default function LoginModal(): React.ReactElement | null {
  const { showLoginModal, loginAction, closeLoginModal } = useAuthGuard();
  const { signInWithGitHub } = useAuth();

  if (!showLoginModal) return null;

  const handleGitHub = async (): Promise<void> => {
    try {
      await signInWithGitHub();
    } catch {
      // OAuth redirect will handle the rest
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeLoginModal}>
      <div
        className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-linear-to-br from-yellow-400 via-yellow-300 to-amber-200 px-6 pt-6 pb-5 text-center">
          <button onClick={closeLoginModal} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-black/10 transition-colors">
            <X className="w-4 h-4 text-slate-700" />
          </button>
          <div className="text-3xl mb-2">✨</div>
          <h2 className="text-lg font-semibold text-slate-800">
            GitHubで始めよう
          </h2>
          {loginAction && (
            <p className="text-xs text-slate-600 mt-1">
              「{loginAction}」にはログインが必要です
            </p>
          )}
        </div>

        {/* Comparison Table */}
        <div className="px-5 pt-4 pb-3">
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-50 text-center text-[10px] font-semibold text-slate-400 py-2 border-b border-slate-100">
              <span>機能</span>
              <span>ゲスト</span>
              <span className="text-yellow-600">メンバー</span>
            </div>
            <CompRow icon={<Eye className="w-3 h-3" />} label="閲覧" guest check />
            <CompRow icon={<Copy className="w-3 h-3" />} label="コピー" guest check />
            <CompRow icon={<Pencil className="w-3 h-3" />} label="作成・編集" check />
            <CompRow icon={<Star className="w-3 h-3" />} label="お気に入り" check />
            <CompRow icon={<GitBranch className="w-3 h-3" />} label="アレンジ" check />
            <CompRow icon={<History className="w-3 h-3" />} label="履歴" check last />
          </div>
        </div>

        {/* GitHub CTA */}
        <div className="px-5 pb-5 space-y-3">
          <button
            onClick={handleGitHub}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-slate-300/40 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            <Github className="w-5 h-5" />
            GitHubアカウントでログイン
          </button>

          {/* Benefits */}
          <div className="flex items-center justify-center gap-4 text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              ワンクリック
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" />
              安全な認証
            </span>
            <span className="flex items-center gap-1">
              <Github className="w-3 h-3 text-slate-400" />
              開発者向け
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompRow({
  icon,
  label,
  guest,
  check,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  guest?: boolean;
  check?: boolean;
  last?: boolean;
}): React.ReactElement {
  return (
    <div className={`grid grid-cols-3 text-center items-center py-2 text-xs ${last ? "" : "border-b border-slate-50"}`}>
      <span className="flex items-center justify-center gap-1 text-slate-500 font-medium">
        {icon} {label}
      </span>
      <span>
        {guest ? (
          <Check className="w-3.5 h-3.5 text-green-500 mx-auto" />
        ) : (
          <Lock className="w-3 h-3 text-slate-200 mx-auto" />
        )}
      </span>
      <span>
        {check ? (
          <Check className="w-3.5 h-3.5 text-yellow-500 mx-auto" />
        ) : (
          <Lock className="w-3 h-3 text-slate-200 mx-auto" />
        )}
      </span>
    </div>
  );
}
