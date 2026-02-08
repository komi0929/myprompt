"use client";

import { useRef, useState } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { exportPrompts, exportAsMarkdown, parseImportFile } from "@/lib/import-export";

import { Upload, FileJson, FileText } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function ImportExportMenu(): React.ReactElement {
  const { prompts, addPrompt, getFilteredPrompts } = usePromptStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleExportJSON = (): void => {
    const filtered = getFilteredPrompts();
    exportPrompts(filtered.length > 0 ? filtered : prompts);
  };

  const handleExportMarkdown = (): void => {
    const filtered = getFilteredPrompts();
    exportAsMarkdown(filtered.length > 0 ? filtered : prompts);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={importing}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          "bg-slate-100 text-slate-600 hover:bg-yellow-100 hover:text-yellow-700",
          importing && "opacity-50 cursor-not-allowed"
        )}
        title="JSONファイルからインポート"
      >
        <Upload className="w-3.5 h-3.5" />
        インポート
      </button>
      <button
        onClick={handleExportJSON}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-yellow-100 hover:text-yellow-700 transition-all"
        title="JSON形式でエクスポート"
      >
        <FileJson className="w-3.5 h-3.5" />
        JSON
      </button>
      <button
        onClick={handleExportMarkdown}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-yellow-100 hover:text-yellow-700 transition-all"
        title="Markdown形式でエクスポート"
      >
        <FileText className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Markdown</span>
        <span className="sm:hidden">MD</span>
      </button>
    </div>
  );
}
