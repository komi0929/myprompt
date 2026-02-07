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
}

/* ─── Actions ─── */
interface PromptStoreActions {
  addPrompt: (prompt: Omit<Prompt, "id" | "updatedAt" | "likeCount">) => Promise<string>;
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => Promise<void>;
  deletePrompt: (id: string) => Promise<void>;
  duplicateAsArrangement: (sourceId: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
  toggleLike: (id: string) => void;
  isFavorited: (id: string) => boolean;
  isLiked: (id: string) => boolean;
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
  markAllNotificationsRead: () => void;
}

type PromptStore = PromptStoreState & PromptStoreActions;

const PromptStoreContext = createContext<PromptStore | null>(null);

/* ─── LocalStorage helpers ─── */
function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

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
    likeCount: 0,
    authorId: row.user_id,
    authorName: row.profiles?.display_name ?? undefined,
    authorAvatarUrl: row.profiles?.avatar_url ?? undefined,
    lineage: {
      parent: row.parent_id ?? undefined,
      isOriginal: !row.parent_id,
    },
  };
}

/* ─── Current mock user ID ─── */
const MOCK_USER_ID = "mock-user";

export function PromptStoreProvider({ children }: { children: ReactNode }): ReactNode {
  const { user, isGuest } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>(MOCK_PROMPTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setView] = useState<PromptStoreState["view"]>("library");
  const [visibilityFilter, setVisibilityFilter] = useState<PromptStoreState["visibilityFilter"]>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<Phase>("All");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const currentUserId = user?.id ?? "";

  /* ─── Load from localStorage on mount ─── */
  useEffect(() => {
    setFavorites(loadJson<string[]>("myprompt-favorites", []));
    setLikes(loadJson<string[]>("myprompt-likes", []));
    setNotifications(loadJson<AppNotification[]>("myprompt-notifications", []));
  }, []);

  /* ─── Persist favorites/likes/notifications on change ─── */
  useEffect(() => {
    if (hydrated) saveJson("myprompt-favorites", favorites);
  }, [favorites, hydrated]);
  useEffect(() => {
    if (hydrated) saveJson("myprompt-likes", likes);
  }, [likes, hydrated]);
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
        } else {
          setPrompts(MOCK_PROMPTS);
        }
      } else {
        const { data, error } = await supabase
          .from("prompts")
          .select("*, profiles(display_name, avatar_url)")
          .order("updated_at", { ascending: false });
        if (!error && data) {
          setPrompts(data.map(dbToPrompt));
        } else {
          setPrompts(MOCK_PROMPTS);
        }
      }
    } catch {
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

  /* ─── Push notification (local mock) ─── */
  const pushNotification = useCallback((type: "like" | "favorite", promptId: string, promptTitle: string): void => {
    const actorNames = ["田中さん", "鈴木さん", "佐藤さん", "山田さん", "伊藤さん"];
    const n: AppNotification = {
      id: crypto.randomUUID(),
      type,
      promptId,
      promptTitle,
      actorName: actorNames[Math.floor(Math.random() * actorNames.length)],
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => [n, ...prev].slice(0, 50)); // keep max 50
  }, []);

  /* ─── CRUD Operations ─── */
  const addPrompt = useCallback(async (input: Omit<Prompt, "id" | "updatedAt" | "likeCount">): Promise<string> => {
    if (!user) {
      // Local-only fallback
      const localId = crypto.randomUUID();
      const newPrompt: Prompt = { ...input, id: localId, updatedAt: new Date().toISOString(), likeCount: 0, authorId: MOCK_USER_ID };
      setPrompts(prev => [newPrompt, ...prev]);
      setSelectedPromptId(localId);
      return localId;
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
      .select()
      .single();
    if (error || !data) {
      const localId = crypto.randomUUID();
      const newPrompt: Prompt = { ...input, id: localId, updatedAt: new Date().toISOString(), likeCount: 0, authorId: currentUserId };
      setPrompts(prev => [newPrompt, ...prev]);
      setSelectedPromptId(localId);
      return localId;
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
  }, [user, currentUserId]);

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
      id: crypto.randomUUID(),
      title: `${source.title} (アレンジ)`,
      updatedAt: new Date().toISOString(),
      likeCount: 0,
      authorId: currentUserId,
      lineage: { parent: source.title, isOriginal: false },
    };
    setEditingPrompt(newPrompt);
  }, [prompts, currentUserId]);

  /* ─── Favorite toggle ─── */
  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const isFav = favorites.includes(id);
    setFavorites(prev => isFav ? prev.filter(fid => fid !== id) : [...prev, id]);

    // Trigger notification for prompt author (mock)
    if (!isFav) {
      const prompt = prompts.find(p => p.id === id);
      if (prompt && prompt.authorId && prompt.authorId !== currentUserId) {
        pushNotification("favorite", id, prompt.title);
      }
    }

    if (user) {
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("prompt_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, prompt_id: id });
      }
    }
  }, [favorites, user, prompts, currentUserId, pushNotification]);

  /* ─── Like toggle ─── */
  const toggleLike = useCallback((id: string): void => {
    const isLiked = likes.includes(id);
    setLikes(prev => isLiked ? prev.filter(lid => lid !== id) : [...prev, id]);

    // Update likeCount on the prompt
    setPrompts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, likeCount: p.likeCount + (isLiked ? -1 : 1) };
    }));

    // Trigger notification (mock)
    if (!isLiked) {
      const prompt = prompts.find(p => p.id === id);
      if (prompt && prompt.authorId && prompt.authorId !== currentUserId) {
        pushNotification("like", id, prompt.title);
      }
    }
  }, [likes, prompts, currentUserId, pushNotification]);

  const isFavorited = useCallback((id: string): boolean => favorites.includes(id), [favorites]);
  const isLiked = useCallback((id: string): boolean => likes.includes(id), [likes]);

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

  const getHistory = useCallback((id: string): HistoryEntry[] => {
    return history[id] ?? [];
  }, [history]);

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

    return result;
  }, [prompts, view, currentPhase, visibilityFilter, searchQuery, favorites, currentUserId]);

  const store = useMemo<PromptStore>(() => ({
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked,
    setView, setVisibilityFilter, setSearchQuery,
    setSelectedPromptId, setCurrentPhase, openEditor, closeEditor,
    getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
  }), [
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked,
    openEditor, closeEditor, getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
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
