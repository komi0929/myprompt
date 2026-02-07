"use client";

import { Button } from "@/components/ui/Button";
import { usePromptStore, type HistoryEntry } from "@/lib/prompt-store";
import { X, Clock } from "lucide-react";
import { useState } from "react";

export default function HistoryModal({ promptId, onClose }: { promptId: string; onClose: () => void }): React.ReactElement {
  const { getHistory } = usePromptStore();
  const entries = getHistory(promptId);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedEntry: HistoryEntry | null = selectedIndex !== null ? entries[selectedIndex] ?? null : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[80vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            編集履歴
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {entries.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-200" />
              <p className="font-bold">まだ履歴がありません</p>
            </div>
          ) : (
            entries.slice().reverse().map((entry, idx) => {
              const reverseIdx = entries.length - 1 - idx;
              const isSelected = selectedIndex === reverseIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(isSelected ? null : reverseIdx)}
                  className={`w-full text-left p-4 rounded-[20px] border transition-all ${
                    isSelected
                      ? "bg-yellow-50 border-yellow-300 shadow-sm"
                      : "bg-slate-50 border-slate-100 hover:bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-sm text-slate-700 truncate">{entry.title}</span>
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
          <div className="border-t border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-400 mb-2">プレビュー</h3>
            <div className="bg-slate-50 rounded-[16px] p-4 border border-slate-100 font-mono text-sm text-slate-700 max-h-40 overflow-y-auto whitespace-pre-wrap">
              {selectedEntry.content}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="rounded-[20px]">
            閉じる
          </Button>
        </div>
      </div>
    </div>
  );
}
