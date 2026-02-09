"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Check, Undo2 } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
  /** Optional undo callback — when provided, shows an "元に戻す" button */
  onUndo?: () => void;
  /** Duration in ms before auto-dismiss (default 2500, with undo: 5000) */
  duration?: number;
}

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function showToast(text: string, options?: { onUndo?: () => void; duration?: number }): void {
  const msg: ToastMessage = {
    id: toastId++,
    text,
    onUndo: options?.onUndo,
    duration: options?.duration,
  };
  listeners.forEach(fn => fn(msg));
}

export function copyToClipboard(text: string, label = "コピーしました"): void {
  navigator.clipboard.writeText(text).then(() => {
    showToast(label);
  }).catch(() => {
    showToast("コピーに失敗しました");
  });
}

export default function ToastContainer(): React.ReactElement | null {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    // Clean up timer reference
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts(prev => [...prev, msg]);
    const timeout = msg.duration ?? (msg.onUndo ? 5000 : 2500);
    const timer = setTimeout(() => removeToast(msg.id), timeout);
    timersRef.current.set(msg.id, timer);
  }, [removeToast]);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-9999 flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 bg-slate-800 text-white px-5 py-3 rounded-[20px] shadow-xl",
            "text-sm font-bold tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          <Check className="w-4 h-4 text-yellow-400 shrink-0" />
          <span>{t.text}</span>
          {t.onUndo && (
            <button
              onClick={() => {
                t.onUndo?.();
                removeToast(t.id);
              }}
              className="ml-2 flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <Undo2 className="w-3.5 h-3.5" />
              元に戻す
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
