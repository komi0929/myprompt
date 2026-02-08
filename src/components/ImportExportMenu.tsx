"use client";

import { useRef, useState } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { exportPrompts, exportAsMarkdown, parseImportFile } from "@/lib/import-export";

import { Upload, FileJson, FileText, MoreHorizontal } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function ImportExportMenu(): React.ReactElement {
  const { prompts, addPrompt, getFilteredPrompts } = usePromptStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExportJSON = (): void => {
    const filtered = getFilteredPrompts();
    exportPrompts(filtered.length > 0 ? filtered : prompts);
    setOpen(false);
  };

  const handleExportMarkdown = (): void => {
    const filtered = getFilteredPrompts();
    exportAsMarkdown(filtered.length > 0 ? filtered : prompts);
    setOpen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const data = await parseImportFile(file);
      let count = 0;
      for (const p of data.prompts) {
        const validPhases = ["Planning", "Design", "Implementation", "Debug", "Release", "Other"] as const;
        const validPhase = validPhases.includes(p.phase as typeof validPhases[number])
          ? (p.phase as typeof validPhases[number])
          : "Other" as const;
        await addPrompt({
          title: p.title,
          content: p.content,
          tags: p.tags ?? [],
          phase: validPhase,
          visibility: p.visibility === "Public" ? "Public" : "Private",
          lineage: { isOriginal: true },
        });
        count++;
      }
      showToast(`${count}件のプロンプトをインポートしました ✨`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "インポートに失敗しました");
    } finally {
      setImporting(false);
      setOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        title="インポート / エクスポート"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-xl border border-slate-200 shadow-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className={cn(
                "flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors",
                importing && "opacity-50 cursor-not-allowed"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              インポート（JSON）
            </button>
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
            >
              <FileJson className="w-3.5 h-3.5" />
              エクスポート（JSON）
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              エクスポート（Markdown）
            </button>
          </div>
        </>
      )}
    </div>
  );
}
