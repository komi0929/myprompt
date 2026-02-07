"use client";

import { Sidebar } from "@/components/Sidebar";
import { PhaseCompass } from "@/components/PhaseCompass";
import { PromptFeed } from "@/components/PromptFeed";
import { DetailPanel } from "@/components/DetailPanel";
import { PromptStoreProvider, usePromptStore } from "@/lib/prompt-store";
import { PHASES } from "@/lib/mock-data";
import ToastContainer from "@/components/ui/Toast";
import PromptModal from "@/components/PromptModal";
import WelcomeOverlay from "@/components/WelcomeOverlay";
import FloatingCreateButton from "@/components/FloatingCreateButton";
import { Search, Plus, Sparkles } from "lucide-react";

export default function Page(): React.ReactElement {
  return (
    <PromptStoreProvider>
      <PageContent />
      <PromptModal />
      <ToastContainer />
    </PromptStoreProvider>
  );
}

function PageContent(): React.ReactElement {
  const { currentPhase, setCurrentPhase, getFilteredPrompts, searchQuery, setSearchQuery, openEditor } = usePromptStore();
  const filteredPrompts = getFilteredPrompts();
  const currentPhaseData = PHASES.find(p => p.id === currentPhase);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Welcome Overlay (first visit only) */}
      <WelcomeOverlay onCreateFirst={() => openEditor()} />

      {/* 1. Left Sidebar */}
      <Sidebar className="hidden md:flex shrink-0 z-30" />

      {/* 2. Center Main Feed */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Search Bar — always visible at top */}
        <div className="px-8 pt-6 pb-2 z-20">
          <div className="relative max-w-4xl mx-auto">
            <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="プロンプトを検索..."
              className="h-14 w-full rounded-[24px] bg-white border border-slate-100 pl-14 pr-6 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all shadow-sm hover:shadow"
            />
          </div>
        </div>

        {/* Phase Compass */}
        <div className="px-8 pb-2 z-20">
          <div className="max-w-4xl mx-auto">
            <PhaseCompass currentPhase={currentPhase} onPhaseChange={setCurrentPhase} />
          </div>
        </div>
        
        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 scroll-smooth">
          <div className="max-w-4xl mx-auto py-4">
            <div className="mb-6 pl-2 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {currentPhaseData ? `${currentPhaseData.icon} ${currentPhaseData.label}` : "プロンプト"}
                </h2>
                <p className="text-slate-400 mt-1 text-sm">
                  {filteredPrompts.length} 件のプロンプト
                </p>
              </div>
            </div>
            
            {filteredPrompts.length > 0 ? (
              <PromptFeed />
            ) : (
              <EmptyState onCreateFirst={() => openEditor()} />
            )}
          </div>
        </div>
      </main>

      {/* 3. Right Detail Panel */}
      <aside className="hidden lg:flex w-[420px] xl:w-[480px] h-full shrink-0 z-40">
        <DetailPanel />
      </aside>

      {/* Floating Create Button */}
      <FloatingCreateButton />
    </div>
  );
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-yellow-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-600 mb-2">
        まだプロンプトはありません
      </h3>
      <p className="text-slate-400 mb-6 max-w-xs leading-relaxed">
        ChatGPTやCursorで使えるプロンプトを<br />保存してみましょう！
      </p>
      <button
        onClick={onCreateFirst}
        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-bold px-8 py-4 rounded-[20px] shadow-lg shadow-yellow-200 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-5 h-5" />
        最初のプロンプトを作成する
      </button>
    </div>
  );
}
