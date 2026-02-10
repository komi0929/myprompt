"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Search, Copy, Sparkles, ChevronDown, ChevronUp,
  Flame, Star, ArrowLeft, Tag,
  Download, Upload, Heart, Eye, Plus, Layers, Command,
  HelpCircle,
} from "lucide-react";

/* ─── FAQ Data ─── */
const FAQ_ITEMS = [
  {
    q: "ログインしなくても使えますか？",
    a: "みんなのプロンプトの閲覧やいいね！はログイン不要です。プロンプトのメモやお気に入り登録にはログインが必要です。GoogleアカウントまたはGitHubアカウントで簡単にログインできます。",
  },
  {
    q: "自分のプロンプトを他の人に見せたくない場合は？",
    a: "プロンプト作成時に「公開範囲」を「プライベート」にすれば、あなただけが見れます。デフォルトはプライベートなので安心です。",
  },
  {
    q: "プロンプトを間違えて削除した場合は？",
    a: "現時点では削除の取り消しはできません。大切なプロンプトは事前にエクスポート機能でバックアップを取ることをおすすめします。",
  },
  {
    q: "テンプレート変数って何ですか？",
    a: "プロンプト内に {{変数名}} と書くと、コピー時に好きな値に置き換えられます。例えば「{{言語}}で{{機能}}を実装して」と書けば、毎回違うプロンプトとして使い回せます。",
  },
  {
    q: "フェーズって何ですか？",
    a: "バイブコーディングの開発工程を表します。「企画」「設計」「実装」「テスト」「公開」「改善」の6フェーズがあり、プロンプトをフェーズごとに整理できます。",
  },
  {
    q: "データはどこに保存されますか？",
    a: "クラウド（Supabase）に安全に保存されます。どのデバイスからでも同じアカウントでログインすればアクセスできます。",
  },
];

/* ─── Shortcut Data ─── */
const SHORTCUTS = [
  { keys: ["Ctrl", "K"], description: "プロンプトを検索してコピー" },
  { keys: ["Ctrl", "N"], description: "新しいプロンプトをメモ" },
  { keys: ["↑", "↓"], description: "プロンプトを選択移動" },
  { keys: ["C"], description: "選択中のプロンプトをコピー" },
  { keys: ["Esc"], description: "選択解除 / モーダルを閉じる" },
];

