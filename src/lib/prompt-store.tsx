"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Phase, type Prompt } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

/* ─── History Snapshot ─── */
export type SortOrder = "updated" | "created" | "useCount" | "likes" | "title";

export const SORT_OPTIONS: { value: SortOrder; label: string }[] = [
  { value: "updated", label: "更新日順" },
  { value: "useCount", label: "よく使う順" },
  { value: "likes", label: "いいね順" },
  { value: "title", label: "タイトル順" },
];

export interface HistoryEntry {
  timestamp: string;
  title: string;
  content: string;
}

/* ─── Notification ─── */
export interface AppNotification {
  id: string;
  type: "like" | "favorite" | "fork";
  promptId: string;
  promptTitle: string;
  actorName: string;
  timestamp: string;
  read: boolean;
}

/* ─── Store State ─── */
interface PromptStoreState {
  prompts: Prompt[];
  favorites: string[];
  likes: string[];
  history: Record<string, HistoryEntry[]>;
  notifications: AppNotification[];
  unreadCount: number;
  view: "library" | "trend";
  visibilityFilter: "all" | "Private" | "Public";
  searchQuery: string;
  selectedPromptId: string | null;
  currentPhase: Phase;
  editingPrompt: Prompt | null;
  sortOrder: SortOrder;
}

/* ─── Actions ─── */
interface PromptStoreActions {
  addPrompt: (prompt: Omit<Prompt, "id" | "updatedAt" | "likeCount">) => Promise<string>;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicateAsArrangement: (sourceId: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  isFavorited: (id: string) => boolean;
  isLiked: (id: string) => boolean;
  incrementUseCount: (id: string) => void;
  setSortOrder: (order: SortOrder) => void;
  setView: (view: PromptStoreState["view"]) => void;
  setVisibilityFilter: (f: PromptStoreState["visibilityFilter"]) => void;
  setSearchQuery: (q: string) => void;
  setSelectedPromptId: (id: string | null) => void;
  setCurrentPhase: (p: Phase) => void;
  openEditor: (prompt?: Prompt) => void;
  closeEditor: () => void;
  getHistory: (id: string) => Promise<HistoryEntry[]>;
  getFilteredPrompts: () => Prompt[];
  refreshPrompts: () => Promise<void>;
  markAllNotificationsRead: () => void;
}

type PromptStore = PromptStoreState & PromptStoreActions;

const PromptStoreContext = createContext<PromptStore | null>(null);

/* ─── LocalStorage helpers ─── */
function saveJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

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
  like_count?: number;
  use_count?: number;
  created_at: string;
  updated_at: string;
  profiles?: { display_name: string | null; avatar_url: string | null } | null;
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
    likeCount: row.like_count ?? 0,
    useCount: row.use_count ?? 0,
    authorId: row.user_id,
    authorName: row.profiles?.display_name ?? undefined,
    authorAvatarUrl: row.profiles?.avatar_url ?? undefined,
    lineage: {
      parent: row.parent_id ?? undefined,
      isOriginal: !row.parent_id,
    },
  };
}

