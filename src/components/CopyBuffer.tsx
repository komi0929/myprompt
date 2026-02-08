"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, X } from "lucide-react";
import { copyToClipboard } from "@/components/ui/Toast";

interface BufferItem {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

const BUFFER_MAX = 3;
const BUFFER_TTL = 5 * 60 * 1000; // 5 minutes

export default function CopyBuffer(): React.ReactElement {
  const [items, setItems] = useState<BufferItem[]>([]);

  // Add item to buffer (called externally via custom event)
  useEffect(() => {
    const handler = (e: CustomEvent<BufferItem>): void => {
      setItems(prev => {
        const filtered = prev.filter(i => i.id !== e.detail.id);
        return [e.detail, ...filtered].slice(0, BUFFER_MAX);
      });
    };
    window.addEventListener("copybuffer:add", handler as EventListener);
    return () => window.removeEventListener("copybuffer:add", handler as EventListener);
  }, []);

  // Auto-clear after TTL
  useEffect(() => {
    if (items.length === 0) return;
    const timer = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(i => now - i.timestamp < BUFFER_TTL));
    }, 30000);
    return () => clearInterval(timer);
  }, [items.length]);

  const handleRecopy = useCallback((item: BufferItem): void => {
    copyToClipboard(item.content, `「${item.title}」をコピー ✨`);
  }, []);

  const handleRemove = useCallback((id: string): void => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  const handleClearAll = useCallback((): void => {
    setItems([]);
  }, []);

  if (items.length === 0) return <></>;

  return (
    <div className="fixed bottom-24 md:bottom-6 right-4 z-50 w-64 animate-in slide-in-from-right duration-300">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-slate-100">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Copy className="w-3 h-3" />
            コピー履歴 ({items.length})
          </span>
          <button onClick={handleClearAll} className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors">
            クリア
          </button>
        </div>

        {/* Items */}
        <div className="divide-y divide-slate-50">
          {items.map(item => (
            <div
              key={item.id}
              className="group flex items-center gap-2 px-3 py-2 hover:bg-yellow-50/50 transition-colors cursor-pointer"
              onClick={() => handleRecopy(item)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-600 truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 truncate">{item.content.slice(0, 40)}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleRemove(item.id); }}
                className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-300 hover:text-slate-500 transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Call this to add a copied prompt to the buffer */
export function addToCopyBuffer(id: string, title: string, content: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("copybuffer:add", {
    detail: { id, title, content, timestamp: Date.now() },
  }));
}
