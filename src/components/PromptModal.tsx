"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { usePromptStore } from "@/lib/prompt-store";
import { PHASES, type Phase } from "@/lib/types";

type PromptPhase = Exclude<Phase, "All">;
import { X, Save, Clock } from "lucide-react";
import { showToast } from "@/components/ui/Toast";
import { showCelebration } from "@/components/SuccessCelebration";
import TagAutocomplete from "@/components/TagAutocomplete";

export default function PromptModal(): React.ReactElement | null {
  const { editingPrompt, closeEditor, addPrompt, updatePrompt } = usePromptStore();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [phase, setPhase] = useState<PromptPhase>("Implementation");
  const [visibility, setVisibility] = useState<"Private" | "Public">("Public");
  const [notes, setNotes] = useState("");
  const [hasDraft, setHasDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveHistory, setSaveHistory] = useState(false);
  const [historyLabel, setHistoryLabel] = useState("");

  const isNew = editingPrompt?.id === "";

  // React-approved: "Adjusting state when a prop changes"
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevEditingId, setPrevEditingId] = useState<string | undefined>(undefined);
  const editingId = editingPrompt?.id;
  if (editingId !== undefined && editingId !== prevEditingId) {
    setPrevEditingId(editingId);
    setTagInput(""); // Reset tag input on prompt change (B-11 fix)

    const draftKey = `myprompt-draft-${editingId || "new"}`;
    const savedDraft = typeof window !== "undefined" ? localStorage.getItem(draftKey) : null;
    if (savedDraft && editingId === "") {
      try {
        const draft = JSON.parse(savedDraft) as { title: string; content: string; tags: string[]; phase: PromptPhase; visibility: "Private" | "Public"; notes?: string };
        if (draft.title || draft.content) {
          setTitle(draft.title);
          setContent(draft.content);
          setTags(draft.tags ?? []);
          setPhase(draft.phase ?? "Implementation");
          setVisibility(draft.visibility ?? "Public");
          setNotes(draft.notes ?? "");
          setHasDraft(true);
        } else {
          setTitle(editingPrompt!.title);
          setContent(editingPrompt!.content);
          setTags(editingPrompt!.tags);
          setPhase(editingPrompt!.phase);
          setVisibility(editingPrompt!.visibility);
          setNotes("");
          setHasDraft(false);
        }
      } catch {
        setTitle(editingPrompt!.title);
        setContent(editingPrompt!.content);
        setTags(editingPrompt!.tags);
        setPhase(editingPrompt!.phase);
        setVisibility(editingPrompt!.visibility);
        setNotes("");
        setHasDraft(false);
      }
    } else if (editingPrompt) {
      setTitle(editingPrompt.title);
      setContent(editingPrompt.content);
      setTags(editingPrompt.tags);
      setPhase(editingPrompt.phase);
      setVisibility(editingPrompt.visibility);
      setNotes(editingPrompt.notes ?? "");
      setHasDraft(false);
    }
  }

  if (!editingPrompt) return null;

  // Auto-save draft to localStorage
  const draftKey = `myprompt-draft-${editingPrompt.id || "new"}`;
  const saveDraft = (): void => {
    if (typeof window !== "undefined" && (title || content)) {
      localStorage.setItem(draftKey, JSON.stringify({ title, content, tags, phase, visibility, notes }));
    }
  };
  const clearDraft = (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(draftKey);
    }
    setHasDraft(false);
  };

  const handleAddTag = (tagValue?: string): void => {
    const t = (tagValue ?? tagInput).trim();
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

    setSaving(true);
    try {
      if (isNew) {
        const id = await addPrompt({
          title: title.trim(),
          content: content.trim(),
          tags,
          phase,
          visibility,
          notes: notes.trim() || undefined,
        });
        if (!id) { setSaving(false); return; }
        showCelebration(visibility === "Public" ? "share" : "save");
      } else {
        const ok = await updatePrompt(editingPrompt.id, {
          title: title.trim(),
          content: content.trim(),
          tags,
          phase,
          visibility,
          notes: notes.trim() || undefined,
        }, { save: saveHistory, label: historyLabel.trim() || undefined });
        if (!ok) { setSaving(false); return; }
        if (visibility === "Public" && editingPrompt.visibility !== "Public") {
          showCelebration("share");
        }
        showToast(saveHistory ? "更新に成功しました（履歴あり）✅" : "更新に成功しました ✅");
      }
      clearDraft();
      closeEditor();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={closeEditor}>

      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            {isNew ? "新しいプロンプトをメモ" : "プロンプトを編集"}
          </h2>
          <button onClick={closeEditor} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors" aria-label="閉じる">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Draft Banner */}
        {hasDraft && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
            <span className="text-xs text-amber-600">📝 前回の下書きを復元しました</span>
            <button onClick={() => { clearDraft(); setTitle(""); setContent(""); setTags([]); }} className="text-[10px] text-amber-500 hover:text-amber-700 transition-colors">クリア</button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); saveDraft(); }}
              placeholder="例: Cursor用レスポンシブ修正プロンプト"
              maxLength={200}
              className="w-full h-10 px-4 rounded-lg border border-slate-200 text-slate-700 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">プロンプト本文</label>
            <textarea
              value={content}
              onChange={e => { setContent(e.target.value); saveDraft(); }}
              placeholder={"プロンプトの内容を入力\n\n変数には {変数名} を使えます"}
              rows={8}
              maxLength={10000}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all font-mono leading-relaxed resize-none"
            />
          </div>

          {/* 補足情報 */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">💡 補足情報（任意）</label>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); saveDraft(); }}
              placeholder="使い方のコツ、効果的だった場面、注意点など"
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 text-slate-700 text-sm placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all resize-none"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">タグ</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {tags.map(tag => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-[11px]"
                  onClick={() => handleRemoveTag(tag)}
                >
                  #{tag} ×
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <TagAutocomplete
                value={tagInput}
                onChange={setTagInput}
                onAddTag={handleAddTag}
                existingTags={tags}
                placeholder="タグを入力して Enter"
                className="flex-1"
              />
              <Button size="sm" variant="secondary" onClick={() => handleAddTag(tagInput)}>
                追加
              </Button>
            </div>
          </div>

          {/* Phase & Visibility */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">開発フェーズ</label>
              <select
                value={phase}
                onChange={e => setPhase(e.target.value as PromptPhase)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all bg-white"
              >
                {PHASES.filter(p => p.id !== "All").map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">公開設定</label>
              <select
                value={visibility}
                onChange={e => setVisibility(e.target.value as "Private" | "Public")}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all bg-white"
              >
                <option value="Private">🔒 自分のみ</option>
                <option value="Public">🌐 みんなに公開</option>
              </select>
            </div>
          </div>

          {/* History Save Option (update only) */}
          {!isNew && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={saveHistory}
                  onChange={e => setSaveHistory(e.target.checked)}
                  className="w-4 h-4 accent-yellow-500 rounded"
                />
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">この更新を編集履歴に残す</span>
              </label>
              {saveHistory && (
                <input
                  type="text"
                  value={historyLabel}
                  onChange={e => setHistoryLabel(e.target.value)}
                  placeholder="バージョン名（例: GPT-4o向け調整）"
                  maxLength={60}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all bg-white placeholder:text-slate-300"
                />
              )}
              <p className="text-[10px] text-slate-400 leading-relaxed">※ 誤字脱字の修正など軽微な変更は履歴を残さないことを推奨します</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <Button variant="ghost" onClick={closeEditor}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={saving} className="shadow-md shadow-yellow-200">
            <Save className="w-4 h-4 mr-1.5" />
            {saving ? "保存中..." : isNew ? "メモする" : "更新する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