export default function GuidePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ホームに戻る</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-12 pb-24">
        {/* Hero */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-yellow-50 border-2 border-yellow-100 shadow-sm mx-auto">
            <Image
              src="/mascot.png"
              alt="マイプロンプト"
              width={56}
              height={56}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            マイプロンプトの使い方
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            バイブコーディングのお供に。<br />
            よく使うAIプロンプトをメモして、すぐコピーして使えるサイトです。
          </p>
        </section>

        {/* Section 1: 30秒でわかる概要 */}
        <section className="space-y-4">
          <SectionHeader emoji="🚀" title="30秒でわかるマイプロンプト" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-600 leading-relaxed">
              マイプロンプトは、<strong>AIプロンプトのメモ帳</strong>です。
              ChatGPT、Cursor、Claude、Copilotなどで使うプロンプトをここに保存しておけば、
              いつでも<strong>ワンクリックでコピー</strong>してすぐに使えます。
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <HighlightCard emoji="📝" label="メモする" description="プロンプトを保存" color="yellow" />
              <HighlightCard emoji="📋" label="コピーする" description="ワンクリックで" color="blue" />
              <HighlightCard emoji="🤖" label="使う" description="AIにペーストするだけ" color="green" />
            </div>
          </div>
        </section>

        {/* Section 2: 基本の3ステップ */}
        <section className="space-y-4">
          <SectionHeader emoji="✨" title="基本の3ステップ" />
          <div className="space-y-4">
            <StepCard
              number={1}
              icon={<Plus className="w-5 h-5 text-yellow-600" />}
              title="プロンプトをメモする"
              description="右下の黄色い「メモ」ボタンをクリック → タイトルとプロンプト内容を入力 → 保存。これだけでメモ完了！"
              tip="💡 テンプレート変数 {{変数名}} を使うとプロンプトの使い回しが簡単に"
            />
            <StepCard
              number={2}
              icon={<Copy className="w-5 h-5 text-blue-600" />}
              title="コピーして使う"
              description="保存したプロンプトカードの右上にあるコピーアイコン（📋）をクリックするだけ。クリップボードに自動コピーされます。"
              tip="💡 Ctrl+K で検索してすぐコピーすることもできます"
            />
            <StepCard
              number={3}
              icon={<Sparkles className="w-5 h-5 text-purple-600" />}
              title="AIに貼り付ける"
              description="ChatGPTやCursorなど、いつものAIツールにペーストするだけ。プロンプトの入力ミスもなくなります！"
              tip="💡 コピーしたプロンプトは「コピーバッファ」に一時保管されます"
            />
          </div>
        </section>

        {/* Section 3: 便利機能 */}
        <section className="space-y-4">
          <SectionHeader emoji="🔧" title="便利機能の使い方" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon={<Search className="w-5 h-5 text-slate-600" />}
              title="検索"
              description="上部の検索バーまたはCtrl+Kで素早くプロンプトを探せます。#タグ名でタグ検索も可能。"
            />
            <FeatureCard
              icon={<Layers className="w-5 h-5 text-slate-600" />}
              title="フェーズ分類"
              description="企画→設計→実装→テスト→公開→改善の6フェーズでプロンプトを整理できます。"
            />
            <FeatureCard
              icon={<Tag className="w-5 h-5 text-slate-600" />}
              title="タグ付け"
              description="自由にタグを付けて分類。同じタグのプロンプトを一覧表示できます。"
            />
            <FeatureCard
              icon={<Command className="w-5 h-5 text-slate-600" />}
              title="テンプレート変数"
              description="{{変数名}} でプロンプトの一部を変えて使い回し。変数ごとに値を入れてコピーできます。"
            />
            <FeatureCard
              icon={<Download className="w-5 h-5 text-slate-600" />}
              title="エクスポート"
              description="プロンプトをJSON形式でエクスポート。バックアップや別環境への移行に。"
            />
            <FeatureCard
              icon={<Upload className="w-5 h-5 text-slate-600" />}
              title="インポート"
              description="JSONファイルからプロンプトを一括インポート。データの復元にも使えます。"
            />
          </div>
        </section>

        {/* Section 4: みんなのプロンプト */}
        <section className="space-y-4">
          <SectionHeader emoji="🔥" title="みんなのプロンプト活用法" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">みんなのタブで発見</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  サイドバー（またはモバイルの下部ナビ）の「みんなのプロンプト」タブで、他のバイブコーダーが公開したプロンプトを閲覧できます。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-pink-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">いいね！で評価</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  気に入ったプロンプトに「いいね！」ができます。ログイン不要。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">お気に入りでストック</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  他の人のプロンプトをお気に入り登録すると、自分のライブラリに表示されます。（要ログイン）
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700">自分のプロンプトを公開</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  プロンプト編集画面で公開範囲を「パブリック」にすると、みんなのプロンプトに掲載されます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: FAQ */}
        <section className="space-y-4">
          <SectionHeader emoji="❓" title="よくある質問" />
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <FaqAccordion key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </section>

        {/* Section 6: ショートカット */}
        <section className="space-y-4">
          <SectionHeader emoji="⌨️" title="キーボードショートカット" />
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">キー</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {SHORTCUTS.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        {s.keys.map((k) => (
                          <kbd
                            key={k}
                            className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono text-slate-600"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center space-y-3 pt-4">
          <p className="text-sm text-slate-500">
            さっそくプロンプトをメモしてみましょう！
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-8 py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-105 active:scale-[0.97] text-sm"
          >
            <Sparkles className="w-4 h-4" />
            ホームに戻る
          </Link>
        </section>
      </main>
    </div>
  );
}

/* ─── Sub Components ─── */
function SectionHeader({ emoji, title }: { emoji: string; title: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl">{emoji}</span>
      <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
    </div>
  );
}

function HighlightCard({
  emoji,
  label,
  description,
  color,
}: {
  emoji: string;
  label: string;
  description: string;
  color: string;
}): React.ReactElement {
  const colorMap: Record<string, string> = {
    yellow: "bg-yellow-50 border-yellow-200",
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
  };
  return (
    <div className={cn("flex flex-col items-center p-4 rounded-xl border", colorMap[color] || colorMap.yellow)}>
      <span className="text-2xl mb-1">{emoji}</span>
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <span className="text-[10px] text-slate-500">{description}</span>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  description,
  tip,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  tip: string;
}): React.ReactElement {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden">
      <div className="absolute -top-2 -left-2 w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center opacity-60">
        <span className="text-xl font-black text-yellow-400">{number}</span>
      </div>
      <div className="flex items-start gap-3 ml-8">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-slate-700">{title}</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
          <div className="mt-2 text-[11px] text-yellow-700 bg-yellow-50 rounded-lg px-3 py-1.5 border border-yellow-100">
            {tip}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

function FaqAccordion({ question, answer }: { question: string; answer: string }): React.ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-yellow-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700">{question}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-3 pt-0 ml-6">
          <p className="text-xs text-slate-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