export function PromptStoreProvider({ children }: { children: ReactNode }): ReactNode {
  const { user, isGuest } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [history] = useState<Record<string, HistoryEntry[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setView] = useState<PromptStoreState["view"]>("library");
  const [visibilityFilter, setVisibilityFilter] = useState<PromptStoreState["visibilityFilter"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("All");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("updated");

  const currentUserId = user?.id ?? "";

  /* ─── Persist notifications on change ─── */
  useEffect(() => {
    if (hydrated) saveJson("myprompt-notifications", notifications);
  }, [notifications, hydrated]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  /* ─── Fetch prompts ─── */
  const refreshPrompts = useCallback(async (): Promise<void> => {
    try {
      if (isGuest) {
        const { data, error } = await supabase
          .from("prompts")
          .select("*, profiles(display_name, avatar_url)")
          .eq("visibility", "Public")
          .order("updated_at", { ascending: false });
        if (!error && data) {
          setPrompts(data.map(dbToPrompt));
        }
      } else {
        const { data, error } = await supabase
          .from("prompts")
          .select("*, profiles(display_name, avatar_url)")
          .order("updated_at", { ascending: false });
        if (!error && data) {
          setPrompts(data.map(dbToPrompt));
        }
      }
    } catch {
      // Keep current prompts on error
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

  /* ─── Fetch likes from Supabase ─── */
  const refreshLikes = useCallback(async (): Promise<void> => {
    if (isGuest || !user) return;
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("prompt_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setLikes(data.map(l => l.prompt_id));
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
      await refreshLikes();
      setHydrated(true);
    };
    load();
  }, [refreshPrompts, refreshFavorites, refreshLikes]);

  // Auto-select first prompt (inside hydration callback, not in a separate effect)
  const autoSelectId = hydrated && prompts.length > 0 && !selectedPromptId
    ? prompts[0].id
    : null;
  if (autoSelectId && autoSelectId !== selectedPromptId) {
    setSelectedPromptId(autoSelectId);
  }

  /* ─── Notifications (placeholder - no mock data) ─── */

  /* ─── CRUD Operations ─── */
  const addPrompt = useCallback(async (input: Omit<Prompt, "id" | "updatedAt" | "likeCount">): Promise<string> => {
    if (!user) {
      // Guests cannot create prompts
      return "";
    }
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
      .select("*, profiles(display_name, avatar_url)")
      .single();
    if (error || !data) {
      return "";
    }
    const newPrompt = dbToPrompt(data);
    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);

    await supabase.from("prompt_history").insert({
      prompt_id: newPrompt.id,
      title: newPrompt.title,
      content: newPrompt.content,
    });

    return newPrompt.id;
  }, [user]);

  const updatePrompt = useCallback(async (id: string, updates: Partial<Omit<Prompt, "id">>): Promise<void> => {
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

      await supabase.from("prompts").update(dbUpdates).eq("id", id).eq("user_id", user.id);

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
    setLikes(prev => prev.filter(lid => lid !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);
    if (user) {
      await supabase.from("prompts").delete().eq("id", id).eq("user_id", user.id);
    }
  }, [selectedPromptId, user]);

  const duplicateAsArrangement = useCallback((sourceId: string): void => {
    const source = prompts.find(p => p.id === sourceId);
    if (!source) return;
    const newPrompt: Prompt = {
      ...source,
      id: "",
      title: `${source.title} (アレンジ)`,
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      authorId: currentUserId,
      lineage: { parent: source.id, isOriginal: false },
    };
    setEditingPrompt(newPrompt);
  }, [prompts, currentUserId]);

  /* ─── Favorite toggle ─── */
  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(fid => fid !== id) : [...prev, id]);

    if (user) {
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("prompt_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, prompt_id: id });
      }
    }
  }, [favorites, user]);

  /* ─── Like toggle (DB-persisted) ─── */
  const toggleLike = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    const alreadyLiked = likes.includes(id);
    // Optimistic update
    setLikes(prev => alreadyLiked ? prev.filter(lid => lid !== id) : [...prev, id]);
    setPrompts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, likeCount: p.likeCount + (alreadyLiked ? -1 : 1) };
    }));

    if (alreadyLiked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("prompt_id", id);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, prompt_id: id });
    }
  }, [likes, user]);

  const isFavorited = useCallback((id: string): boolean => favorites.includes(id), [favorites]);
  const isLiked = useCallback((id: string): boolean => likes.includes(id), [likes]);

  /* ─── Use Count ─── */
  const incrementUseCount = useCallback((id: string): void => {
    setPrompts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, useCount: (p.useCount ?? 0) + 1 };
    }));
    if (user) {
      supabase.rpc("increment_use_count", { prompt_id: id }).then();
    }
  }, [user]);

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
        likeCount: 0,
        authorId: currentUserId,
        lineage: { isOriginal: true },
      });
    }
  }, [currentPhase, currentUserId]);

  const closeEditor = useCallback((): void => {
    setEditingPrompt(null);
  }, []);

  const getHistory = useCallback(async (id: string): Promise<HistoryEntry[]> => {
    if (!user) return history[id] ?? [];
    try {
      const { data, error } = await supabase
        .from("prompt_history")
        .select("title, content, created_at")
        .eq("prompt_id", id)
        .order("created_at", { ascending: true });
      if (!error && data) {
        return data.map(d => ({ title: d.title, content: d.content, timestamp: d.created_at }));
      }
    } catch {
      // fallback
    }
    return history[id] ?? [];
  }, [history, user]);

  const markAllNotificationsRead = useCallback((): void => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const getFilteredPrompts = useCallback((): Prompt[] => {
    let result = prompts;

    // View filter: library = owned + favorited, trend = public
    if (view === "library") {
      result = result.filter(p =>
        p.authorId === currentUserId || favorites.includes(p.id)
      );
    } else if (view === "trend") {
      result = result.filter(p => p.visibility === "Public");
    }

    // Phase filter
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

    // Sort
    switch (sortOrder) {
      case "useCount":
        result = [...result].sort((a, b) => (b.useCount ?? 0) - (a.useCount ?? 0));
        break;
      case "likes":
        result = [...result].sort((a, b) => b.likeCount - a.likeCount);
        break;
      case "title":
        result = [...result].sort((a, b) => a.title.localeCompare(b.title, "ja"));
        break;
      case "updated":
      default:
        // Already sorted by updated_at from DB
        break;
    }

    return result;
  }, [prompts, view, currentPhase, visibilityFilter, searchQuery, favorites, currentUserId, sortOrder]);

  const store = useMemo<PromptStore>(() => ({
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked, incrementUseCount,
    setView, setVisibilityFilter, setSearchQuery, setSortOrder,
    setSelectedPromptId, setCurrentPhase, openEditor, closeEditor,
    getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
  }), [
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked, incrementUseCount,
    openEditor, closeEditor, getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead, setSortOrder,
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
