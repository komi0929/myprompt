"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Copy, GitBranch, Trash2, Pencil, Heart, Bookmark, ArrowUpDown, Pin, CheckSquare, Square } from "lucide-react";
import { usePromptStore, SORT_OPTIONS } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { copyToClipboard, showToast } from "@/components/ui/Toast";
import { type Prompt, PHASES } from "@/lib/mock-data";
import { useAuth } from "@/components/AuthProvider";
import type { BulkModeState } from "@/components/BulkActionBar";

export function PromptFeed({ bulkMode, onToggleSelect }: { bulkMode?: BulkModeState; onToggleSelect?: (id: string) => void } = {}): React.ReactElement {
  const { getFilteredPrompts, favorites, sortOrder, setSortOrder } = usePromptStore();
  const prompts = getFilteredPrompts();

  return (
    <div className="space-y-3 pb-28">
      {/* Sort bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">{prompts.length}件</span>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="text-xs text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 cursor-pointer hover:border-slate-300 transition-colors"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {prompts.map((prompt) => (
          <PromptCard key={prompt.id} prompt={prompt} isFavoritedByMe={favorites.includes(prompt.id)} bulkMode={bulkMode} onToggleSelect={onToggleSelect} />
        ))}
      </div>
    </div>
  );
}

function PromptCard({ prompt, isFavoritedByMe, bulkMode, onToggleSelect }: { prompt: Prompt; isFavoritedByMe: boolean; bulkMode?: BulkModeState; onToggleSelect?: (id: string) => void }): React.ReactElement {
  const { setSelectedPromptId, selectedPromptId, deletePrompt, toggleFavorite, toggleLike, isLiked, openEditor, incrementUseCount, togglePin } = usePromptStore();
  const { requireAuth } = useAuthGuard();
  const { user } = useAuth();
  const isSelected = selectedPromptId === prompt.id;
  const liked = isLiked(prompt.id);
  const phaseInfo = PHASES.find(p => p.id === prompt.phase);

  // Determine origin badge
  const isOwned = !!user && prompt.authorId === user.id;

  const handleFavorite = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("お気に入り登録")) return;
    toggleFavorite(prompt.id);
    showToast(isFavoritedByMe ? "お気に入りから削除" : "⭐ お気に入りに追加しました");
  };

  const handleLike = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("いいね")) return;
    toggleLike(prompt.id);
    if (!liked) showToast("👍 いいね！しました");
  };

  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("プロンプトの編集")) return;
    openEditor(prompt);
  };

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("プロンプトの削除")) return;
    if (!window.confirm("このプロンプトを削除しますか？\nこの操作は元に戻せません。")) return;
    deletePrompt(prompt.id);
    showToast("プロンプトを削除しました");
  };

  const isBulkSelected = bulkMode?.isActive && bulkMode.selectedIds.has(prompt.id);

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer border-l-3 border-l-transparent",
        isSelected && "border-l-yellow-400 bg-yellow-50/30 shadow-md",
        isBulkSelected && "ring-2 ring-yellow-400 bg-yellow-50/20"
      )}
      onClick={() => {
        if (bulkMode?.isActive && onToggleSelect) {
          onToggleSelect(prompt.id);
        } else {
          setSelectedPromptId(prompt.id);
        }
      }}
    >
      {/* Bulk select checkbox */}
      {bulkMode?.isActive && (
        <div className="absolute top-3 left-3 z-20">
          {isBulkSelected ? (
            <CheckSquare className="w-5 h-5 text-yellow-600" />
          ) : (
            <Square className="w-5 h-5 text-slate-400" />
          )}
        </div>
      )}

      {/* Always-visible action bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button
          className={cn(
            "p-2.5 rounded-lg transition-all",
            prompt.isPinned
              ? "text-amber-500 bg-amber-50"
              : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
          )}
          onClick={(e) => {
            e.stopPropagation();
            togglePin(prompt.id);
          }}
          title={prompt.isPinned ? "ピン解除" : "ピン留め"}
        >
          <Pin className={cn("w-4 h-4", prompt.isPinned && "fill-amber-400")} />
        </button>
        <button
          className={cn(
            "p-2.5 rounded-lg transition-all",
            isFavoritedByMe
              ? "text-yellow-500 bg-yellow-50"
              : "text-slate-400 hover:text-yellow-500 hover:bg-yellow-50"
          )}
          onClick={handleFavorite}
          title={isFavoritedByMe ? "お気に入り解除" : "お気に入りに追加"}
        >
          <Bookmark className={cn("w-4 h-4", isFavoritedByMe && "fill-yellow-400")} />
        </button>
        <button
          className="p-2.5 rounded-lg text-slate-400 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(prompt.content, "コピーしました ✨");
            incrementUseCount(prompt.id);
          }}
          title="プロンプトをコピー"
        >
          <Copy className="w-4 h-4" />
        </button>
      </div>

      <CardHeader className="space-y-2.5 pt-6 pb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {phaseInfo && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              {phaseInfo.icon} {phaseInfo.label}
            </span>
          )}
          {!prompt.lineage.isOriginal && (
            <span className="flex items-center text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
              <GitBranch className="w-3 h-3 mr-0.5" />派生
            </span>
          )}
          {/* Origin indicator */}
          {isOwned ? (
            <span className="text-[10px] font-medium text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
              ✏️ 自作
            </span>
          ) : isFavoritedByMe ? (
            <span className="text-[10px] font-medium text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-md border border-yellow-200">
              ⭐ お気に入り
            </span>
          ) : null}
        </div>
        <CardTitle className="leading-snug group-hover:text-yellow-600 transition-colors line-clamp-2 pr-20">
          {prompt.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <div className="relative group/preview">
          <div className="mt-2 text-xs leading-relaxed text-slate-500 font-mono whitespace-pre-wrap wrap-break-word line-clamp-5 md:line-clamp-3 bg-slate-50 rounded-lg p-3 border border-slate-100 transition-colors">
            {prompt.content}
          </div>
          {/* Hover preview tooltip */}
          {prompt.content.length > 120 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-40 hidden group-hover/preview:block pointer-events-none">
              <div className="bg-white rounded-lg border border-slate-200 shadow-xl p-3 text-xs text-slate-600 font-mono leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {prompt.content.slice(0, 500)}
                {prompt.content.length > 500 && "…"}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="justify-between pt-1 pb-3.5">
        <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
          {prompt.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-400 border border-slate-100 text-[10px]">#{tag}</Badge>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] text-slate-500">+{prompt.tags.length - 3}</span>
          )}
        </div>

        {/* Author info */}
        {!isOwned && prompt.authorName && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {prompt.authorAvatarUrl ? (
              prompt.authorAvatarUrl.startsWith("http") ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={prompt.authorAvatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                </>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-50 border border-yellow-200 text-[10px]">
                  {prompt.authorAvatarUrl}
                </div>
              )
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[9px] font-semibold">
                {prompt.authorName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{prompt.authorName}</span>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0">
          {/* Like button - always visible */}
          <button
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
              liked
                ? "text-pink-500 bg-pink-50"
                : "text-slate-400 hover:text-pink-500 hover:bg-pink-50"
            )}
            onClick={handleLike}
            title="いいね！"
            aria-label="いいね！"
          >
            <Heart className={cn("w-3.5 h-3.5", liked && "fill-pink-400")} />
            <span className="font-medium tabular-nums">{prompt.likeCount}</span>
          </button>

          {/* Edit/Delete - only for owned prompts */}
          {isOwned && (
            <div className="flex gap-0.5">
              <button
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                onClick={handleEdit}
                title="編集"
                aria-label="編集"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                onClick={handleDelete}
                title="削除"
                aria-label="削除"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
