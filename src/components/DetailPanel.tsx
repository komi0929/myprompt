"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PHASES } from "@/lib/mock-data";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { copyToClipboard } from "@/components/ui/Toast";
import { ArrowRight, Copy, GitBranch, History, Share2, Sparkles, Edit3, Pencil, Heart, Bookmark } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import HistoryModal from "@/components/HistoryModal";
import { showToast } from "@/components/ui/Toast";

export function DetailPanel(): React.ReactElement {
  const { selectedPromptId, prompts, openEditor, duplicateAsArrangement, toggleFavorite, isFavorited, toggleLike, isLiked } = usePromptStore();
  const { requireAuth } = useAuthGuard();
  const prompt = prompts.find(p => p.id === selectedPromptId) ?? null;
  const [historyOpen, setHistoryOpen] = useState(false);

   if (!prompt) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
        <Sparkles className="h-10 w-10 mb-3 text-slate-200" />
        <p className="font-semibold text-sm">左のカードをクリックして</p>
        <p className="font-semibold text-sm">プロンプトの詳細を表示 👈</p>
      </div>
    );
  }

  const phaseInfo = PHASES.find(p => p.id === prompt.phase);
  const fav = isFavorited(prompt.id);
  const liked = isLiked(prompt.id);

  const handleShare = (): void => {
    if (navigator.share) {
      navigator.share({ title: prompt.title, text: prompt.content }).catch(() => {});
    } else {
      copyToClipboard(`${prompt.title}\n\n${prompt.content}`, "共有用テキストをコピーしました");
    }
  };

  const handleArrange = (): void => {
    if (!requireAuth("プロンプトのアレンジ")) return;
    duplicateAsArrangement(prompt.id);
  };

  const handleEdit = (): void => {
    if (!requireAuth("プロンプトの編集")) return;
    openEditor(prompt);
  };

  const handleHistory = (): void => {
    if (!requireAuth("履歴の閲覧")) return;
    setHistoryOpen(true);
  };

  const handleFavorite = (): void => {
    if (!requireAuth("お気に入り登録")) return;
    toggleFavorite(prompt.id);
    showToast(fav ? "お気に入りから削除" : "⭐ お気に入りに追加しました");
  };

  const handleLike = (): void => {
    toggleLike(prompt.id);
    if (!liked) showToast("👍 いいね！しました");
  };

  return (
    <div className="flex h-full flex-col bg-white border-l border-slate-200/80 shadow-lg shadow-slate-200/30 z-20 w-full max-w-[480px]">
      
      {/* Lineage Bar */}
      <div className="bg-slate-50 border-b border-slate-200/80 p-4">
        <div className="flex items-center space-x-2 text-xs text-slate-500 overflow-x-auto no-scrollbar whitespace-nowrap">
          <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
          {prompt.lineage.parent && (
            <>
              <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-400">
                {prompt.lineage.parent}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
            </>
          )}
          <span className="px-2 py-1 rounded-md bg-yellow-100 border border-yellow-200 text-yellow-700 font-semibold">
            現在
          </span>
          {prompt.lineage.children && prompt.lineage.children.length > 0 && (
            <>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className="px-2 py-1 rounded-md bg-white border border-slate-200 text-slate-400">
                {prompt.lineage.children.length} 派生
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex gap-1.5 flex-wrap">
            {prompt.visibility === "Private" && (
              <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[11px]">🔒 自分のみ</Badge>
            )}
            {prompt.visibility === "Public" && (
              <Badge variant="secondary" className="bg-yellow-50 text-yellow-600 border-yellow-200 text-[11px]">🌐 公開</Badge>
            )}
            {phaseInfo && (
              <Badge variant="secondary" className="bg-slate-50 text-slate-500 border-slate-200 text-[11px]">
                {phaseInfo.icon} {phaseInfo.label}
              </Badge>
            )}
            {prompt.tags.map(tag => <Badge key={tag} variant="outline" className="text-[11px]">#{tag}</Badge>)}
          </div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-semibold text-slate-800 leading-tight">
              {prompt.title}
            </h1>
            <Button
              variant="secondary"
              size="sm"
              className="shrink-0 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
              onClick={handleEdit}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              編集
            </Button>
          </div>
          <div className="text-xs text-slate-400 font-mono border-b border-slate-100 pb-3">
            更新日: {new Date(prompt.updatedAt).toLocaleDateString("ja-JP")}
          </div>
        </div>

        {/* Like & Favorite quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              liked
                ? "text-pink-500 bg-pink-50 border-pink-200"
                : "text-slate-400 bg-white border-slate-200 hover:text-pink-500 hover:bg-pink-50 hover:border-pink-200"
            )}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-pink-400")} />
            いいね！ <span className="tabular-nums">{prompt.likeCount}</span>
          </button>
          <button
            onClick={handleFavorite}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
              fav
                ? "text-yellow-600 bg-yellow-50 border-yellow-300"
                : "text-slate-400 bg-white border-slate-200 hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-300"
            )}
          >
            <Bookmark className={cn("w-4 h-4", fav && "fill-yellow-400")} />
            {fav ? "お気に入り" : "お気に入りに追加"}
          </button>
        </div>

        {/* Prompt Content */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
            <Edit3 className="w-3.5 h-3.5" /> プロンプト内容
          </h3>
          
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 font-mono text-sm leading-relaxed text-slate-700 shadow-inner min-h-[160px] whitespace-pre-wrap">
            {prompt.content.split(/({.*?})/).map((part, i) => 
              part.match(/^{.*}$/) ? (
                <span key={i} className="bg-yellow-200 text-yellow-800 px-1 rounded font-semibold mx-0.5 border-b-2 border-yellow-300">
                  {part}
                </span>
              ) : (
                part
              )
            )}
          </div>

          <Button
            className="w-full"
            variant="secondary"
            size="lg"
            onClick={() => copyToClipboard(prompt.content, "コピーしました ✨")}
          >
            <Copy className="w-4 h-4 mr-2" />
            プロンプトをコピー
          </Button>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-1">
          <Button className="w-full shadow-md shadow-yellow-200 hover:shadow-yellow-300 transition-shadow" size="lg" onClick={handleArrange}>
            <Sparkles className="w-4 h-4 mr-2" />
            このプロンプトをアレンジ
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" className="w-full" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1.5" /> シェア
            </Button>
            <Button variant="secondary" className="w-full" onClick={handleHistory}>
              <History className="w-4 h-4 mr-1.5" /> 履歴
            </Button>
          </div>
        </div>

        {/* Descendants */}
        {prompt.lineage.children && prompt.lineage.children.length > 0 && (
          <div className="pt-6 border-t border-slate-100">
            <h4 className="font-semibold text-sm text-slate-500 mb-3 flex items-center gap-2">
              <GitBranch className="w-4 h-4" /> みんなの活用事例
            </h4>
            <div className="space-y-2">
              {prompt.lineage.children.map(child => (
                <div key={child} className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-600 hover:bg-white hover:border-yellow-200 transition-colors cursor-pointer">
                  {child}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {historyOpen && (
        <HistoryModal promptId={prompt.id} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  );
}
