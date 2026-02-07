"use client";

import { Sidebar } from "@/components/Sidebar";
import { PhaseCompass } from "@/components/PhaseCompass";
import { PromptFeed } from "@/components/PromptFeed";
import { DetailPanel } from "@/components/DetailPanel";
import { PromptStoreProvider, usePromptStore } from "@/lib/prompt-store";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGuardProvider } from "@/lib/useAuthGuard";
import ToastContainer from "@/components/ui/Toast";
import PromptModal from "@/components/PromptModal";
import LoginModal from "@/components/LoginModal";
import Footer from "@/components/Footer";

import WelcomeOverlay from "@/components/WelcomeOverlay";
import FloatingCreateButton from "@/components/FloatingCreateButton";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { Search, Plus, Sparkles } from "lucide-react";

export default function Page(): React.ReactElement {
  return (
    <AuthProvider>
      <AuthGuardProvider>
        <PromptStoreProvider>
          <PageContent />
          <PromptModal />
          <LoginModal />
          <ToastContainer />
        </PromptStoreProvider>
      </AuthGuardProvider>
    </AuthProvider>
  );
}

function PageContent(): React.ReactElement {
  const { currentPhase, setCurrentPhase, getFilteredPrompts, searchQuery, setSearchQuery, openEditor } = usePromptStore();
  const { isGuest } = useAuth();
  const { requireAuth } = useAuthGuard();
  const filteredPrompts = getFilteredPrompts();

  const handleCreateNew = (): void => {
    if (requireAuth("プロンプトのメモ")) {
      openEditor();
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Welcome Overlay (first visit only) */}
      <WelcomeOverlay onCreateFirst={handleCreateNew} />

      {/* 1. Left Sidebar */}
      <Sidebar className="hidden md:flex shrink-0 z-30" />

      {/* 2. Center Main Feed */}
      <main className="flex-1 flex flex-col h-full relative z-10 overflow-hidden">
        {/* Shoulder Copy */}
        <div className="px-6 pt-5 pb-0 z-20">
          <p className="text-center text-xs text-slate-400 tracking-wide">バイブコーダーのためのプロンプト簡単メモサイト</p>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-3 pb-2 z-20">
          <div className="relative max-w-4xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="プロンプトを検索..."
              className="h-10 w-full rounded-lg bg-white border border-slate-200 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-300 transition-all shadow-sm hover:shadow"
            />
          </div>
        </div>

        {/* Phase Compass */}
        <div className="px-6 pb-1 z-20">
          <div className="max-w-4xl mx-auto">
            <PhaseCompass currentPhase={currentPhase} onPhaseChange={setCurrentPhase} />
          </div>
        </div>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 scroll-smooth">
          <div className="max-w-4xl mx-auto py-3">

            {filteredPrompts.length > 0 ? (
              <PromptFeed />
            ) : (
              <EmptyState onCreateFirst={handleCreateNew} />
            )}
          </div>
          <Footer />
        </div>
      </main>

      {/* 3. Right Detail Panel */}
      <aside className="hidden lg:flex w-[400px] xl:w-[440px] h-full shrink-0 z-40">
        <DetailPanel />
      </aside>

      {/* Floating Create Button (auth-guarded) */}
      {!isGuest && <FloatingCreateButton />}


    </div>
  );
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-xl bg-yellow-50 flex items-center justify-center mb-5">
        <Sparkles className="w-8 h-8 text-yellow-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-600 mb-1.5">
        まだプロンプトはありません
      </h3>
      <p className="text-slate-400 text-sm mb-5 max-w-xs leading-relaxed">
        ChatGPTやCursorで使えるプロンプトを<br />メモしてみましょう！
      </p>
      <button
        onClick={onCreateFirst}
        className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-6 py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-105 active:scale-[0.97] text-sm"
      >
        <Plus className="w-4 h-4" />
        最初のプロンプトをメモする
      </button>
    </div>
  );
}
