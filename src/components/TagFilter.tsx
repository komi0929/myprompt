"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/prompt-store";
import { Tag } from "lucide-react";

export default function TagFilter(): React.ReactElement {
  const { prompts, searchQuery, setSearchQuery } = usePromptStore();

  // Extract tag usage counts
  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of prompts) {
      for (const t of p.tags) {
        counts.set(t, (counts.get(t) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
  }, [prompts]);

  if (tagCounts.length === 0) return <></>;

  // Active tag is whatever matches the current search query exactly as a tag
  const activeTag = tagCounts.find(([tag]) => searchQuery === `#${tag}`)?.[0] ?? null;

  const handleToggleTag = (tag: string): void => {
    if (activeTag === tag) {
      setSearchQuery("");
    } else {
      setSearchQuery(`#${tag}`);
    }
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      <Tag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      {tagCounts.map(([tag, count]) => (
        <button
          key={tag}
          onClick={() => handleToggleTag(tag)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0",
            activeTag === tag
              ? "bg-yellow-400 text-slate-800 shadow-sm"
              : "bg-slate-100 text-slate-500 hover:bg-yellow-100 hover:text-yellow-700"
          )}
        >
          #{tag}
          <span className="text-[10px] opacity-60">{count}</span>
        </button>
      ))}
    </div>
  );
}
