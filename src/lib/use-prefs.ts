import { useSyncExternalStore } from "react";
import { getLang, getTheme, subscribe, type Lang, type Theme } from "@/lib/prefs";

/** Re-render on language or theme changes. */
export function usePrefs(): { lang: Lang; theme: Theme } {
  const lang = useSyncExternalStore(subscribe, getLang, getLang);
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  return { lang, theme };
}
