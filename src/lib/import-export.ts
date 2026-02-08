"use client";

import type { Prompt } from "@/lib/mock-data";
import { showToast } from "@/components/ui/Toast";

interface ExportData {
  version: number;
  exportedAt: string;
  prompts: Array<{
    title: string;
    content: string;
    tags: string[];
    phase: string;
    visibility: string;
  }>;
}

export function exportPrompts(prompts: Prompt[]): void {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    prompts: prompts.map(p => ({
      title: p.title,
      content: p.content,
      tags: p.tags,
      phase: p.phase,
      visibility: p.visibility,
    })),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myprompt-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${prompts.length}件のプロンプトをエクスポートしました 📦`);
}

export function parseImportFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const data = JSON.parse(e.target?.result as string) as ExportData;
        if (!data.version || !Array.isArray(data.prompts)) {
          reject(new Error("無効なファイル形式です"));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error("JSONの解析に失敗しました"));
      }
    };
    reader.onerror = (): void => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsText(file);
  });
}

export function exportAsMarkdown(prompts: Prompt[]): void {
  const lines = prompts.map(p => {
    const tagStr = p.tags.length > 0 ? `\nTags: ${p.tags.map(t => `#${t}`).join(" ")}` : "";
    return `## ${p.title}\n\n${p.content}${tagStr}\n\n---\n`;
  });

  const content = `# MyPrompt エクスポート\n\nエクスポート日: ${new Date().toLocaleDateString("ja-JP")}\nプロンプト数: ${prompts.length}\n\n---\n\n${lines.join("\n")}`;

  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `myprompt-export-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`${prompts.length}件をMarkdownでエクスポートしました 📝`);
}
