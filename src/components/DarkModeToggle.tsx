"use client";

import { useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  const resolved = theme === "system" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

export default function DarkModeToggle(): React.ReactElement {
  const [theme, setTheme] = useState<Theme>("light");

  // Initialize from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("myprompt-theme") as Theme | null;
    const initial = saved ?? "system";
    setTheme(initial);
    applyTheme(initial);

    // Listen for system theme changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (): void => { if (theme === "system") applyTheme("system"); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cycleTheme = useCallback((): void => {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
    localStorage.setItem("myprompt-theme", next);
    applyTheme(next);
  }, [theme]);

  const labels: Record<Theme, string> = {
    light: "ライト",
    dark: "ダーク",
    system: "システム",
  };

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-500 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-all"
      title={`テーマ: ${labels[theme]}`}
    >
      {theme === "dark" ? (
        <Moon className="w-4 h-4" />
      ) : (
        <Sun className="w-4 h-4" />
      )}
    </button>
  );
}
