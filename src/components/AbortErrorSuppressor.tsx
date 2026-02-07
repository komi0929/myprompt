"use client";

import { useEffect } from "react";

/**
 * Global AbortError suppressor.
 *
 * React 19 Strict Mode + Next.js 16 Turbopack causes fetch AbortError
 * when components unmount/remount. Supabase auth APIs internally use
 * fetch with AbortSignal which bypasses our resilientFetch wrapper.
 *
 * This component catches ALL unhandled AbortErrors at the window level
 * so they never surface as runtime errors.
 */
export default function AbortErrorSuppressor(): null {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent): void => {
      const err = event.reason;
      if (
        err instanceof DOMException && err.name === "AbortError" ||
        (err instanceof Error && err.message === "signal is aborted without reason")
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  return null;
}
