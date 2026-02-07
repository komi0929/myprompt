"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ToastMessage {
  id: number;
  text: string;
}

let toastId = 0;
const listeners: Array<(msg: ToastMessage) => void> = [];

export function showToast(text: string): void {
  const msg: ToastMessage = { id: toastId++, text };
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

  const addToast = useCallback((msg: ToastMessage) => {
    setToasts(prev => [...prev, msg]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== msg.id));
    }, 2500);
  }, []);

  useEffect(() => {
    listeners.push(addToast);
    return () => {
      const idx = listeners.indexOf(addToast);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 items-center">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-[20px] shadow-xl",
            "text-sm font-bold tracking-wide animate-in fade-in slide-in-from-bottom-4 duration-300"
          )}
        >
          <Check className="w-4 h-4 text-yellow-400" />
          {t.text}
        </div>
      ))}
    </div>
  );
}
