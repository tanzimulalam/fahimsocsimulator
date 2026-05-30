import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { classroomApi } from "./apiClient";

/**
 * Dual-layer persistence hook mirroring the XdrResponsePlaybook pattern:
 *  - writes to localStorage immediately (synchronous, demos work with no backend)
 *  - debounce-syncs the same JSON to the Cloudflare D1 backend when configured
 *  - hydrates from the backend on mount
 *  - resets to its initial value when the instructor fires the class-reset event
 *
 * Use scope = "default" everywhere, and a unique versioned key per feature.
 */
export function useLabState<T>(
  key: string,
  initial: T | (() => T)
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const initialRef = useRef(initial);
  const makeInitial = (): T =>
    typeof initialRef.current === "function"
      ? (initialRef.current as () => T)()
      : initialRef.current;

  const [state, setState] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return makeInitial();
  });

  const [hydrated, setHydrated] = useState(!classroomApi.enabled);

  useEffect(() => {
    if (!classroomApi.enabled) return;
    let cancelled = false;
    classroomApi
      .getLabState<T>("default", key)
      .then((remote) => {
        if (!cancelled && remote != null) setState(remote);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota */
    }
    if (!classroomApi.enabled || !hydrated) return;
    const timer = window.setTimeout(() => {
      classroomApi.putLabState("default", key, state).catch(() => {});
    }, 400);
    return () => window.clearTimeout(timer);
  }, [key, state, hydrated]);

  useEffect(() => {
    function onReset() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      setState(makeInitial());
    }
    window.addEventListener("lab-state-reset", onReset);
    return () => window.removeEventListener("lab-state-reset", onReset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [state, setState, hydrated];
}

export function analystInitials(name?: string | null): string {
  if (name && name.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return "FT";
}
