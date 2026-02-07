"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { X, Mail, Github, Check, Lock, Eye, Copy, Pencil, Star, GitBranch, History, Zap, Shield } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

/* Google "G" SVG icon */
function GoogleIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginModal(): React.ReactElement | null {
  const { showLoginModal, loginAction, closeLoginModal } = useAuthGuard();
  const { signInWithEmail, signUpWithEmail, signInWithGitHub, signInWithGoogle } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
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

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeLoginModal}>
      <div
        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 pt-8 pb-5 text-center">
          <button onClick={closeLoginModal} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
          <h2 className="text-xl font-bold text-slate-800">
            無料ですぐに始められます
          </h2>
          {loginAction ? (
            <p className="text-sm text-slate-500 mt-2">
              「{loginAction}」にはログインが必要です
            </p>
          ) : (
            <p className="text-sm text-slate-500 mt-2">
              登録済みの方もはじめての方もこちらからどうぞ！<br />無料ではじめられます。
            </p>
          )}
        </div>

        {/* Auth Buttons */}
        <div className="px-6 pb-6 space-y-3">
          {/* Google (primary - like Nani) */}
          <button
            onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-full shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            <GoogleIcon className="w-5 h-5" />
            Googleでログイン
          </button>

          {/* GitHub */}
          <button
            onClick={() => signInWithGitHub()}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-full border border-slate-200 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            <Github className="w-5 h-5" />
            GitHubでログイン
          </button>

          {/* Email toggle */}
          {!showEmailForm ? (
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              メールアドレスでログイン
            </button>
          ) : (
            <div className="pt-1 space-y-2.5">
              <div className="flex items-center gap-3 text-[10px] text-slate-300">
                <div className="flex-1 h-px bg-slate-200" />
                <span>メールアドレスで{mode === "login" ? "ログイン" : "新規登録"}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="メールアドレス"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
                />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="パスワード"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-[1.01] active:scale-[0.99] text-sm disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                  {loading ? "処理中..." : mode === "login" ? "メールでログイン" : "アカウントを作成"}
                </button>
              </form>
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-0.5"
              >
                {mode === "login" ? "アカウントをお持ちでないですか？ 新規登録" : "すでにアカウントをお持ちですか？ ログイン"}
              </button>
            </div>
          )}

          {/* Comparison Table (collapsed) */}
          <details className="group pt-1">
            <summary className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 text-center list-none flex items-center justify-center gap-1.5 transition-colors">
              <Zap className="w-3 h-3 text-yellow-500" />
              ログインするとできること
              <span className="group-open:rotate-180 transition-transform text-slate-300">▾</span>
            </summary>
            <div className="mt-3 rounded-xl border border-slate-100 overflow-hidden">
              <div className="grid grid-cols-3 bg-slate-50 text-center text-[10px] font-semibold text-slate-400 py-2 border-b border-slate-100">
                <span>機能</span>
                <span>ゲスト</span>
                <span className="text-yellow-600">メンバー</span>
              </div>
              <CompRow icon={<Eye className="w-3 h-3" />} label="閲覧" guest check />
              <CompRow icon={<Copy className="w-3 h-3" />} label="コピー" guest check />
              <CompRow icon={<Pencil className="w-3 h-3" />} label="メモ・編集" check />
              <CompRow icon={<Star className="w-3 h-3" />} label="お気に入り" check />
              <CompRow icon={<GitBranch className="w-3 h-3" />} label="カスタマイズ" check />
              <CompRow icon={<History className="w-3 h-3" />} label="履歴" check last />
            </div>
          </details>

          {/* Footer */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-green-500" />
              安全な認証
            </span>
            <span>·</span>
            <span>完全無料</span>
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
