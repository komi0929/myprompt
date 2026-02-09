"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, Trophy, Sparkles } from "lucide-react";

/* ─── Milestones ─── */
interface Milestone {
  id: string;
  emoji: string;
  label: string;
  storageKey: string;
  hint: string; // action hint when clicked
}

const MILESTONES: Milestone[] = [
  { id: "visit", emoji: "🎉", label: "サイトに来た", storageKey: "ob_milestone_visit", hint: "完了！ようこそ" },
  { id: "create", emoji: "📝", label: "最初のメモ", storageKey: "ob_milestone_create", hint: "右下の「メモ」ボタンからプロンプトを作成してみましょう" },
  { id: "copy", emoji: "📋", label: "コピーした", storageKey: "ob_milestone_copy", hint: "プロンプトカードのコピーボタン（📋）をクリックしてみましょう" },
  { id: "search", emoji: "🔍", label: "検索した", storageKey: "ob_milestone_search", hint: "上部の検索バーにキーワードを入力してみましょう" },
  { id: "like", emoji: "❤️", label: "いいね！した", storageKey: "ob_milestone_like", hint: "プロンプトのハートアイコンをクリックしてみましょう" },
  { id: "publish", emoji: "🌐", label: "公開した", storageKey: "ob_milestone_publish", hint: "プロンプト編集で公開範囲を「パブリック」にしてみましょう" },
  { id: "favorite", emoji: "⭐", label: "お気に入り", storageKey: "ob_milestone_favorite", hint: "ブックマークアイコンをクリックしてお気に入りに追加しましょう" },
];

/* ─── localStorage helpers ─── */
const emptySubscribe = (): (() => void) => () => {};

function useMilestoneState(): boolean[] {
  return MILESTONES.map((m) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useSyncExternalStore(
      emptySubscribe,
      () => localStorage.getItem(m.storageKey) === "true",
      () => false
    )
  );
}

/** Mark a milestone as completed. Call from actions in prompt-store etc. */
export function markMilestone(id: string): void {
  const m = MILESTONES.find((ms) => ms.id === id);
  if (m) {
    localStorage.setItem(m.storageKey, "true");
    // Dispatch a storage event so useSyncExternalStore picks it up
    window.dispatchEvent(new Event("ob-milestone-update"));
  }
}

export default function OnboardingProgress(): React.ReactElement | null {
  const completedArr = useMilestoneState();
  const completedCount = completedArr.filter(Boolean).length;
  const total = MILESTONES.length;
  const allComplete = completedCount === total;
  const [expanded, setExpanded] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);

  // Check if the user has dismissed onboarding progress
  const isDismissed = useSyncExternalStore(
    emptySubscribe,
    () => localStorage.getItem("ob_progress_dismissed") === "true",
    () => false
  );

  if (isDismissed) return null;

  const percentage = Math.round((completedCount / total) * 100);

  const handleDismiss = (): void => {
    localStorage.setItem("ob_progress_dismissed", "true");
  };

  return (
    <div className="mb-4">
      {/* Compact bar */}
      <div
        className={cn(
          "bg-white rounded-xl border shadow-sm transition-all",
          allComplete
            ? "border-yellow-300 bg-yellow-50"
            : "border-slate-200"
        )}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left"
        >
          {allComplete ? (
            <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-700">
                {allComplete
                  ? "🎊 マスター達成！"
                  : `使いこなし度 ${percentage}%`}
              </span>
              <span className="text-[10px] text-slate-400">
                {completedCount}/{total}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  allComplete
                    ? "bg-yellow-400"
                    : "bg-linear-to-r from-yellow-300 to-yellow-500"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          )}
        </button>

        {/* Expanded milestones */}
        {expanded && (
          <div className="px-4 pb-3 space-y-1.5 border-t border-slate-100 pt-2">
            {MILESTONES.map((m, i) => {
              const done = completedArr[i];
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveHint(activeHint === m.id ? null : m.id)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-colors",
                    done
                      ? "bg-yellow-50/50"
                      : "hover:bg-slate-50 cursor-pointer"
                  )}
                >
                  {done ? (
                    <div className="w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
                  )}
                  <span className="text-sm shrink-0">{m.emoji}</span>
                  <span
                    className={cn(
                      "text-xs flex-1",
                      done
                        ? "text-slate-400 line-through"
                        : "text-slate-600 font-medium"
                    )}
                  >
                    {m.label}
                  </span>
                  {!done && activeHint === m.id && (
                    <span className="text-[10px] text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-100 animate-in fade-in duration-200">
                      {m.hint}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Dismiss link */}
            <div className="text-center pt-1">
              <button
                onClick={handleDismiss}
                className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                {allComplete ? "このバーを非表示にする" : "プログレスバーを非表示"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
