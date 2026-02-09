"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, ChevronLeft, X, Sparkles, Search, Copy, Flame, BookOpen } from "lucide-react";

/* ─── Tour Steps ─── */
interface TourStep {
  id: string;
  emoji: string;
  title: string;
  description: string;
  highlightSelector?: string; // CSS selector to spotlight
  position?: "center" | "bottom" | "top";
  icon: React.ReactNode;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    emoji: "🎉",
    title: "マイプロンプトへようこそ！",
    description:
      "ここはAIプロンプトの「メモ帳」です。\nChatGPTやCursorで使うプロンプトを保存して、\nいつでもワンクリックでコピーして使えます。",
    position: "center",
    icon: <Sparkles className="w-6 h-6 text-yellow-500" />,
  },
  {
    id: "create",
    emoji: "✨",
    title: "プロンプトをメモしよう",
    description:
      "右下の黄色い「メモ」ボタンから\n新しいプロンプトをメモできます。\nよく使うプロンプトを保存しておきましょう！",
    highlightSelector: "[title='新しいプロンプトをメモ']",
    position: "top",
    icon: <BookOpen className="w-6 h-6 text-yellow-500" />,
  },
  {
    id: "search",
    emoji: "🔍",
    title: "サッと検索して見つける",
    description:
      "上部の検索バーからプロンプトを検索できます。\n「#タグ名」でタグ検索もOK！\nCtrl+K でどこからでも一発検索もできます。",
    highlightSelector: "input[placeholder*='検索']",
    position: "bottom",
    icon: <Search className="w-6 h-6 text-yellow-500" />,
  },
  {
    id: "copy",
    emoji: "📋",
    title: "コピーしてすぐ使える",
    description:
      "プロンプトカードの右上にあるコピーボタン（📋）を\nクリックするだけ！クリップボードにコピーされるので、\nそのままChatGPTに貼り付けて使えます。",
    position: "center",
    icon: <Copy className="w-6 h-6 text-yellow-500" />,
  },
  {
    id: "community",
    emoji: "🔥",
    title: "みんなのプロンプトも参考に",
    description:
      "「みんなのプロンプト」タブで\n他のバイブコーダーが公開したプロンプトを見れます。\nいいね！やお気に入りもできます。",
    position: "center",
    icon: <Flame className="w-6 h-6 text-yellow-500" />,
  },
];

/* ─── localStorage check ─── */
const emptySubscribe = (): (() => void) => () => {};

export default function WelcomeOverlay({
  onCreateFirst,
}: {
  onCreateFirst: () => void;
}): React.ReactElement | null {
  const wasWelcomed = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem("myprompt-welcomed") === "true",
    () => true
  );
  const [dismissed, setDismissed] = useState(false);
  const [step, setStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const currentStep = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;

  /* ─── Highlight Element ─── */
  const updateHighlight = useCallback(() => {
    if (!currentStep?.highlightSelector) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(currentStep.highlightSelector);
    if (el) {
      setHighlightRect(el.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [currentStep]);

  // Spotlight position requires DOM measurement after render
  useEffect(() => {
    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    return () => window.removeEventListener("resize", updateHighlight);
  }, [updateHighlight]);

  if (wasWelcomed || dismissed) return null;

  const handleDismiss = (): void => {
    localStorage.setItem("myprompt-welcomed", "true");
    // Set initial milestones
    localStorage.setItem("ob_milestone_visit", "true");
    setDismissed(true);
  };

  const handleNext = (): void => {
    if (isLast) {
      handleDismiss();
      onCreateFirst();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = (): void => {
    if (step > 0) setStep((s) => s - 1);
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center">
      {/* Overlay with spotlight cutout */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {highlightRect && (
              <rect
                x={highlightRect.left - 8}
                y={highlightRect.top - 8}
                width={highlightRect.width + 16}
                height={highlightRect.height + 16}
                rx="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-mask)"
        />
      </svg>

      {/* Spotlight ring */}
      {highlightRect && (
        <div
          className="absolute pointer-events-none border-2 border-yellow-400 rounded-xl z-1 animate-pulse"
          style={{
            left: highlightRect.left - 8,
            top: highlightRect.top - 8,
            width: highlightRect.width + 16,
            height: highlightRect.height + 16,
          }}
        />
      )}

      {/* Tour Card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden",
          "animate-in fade-in zoom-in-95 duration-200"
        )}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2">
          {TOUR_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i === step
                  ? "w-6 bg-yellow-400"
                  : i < step
                    ? "bg-yellow-200"
                    : "bg-slate-200"
              )}
            />
          ))}
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-4 text-center relative">
          <button
            onClick={handleDismiss}
            className="absolute top-0 right-3 p-1.5 rounded-md hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-50 border-2 border-yellow-100 mb-4 shadow-sm">
            {currentStep.icon}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">{currentStep.emoji}</span>
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">
              {currentStep.title}
            </h2>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">
            {currentStep.description}
          </p>
        </div>

        {/* Step indicator text */}
        <div className="px-6 text-center mb-1">
          <span className="text-[10px] text-slate-400 font-medium">
            ステップ {step + 1} / {TOUR_STEPS.length}
          </span>
        </div>

        {/* Navigation */}
        <div className="px-5 pb-5 flex items-center gap-2.5">
          {step > 0 && (
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors px-3 py-2.5 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
              戻る
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
          >
            {isLast ? (
              <>
                <Sparkles className="w-4 h-4" />
                さっそく始める！
              </>
            ) : (
              <>
                次へ
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="pb-4 text-center">
            <button
              onClick={handleDismiss}
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              スキップして始める
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
