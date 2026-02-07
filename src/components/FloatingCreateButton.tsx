"use client";

import { Plus } from "lucide-react";
import { usePromptStore } from "@/lib/prompt-store";

export default function FloatingCreateButton(): React.ReactElement {
  const { openEditor } = usePromptStore();

  return (
    <button
      onClick={() => openEditor()}
      className="fixed bottom-8 right-8 z-[80] flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-bold pl-5 pr-6 py-4 rounded-[24px] shadow-xl shadow-yellow-300/40 hover:shadow-yellow-400/50 transition-all duration-300 hover:scale-105 active:scale-95"
      title="新しいプロンプトを作成"
    >
      <Plus className="w-6 h-6" />
      <span className="text-base">作成</span>
    </button>
  );
}
