"use client";

import { useState, useMemo } from "react";
import { X, Copy, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copyToClipboard } from "@/components/ui/Toast";
import {
  extractVariables,
  fillTemplate,
  saveTemplateValues,
  loadTemplateValues,
} from "@/lib/template-utils";

interface TemplateModalProps {
  promptId: string;
  promptTitle: string;
  promptContent: string;
  onClose: () => void;
  onUsed?: () => void;
}

export default function TemplateModal({
  promptId,
  promptTitle,
  promptContent,
  onClose,
  onUsed,
}: TemplateModalProps): React.ReactElement {
  const variables = useMemo(() => extractVariables(promptContent), [promptContent]);
  // Initialize values from saved state (no effect needed - compute once)
  const [values, setValues] = useState<Record<string, string>>(() => {
    const saved = loadTemplateValues(promptId);
    const initial: Record<string, string> = {};
    for (const v of variables) {
      initial[v] = saved[v] ?? "";
    }
    return initial;
  });

  const filledContent = useMemo(() => fillTemplate(promptContent, values), [promptContent, values]);
  const allFilled = variables.every((v) => (values[v] ?? "").trim() !== "");

  const handleCopy = (): void => {
    saveTemplateValues(promptId, values);
    copyToClipboard(filledContent, "コピーしました ✨ すぐ使えます！");
    onUsed?.();
    onClose();
  };

  const handleReset = (): void => {
    const empty: Record<string, string> = {};
    for (const v of variables) {
      empty[v] = "";
    }
    setValues(empty);
  };

  const handleChange = (variable: string, value: string): void => {
    setValues((prev) => ({ ...prev, [variable]: value }));
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-linear-to-r from-yellow-50 to-amber-50">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-400 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">テンプレートとして使う</h2>
              <p className="text-[11px] text-slate-400 truncate max-w-xs">{promptTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Variable Input Form */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                変数を入力（{variables.length}個）
              </label>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                リセット
              </button>
            </div>
            {variables.map((variable) => (
              <div key={variable} className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-semibold border border-yellow-200">
                    {`{${variable}}`}
                  </span>
                </label>
                <textarea
                  value={values[variable] ?? ""}
                  onChange={(e) => handleChange(variable, e.target.value)}
                  placeholder={`${variable}を入力...`}
                  rows={values[variable]?.includes("\n") ? 3 : 1}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all resize-none font-mono"
                />
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              プレビュー
            </label>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono text-sm leading-relaxed text-slate-700 max-h-[200px] overflow-y-auto whitespace-pre-wrap shadow-inner">
              {filledContent.split(/(\{[^{}]+\})/).map((part, i) =>
                part.match(/^\{[^{}]+\}$/) ? (
                  <span
                    key={i}
                    className="bg-red-100 text-red-600 px-1 rounded font-semibold mx-0.5 border-b-2 border-red-200"
                  >
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                )
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-400">
            {allFilled
              ? "✅ すべての変数が入力済み"
              : `⚠️ 未入力の変数が ${variables.filter((v) => !(values[v] ?? "").trim()).length} 個`}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              キャンセル
            </Button>
            <Button
              onClick={handleCopy}
              className="shadow-md shadow-yellow-200"
            >
              <Copy className="w-4 h-4 mr-1.5" />
              {allFilled ? "コピーして使う" : "このままコピー"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
