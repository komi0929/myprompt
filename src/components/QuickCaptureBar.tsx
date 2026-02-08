"use client";

import { useState, useRef, useCallback } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { showToast } from "@/components/ui/Toast";
import { Zap, ArrowUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

/** Guess phase from content keywords */
function guessPhase(text: string): "Planning" | "Design" | "Implementation" | "Debug" | "Release" | "Other" {
  const lower = text.toLowerCase();
  if (/バグ|エラー|error|debug|修正|fix|直し/.test(lower)) return "Debug";
  if (/設計|design|ui|ux|レイアウト|画面|デザイン/.test(lower)) return "Design";
  if (/実装|implement|コード|code|関数|function|component|コンポーネント/.test(lower)) return "Implementation";
  if (/企画|plan|要件|prd|アイデア|idea|仕様/.test(lower)) return "Planning";
  if (/deploy|リリース|release|公開|vercel|ビルド|build/.test(lower)) return "Release";
  return "Other";
}

/** Extract #tags from text and return cleaned text + tags */
function extractInlineTags(text: string): { cleaned: string; tags: string[] } {
  const tagRegex = /#([^\s#]+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }
  const cleaned = text.replace(tagRegex, "").trim();
  return { cleaned, tags };
}

export default function QuickCaptureBar(): React.ReactElement {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addPrompt } = usePromptStore();
  const { requireAuth } = useAuthGuard();

  const handleSubmit = useCallback(async (): Promise<void> => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!requireAuth("プロンプトのメモ")) return;

    setSaving(true);
    try {
      const { cleaned, tags } = extractInlineTags(trimmed);
      const content = cleaned;
      // Title: first line, or first 40 chars
      const firstLine = content.split("\n")[0];
      const title = firstLine.length > 40 ? firstLine.slice(0, 40) + "…" : firstLine;
      const phase = guessPhase(content);

      await addPrompt({
        title,
        content,
        tags,
        phase,
        visibility: "Private",
        lineage: { isOriginal: true },
      });
      setValue("");
      showToast("メモしました ✨");
    } finally {
      setSaving(false);
    }
  }, [value, addPrompt, requireAuth]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = value.trim().length > 0;

  return (
    <div
      className={cn(
        "w-full max-w-4xl mx-auto transition-all duration-200",
        isFocused && "scale-[1.01]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-white px-3 py-2 shadow-sm transition-all duration-200",
          isFocused
            ? "border-yellow-300 shadow-md shadow-yellow-100/50 ring-2 ring-yellow-400/20"
            : "border-slate-200 hover:border-slate-300 hover:shadow"
        )}
      >
        <Zap className={cn(
          "w-4 h-4 shrink-0 transition-colors",
          isFocused ? "text-yellow-500" : "text-slate-300"
        )} />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="プロンプトをサッとメモ… Enterで保存  #タグ も使えます"
          disabled={saving}
          className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none disabled:opacity-50"
        />

        {hasContent && (
          <div className="flex items-center gap-1.5 shrink-0">
            {extractInlineTags(value).tags.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-md font-medium">
                <Hash className="w-2.5 h-2.5" />
                {extractInlineTags(value).tags.length}
              </span>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-white transition-all active:scale-90 disabled:opacity-50"
              title="保存 (Enter)"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Hints */}
      {isFocused && (
        <div className="flex items-center gap-3 mt-1.5 px-1 text-[10px] text-slate-400">
          <span>⚡ Enter で即保存</span>
          <span>#タグ名 でタグ付け</span>
          <span>フェーズは自動判定</span>
        </div>
      )}
    </div>
  );
}
