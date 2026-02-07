"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usePromptStore } from "@/lib/prompt-store";
import { PHASES, type Phase } from "@/lib/mock-data";

type PromptPhase = Exclude<Phase, "All">;
import { X, Save } from "lucide-react";
import { showToast } from "@/components/ui/Toast";

export default function PromptModal(): React.ReactElement | null {
  const { editingPrompt, closeEditor, addPrompt, updatePrompt } = usePromptStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [phase, setPhase] = useState<PromptPhase>("Implementation");
  const [visibility, setVisibility] = useState<"Private" | "Public">("Private");

  const isNew = editingPrompt?.id === "";

  useEffect(() => {
    if (editingPrompt) {
      setTitle(editingPrompt.title);
      setContent(editingPrompt.content);
      setTags(editingPrompt.tags);
      setPhase(editingPrompt.phase);
      setVisibility(editingPrompt.visibility);
    }
  }, [editingPrompt]);

  if (!editingPrompt) return null;

  const handleAddTag = (): void => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string): void => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSave = async (): Promise<void> => {
    if (!title.trim()) {
      showToast("タイトルを入力してください");
      return;
    }
    if (!content.trim()) {
      showToast("プロンプト内容を入力してください");
      return;
    }

    if (isNew) {
      await addPrompt({
        title: title.trim(),
        content: content.trim(),
        tags,
        phase,
        visibility,
        lineage: editingPrompt.lineage,
      });
      showToast("プロンプトを保存しました");
    } else {
      await updatePrompt(editingPrompt.id, {
        title: title.trim(),
        content: content.trim(),
        tags,
        phase,
        visibility,
      });
      showToast("プロンプトを更新しました");
    }
    closeEditor();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeEditor}>
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {isNew ? "新しいプロンプトを作成" : "プロンプトを編集"}
          </h2>
          <button onClick={closeEditor} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例: Cursor用レスポンシブ修正プロンプト"
              className="w-full h-12 px-5 rounded-[20px] border border-slate-200 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500">プロンプト内容</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="プロンプトの内容を入力&#10;&#10;変数には {変数名} を使えます"
              rows={10}
              className="w-full px-5 py-4 rounded-[20px] border border-slate-200 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all font-mono text-sm leading-relaxed resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-500">タグ</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                  onClick={() => handleRemoveTag(tag)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                placeholder="タグを入力して Enter"
                className="flex-1 h-10 px-4 rounded-[16px] border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all"
              />
              <Button size="sm" variant="secondary" onClick={handleAddTag} className="rounded-[16px]">
                追加
              </Button>
            </div>
          </div>

          {/* Phase & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">開発フェーズ</label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as PromptPhase)}
                className="w-full h-10 px-4 rounded-[16px] border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all bg-white"
              >
                {PHASES.filter(p => p.id !== "All").map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-500">公開設定</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as "Private" | "Public")}
                className="w-full h-10 px-4 rounded-[16px] border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all bg-white"
              >
                <option value="Private">🔒 自分のみ</option>
                <option value="Public">🌐 みんなに公開</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={closeEditor} className="rounded-[20px]">
            キャンセル
          </Button>
          <Button onClick={handleSave} className="rounded-[20px] shadow-lg shadow-yellow-200">
            <Save className="w-4 h-4 mr-2" />
            {isNew ? "保存する" : "更新する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
