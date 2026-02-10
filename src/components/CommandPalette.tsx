"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/prompt-store";
import { copyToClipboard } from "@/components/ui/Toast";
import { Search, Copy, FileText, Sparkles } from "lucide-react";

export default function CommandPalette(): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { prompts, setSelectedPromptId, incrementUseCount } = usePromptStore();

  // Filter prompts by query
  const results = useMemo(() => {
    if (!query.trim()) return prompts.slice(0, 10);
    const q = query.toLowerCase();
    return prompts
      .filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [query, prompts]);

  // Reset selection when query changes
  const handleQueryChange = (val: string): void => {
    setQuery(val);
    setSelectedIndex(0);
  };

  // Global shortcut: Ctrl+K opens palette
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return !prev;
        });
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return (): void => window.removeEventListener("keydown", handler);
  }, [open]);

  // Remove "Focus input when opened" effect as it is now handled in keydown or we need a separate "onOpen" effect if triggered elsewhere?
  // Wait, if opened via other means (not Ctrl+K, e.g. clicking a button somewhere?).
  // If there's no button to open it (it's a command palette), Ctrl+K is likely the main entry.
  // But let's keep a simplified effect just for focus if opened via other means, but WITHOUT state reset.
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-index]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleCopy = useCallback((id: string, content: string): void => {
    copyToClipboard(content, "コピーしました ✨");
    incrementUseCount(id);
    setOpen(false);
  }, [incrementUseCount]);

  const handleSelect = useCallback((id: string): void => {
    setSelectedPromptId(id);
    setOpen(false);
  }, [setSelectedPromptId]);

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      // Enter = copy, Shift+Enter = navigate
      if (e.shiftKey) {
        handleSelect(results[selectedIndex].id);
      } else {
        handleCopy(results[selectedIndex].id, results[selectedIndex].content);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh]" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="プロンプトを検索してコピー..."
            className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 bg-transparent outline-none"
          />
          <kbd className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[40vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <Sparkles className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">見つかりませんでした</p>
            </div>
          ) : (
            results.map((prompt, index) => (
              <div
                key={prompt.id}
                data-index={index}
                className={cn(
                  "flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                  index === selectedIndex ? "bg-yellow-50" : "hover:bg-slate-50"
                )}
                onClick={() => handleCopy(prompt.id, prompt.content)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{prompt.title}</p>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{prompt.content.slice(0, 100)}</p>
                  {prompt.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {prompt.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Copy className="w-3.5 h-3.5 text-slate-300 mt-1 shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400">
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">↑↓</kbd> 移動</span>
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">Enter</kbd> コピー</span>
          <span><kbd className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono">Shift+Enter</kbd> 詳細</span>
        </div>
      </div>
    </div>
  );
}
