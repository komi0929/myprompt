"use client";

import { Sidebar } from "@/components/Sidebar";
import { PhaseCompass } from "@/components/PhaseCompass";
import { PromptFeed } from "@/components/PromptFeed";
import { DetailPanel } from "@/components/DetailPanel";
import { PromptStoreProvider, usePromptStore } from "@/lib/prompt-store";
import PromptModal from "@/components/PromptModal";
import LoginModal from "@/components/LoginModal";
import Footer from "@/components/Footer";
import Image from "next/image";

import WelcomeOverlay from "@/components/WelcomeOverlay";
import FloatingCreateButton from "@/components/FloatingCreateButton";
import BottomNav from "@/components/BottomNav";
import TagFilter from "@/components/TagFilter";
import ImportExportMenu from "@/components/ImportExportMenu";
import StatsBar from "@/components/StatsBar";
import CopyBuffer from "@/components/CopyBuffer";
import BulkActionBar from "@/components/BulkActionBar";
import type { BulkModeState } from "@/components/BulkActionBar";
import OnboardingProgress from "@/components/OnboardingProgress";
import { markMilestone } from "@/components/OnboardingProgress";
import { useAuth } from "@/components/AuthProvider";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { useKeyboardShortcuts } from "@/lib/useKeyboardShortcuts";
import { Search, Plus, Sparkles, X, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";

import CommandPalette from "@/components/CommandPalette";
import ErrorBoundary from "@/components/ErrorBoundary";
import SuccessCelebration from "@/components/SuccessCelebration";

export default function Page(): React.ReactElement {
  return (
    <PromptStoreProvider>
      <ErrorBoundary>
        <PageContent />
        <PromptModal />
        <LoginModal />
        <CommandPalette />
        <CopyBuffer />
      </ErrorBoundary>
      <SuccessCelebration />
    </PromptStoreProvider>
  );
}

function PageContent(): React.ReactElement {
  const { currentPhase, setCurrentPhase, filteredPrompts, searchQuery, setSearchQuery, openEditor, selectedPromptId, setSelectedPromptId } = usePromptStore();
  const { isGuest } = useAuth();
  const { requireAuth } = useAuthGuard();
  useKeyboardShortcuts();
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<BulkModeState>({ isActive: false, selectedIds: new Set() });

  // Debounced search
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((value: string): void => {
    setLocalSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      if (value.length > 0) markMilestone("search");
    }, 300);
  }, [setSearchQuery]);
  // Cleanup on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  // React-approved pattern: "Adjusting state when a prop changes"
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevSelectedId, setPrevSelectedId] = useState<string | null>(null);
  if (selectedPromptId !== prevSelectedId) {
    setPrevSelectedId(selectedPromptId);
    if (selectedPromptId && typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileDetailOpen(true);
    }
  }

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
        {/* Hero Header - compact */}
        <div className="px-4 md:px-6 pt-3 md:pt-4 pb-1 z-20 flex items-center justify-center gap-2">
          <Image
            src="/mascot.png"
            alt="マイプロンプト"
            width={200}
            height={200}
            className="h-[36px] w-[36px] md:h-[44px] md:w-[44px] object-contain drop-shadow-md shrink-0"
          />
          <div className="flex flex-col items-start">
            <p className="text-sm md:text-base font-extrabold text-slate-800 tracking-tight">
              プロンプト簡単メモサイト
            </p>
            <p className="text-[10px] md:text-xs font-medium text-yellow-600/80 tracking-wider">
              For バイブコーディング
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 md:px-6 pt-2 md:pt-3 pb-1 md:pb-2 z-20">
          <div className="relative max-w-4xl mx-auto">
            <Search className="absolute left-3 md:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="プロンプトを検索... (Ctrl+K)"
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all shadow-sm hover:shadow"
            />
          </div>
        </div>

        {/* Phase Compass + Tag Filter + Import/Export */}
        <div className="px-4 md:px-6 pb-1 z-20">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <PhaseCompass currentPhase={currentPhase} onPhaseChange={setCurrentPhase} />
              </div>
              <div className="hidden md:block shrink-0">
                <ImportExportMenu />
              </div>
            </div>
            <TagFilter />
          </div>
        </div>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 md:pb-10 scroll-smooth">
          <div className="max-w-4xl mx-auto py-3">
            <OnboardingProgress />
            <StatsBar />

            {filteredPrompts.length > 0 ? (
              <PromptFeed bulkMode={bulkMode} onToggleSelect={(id: string) => setBulkMode(prev => {
                const next = new Set(prev.selectedIds);
                if (next.has(id)) next.delete(id); else next.add(id);
                return { ...prev, selectedIds: next };
              })} />
            ) : (
              <EmptyState onCreateFirst={handleCreateNew} />
            )}
          </div>
          <Footer />
        </div>


        {/* Bulk mode button & bar */}
        {!bulkMode.isActive && (
          <button
            onClick={() => setBulkMode(prev => ({ ...prev, isActive: true }))}
            className="fixed bottom-24 md:bottom-6 left-4 z-40 flex items-center gap-1.5 px-3 h-10 rounded-xl bg-white border border-slate-200 shadow-md text-xs font-medium text-slate-500 hover:text-yellow-600 hover:border-yellow-300 transition-all"
            title="一括操作"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="hidden md:inline">選択</span>
          </button>
        )}
        <BulkActionBar bulkMode={bulkMode} setBulkMode={setBulkMode} />
      </main>

      {/* 3. Right Detail Panel - Desktop only */}
      <aside className="hidden lg:flex w-[400px] xl:w-[440px] h-full shrink-0 z-40">
        <DetailPanel />
      </aside>

      {/* 3b. Mobile Detail Drawer */}
      {mobileDetailOpen && selectedPromptId && (() => {
        const currentIndex = filteredPrompts.findIndex(p => p.id === selectedPromptId);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex < filteredPrompts.length - 1;
        const goTo = (dir: -1 | 1): void => {
          const next = filteredPrompts[currentIndex + dir];
          if (next) setSelectedPromptId(next.id);
        };
        return (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => setMobileDetailOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 flex items-center justify-between p-3 bg-white/90 backdrop-blur-md border-b border-slate-100 rounded-t-2xl z-10">
              {/* V-01: Prev/Next navigation */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => goTo(-1)}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="前のプロンプト"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <span className="text-[10px] text-slate-400 tabular-nums">{currentIndex + 1}/{filteredPrompts.length}</span>
                <button
                  onClick={() => goTo(1)}
                  disabled={!hasNext}
                  className="p-1.5 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="次のプロンプト"
                >
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="w-10 h-1 rounded-full bg-slate-200" />
              <button
                onClick={() => setMobileDetailOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <DetailPanel />
          </div>
        </div>
        );
      })()}

      {/* Floating Create Button (auth-guarded, desktop only) */}
      {!isGuest && <div className="hidden md:block"><FloatingCreateButton /></div>}

      {/* Mobile Bottom Navigation */}
      <BottomNav />

    </div>
  );
}

function EmptyState({ onCreateFirst }: { onCreateFirst: () => void }): React.ReactElement {
  const { isGuest } = useAuth();
  const { setView } = usePromptStore();

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
      <div className="flex flex-col gap-3 items-center">
        <button
          onClick={onCreateFirst}
          className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-slate-800 font-semibold px-6 py-3 rounded-xl shadow-md shadow-yellow-200 transition-all hover:scale-105 active:scale-[0.97] text-sm"
        >
          <Plus className="w-4 h-4" />
          最初のプロンプトをメモする
        </button>
        {isGuest && (
          <button
            onClick={() => setView("trend")}
            className="text-sm text-slate-400 hover:text-yellow-600 transition-colors underline underline-offset-2"
          >
            まずは公開プロンプトを見てみる 👀
          </button>
        )}
      </div>
    </div>
  );
}
