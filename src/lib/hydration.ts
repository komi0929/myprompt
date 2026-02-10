/**
 * Hydration-safe storage utilities.
 *
 * UNIFIED PATTERN: All sessionStorage/localStorage reads MUST go through
 * these helpers to prevent React Error #418 (hydration mismatch).
 *
 * Pattern: Always return fallback during SSR and initial render.
 * Read from storage only in useEffect (after mount).
 */

/** Read from sessionStorage (client-only, safe to call during SSR) */
export function ssGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = sessionStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Write to sessionStorage (no-op during SSR) */
export function ssSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(key, JSON.stringify(value));
}

/** Read from localStorage (client-only, safe to call during SSR) */
export function lsGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Write to localStorage (no-op during SSR) */
export function lsSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}
