"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PHASES } from "@/lib/mock-data";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { copyToClipboard } from "@/components/ui/Toast";
import { ArrowRight, Copy, GitBranch, History, Share2, Sparkles, Edit3, Pencil, Heart, Bookmark, Zap, ChevronDown, Lightbulb, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import HistoryModal from "@/components/HistoryModal";
import TemplateModal from "@/components/TemplateModal";
import { showToast } from "@/components/ui/Toast";
import { useAuth } from "@/components/AuthProvider";
import { hasVariables } from "@/lib/template-utils";
import { addToCopyBuffer } from "@/components/CopyBuffer";

export function DetailPanel(): React.ReactElement {
  const { selectedPromptId, prompts, openEditor, duplicateAsArrangement, toggleFavorite, isFavorited, toggleLike, isLiked, incrementUseCount, updatePrompt, setSelectedPromptId } = usePromptStore();
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();
  const prompt = prompts.find(p => p.id === selectedPromptId) ?? null;
  const [historyOpen, setHistoryOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

   if (!prompt) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-50/50">
        <Sparkles className="h-10 w-10 mb-3 text-slate-200" />
        <p className="font-semibold text-sm">プロンプトを選んで</p>
        <p className="font-semibold text-sm">詳細を確認しましょう ✨</p>
      </div>
    );
  }

  const phaseInfo = PHASES.find(p => p.id === prompt.phase);
  const fav = isFavorited(prompt.id);
  const liked = isLiked(prompt.id);
  const isOwner = user?.id === prompt.authorId;

  const handleShare = (): void => {
    if (navigator.share) {
      navigator.share({ title: prompt.title, text: prompt.content }).catch(() => {});
    } else {
      copyToClipboard(`${prompt.title}\n\n${prompt.content}`, "共有用テキストをコピーしました");
    }
  };

  const handleArrange = (): void => {
    if (!requireAuth("プロンプトの派生メモ")) return;
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
    <div className="flex h-full flex-col overflow-y-auto bg-white border-l border-slate-200/80 shadow-lg shadow-slate-200/30 z-20 w-full max-w-[480px]">
      
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
        {/* Author section */}
        <div className="flex items-center gap-3">
          {prompt.authorAvatarUrl ? (
            prompt.authorAvatarUrl.startsWith("http") ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={prompt.authorAvatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
              </>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200 text-lg">
                {prompt.authorAvatarUrl}
              </div>
            )
          ) : prompt.authorName ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-white text-sm font-semibold">
              {prompt.authorName.charAt(0).toUpperCase()}
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            {prompt.authorName && (
              <p className="text-sm font-semibold text-slate-700 truncate">{prompt.authorName}</p>
            )}
            <p className="text-[10px] text-slate-500">
              {new Date(prompt.updatedAt).toLocaleDateString("ja-JP")}に更新
            </p>
          </div>
        </div>
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
            <h1 className="text-xl font-semibold text-slate-800 leading-tight tracking-tight">
              {prompt.title}
            </h1>
            {/* Edit button - only for owned prompts */}
            {!!user && prompt.authorId === user.id && (
              <Button
                variant="secondary"
                size="sm"
                className="shrink-0 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                onClick={handleEdit}
              >
                <Pencil className="w-3.5 h-3.5 mr-1" />
                編集
              </Button>
            )}
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
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Edit3 className="w-3.5 h-3.5" /> プロンプト内容
            </h3>
            {(prompt.useCount ?? 0) > 0 && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                📋 {prompt.useCount}回使用
              </span>
            )}
          </div>
          
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

          {/* Template Use button or simple copy */}
          {hasVariables(prompt.content) ? (
            <Button
              className="w-full shadow-md shadow-yellow-200 hover:shadow-yellow-300 transition-shadow"
              size="lg"
              onClick={() => setTemplateOpen(true)}
            >
              <Zap className="w-4 h-4 mr-2" />
              テンプレートとして使う（変数あり）
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button
                className="flex-1"
                variant="secondary"
                size="lg"
                onClick={() => {
                  copyToClipboard(prompt.content, "コピーしました ✨");
                  incrementUseCount(prompt.id);
                  addToCopyBuffer(prompt.id, prompt.title, prompt.content);
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                コピー
              </Button>
              <div className="relative group/fmt">
                <Button variant="ghost" size="lg" className="px-2" title="フォーマット選択">
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover/fmt:block z-30">
                  <div className="bg-white rounded-lg border border-slate-200 shadow-lg py-1 min-w-[140px]">
                    <button
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                      onClick={() => {
                        const md = `## ${prompt.title}\n\n${prompt.content}\n\nTags: ${prompt.tags.map(t => `#${t}`).join(" ")}`;
                        copyToClipboard(md, "Markdown形式でコピー ✨");
                        incrementUseCount(prompt.id);
                      }}
                    >
                      📝 Markdown形式
                    </button>
                    <button
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
                      onClick={() => {
                        const xml = `<prompt>\n<title>${prompt.title}</title>\n<content>\n${prompt.content}\n</content>\n<tags>${prompt.tags.join(", ")}</tags>\n</prompt>`;
                        copyToClipboard(xml, "XML形式でコピー ✨");
                        incrementUseCount(prompt.id);
                      }}
                    >
                      🏷️ XML形式
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 💡 補足情報 */}
        {prompt.notes && (
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5" /> 補足
            </h4>
            <div className="bg-amber-50 rounded-lg p-4 text-sm text-slate-600 leading-relaxed border border-amber-100 whitespace-pre-wrap">
              {prompt.notes}
            </div>
          </div>
        )}

        {/* Rating Marker */}
        {isOwner && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 mr-1">評価:</span>
            {(["good", "neutral", "bad"] as const).map(r => {
              const icons = { good: ThumbsUp, neutral: Minus, bad: ThumbsDown };
              const labels = { good: "成功", neutral: "普通", bad: "失敗" };
              const colors = {
                good: prompt.rating === r ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600",
                neutral: prompt.rating === r ? "bg-amber-100 text-amber-700 border-amber-200" : "text-slate-400 hover:bg-amber-50 hover:text-amber-600",
                bad: prompt.rating === r ? "bg-red-100 text-red-700 border-red-200" : "text-slate-400 hover:bg-red-50 hover:text-red-600",
              };
              const Icon = icons[r];
              return (
                <button
                  key={r}
                  onClick={() => updatePrompt(prompt.id, { rating: prompt.rating === r ? undefined : r })}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-lg border border-transparent text-xs font-medium transition-all",
                    colors[r]
                  )}
                  title={labels[r]}
                >
                  <Icon className="w-3 h-3" />
                  {labels[r]}
                </button>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button className="w-full" variant="outline" size="lg" onClick={handleArrange}>
            <Sparkles className="w-4 h-4 mr-2" />
            このプロンプトをもとにメモ
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


        {/* Related prompts */}
        <RelatedSuggestions currentPrompt={prompt} allPrompts={prompts} onSelect={setSelectedPromptId} />

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

      {templateOpen && prompt && (
        <TemplateModal
          promptId={prompt.id}
          promptTitle={prompt.title}
          promptContent={prompt.content}
          onClose={() => setTemplateOpen(false)}
          onUsed={() => incrementUseCount(prompt.id)}
        />
      )}
    </div>
  );
}

import type { Prompt } from "@/lib/mock-data";

function RelatedSuggestions({ currentPrompt, allPrompts, onSelect }: {
  currentPrompt: Prompt;
  allPrompts: Prompt[];
  onSelect: (id: string) => void;
}): React.ReactElement {
  // Score-based related prompt finding
  const related = allPrompts
    .filter(p => p.id !== currentPrompt.id)
    .map(p => {
      let score = 0;
      // Shared tags
      const sharedTags = p.tags.filter(t => currentPrompt.tags.includes(t)).length;
      score += sharedTags * 3;
      // Same phase
      if (p.phase === currentPrompt.phase) score += 2;
      // Lineage connection
      if (currentPrompt.lineage.parent === p.id || currentPrompt.lineage.children?.includes(p.id)) score += 5;
      return { prompt: p, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (related.length === 0) return <></>;

  return (
    <div className="pt-4 border-t border-slate-100">
      <h4 className="font-semibold text-xs text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
        <Lightbulb className="w-3.5 h-3.5" />
        関連するメモ
      </h4>
      <div className="space-y-1">
        {related.map(r => (
          <button
            key={r.prompt.id}
            onClick={() => onSelect(r.prompt.id)}
            className="w-full text-left p-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-white hover:border-yellow-200 transition-all group"
          >
            <p className="text-xs font-medium text-slate-600 truncate group-hover:text-yellow-700">{r.prompt.title}</p>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.prompt.content.slice(0, 50)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
