"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Phase, type Prompt, MOCK_PROMPTS } from "@/lib/mock-data";

/* ─── History Snapshot ─── */
export interface HistoryEntry {
  timestamp: string;
  title: string;
  content: string;
}

/* ─── Store State ─── */
interface PromptStoreState {
  prompts: Prompt[];
  favorites: string[];
  history: Record<string, HistoryEntry[]>; // promptId -> snapshots
  view: "library" | "trend" | "favorites";
  visibilityFilter: "all" | "Private" | "Public";
  searchQuery: string;
  selectedPromptId: string | null;
  currentPhase: Phase;
  editingPrompt: Prompt | null; // null = closed, { id: "" } = new
}

/* ─── Actions ─── */
interface PromptStoreActions {
  addPrompt: (prompt: Omit<Prompt, "id" | "updatedAt">) => string;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => void;
  deletePrompt: (id: string) => void;
  duplicateAsArrangement: (sourceId: string) => void;
  toggleFavorite: (id: string) => void;
  setView: (view: PromptStoreState["view"]) => void;
  setVisibilityFilter: (f: PromptStoreState["visibilityFilter"]) => void;
  setSearchQuery: (q: string) => void;
  setSelectedPromptId: (id: string | null) => void;
  setCurrentPhase: (p: Phase) => void;
  openEditor: (prompt?: Prompt) => void;
  closeEditor: () => void;
  getHistory: (id: string) => HistoryEntry[];
  getFilteredPrompts: () => Prompt[];
}

type PromptStore = PromptStoreState & PromptStoreActions;

const PromptStoreContext = createContext<PromptStore | null>(null);

const STORAGE_KEY = "myprompt-data";

function loadFromStorage(): { prompts: Prompt[]; favorites: string[]; history: Record<string, HistoryEntry[]> } {
  if (typeof window === "undefined") return { prompts: MOCK_PROMPTS, favorites: [], history: {} };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        prompts?: Prompt[];
        favorites?: string[];
        history?: Record<string, HistoryEntry[]>;
      };
      return {
        prompts: parsed.prompts && parsed.prompts.length > 0 ? parsed.prompts : MOCK_PROMPTS,
        favorites: parsed.favorites ?? [],
        history: parsed.history ?? {},
      };
    }
  } catch { /* ignore parse errors */ }
  return { prompts: MOCK_PROMPTS, favorites: [], history: {} };
}

function saveToStorage(data: { prompts: Prompt[]; favorites: string[]; history: Record<string, HistoryEntry[]> }): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore quota errors */ }
}

let nextId = 100;

export function PromptStoreProvider({ children }: { children: ReactNode }): ReactNode {
  const [prompts, setPrompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [view, setView] = useState<PromptStoreState["view"]>("library");
  const [visibilityFilter, setVisibilityFilter] = useState<PromptStoreState["visibilityFilter"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("Implementation");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    const data = loadFromStorage();
    setPrompts(data.prompts);
    setFavorites(data.favorites);
    setHistory(data.history);
    // Auto-select first prompt if available
    if (data.prompts.length > 0) {
      setSelectedPromptId(data.prompts[0].id);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    saveToStorage({ prompts, favorites, history });
  }, [prompts, favorites, history, hydrated]);

  const addPrompt = useCallback((input: Omit<Prompt, "id" | "updatedAt">): string => {
    const id = String(nextId++);
    const newPrompt: Prompt = { ...input, id, updatedAt: new Date().toISOString() };
    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(id);
    // Save initial history
    setHistory(prev => ({
      ...prev,
      [id]: [{ timestamp: newPrompt.updatedAt, title: newPrompt.title, content: newPrompt.content }],
    }));
    return id;
  }, []);

  const updatePrompt = useCallback((id: string, updates: Partial<Omit<Prompt, "id">>): void => {
    setPrompts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
        // Save history snapshot
        setHistory(h => ({
          ...h,
          [id]: [...(h[id] ?? []), { timestamp: updated.updatedAt, title: updated.title, content: updated.content }],
        }));
        return updated;
      })
    );
  }, []);

  const deletePrompt = useCallback((id: string): void => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    setFavorites(prev => prev.filter(fid => fid !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
  }, [selectedPromptId]);

  const duplicateAsArrangement = useCallback((sourceId: string): void => {
    const source = prompts.find(p => p.id === sourceId);
    if (!source) return;
    const newPrompt: Prompt = {
      ...source,
      id: String(nextId++),
      title: `${source.title} (アレンジ)`,
      updatedAt: new Date().toISOString(),
      lineage: { parent: source.title, isOriginal: false },
    };
    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);
    setEditingPrompt(newPrompt);
  }, [prompts]);

  const toggleFavorite = useCallback((id: string): void => {
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  }, []);

  const openEditor = useCallback((prompt?: Prompt): void => {
    if (prompt) {
      setEditingPrompt(prompt);
    } else {
      // New prompt — default to "Implementation" if currentPhase is "All"
      const defaultPhase = currentPhase === "All" ? "Implementation" : currentPhase;
      setEditingPrompt({
        id: "",
        title: "",
        content: "",
        tags: [],
        phase: defaultPhase,
        visibility: "Private",
        updatedAt: "",
        lineage: { isOriginal: true },
      });
    }
  }, [currentPhase]);

  const closeEditor = useCallback((): void => {
    setEditingPrompt(null);
  }, []);

  const getHistory = useCallback((id: string): HistoryEntry[] => {
    return history[id] ?? [];
  }, [history]);

  const getFilteredPrompts = useCallback((): Prompt[] => {
    let result = prompts;

    // View filter
    if (view === "trend") {
      result = result.filter(p => p.visibility === "Public");
    } else if (view === "favorites") {
      result = result.filter(p => favorites.includes(p.id));
    }

    // Phase filter (skip if "All")
    if (currentPhase !== "All") {
      result = result.filter(p => p.phase === currentPhase);
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      result = result.filter(p => p.visibility === visibilityFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [prompts, view, currentPhase, visibilityFilter, searchQuery, favorites]);

  const store = useMemo<PromptStore>(() => ({
    prompts, favorites, history, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, setView, setVisibilityFilter, setSearchQuery,
    setSelectedPromptId, setCurrentPhase, openEditor, closeEditor,
    getHistory, getFilteredPrompts,
  }), [
    prompts, favorites, history, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, openEditor, closeEditor, getHistory, getFilteredPrompts,
  ]);

  return (
    <PromptStoreContext.Provider value={store}>
      {children}
    </PromptStoreContext.Provider>
  );
}

export function usePromptStore(): PromptStore {
  const ctx = useContext(PromptStoreContext);
  if (!ctx) throw new Error("usePromptStore must be used within PromptStoreProvider");
  return ctx;
}
