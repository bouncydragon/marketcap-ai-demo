"use client";

import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const memory = new Map<string, string>(); // fallback when localStorage is blocked

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memory.get(key) ?? null;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb); // other tabs
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

/**
 * localStorage-backed string that is null on the server and during hydration,
 * so server and client markup agree, then updates without an effect.
 */
export function useStoredString(key: string) {
  const value = useSyncExternalStore(subscribe, () => read(key), () => null);
  const set = useCallback(
    (next: string) => {
      memory.set(key, next);
      try {
        localStorage.setItem(key, next);
      } catch {
        /* blocked: memory fallback is used */
      }
      listeners.forEach((l) => l());
    },
    [key],
  );
  return [value, set] as const;
}
