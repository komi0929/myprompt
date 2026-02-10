/**
 * Database operations — Supabase CRUD + type mapping.
 *
 * All DB interactions go through this module.
 * `dbToPrompt` maps DB rows to domain `Prompt` objects.
 */
import { supabase } from "@/lib/supabase";
import type { DbPromptRow, Prompt } from "@/lib/types";

/* ─── DB Row → Prompt ─── */
export function dbToPrompt(row: DbPromptRow): Prompt {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    tags: row.tags ?? [],
    phase: (row.phase ?? "Implementation") as Prompt["phase"],
    visibility: (row.visibility ?? "Private") as Prompt["visibility"],
    updatedAt: row.updated_at ?? new Date().toISOString(),
    likeCount: row.like_count ?? 0,
    useCount: row.use_count ?? 0,
    isPinned: row.is_pinned ?? false,
    folderId: row.folder_id ?? undefined,
    lastUsedAt: row.last_used_at ?? undefined,
    notes: row.notes ?? undefined,
    rating: (row.rating as Prompt["rating"]) ?? undefined,
    authorId: row.user_id ?? "",
    authorName: profile?.display_name ?? undefined,
    authorAvatarUrl: profile?.avatar_url ?? undefined,
  };
}

/* ─── Fetch prompts ─── */
export async function fetchPrompts(userId: string | null): Promise<Prompt[]> {
  let query = supabase
    .from("prompts")
    .select("*, profiles:user_id(display_name, avatar_url)");

  if (userId) {
    query = query.or(`user_id.eq.${userId},visibility.eq.Public`);
  } else {
    query = query.eq("visibility", "Public");
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    console.error("[db] fetchPrompts error:", error.message);
    return [];
  }

  return (data as unknown as DbPromptRow[]).map(dbToPrompt);
}

/* ─── Fetch favorites ─── */
export async function fetchFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("prompt_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[db] fetchFavorites error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => r.prompt_id).filter((id): id is string => id !== null);
}

/* ─── Fetch likes ─── */
export async function fetchLikes(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("likes")
    .select("prompt_id")
    .eq("user_id", userId);

  if (error) {
    console.error("[db] fetchLikes error:", error.message);
    return [];
  }

  return (data ?? []).map((r) => r.prompt_id);
}
