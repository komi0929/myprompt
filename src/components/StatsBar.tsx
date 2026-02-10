"use client";

import { useMemo, useState } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuth } from "@/components/AuthProvider";
import { cn } from "@/lib/utils";
import { BarChart3, TrendingUp, Flame, ChevronDown, ChevronUp } from "lucide-react";

export default function StatsBar(): React.ReactElement {
  const { prompts } = usePromptStore();
  const { isGuest, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  // Only show stats for user's own prompts
  const ownPrompts = prompts;
  const totalCount = ownPrompts.length;
  const thisWeekCount = ownPrompts.filter(p => {
    const d = new Date(p.updatedAt);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return d >= weekAgo;
  }).length;

  // Top 3 most used
  const top3 = [...ownPrompts]
    .filter(p => (p.useCount ?? 0) > 0)
    .sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0))
    .slice(0, 3);

  // Phase distribution
  const phaseCounts: Record<string, number> = {};
  for (const p of ownPrompts) {
    phaseCounts[p.phase] = (phaseCounts[p.phase] ?? 0) + 1;
  }
  const phaseLabels: Record<string, string> = {
    Planning: "🌱 企画",
    Design: "🎨 設計",
    Implementation: "💻 実装",
    Debug: "🐛 デバッグ",
    Release: "🚀 リリース",
    Other: "📦 その他",
  };

  // Streak (consecutive days with activity)
  const streak = useMemo(() => {
    const dates = new Set(ownPrompts.map(p => new Date(p.updatedAt).toDateString()));
    let count = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (dates.has(d.toDateString())) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [ownPrompts]);

  // Hide stats for guests, loading, or when no prompts
  if (isLoading || isGuest || totalCount === 0) return <></>;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center gap-2 w-full text-left group"
      >
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
            <BarChart3 className="w-3 h-3" />
            {totalCount}件のメモ
          </span>
          {thisWeekCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-medium">
              <TrendingUp className="w-2.5 h-2.5" />
              今週 +{thisWeekCount}
            </span>
          )}
          {streak > 1 && (
            <span className="flex items-center gap-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md font-medium">
              <Flame className="w-2.5 h-2.5" />
              {streak}日連続 🔥
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        )}
      </button>

      {open && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3 animate-in fade-in duration-200">
          {/* Phase Distribution */}
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">フェーズ分布</p>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(phaseCounts).map(([phase, count]) => (
                <span
                  key={phase}
                  className="text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"
                >
                  {phaseLabels[phase] ?? phase} {count}
                </span>
              ))}
            </div>
          </div>

          {/* Top Used */}
          {top3.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">よく使うメモ TOP3</p>
              <div className="space-y-1">
                {top3.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-slate-100 text-slate-500"
                    )}>
                      {i + 1}
                    </span>
                    <span className="truncate flex-1">{p.title}</span>
                    <span className="text-[10px] text-slate-400">{p.useCount}回</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
