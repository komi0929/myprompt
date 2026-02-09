"use client";

import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Plus } from "lucide-react";

export default function FloatingCreateButton(): React.ReactElement {
  const { openEditor } = usePromptStore();
  const { requireAuth } = useAuthGuard();

  const handleCreate = (): void => {
    if (requireAuth("プロンプトのメモ")) {
      openEditor();
    }
  };

  return (
    <button
      onClick={handleCreate}
      className="fixed bottom-6 right-6 z-80 flex items-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold pl-4 pr-5 py-3 rounded-xl shadow-lg shadow-yellow-300/40 hover:shadow-yellow-400/50 transition-all hover:scale-105 active:scale-[0.97]"
      title="新しいプロンプトをメモ"
    >
      <Plus className="w-4 h-4" />
      <span className="text-sm">メモ</span>
    </button>
  );
}
