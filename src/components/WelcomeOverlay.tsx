"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sparkles, BookOpen, Copy, Share2 } from "lucide-react";

const STORAGE_KEY = "myprompt-welcome-seen";

function getInitialVisibility(): boolean {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem(STORAGE_KEY);
}

export default function WelcomeOverlay({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement | null {
  const [visible, setVisible] = useState(getInitialVisibility);

  if (!visible) return null;

  const handleDismiss = (): void => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
  };

  const handleCreateFirst = (): void => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onCreateFirst();
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-200 px-8 pt-10 pb-8 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">
            MyPrompt へようこそ！
          </h1>
          <p className="text-slate-700/80 text-base leading-relaxed">
            開発で使えるプロンプトを<br />
            <span className="font-bold text-slate-800">保存・整理・共有</span>できるツールです
          </p>
        </div>

        {/* Features */}
        <div className="px-8 py-6 space-y-4">
          <FeatureRow
            icon={<BookOpen className="w-5 h-5 text-yellow-500" />}
            title="プロンプトをメモ"
            desc="ChatGPTやCursorで使えるプロンプトをフェーズごとに保存"
          />
          <FeatureRow
            icon={<Copy className="w-5 h-5 text-yellow-500" />}
            title="ワンクリックでコピー"
            desc="保存したプロンプトをすぐに使える"
          />
          <FeatureRow
            icon={<Share2 className="w-5 h-5 text-yellow-500" />}
            title="アレンジ & シェア"
            desc="他の人のプロンプトを参考に、自分用にカスタマイズ"
          />
        </div>

        {/* Actions */}
        <div className="px-8 pb-8 space-y-3">
          <Button
            className="w-full text-lg h-14 rounded-[20px] shadow-lg shadow-yellow-200"
            onClick={handleCreateFirst}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            最初のプロンプトを保存する
          </Button>
          <button
            onClick={handleDismiss}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-2"
          >
            あとで見る
          </button>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }): React.ReactElement {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-yellow-50 border border-yellow-100">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-700 text-sm">{title}</h3>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
