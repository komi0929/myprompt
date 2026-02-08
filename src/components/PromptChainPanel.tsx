"use client";

import { useState, useCallback } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { Link2, Plus, Trash2, GripVertical, Copy, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { copyToClipboard } from "@/components/ui/Toast";
import { addToCopyBuffer } from "@/components/CopyBuffer";

interface ChainItem {
  promptId: string;
  note?: string;
}

const CHAIN_STORAGE_KEY = "myprompt-chains";

interface SavedChain {
  id: string;
  name: string;
  items: ChainItem[];
  createdAt: string;
}

function loadChains(): SavedChain[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CHAIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedChain[]) : [];
  } catch {
    return [];
  }
}

function saveChains(chains: SavedChain[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHAIN_STORAGE_KEY, JSON.stringify(chains));
}

export default function PromptChainPanel(): React.ReactElement {
  const { prompts, setSelectedPromptId } = usePromptStore();
  const [chains, setChains] = useState<SavedChain[]>(loadChains);
  const [editing, setEditing] = useState<SavedChain | null>(null);
  const [expanded, setExpanded] = useState(false);

  const handleCreateNew = useCallback((): void => {
    const newChain: SavedChain = {
      id: crypto.randomUUID(),
      name: "新しいチェイン",
      items: [],
      createdAt: new Date().toISOString(),
    };
    setEditing(newChain);
  }, []);

  const handleSaveChain = useCallback((): void => {
    if (!editing) return;
    setChains(prev => {
      const filtered = prev.filter(c => c.id !== editing.id);
      const updated = [editing, ...filtered];
      saveChains(updated);
      return updated;
    });
    setEditing(null);
  }, [editing]);

  const handleDeleteChain = useCallback((id: string): void => {
    setChains(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChains(updated);
      return updated;
    });
    if (editing?.id === id) setEditing(null);
  }, [editing]);

  const handleAddItem = useCallback((promptId: string): void => {
    if (!editing) return;
    setEditing(prev => prev ? { ...prev, items: [...prev.items, { promptId }] } : null);
  }, [editing]);

  const handleRemoveItem = useCallback((index: number): void => {
    if (!editing) return;
    setEditing(prev => prev ? { ...prev, items: prev.items.filter((_, i) => i !== index) } : null);
  }, [editing]);

  const handleCopyAll = useCallback((chain: SavedChain): void => {
    const texts = chain.items
      .map(item => {
        const p = prompts.find(pr => pr.id === item.promptId);
        if (!p) return null;
        return `## ${p.title}\n\n${p.content}`;
      })
      .filter(Boolean)
      .join("\n\n---\n\n");
    copyToClipboard(texts, `「${chain.name}」(${chain.items.length}件)\u3092コピー ✨`);
    // Add first item to buffer
    const firstPrompt = prompts.find(p => p.id === chain.items[0]?.promptId);
    if (firstPrompt) addToCopyBuffer(chain.id, chain.name, texts);
  }, [prompts]);

  // Available prompts to add (not already in chain)
  const availablePrompts = editing
    ? prompts.filter(p => !editing.items.some(i => i.promptId === p.id))
    : [];

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center justify-between w-full"
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <Link2 className="w-3.5 h-3.5" />
          プロンプトチェイン
          {chains.length > 0 && (
            <span className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {chains.length}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-2 animate-in fade-in duration-200">
          {/* Saved chains */}
          {chains.map(chain => (
            <div key={chain.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-600">{chain.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleCopyAll(chain)} className="p-1 rounded hover:bg-yellow-50 text-slate-400 hover:text-yellow-600 transition-colors" title="全てコピー">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEditing(chain)} className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="編集">
                    <GripVertical className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDeleteChain(chain.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="削除">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {chain.items.map((item, i) => {
                  const p = prompts.find(pr => pr.id === item.promptId);
                  return (
                    <span key={`${item.promptId}-${i}`} className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedPromptId(item.promptId)}
                        className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 hover:border-yellow-300 hover:text-yellow-700 transition-colors truncate max-w-[100px]"
                      >
                        {p?.title ?? "?"}
                      </button>
                      {i < chain.items.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-slate-300" />}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Editing view */}
          {editing && (
            <div className="p-3 bg-white rounded-lg border-2 border-yellow-300 shadow-md space-y-2">
              <input
                value={editing.name}
                onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full text-sm font-semibold text-slate-700 bg-transparent border-b border-slate-200 outline-none focus:border-yellow-400 pb-1"
                placeholder="チェイン名"
              />
              {/* Chain items */}
              <div className="space-y-1">
                {editing.items.map((item, i) => {
                  const p = prompts.find(pr => pr.id === item.promptId);
                  return (
                    <div key={`edit-${item.promptId}-${i}`} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-md px-2 py-1.5">
                      <span className="text-[10px] text-slate-400 font-bold w-4">{i + 1}</span>
                      <span className="flex-1 truncate">{p?.title ?? "?"}</span>
                      <button onClick={() => handleRemoveItem(i)} className="p-0.5 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Add prompt selector */}
              {availablePrompts.length > 0 && (
                <select
                  onChange={e => { if (e.target.value) { handleAddItem(e.target.value); e.target.value = ""; } }}
                  className="w-full text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 focus:outline-none focus:border-yellow-300"
                  defaultValue=""
                >
                  <option value="">+ プロンプトを追加...</option>
                  {availablePrompts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              )}
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>キャンセル</Button>
                <Button size="sm" onClick={handleSaveChain}>保存</Button>
              </div>
            </div>
          )}

          {/* Create button */}
          {!editing && (
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 hover:border-yellow-300 hover:text-yellow-600 transition-all"
            >
              <Plus className="w-3 h-3" />
              新しいチェインを作成
            </button>
          )}
        </div>
      )}
    </div>
  );
}
