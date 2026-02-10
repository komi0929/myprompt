"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { trackEvent } from "@/lib/analytics";
import { markMilestone } from "@/components/OnboardingProgress";
import { showToast } from "@/components/ui/Toast";
import { ssGet, ssSet } from "@/lib/hydration";
import { dbToPrompt } from "@/lib/db";
import type { Phase, Prompt, Folder, SortOrder, HistoryEntry, AppNotification } from "@/lib/types";

// Re-export types for backward compatibility with existing imports
export type { SortOrder, HistoryEntry, AppNotification } from "@/lib/types";
export { SORT_OPTIONS } from "@/lib/types";

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
  updatePrompt: (id: string, updates: Partial<Omit<Prompt, "id">>) => Promise<boolean>;
  deletePrompt: (id: string) => Promise<void>;

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

export function PromptStoreProvider({ children }: { children: ReactNode }): ReactNode {
  const { user, authStatus } = useAuth();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [history] = useState<Record<string, HistoryEntry[]>>({});
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [view, setViewState] = useState<PromptStoreState["view"]>("library");
  const [visibilityFilter, setVisibilityFilterState] = useState<PromptStoreState["visibilityFilter"]>("all");
  const [searchQuery, setSearchQueryState] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [currentPhase, setCurrentPhaseState] = useState<Phase>("All");
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [sortOrder, setSortOrderState] = useState<SortOrder>("updated");

  // Hydration-safe: restore sessionStorage values only after mount
  useEffect(() => {
    setViewState(ssGet("mp-view", "library" as const));
    setVisibilityFilterState(ssGet("mp-vf", "all" as const));
    setSearchQueryState(ssGet("mp-sq", ""));
    setCurrentPhaseState(ssGet("mp-phase", "All" as Phase));
    setSortOrderState(ssGet("mp-sort", "updated" as SortOrder));
  }, []);

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
    if (authStatus === "loading") return; // Wait for auth to resolve
    try {
      if (authStatus === "guest") {
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
  }, [authStatus]);

  /* ─── Fetch favorites from Supabase ─── */
  const refreshFavorites = useCallback(async (): Promise<void> => {
    if (authStatus !== "authenticated" || !user) return;
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("prompt_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setFavorites(data.map(f => f.prompt_id).filter((id): id is string => id !== null));
      }
    } catch {
      // ignore
    }
  }, [authStatus, user]);

  /* ─── Fetch likes from Supabase ─── */
  const refreshLikes = useCallback(async (): Promise<void> => {
    if (authStatus !== "authenticated" || !user) return;
    try {
      const { data, error } = await supabase
        .from("likes")
        .select("prompt_id")
        .eq("user_id", user.id);
      if (!error && data) {
        setLikes(data.map(l => l.prompt_id).filter((id): id is string => id !== null));
      }
    } catch {
      // ignore
    }
  }, [authStatus, user]);

  // Hydrate on auth change — only after auth is resolved
  useEffect(() => {
    if (authStatus === "loading") return; // Don't fetch until auth state is known
    const load = async (): Promise<void> => {
      await refreshPrompts();
      await refreshFavorites();
      await refreshLikes();
      setHydrated(true);
    };
    load();
  }, [refreshPrompts, refreshFavorites, refreshLikes, authStatus]);

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
      showToast("ログインが必要です");
      return "";
    }
    const insertPayload = {
      user_id: user.id,
      title: input.title,
      content: input.content,
      tags: input.tags,
      phase: input.phase,
      visibility: input.visibility,

      notes: input.notes ?? null,
    };
    // INSERT first
    const { data: inserted, error: insertError } = await supabase
      .from("prompts")
      .insert(insertPayload)
      .select("*")
      .single();

    if (insertError) {
      console.warn("addPrompt first attempt failed:", insertError.message);

      // Self-healing: If FK violation (23503) or any error, try to ensure profile exists
      // This fixes the "User references missing profile" issue
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User",
        avatar_url: user.user_metadata?.avatar_url || "",
      });

      if (profileError) {
        console.error("Profile self-healing failed:", profileError.message);
        showToast("ユーザープロファイルの修復に失敗しました");
        return "";
      }

      // Retry insert
      const { data: retryInserted, error: retryError } = await supabase
        .from("prompts")
        .insert(insertPayload)
        .select("*")
        .single();

      if (retryError || !retryInserted) {
        console.error("addPrompt retry failed:", retryError?.message);
        showToast("保存に失敗しました。もう一度お試しください");
        return "";
      }
      
      // Success on retry
      // Continue with 'retryInserted' as 'inserted'
      // Note: We need to assign it to a variable accessible below, or just copy the logic.
      // Refactoring to avoid code duplication is better, but simple nested structure is safer for patch.
      
      // ... continue with retryInserted ...
      const newPrompt = dbToPrompt(retryInserted);
      setPrompts(prev => [newPrompt, ...prev]);
      setSelectedPromptId(newPrompt.id);

      const { error: histError } = await supabase.from("prompt_history").insert({
        prompt_id: newPrompt.id,
        title: newPrompt.title,
        content: newPrompt.content,
      });
      if (histError) console.warn("prompt_history insert failed:", histError.message);

      trackEvent("prompt_create", { prompt_id: newPrompt.id, visibility: input.visibility, phase: input.phase });
      markMilestone("create");
      if (input.visibility === "Public") {
        trackEvent("prompt_publish", { prompt_id: newPrompt.id });
        markMilestone("publish");
      }
      return newPrompt.id;
    }

    if (!inserted) return ""; // Should not happen if error is null

    // ... Original success path ...

    // Try to enrich with profile data (non-blocking)
    const { data: enriched } = await supabase
      .from("prompts")
      .select("*, profiles(display_name, avatar_url)")
      .eq("id", inserted.id)
      .maybeSingle();
    const data = enriched ?? inserted;
    const newPrompt = dbToPrompt(data);
    setPrompts(prev => [newPrompt, ...prev]);
    setSelectedPromptId(newPrompt.id);

    const { error: histError } = await supabase.from("prompt_history").insert({
      prompt_id: newPrompt.id,
      title: newPrompt.title,
      content: newPrompt.content,
    });
    if (histError) console.warn("prompt_history insert failed:", histError.message);

    trackEvent("prompt_create", { prompt_id: newPrompt.id, visibility: input.visibility, phase: input.phase });
    markMilestone("create");
    if (input.visibility === "Public") {
      trackEvent("prompt_publish", { prompt_id: newPrompt.id });
      markMilestone("publish");
    }

    return newPrompt.id;
  }, [user]);

  const updatePrompt = useCallback(async (id: string, updates: Partial<Omit<Prompt, "id">>): Promise<boolean> => {
    // Capture previous state for rollback
    const previousPrompt = prompts.find(p => p.id === id);

    // Optimistic UI update
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
      if ('notes' in updates) dbUpdates.notes = updates.notes ?? null;
      if ('rating' in updates) dbUpdates.rating = updates.rating ?? null;
      if (updates.isPinned !== undefined) dbUpdates.is_pinned = updates.isPinned;
      if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId ?? null;

      const { error } = await supabase.from("prompts").update(dbUpdates).eq("id", id).eq("user_id", user.id);

      if (error) {
        // Rollback optimistic update
        if (previousPrompt) {
          setPrompts(prev => prev.map(p => p.id === id ? previousPrompt : p));
        }
        showToast("更新の保存に失敗しました");
        return false;
      }

      // Only create history entry for title/content changes (avoid bloat)
      if (updates.title !== undefined || updates.content !== undefined) {
        if (previousPrompt) {
          const { error: histError } = await supabase.from("prompt_history").insert({
            prompt_id: id,
            title: updates.title ?? previousPrompt.title,
            content: updates.content ?? previousPrompt.content,
          });
          if (histError) console.warn("prompt_history insert failed:", histError.message);
        }
      }
    }
    return true;
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
    const timer = setTimeout(async () => {
      deleteTimers.current.delete(id);
      if (user) {
        const { error } = await supabase.from("prompts").delete().eq("id", id).eq("user_id", user.id);
        if (error) {
          // Restore on failure
          if (deletedPrompt) {
            setPrompts(prev => [deletedPrompt, ...prev]);
          }
          showToast("削除に失敗しました。プロンプトを復元しました");
        }
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



  /* ─── Favorite toggle ─── */
  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const isFav = favorites.includes(id);
    // Optimistic update
    setFavorites(prev => isFav ? prev.filter(fid => fid !== id) : [...prev, id]);

    if (user) {
      if (isFav) {
        const { error } = await supabase.from("favorites").delete().eq("user_id", user.id).eq("prompt_id", id);
        if (error) {
          setFavorites(prev => [...prev, id]); // Rollback
          showToast("お気に入りの解除に失敗しました");
        }
      } else {
        const { error } = await supabase.from("favorites").insert({ user_id: user.id, prompt_id: id });
        if (error) {
          setFavorites(prev => prev.filter(fid => fid !== id)); // Rollback
          showToast("お気に入りの追加に失敗しました");
        } else {
          trackEvent("prompt_favorite", { prompt_id: id });
          markMilestone("favorite");
        }
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
      const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("prompt_id", id);
      if (error) {
        // Rollback
        setLikes(prev => [...prev, id]);
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, likeCount: p.likeCount + 1 } : p));
        showToast("いいねの解除に失敗しました");
      }
    } else {
      const { error } = await supabase.from("likes").insert({ user_id: user.id, prompt_id: id });
      if (error) {
        // Rollback
        setLikes(prev => prev.filter(lid => lid !== id));
        setPrompts(prev => prev.map(p => p.id === id ? { ...p, likeCount: p.likeCount - 1 } : p));
        showToast("いいねに失敗しました");
      } else {
        trackEvent("prompt_like", { prompt_id: id });
        markMilestone("like");
      }
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
      // Use count is non-critical — log errors but don't rollback UI
      supabase.rpc("increment_use_count", { prompt_id: id }).then(({ error }) => {
        if (error) console.warn("increment_use_count failed:", error.message);
      });
      supabase.from("prompts").update({ last_used_at: now }).eq("id", id).then(({ error }) => {
        if (error) console.warn("last_used_at update failed:", error.message);
      });
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
        visibility: "Public",
        updatedAt: "",
        likeCount: 0,
        authorId: currentUserId,
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
        return data.map(d => ({ title: d.title ?? "", content: d.content ?? "", timestamp: d.created_at ?? "" }));
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
      result = result.filter(p => p.visibility === "Public" || (currentUserId && p.authorId === currentUserId));
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
        if (newPinned && pinnedCount >= 5) {
          showToast("ピン留めは最大5件までです");
          return p;
        }
        newPinnedValue = newPinned;
        return { ...p, isPinned: newPinned };
      });
    });
    if (user && newPinnedValue !== null) {
      const pinnedVal = newPinnedValue;
      // Fire-and-forget is acceptable here since we have rollback
      (async () => {
        const { error } = await supabase.from("prompts").update({ is_pinned: pinnedVal }).eq("id", id);
        if (error) {
          // Rollback
          setPrompts(prev => prev.map(p => p.id === id ? { ...p, isPinned: !pinnedVal } : p));
          showToast("ピン留めの更新に失敗しました");
        }
      })();
    }
  }, [user]);

  /* ─── Folders (logic) ─── */

  // Load folders from DB
  useEffect(() => {
    if (!user) return;
    supabase.from("folders").select("*").order("sort_order").then(({ data, error }) => {
      if (error) {
        console.warn("folders fetch failed:", error.message);
        return;
      }
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
      supabase.from("folders").insert({ user_id: user.id, name, color, sort_order: folders.length }).select("id").single().then(({ data, error }) => {
        if (error) {
          // Rollback
          setFolders(prev => prev.filter(f => f.id !== tempId));
          showToast("フォルダの作成に失敗しました");
        } else if (data) {
          setFolders(prev => prev.map(f => f.id === tempId ? { ...f, id: data.id } : f));
        }
      });
    }
  }, [user, folders.length]);

  const deleteFolder = useCallback((id: string): void => {
    const deletedFolder = folders.find(f => f.id === id);
    const affectedPrompts = prompts.filter(p => p.folderId === id);
    setFolders(prev => prev.filter(f => f.id !== id));
    setPrompts(prev => prev.map(p => p.folderId === id ? { ...p, folderId: undefined } : p));
    if (selectedFolderId === id) setSelectedFolderId(null);
    if (user) {
      supabase.from("folders").delete().eq("id", id).then(({ error }) => {
        if (error) {
          // Rollback
          if (deletedFolder) setFolders(prev => [...prev, deletedFolder]);
          setPrompts(prev => prev.map(p => {
            const was = affectedPrompts.find(ap => ap.id === p.id);
            return was ? { ...p, folderId: was.folderId } : p;
          }));
          showToast("フォルダの削除に失敗しました");
        }
      });
    }
  }, [user, selectedFolderId, folders, prompts]);

  const moveToFolder = useCallback((promptId: string, folderId: string | null): void => {
    const previousFolderId = prompts.find(p => p.id === promptId)?.folderId;
    setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, folderId: folderId ?? undefined } : p));
    if (user) {
      supabase.from("prompts").update({ folder_id: folderId }).eq("id", promptId).then(({ error }) => {
        if (error) {
          // Rollback
          setPrompts(prev => prev.map(p => p.id === promptId ? { ...p, folderId: previousFolderId } : p));
          showToast("フォルダ移動に失敗しました");
        }
      });
    }
  }, [user, prompts]);

  const getRecentlyUsed = useCallback((): Prompt[] => {
    return prompts
      .filter(p => p.lastUsedAt && p.authorId === currentUserId)
      .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
      .slice(0, 5);
  }, [prompts, currentUserId]);

  const store = useMemo<PromptStore>(() => ({
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder, folders, selectedFolderId, filteredPrompts,
    addPrompt, updatePrompt, deletePrompt,
    toggleFavorite, toggleLike, isFavorited, isLiked, incrementUseCount, togglePin,
    setView, setVisibilityFilter, setSearchQuery, setSortOrder,
    setSelectedPromptId, setCurrentPhase, openEditor, closeEditor,
    getHistory, getFilteredPrompts, refreshPrompts, markAllNotificationsRead,
    addFolder, deleteFolder, setSelectedFolderId, moveToFolder, getRecentlyUsed,
  }), [
    prompts, favorites, likes, history, notifications, unreadCount, view, visibilityFilter, searchQuery,
    selectedPromptId, currentPhase, editingPrompt, sortOrder, folders, selectedFolderId, filteredPrompts,
    addPrompt, updatePrompt, deletePrompt,
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
