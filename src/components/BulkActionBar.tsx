"use client";

import { useState, useCallback } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { Button } from "@/components/ui/Button";
import { CheckSquare, Tags, Trash2, Download, X, FolderInput } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { exportPrompts } from "@/lib/import-export";

export interface BulkModeState {
  isActive: boolean;
  selectedIds: Set<string>;
}

export default function BulkActionBar({
  bulkMode,
  setBulkMode,
}: {
  bulkMode: BulkModeState;
  setBulkMode: (fn: (prev: BulkModeState) => BulkModeState) => void;
}): React.ReactElement | null {
  const { prompts, deletePrompt, updatePrompt, folders } = usePromptStore();
  const [showTagInput, setShowTagInput] = useState(false);
  const [tagValue, setTagValue] = useState("");
  const [showFolderSelect, setShowFolderSelect] = useState(false);

  const selectedCount = bulkMode.selectedIds.size;

  const handleClose = useCallback((): void => {
    setBulkMode(() => ({ isActive: false, selectedIds: new Set() }));
  }, [setBulkMode]);

  const handleAddTag = useCallback((): void => {
    if (!tagValue.trim()) return;
    const tag = tagValue.trim();
    for (const id of bulkMode.selectedIds) {
      const p = prompts.find(pr => pr.id === id);
      if (p && !p.tags.includes(tag)) {
        updatePrompt(id, { tags: [...p.tags, tag] });
      }
    }
    showToast(`${selectedCount}件に「${tag}」タグを追加 ✨`);
    setTagValue("");
    setShowTagInput(false);
  }, [tagValue, bulkMode.selectedIds, prompts, updatePrompt, selectedCount]);

  const handleDeleteSelected = useCallback((): void => {
    for (const id of bulkMode.selectedIds) {
      deletePrompt(id);
    }
    showToast(`${selectedCount}件を削除しました`);
    handleClose();
  }, [bulkMode.selectedIds, deletePrompt, selectedCount, handleClose]);

  const handleExportSelected = useCallback((): void => {
    const selected = prompts.filter(p => bulkMode.selectedIds.has(p.id));
    exportPrompts(selected);
  }, [prompts, bulkMode.selectedIds]);

  const handleMoveToFolder = useCallback((folderId: string | null): void => {
    for (const id of bulkMode.selectedIds) {
      updatePrompt(id, { folderId: folderId ?? undefined });
    }
    const fname = folders.find(f => f.id === folderId)?.name ?? "未分類";
    showToast(`${selectedCount}件を「${fname}」に移動 ✨`);
    setShowFolderSelect(false);
  }, [bulkMode.selectedIds, updatePrompt, selectedCount, folders]);

  if (!bulkMode.isActive) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 shadow-xl px-4 py-2.5">
        <CheckSquare className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-semibold text-slate-700">{selectedCount}件選択</span>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* Tag */}
        {showTagInput ? (
          <div className="flex items-center gap-1">
            <input
              value={tagValue}
              onChange={e => setTagValue(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddTag()}
              placeholder="タグ名"
              className="w-24 h-7 px-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-yellow-300"
              autoFocus
            />
            <Button size="sm" onClick={handleAddTag}>追加</Button>
          </div>
        ) : (
          <button onClick={() => setShowTagInput(true)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors">
            <Tags className="w-3.5 h-3.5" /> タグ
          </button>
        )}

        {/* Folder */}
        {showFolderSelect ? (
          <select
            onChange={e => handleMoveToFolder(e.target.value || null)}
            className="h-7 px-2 text-xs rounded-md border border-slate-200 focus:outline-none focus:border-yellow-300 bg-white"
            autoFocus
          >
            <option value="">未分類</option>
            {folders.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        ) : (
          <button onClick={() => setShowFolderSelect(true)} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
            <FolderInput className="w-3.5 h-3.5" /> 移動
          </button>
        )}

        {/* Export */}
        <button onClick={handleExportSelected} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
          <Download className="w-3.5 h-3.5" /> 出力
        </button>

        {/* Delete */}
        <button onClick={handleDeleteSelected} className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors">
          <Trash2 className="w-3.5 h-3.5" /> 削除
        </button>

        <div className="w-px h-5 bg-slate-200 mx-1" />

        <button onClick={handleClose} className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
