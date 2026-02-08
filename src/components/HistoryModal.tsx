"use client";

import { Button } from "@/components/ui/Button";
import { usePromptStore, type HistoryEntry } from "@/lib/prompt-store";
import { X, Clock, Loader2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { showToast } from "@/components/ui/Toast";

export default function HistoryModal({ promptId, onClose }: { promptId: string; onClose: () => void }): React.ReactElement {
  const { getHistory, updatePrompt, prompts } = usePromptStore();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (): Promise<void> => {
      try {
        const data = await getHistory(promptId);
        if (!cancelled) setEntries(data);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [promptId, getHistory]);

  const selectedEntry: HistoryEntry | null = selectedIndex !== null ? entries[selectedIndex] ?? null : null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            編集履歴
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            <div className="text-center text-slate-400 py-10">
              <Loader2 className="w-10 h-10 mx-auto mb-3 text-slate-200 animate-spin" />
              <p className="font-semibold text-sm">履歴を読み込み中…</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              <Clock className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="font-semibold text-sm">まだ履歴がありません</p>
            </div>
          ) : (
            entries.slice().reverse().map((entry, idx) => {
              const reverseIdx = entries.length - 1 - idx;
              const isSelected = selectedIndex === reverseIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(isSelected ? null : reverseIdx)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "bg-yellow-50 border-yellow-300 shadow-sm"
                      : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-sm text-slate-700 truncate">{entry.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {new Date(entry.timestamp).toLocaleString("ja-JP")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 font-mono">{entry.content}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Preview */}
        {selectedEntry && (
          <div className="border-t border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">プレビュー</h3>
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-100 font-mono text-sm text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
              {selectedEntry.content}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-between">
          {selectedEntry ? (
            <Button
              variant="default"
              onClick={async () => {
                const current = prompts.find(p => p.id === promptId);
                if (!current || !selectedEntry) return;
                await updatePrompt(promptId, {
                  title: selectedEntry.title,
                  content: selectedEntry.content,
                  tags: current.tags,
                  phase: current.phase,
                  visibility: current.visibility,
                });
                showToast("この版に復元しました ✨");
                onClose();
              }}
              className="flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              この版に復元
            </Button>
          ) : (
            <div />
          )}
          <Button variant="secondary" onClick={onClose}>
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
