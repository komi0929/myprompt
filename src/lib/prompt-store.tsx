"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { type Phase, type Prompt, type Folder } from "@/lib/mock-data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { trackEvent } from "@/lib/analytics";
import { markMilestone } from "@/components/OnboardingProgress";
import { showToast } from "@/components/ui/Toast";

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
  folders: Folder[];
  selectedFolderId: string | null;
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
  togglePin: (id: string) => void;
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
  /** Pre-computed filtered prompts (memoized) */
  filteredPrompts: Prompt[];
  refreshPrompts: () => Promise<void>;
  markAllNotificationsRead: () => void;
  addFolder: (name: string, color: string) => void;
  deleteFolder: (id: string) => void;
  setSelectedFolderId: (id: string | null) => void;
  moveToFolder: (promptId: string, folderId: string | null) => void;
  getRecentlyUsed: () => Prompt[];
}

type PromptStore = PromptStoreState & PromptStoreActions;

const PromptStoreContext = createContext<PromptStore | null>(null);

/* ─── sessionStorage helpers ─── */
function ssGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function ssSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
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
  is_pinned?: boolean;
  folder_id?: string | null;
  last_used_at?: string | null;
  notes?: string | null;
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
    isPinned: row.is_pinned ?? false,
    folderId: row.folder_id ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    notes: row.notes ?? undefined,
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
  const [view, setViewState] = useState<PromptStoreState["view"]>(() => ssGet("mp-view", "library" as const));
  const [visibilityFilter, setVisibilityFilterState] = useState<PromptStoreState["visibilityFilter"]>(() => ssGet("mp-vf", "all" as const));
  const [searchQuery, setSearchQueryState] = useState(() => ssGet("mp-sq", ""));
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhaseState] = useState<Phase>(() => ssGet("mp-phase", "All" as Phase));
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sortOrder, setSortOrderState] = useState<SortOrder>(() => ssGet("mp-sort", "updated" as SortOrder));

  // V-13: Persist filter state to sessionStorage
  const setView = useCallback((v: PromptStoreState["view"]) => { setViewState(v); ssSet("mp-view", v); }, []);
  const setVisibilityFilter = useCallback((v: PromptStoreState["visibilityFilter"]) => { setVisibilityFilterState(v); ssSet("mp-vf", v); }, []);
  const setSearchQuery = useCallback((v: string) => { setSearchQueryState(v); ssSet("mp-sq", v); }, []);
  const setCurrentPhase = useCallback((v: Phase) => { setCurrentPhaseState(v); ssSet("mp-phase", v); }, []);
  const setSortOrder = useCallback((v: SortOrder) => { setSortOrderState(v); ssSet("mp-sort", v); }, []);

  const currentUserId = user?.id ?? "";

  /* ─── Persist notifications on change ─── */
  useEffect(() => {
    if (hydrated) {
      if (typeof window !== "undefined") {
        localStorage.setItem("myprompt-notifications", JSON.stringify(notifications));
      }
    }
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

    trackEvent("prompt_create", { prompt_id: newPrompt.id, visibility: input.visibility, phase: input.phase });
    markMilestone("create");
    if (input.visibility === "Public") {
      trackEvent("prompt_publish", { prompt_id: newPrompt.id });
      markMilestone("publish");
    }

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

  // Pending delete timers — cleared on Undo
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const deletePrompt = useCallback(async (id: string): Promise<void> => {
    // Capture the prompt before removing from UI (for undo restoration)
    const deletedPrompt = prompts.find(p => p.id === id);
    const deletedFavs = favorites.filter(fid => fid === id);
    const deletedLikes = likes.filter(lid => lid === id);

    // Optimistic UI removal
    setPrompts(prev => prev.filter(p => p.id !== id));
    setFavorites(prev => prev.filter(fid => fid !== id));
    setLikes(prev => prev.filter(lid => lid !== id));
    if (selectedPromptId === id) setSelectedPromptId(null);

    // Schedule actual DB delete after 5s (matches Undo toast duration)
    const timer = setTimeout(() => {
      deleteTimers.current.delete(id);
      if (user) {
        supabase.from("prompts").delete().eq("id", id).eq("user_id", user.id).then();
      }
    }, 5000);
    deleteTimers.current.set(id, timer);

    // Show toast with Undo action
    showToast("削除しました", {
      onUndo: () => {
        // Cancel the scheduled DB delete
        const pending = deleteTimers.current.get(id);
        if (pending) {
          clearTimeout(pending);
          deleteTimers.current.delete(id);
        }
        // Restore to UI
        if (deletedPrompt) {
          setPrompts(prev => [deletedPrompt, ...prev]);
        }
        if (deletedFavs.length > 0) {
          setFavorites(prev => [...prev, ...deletedFavs]);
        }
        if (deletedLikes.length > 0) {
          setLikes(prev => [...prev, ...deletedLikes]);
        }
        showToast("元に戻しました");
      },
    });
  }, [selectedPromptId, user, prompts, favorites, likes]);

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
        trackEvent("prompt_favorite", { prompt_id: id });
        markMilestone("favorite");
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
      trackEvent("prompt_like", { prompt_id: id });
      markMilestone("like");
    }
  }, [likes, user]);

  const isFavorited = useCallback((id: string): boolean => favorites.includes(id), [favorites]);
  const isLiked = useCallback((id: string): boolean => likes.includes(id), [likes]);

  /* ─── Use Count ─── */
  const incrementUseCount = useCallback((id: string): void => {
    const now = new Date().toISOString();
    setPrompts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, useCount: (p.useCount ?? 0) + 1, lastUsedAt: now };
    }));
    if (user) {
      supabase.rpc("increment_use_count", { prompt_id: id }).then();
      supabase.from("prompts").update({ last_used_at: now }).eq("id", id).then();
    }
    trackEvent("prompt_copy", { prompt_id: id });
    markMilestone("copy");
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

  /* ─── Folders (state only - logic below) ─── */
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // B-12: useMemo instead of useCallback for filtered prompts
  const filteredPrompts = useMemo((): Prompt[] => {
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

    // Folder filter
    if (selectedFolderId) {
      result = result.filter(p => p.folderId === selectedFolderId);
    }

    // Search filter (supports #tag syntax)
    if (searchQuery.trim()) {
      const q = searchQuery.trim();
      if (q.startsWith("#")) {
        const tagName = q.slice(1).toLowerCase();
        result = result.filter(p =>
          p.tags.some(t => t.toLowerCase() === tagName)
        );
      } else {
        const lower = q.toLowerCase();
        result = result.filter(p =>
          p.title.toLowerCase().includes(lower) ||
          p.content.toLowerCase().includes(lower) ||
          p.tags.some(t => t.toLowerCase().includes(lower))
        );
      }
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
        break;
    }

    // Pin-first
    const pinned = result.filter(p => p.isPinned);
    const unpinned = result.filter(p => !p.isPinned);
    return [...pinned, ...unpinned];
  }, [prompts, view, currentPhase, visibilityFilter, searchQuery, favorites, currentUserId, sortOrder, selectedFolderId]);

  // Backwards-compatible wrapper
  const getFilteredPrompts = useCallback((): Prompt[] => filteredPrompts, [filteredPrompts]);

  /* ─── Toggle Pin ─── */
  const togglePin = useCallback((id: string): void => {
    let newPinnedValue: boolean | null = null;
    setPrompts(prev => {
      const pinnedCount = prev.filter(p => p.isPinned).length;
      return prev.map(p => {
        if (p.id !== id) return p;
        const newPinned = !p.isPinned;
        // Max 5 pinned
        if (newPinned && pinnedCount >= 5) return p;
        newPinnedValue = newPinned; // Capture the actual new value
        return { ...p, isPinned: newPinned };
      });
    });
    // Use the value captured from inside setPrompts (avoids stale closure)
    if (user && newPinnedValue !== null) {
      supabase.from("prompts").update({ is_pinned: newPinnedValue }).eq("id", id).then();
    }
  }, [user]);

  /* ─── Folders (logic) ─── */

  // Load folders from DB
  useEffect(() => {
    if (!user) return;
    supabase.from("folders").select("*").order("sort_order").then(({ data }) => {
      if (data) {
        setFolders(data.map(f => ({ id: f.id, name: f.name, color: f.color, sortOrder: f.sort_order })));
      }
    });
  }, [user]);

  const addFolder = useCallback((name: string, color: string): void => {
    const tempId = crypto.randomUUID();
    const newFolder: Folder = { id: tempId, name, color, sortOrder: folders.length };
    setFolders(prev => [...prev, newFolder]);
    if (user) {
      supabase.from("folders").insert({ user_id: user.id, name, color, sort_order: folders.length }).select("id").single().then(({ data }) => {
        if (data) {
          setFolders(prev => prev.map(f => f.id === tempId ? { ...f, id: data.id } : f));
        }
      });
    }
  }, [user, folders.length]);

  const deleteFolder = useCallback((id: string): void => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setPrompts(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p));
    if (selectedFolderId === id) setSelectedFolderId(null);
    if (user) {
      supabase.from("folders").delete().eq("id", id).then();
    }
  }, [user, selectedFolderId]);

  const moveToFolder = useCallback((promptId: string, folderId: string | null): void => {
    setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, folderId: folderId ?? undefined } : p));
    if (user) {
      supabase.from("prompts").update({ folder_id: folderId }).eq("id", promptId).then();
    }
  }, [user]);

  const getRecentlyUsed = useCallback((): Prompt[] => {
    return prompts
      .filter(p => p.lastUsedAt && p.authorId === currentUserId)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 5);
  }, [prompts, currentUserId]);

  const store = useMemo<PromptStore>(() => ({
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder, folders, selectedFolderId, filteredPrompts,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked, incrementUseCount, togglePin,
    setView, setVisibilityFilter, setSearchQuery, setSortOrder,
    setSelectedPromptId, setCurrentPhase, openEditor, closeEditor,
    getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
    addFolder, deleteFolder, setSelectedFolderId, moveToFolder, getRecentlyUsed,
  }), [
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder, folders, selectedFolderId, filteredPrompts,
    addPrompt, updatePrompt, deletePrompt, duplicateAsArrangement,
    toggleFavorite, toggleLike, isFavorited, isLiked, incrementUseCount, togglePin,
    setView, setVisibilityFilter, setSearchQuery, setSortOrder, setCurrentPhase,
    openEditor, closeEditor, getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
    addFolder, deleteFolder, moveToFolder, getRecentlyUsed,
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
