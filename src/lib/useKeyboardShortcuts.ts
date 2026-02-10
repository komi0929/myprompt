"use client";

import { useEffect, useCallback } from "react";
import { usePromptStore } from "@/lib/prompt-store";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { copyToClipboard } from "@/components/ui/Toast";

/**
 * Global keyboard shortcuts for the prompt memo tool.
 * Must be mounted inside PromptStoreProvider.
 */
export function useKeyboardShortcuts(): void {
  const {
    openEditor,
    getFilteredPrompts,
    selectedPromptId,
    setSelectedPromptId,
    incrementUseCount,
  } = usePromptStore();
  const { requireAuth } = useAuthGuard();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // Ctrl+K — Search focus
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="検索"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Ctrl+N — New prompt
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        if (requireAuth("プロンプトのメモ")) {
          openEditor();
        }
        return;
      }

      // Skip remaining shortcuts if editing text
      if (isInput) return;

      const prompts = getFilteredPrompts();
      if (prompts.length === 0) return;

      const currentIndex = prompts.findIndex((p) => p.id === selectedPromptId);

      // Arrow down — select next
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const nextIndex = currentIndex < prompts.length - 1 ? currentIndex + 1 : 0;
        setSelectedPromptId(prompts[nextIndex].id);
        return;
      }

      // Arrow up — select previous
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : prompts.length - 1;
        setSelectedPromptId(prompts[prevIndex].id);
        return;
      }

      // Escape — deselect / close
      if (e.key === "Escape") {
        setSelectedPromptId(null);
        return;
      }

      // C — copy currently selected prompt
      if (e.key === "c" && selectedPromptId) {
        const prompt = prompts.find((p) => p.id === selectedPromptId);
        if (prompt) {
          copyToClipboard(prompt.content, "コピーしました ✨");
          incrementUseCount(prompt.id);
        }
        return;
      }
    },
    [openEditor, requireAuth, getFilteredPrompts, selectedPromptId, setSelectedPromptId, incrementUseCount]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return (): void => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
}
