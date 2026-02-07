"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Phase, type Prompt, MOCK_PROMPTS } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

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
  history: Record<string, HistoryEntry[]>;
  view: "library" | "trend" | "favorites";
  visibilityFilter: "all" | "Private" | "Public";
  searchQuery: string;
  selectedPromptId: string | null;
  currentPhase: Phase;
  editingPrompt: Prompt | null;
}

/* ─── Actions ─── */
interface PromptStoreActions {
  addPrompt: (prompt: Omit<Prompt, "id" | "updatedAt">) => Promise<string>;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicateAsArrangement: (sourceId: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
  setView: (view: PromptStoreState["view"]) => void;
  setVisibilityFilter: (f: PromptStoreState["visibilityFilter"]) => void;
  setSearchQuery: (q: string) => void;
  setSelectedPromptId: (id: string | null) => void;
  setCurrentPhase: (p: Phase) => void;
  openEditor: (prompt?: Prompt) => void;
  closeEditor: () => void;
  getHistory: (id: string) => HistoryEntry[];
  getFilteredPrompts: () => Prompt[];
  refreshPrompts: () => Promise<void>;
}

type PromptStore = PromptStoreState & PromptStoreActions;

const PromptStoreContext = createContext<PromptStore | null>(null);

/* ─── DB Row → Prompt ─── */
interface DbPrompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  phase: string;
  visibility: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

function dbToPrompt(row: DbPrompt): Prompt {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    phase: row.phase as Prompt["phase"],
    visibility: row.visibility as Prompt["visibility"],
    updatedAt: row.updated_at,
    lineage: {
      parent: row.parent_id ?? undefined,
      isOriginal: !row.parent_id,
    },
  };
}

export function PromptStoreProvider({ children }: { children: ReactNode }): ReactNode {
  const { user, isGuest } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [view, setView] = useState<PromptStoreState["view"]>("library");
  const [visibilityFilter, setVisibilityFilter] = useState<PromptStoreState["visibilityFilter"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("All");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);

  /* ─── Fetch prompts from Supabase ─── */
  const refreshPrompts = useCallback(async (): Promise<void> => {
    try {
      if (isGuest) {
        // Guest: only public prompts
        const { data, error } = await supabase
          .from("prompts")
          .select("*")
          .eq("visibility", "Public")
          .order("updated_at", { ascending: false });
        if (!error && data) {
          setPrompts(data.map(dbToPrompt));
        } else {
          // Fallback to mock data if DB not set up yet
          setPrompts(MOCK_PROMPTS);
        }
      } else {
        // Logged in: public + own prompts
        const { data, error } = await supabase
          .from("prompts")
          .select("*")
          .order("updated_at", { ascending: false });
        if (!error && data) {
          setPrompts(data.map(dbToPrompt));
        } else {
          setPrompts(MOCK_PROMPTS);
        }
      }
    } catch {
      // DB not configured yet, use mock data
      setPrompts(MOCK_PROMPTS);
    }
  }, [isGuest]);

  /* ─── Fetch favorites from Supabase ─── */
  const refreshFavorites = useCallback(async (): Promise<void> => {
    if (isGuest || !user) return;
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("prompt_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setFavorites(data.map(f => f.prompt_id));
      }
    } catch {
      // ignore
    }
  }, [isGuest, user]);

  // Hydrate on auth change
  useEffect(() => {
    const load = async (): Promise<void> => {
      await refreshPrompts();
      await refreshFavorites();
      setHydrated(true);
    };
    load();
  }, [refreshPrompts, refreshFavorites]);

  // Auto-select first prompt
  useEffect(() => {
    if (hydrated && prompts.length > 0 && !selectedPromptId) {
      setSelectedPromptId(prompts[0].id);
    }
  }, [hydrated, prompts, selectedPromptId]);

  /* ─── CRUD Operations ─── */
  const addPrompt = useCallback(async (input: Omit<Prompt, "id" | "updatedAt">): Promise<string> => {
    if (!user) return "";
    const { data, error } = await supabase
      .from("prompts")
      .insert({
        user_id: user.id,
        title: input.title,
        content: input.content,
        tags: input.tags,
        phase: input.phase,
        visibility: input.visibility,
        parent_id: input.lineage.parent ?? null,
      })
      .select()
      .single();
    if (error || !data) {
      // Fallback: optimistic local-only
      const localId = crypto.randomUUID();
      const newPrompt: Prompt = { ...input, id: localId, updatedAt: new Date().toISOString() };
      setPrompts(prev => [newPrompt, ...prev]);
      setSelectedPromptId(localId);
      return localId;
    }
    const newPrompt = dbToPrompt(data);
    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);

    // Save initial history
    await supabase.from("prompt_history").insert({
      prompt_id: newPrompt.id,
      title: newPrompt.title,
      content: newPrompt.content,
    });

    return newPrompt.id;
  }, [user]);

  const updatePrompt = useCallback(async (id: string, updates: Partial<Omit<Prompt, "id">>): Promise<void> => {
    // Optimistic update
    setPrompts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        return { ...p, ...updates, updatedAt: new Date().toISOString() };
      })
    );

    if (user) {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.content !== undefined) dbUpdates.content = updates.content;
      if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
      if (updates.phase !== undefined) dbUpdates.phase = updates.phase;
      if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;

      await supabase.from("prompts").update(dbUpdates).eq("id", id);

      // Save history
      const prompt = prompts.find(p => p.id === id);
      if (prompt) {
        await supabase.from("prompt_history").insert({
          prompt_id: id,
          title: updates.title ?? prompt.title,
          content: updates.content ?? prompt.content,
        });
      }
    }
  }, [user, prompts]);

  const deletePrompt = useCallback(async (id: string): Promise<void> => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    setFavorites(prev => prev.filter(fid => fid !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
    if (user) {
      await supabase.from("prompts").delete().eq("id", id);
    }
  }, [selectedPromptId, user]);

  const duplicateAsArrangement = useCallback((sourceId: string): void => {
    const source = prompts.find(p => p.id === sourceId);
    if (!source) return;
    const newPrompt: Prompt = {
      ...source,
      id: crypto.randomUUID(),
      title: `${source.title} (アレンジ)`,
      updatedAt: new Date().toISOString(),
      lineage: { parent: source.title, isOriginal: false },
    };
    setEditingPrompt(newPrompt);
  }, [prompts]);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const isFav = favorites.includes(id);
    // Optimistic
    setFavorites(prev => isFav ? prev.filter(fid => fid !== id) : [...prev, id]);

    if (user) {
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("prompt_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, prompt_id: id });
      }
    }
  }, [favorites, user]);

  const openEditor = useCallback((prompt?: Prompt): void => {
    if (prompt) {
      setEditingPrompt(prompt);
    } else {
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

  // Fetch history from Supabase on demand
  const getHistoryAsync = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_history")
      .select("title, content, created_at")
      .eq("prompt_id", id)
      .order("created_at", { ascending: false });
    if (data) {
      setHistory(prev => ({
        ...prev,
        [id]: data.map(h => ({ timestamp: h.created_at, title: h.title, content: h.content })),
      }));
    }
  }, [user]);

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
    getHistory, getFilteredPrompts, refreshPrompts,
  }), [
    prompts, favorites, history, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, openEditor, closeEditor, getHistory, getFilteredPrompts, refreshPrompts,
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
