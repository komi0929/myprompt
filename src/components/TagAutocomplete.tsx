"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/prompt-store";

interface TagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddTag: (tag: string) => void;
  existingTags: string[];
  placeholder?: string;
  className?: string;
}

export default function TagAutocomplete({
  value,
  onChange,
  onAddTag,
  existingTags,
  placeholder = "タグを入力...",
  className,
}: TagAutocompleteProps): React.ReactElement {
  const { prompts } = usePromptStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all unique tags from all prompts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const p of prompts) {
      for (const t of p.tags) {
        tagSet.add(t);
      }
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "ja"));
  }, [prompts]);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!value.trim()) return allTags.filter(t => !existingTags.includes(t)).slice(0, 8);
    const q = value.toLowerCase();
    return allTags
      .filter(t => t.toLowerCase().includes(q) && !existingTags.includes(t))
      .slice(0, 8);
  }, [value, allTags, existingTags]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return (): void => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (tag: string): void => {
    onAddTag(tag);
    onChange("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (value.trim()) {
        onAddTag(value.trim());
        onChange("");
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn(
          "flex-1 h-9 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-yellow-400/30 focus:border-yellow-400 transition-all",
          className
        )}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={tag}
              className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-yellow-50 hover:text-yellow-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
              onClick={() => handleSelect(tag)}
              type="button"
            >
              <span className="text-slate-400 mr-1">#</span>{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
