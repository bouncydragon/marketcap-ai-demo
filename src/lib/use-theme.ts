"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useStoredString } from "./use-stored-string";

const QUERY = "(prefers-color-scheme: dark)";

function subscribe(cb: () => void) {
  const mq = matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** Saved choice wins; otherwise follow the system setting. */
export function useTheme() {
  const [stored, setStored] = useStoredString("marketcap.theme");
  const systemDark = useSyncExternalStore(subscribe, () => matchMedia(QUERY).matches, () => false);
  const theme: "light" | "dark" = stored === "dark" || stored === "light" ? stored : systemDark ? "dark" : "light";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return { theme, toggle: () => setStored(theme === "dark" ? "light" : "dark") };
}
