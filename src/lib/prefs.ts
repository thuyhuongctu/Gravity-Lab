/** Language and theme preferences: a tiny external store shared by React and the canvas loops. */

export type Lang = "vi" | "en";
export type Theme = "light" | "dark";

const LANG_KEY = "gravity-lab:lang";
const THEME_KEY = "gravity-lab:theme";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: the choice simply is not remembered.
  }
}

/** English first; Vietnamese is a full translation that keeps the English terms in brackets. */
function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "vi" || fromUrl === "en") return fromUrl;
  const saved = read(LANG_KEY);
  if (saved === "vi" || saved === "en") return saved;
  return "en";
}

function initialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = read(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

let lang: Lang = initialLang();
let theme: Theme = initialTheme();
const listeners = new Set<() => void>();

function apply() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dataset.theme = theme;
  document.title = lang === "en" ? "Gravity Lab" : "Trọng lực";
}
apply();

function emit() {
  apply();
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getLang(): Lang {
  return lang;
}

export function getTheme(): Theme {
  return theme;
}

export function setLang(next: Lang) {
  if (next === lang) return;
  lang = next;
  write(LANG_KEY, next);
  emit();
}

export function setTheme(next: Theme) {
  if (next === theme) return;
  theme = next;
  write(THEME_KEY, next);
  emit();
}

/** Pick the Vietnamese or English text for the current language. */
export function tr(vi: string, en: string): string {
  return lang === "en" ? en : vi;
}

/** Fixed-point number with the current language's decimal mark (0,38 or 0.38). */
export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const s = n.toFixed(digits);
  return lang === "en" ? s : s.replace(".", ",");
}

/** Integer with the current language's thousands separator (3.661 or 3,661). */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString(lang === "en" ? "en-US" : "vi-VN");
}
