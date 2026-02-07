"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { X, Mail, Github, Check, Lock, Sparkles, Eye, Copy, Pencil, Star, GitBranch, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ui/Toast";

export default function LoginModal(): React.ReactElement | null {
  const { showLoginModal, loginAction, closeLoginModal } = useAuthGuard();
  const { signInWithEmail, signUpWithEmail, signInWithGitHub } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      showToast("メールアドレスとパスワードを入力してください");
      return;
    }
    setLoading(true);
    const fn = mode === "login" ? signInWithEmail : signUpWithEmail;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      showToast(error);
    } else {
      showToast(mode === "login" ? "ログインしました ✨" : "アカウントを作成しました ✨");
      closeLoginModal();
    }
  };

  const handleGitHub = async (): Promise<void> => {
    try {
      await signInWithGitHub();
    } catch {
      showToast("GitHubログインに失敗しました");
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeLoginModal}>
      <div
        className="w-full max-w-lg mx-4 bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-200 px-8 pt-8 pb-6 text-center">
          <button onClick={closeLoginModal} className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/10 transition-colors">
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-4xl mb-3">✨</div>
          <h2 className="text-xl font-bold text-slate-800">
            無料で全機能を使おう
          </h2>
          {loginAction && (
            <p className="text-sm text-slate-600 mt-1">
              「{loginAction}」にはログインが必要です
            </p>
          )}
        </div>

        {/* Comparison Table */}
        <div className="px-6 pt-5 pb-3">
          <div className="rounded-[20px] border border-slate-100 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-3 bg-slate-50 text-center text-[11px] font-bold text-slate-400 py-2.5 border-b border-slate-100">
              <span>機能</span>
              <span>ゲスト</span>
              <span className="text-yellow-600">メンバー（無料）</span>
            </div>
            {/* Rows */}
            <CompRow icon={<Eye className="w-3.5 h-3.5" />} label="閲覧" guest check />
            <CompRow icon={<Copy className="w-3.5 h-3.5" />} label="コピー" guest check />
            <CompRow icon={<Pencil className="w-3.5 h-3.5" />} label="作成・編集" check />
            <CompRow icon={<Star className="w-3.5 h-3.5" />} label="お気に入り" check />
            <CompRow icon={<GitBranch className="w-3.5 h-3.5" />} label="アレンジ" check />
            <CompRow icon={<History className="w-3.5 h-3.5" />} label="履歴" check last />
          </div>
        </div>

        {/* Auth Form */}
        <div className="px-6 pb-6 space-y-4">
          {/* GitHub OAuth */}
          <Button
            variant="secondary"
            className="w-full h-12 rounded-[20px] font-bold text-sm gap-2"
            onClick={handleGitHub}
          >
            <Github className="w-5 h-5" />
            GitHub でログイン
          </Button>

          <div className="flex items-center gap-3 text-xs text-slate-300">
            <div className="flex-1 h-px bg-slate-200" />
            <span>または</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="w-full h-12 px-5 rounded-[16px] border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="パスワード"
              className="w-full h-12 px-5 rounded-[16px] border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
            />
            <Button
              type="submit"
              className="w-full h-12 rounded-[20px] text-base shadow-lg shadow-yellow-200"
              disabled={loading}
            >
              <Mail className="w-4 h-4 mr-2" />
              {loading ? "処理中..." : mode === "login" ? "メールでログイン" : "アカウントを作成"}
            </Button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            {mode === "login" ? "アカウントをお持ちでないですか？ 新規登録" : "すでにアカウントをお持ちですか？ ログイン"}
          </button>
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
    <div className={`grid grid-cols-3 text-center items-center py-2.5 text-xs ${last ? "" : "border-b border-slate-50"}`}>
      <span className="flex items-center justify-center gap-1.5 text-slate-500 font-medium">
        {icon} {label}
      </span>
      <span>
        {guest ? (
          <Check className="w-4 h-4 text-green-500 mx-auto" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-200 mx-auto" />
        )}
      </span>
      <span>
        {check ? (
          <Check className="w-4 h-4 text-yellow-500 mx-auto" />
        ) : (
          <Lock className="w-3.5 h-3.5 text-slate-200 mx-auto" />
        )}
      </span>
    </div>
  );
}
