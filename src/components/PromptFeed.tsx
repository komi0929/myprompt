"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Copy, GitBranch, Star, Trash2, Pencil } from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { copyToClipboard, showToast } from "@/components/ui/Toast";
import { type Prompt, PHASES } from "@/lib/mock-data";

export function PromptFeed(): React.ReactElement {
  const { getFilteredPrompts } = usePromptStore();
  const prompts = getFilteredPrompts();

  return (
    <div className="grid grid-cols-1 gap-4 p-0.5 pb-28">
      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}

function PromptCard({ prompt }: { prompt: Prompt }): React.ReactElement {
  const { setSelectedPromptId, selectedPromptId, deletePrompt, toggleFavorite, favorites, openEditor } = usePromptStore();
  const { requireAuth } = useAuthGuard();
  const isSelected = selectedPromptId === prompt.id;
  const isFav = favorites.includes(prompt.id);
  const phaseInfo = PHASES.find(p => p.id === prompt.phase);

  const handleFavorite = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("お気に入り登録")) return;
    toggleFavorite(prompt.id);
    showToast(isFav ? "お気に入りから削除" : "お気に入りに追加しました");
  };

  const handleEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("プロンプトの編集")) return;
    openEditor(prompt);
  };

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (!requireAuth("プロンプトの削除")) return;
    deletePrompt(prompt.id);
    showToast("削除しました");
  };

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-between hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
        isSelected && "ring-2 ring-yellow-400 shadow-md shadow-yellow-100/50"
      )}
      onClick={() => setSelectedPromptId(prompt.id)}
    >
      {/* Top Decor Bar */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-[3px] rounded-t-xl",
        prompt.visibility === "Private" ? "bg-slate-200" : "bg-yellow-400"
      )} />

      {/* Always-visible action bar */}
      <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
        <button
          className={cn(
            "p-1.5 rounded-md transition-all",
            isFav
              ? "text-yellow-500 bg-yellow-50"
              : "text-slate-300 hover:text-yellow-500 hover:bg-yellow-50"
          )}
          onClick={handleFavorite}
          title={isFav ? "お気に入り解除" : "お気に入りに追加"}
        >
          <Star className={cn("w-4 h-4", isFav && "fill-yellow-400")} />
        </button>
        <button
          className="p-1.5 rounded-md text-slate-300 hover:text-yellow-600 hover:bg-yellow-50 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(prompt.content, "コピーしました ✨");
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
        </div>
        <CardTitle className="leading-snug group-hover:text-yellow-600 transition-colors line-clamp-2 pr-20">
          {prompt.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pb-2">
        <div className={cn(
          "relative bg-slate-50 p-3.5 rounded-lg text-sm text-slate-600 font-mono leading-relaxed line-clamp-3 border border-slate-100",
          "group-hover:bg-white group-hover:border-yellow-200 transition-colors"
        )}>
          {prompt.content}
        </div>
      </CardContent>

      <CardFooter className="justify-between pt-1 pb-3.5">
        <div className="flex gap-1.5 flex-wrap flex-1 min-w-0">
          {prompt.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="bg-slate-50 text-slate-400 border border-slate-100 text-[10px]">#{tag}</Badge>
          ))}
          {prompt.tags.length > 3 && (
            <span className="text-[10px] text-slate-300">+{prompt.tags.length - 3}</span>
          )}
        </div>

        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shrink-0">
          <button
            className="p-1.5 rounded-md text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all"
            onClick={handleEdit}
            title="編集"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
            onClick={handleDelete}
            title="削除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </CardFooter>
    </Card>
  );
}
