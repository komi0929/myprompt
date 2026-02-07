"use client";

import { useState } from "react";
import { Sparkles, X, BookOpen, Search, Star } from "lucide-react";

function getInitialVisibility(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem("myprompt-welcomed");
}

export default function WelcomeOverlay({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement | null {
  const [visible, setVisible] = useState(getInitialVisibility());

  if (!visible) return null;

  const handleDismiss = (): void => {
    localStorage.setItem("myprompt-welcomed", "true");
    setVisible(false);
  };

  const handleCreate = (): void => {
    handleDismiss();
    onCreateFirst();
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-200 px-6 pt-8 pb-6 text-center relative">
          <button onClick={handleDismiss} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-black/10 transition-colors">
            <X className="w-4 h-4 text-slate-700" />
          </button>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-white/80 mb-4 shadow-md">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-1">
            MyPromptへようこそ！
          </h2>
          <p className="text-sm text-slate-600">
            AIプロンプトを保存・整理・共有できるツール
          </p>
        </div>

        {/* Features */}
        <div className="p-5 space-y-3">
          <FeatureRow
            icon={<BookOpen className="w-4 h-4 text-yellow-500" />}
            title="プロンプトを保存"
            description="ChatGPT、Cursor、Claudeで使うプロンプトをまとめて管理"
          />
          <FeatureRow
            icon={<Search className="w-4 h-4 text-yellow-500" />}
            title="フェーズで整理"
            description="企画・設計・実装など、開発フェーズごとに自動分類"
          />
          <FeatureRow
            icon={<Star className="w-4 h-4 text-yellow-500" />}
            title="アレンジ＆共有"
            description="他の人のプロンプトを参考に、自分用にカスタマイズ"
          />
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            <Sparkles className="w-4 h-4" />
            最初のプロンプトを作成する
          </button>
          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            あとで見る
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-50 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
