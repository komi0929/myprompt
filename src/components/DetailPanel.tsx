"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PHASES } from "@/lib/mock-data";
import { usePromptStore } from "@/lib/prompt-store";
import { copyToClipboard } from "@/components/ui/Toast";
import { ArrowRight, Copy, GitBranch, History, Share2, Sparkles, Edit3, Pencil } from "lucide-react";
import { useState } from "react";
import HistoryModal from "@/components/HistoryModal";

export function DetailPanel(): React.ReactElement {
  const { selectedPromptId, prompts, openEditor, duplicateAsArrangement } = usePromptStore();
  const prompt = prompts.find(p => p.id === selectedPromptId) ?? null;
  const [historyOpen, setHistoryOpen] = useState(false);

  if (!prompt) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
        <Sparkles className="h-12 w-12 mb-4 text-slate-200" />
        <p className="font-bold">左のカードをクリックして</p>
        <p className="font-bold">プロンプトの詳細を表示 👈</p>
      </div>
    );
  }

  const phaseInfo = PHASES.find(p => p.id === prompt.phase);

  const handleShare = (): void => {
    if (navigator.share) {
      navigator.share({
        title: prompt.title,
        text: prompt.content,
      }).catch(() => { /* user cancelled */ });
    } else {
      const text = `${prompt.title}\n\n${prompt.content}`;
      copyToClipboard(text, "共有用テキストをコピーしました");
    }
  };

  const handleArrange = (): void => {
    duplicateAsArrangement(prompt.id);
  };

  const handleEdit = (): void => {
    openEditor(prompt);
  };

  return (
    <div className="flex h-full flex-col bg-white border-l border-slate-100 shadow-xl shadow-slate-200/50 z-20 w-full max-w-[480px]">
      
      {/* Lineage Bar */}
      <div className="bg-slate-50 border-b border-slate-100 p-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
          <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
          {prompt.lineage.parent && (
            <>
              <span className="px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-400">
                {prompt.lineage.parent}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            </>
          )}
          <span className="px-2 py-1 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-700 font-bold">
            現在
          </span>
          {prompt.lineage.children && prompt.lineage.children.length > 0 && (
            <>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-400">
                {prompt.lineage.children.length} 派生
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {prompt.visibility === "Private" && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500">🔒 自分のみ</Badge>
            )}
            {prompt.visibility === "Public" && (
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-600 border-yellow-200">🌐 公開</Badge>
            )}
            {phaseInfo && (
              <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-200">
                {phaseInfo.icon} {phaseInfo.label}
              </Badge>
            )}
            {prompt.tags.map(tag => <Badge key={tag} variant="outline">#{tag}</Badge>)}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-slate-800 leading-tight">
              {prompt.title}
            </h1>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 rounded-[16px] text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
              onClick={handleEdit}
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              編集
            </Button>
          </div>
          <div className="text-xs text-slate-400 font-mono border-b border-slate-100 pb-4">
            更新日: {new Date(prompt.updatedAt).toLocaleDateString("ja-JP")}
          </div>
        </div>

        {/* Prompt Content */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 flex items-center gap-2">
            <Edit3 className="w-4 h-4" /> プロンプト内容
          </h3>
          
          <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100 font-mono text-sm leading-relaxed text-slate-700 shadow-inner min-h-[180px] whitespace-pre-wrap">
            {prompt.content.split(/({.*?})/).map((part, i) => 
              part.match(/^{.*}$/) ? (
                <span key={i} className="bg-yellow-200 text-yellow-800 px-1 rounded-md font-bold mx-0.5 border-b-2 border-yellow-300">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </div>

          {/* Big Copy Button */}
          <Button
            className="w-full rounded-[20px]"
            variant="secondary"
            onClick={() => copyToClipboard(prompt.content, "コピーしました ✨")}
          >
            <Copy className="w-4 h-4 mr-2" />
            プロンプトをコピー
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-4 pt-2">
          <Button className="w-full text-base shadow-lg shadow-yellow-200 hover:shadow-yellow-300 transition-shadow rounded-[20px]" onClick={handleArrange}>
            <Sparkles className="w-5 h-5 mr-2" />
            このプロンプトをアレンジ
          </Button>
          
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" className="w-full rounded-[16px]" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" /> シェアする
            </Button>
            <Button variant="secondary" className="w-full rounded-[16px]" onClick={() => setHistoryOpen(true)}>
              <History className="w-4 h-4 mr-2" /> 履歴を見る
            </Button>
          </div>
        </div>

        {/* Descendants */}
        {prompt.lineage.children && prompt.lineage.children.length > 0 && (
          <div className="pt-8 border-t border-slate-100">
            <h4 className="font-bold text-slate-500 mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> みんなの活用事例
            </h4>
            <div className="space-y-3">
              {prompt.lineage.children.map(child => (
                <div key={child} className="p-4 bg-slate-50 rounded-[20px] border border-slate-100 text-sm text-slate-600 hover:bg-white hover:border-yellow-200 transition-colors cursor-pointer">
                  {child}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Modal */}
      {historyOpen && (
        <HistoryModal promptId={prompt.id} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
}
