import { useSyncExternalStore } from "react";

/** State shared between the story header and the 3D journey: reduced motion, and whether the reader has entered. */
const CALM_KEY = "gravity-lab:calm";

function readCalm(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = localStorage.getItem(CALM_KEY);
    if (v === "1" || v === "0") return v === "1";
  } catch {
    // Fall through to the system setting.
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

let calm = readCalm();
let entered = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

function subscribe(f: () => void) {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
}

export const getCalm = () => calm;
export const getEntered = () => entered;

/** Reduced motion: the reader's own choice, remembered; the system setting applies until they choose. */
export function toggleCalm() {
  calm = !calm;
  try {
    localStorage.setItem(CALM_KEY, calm ? "1" : "0");
  } catch {
    // Not remembered: the system setting applies again next time.
  }
  emit();
}

/** The splash has been dismissed for this page load; the header may fade in. */
export function markEntered() {
  if (entered) return;
  entered = true;
  emit();
}

export function useCalm() {
  return useSyncExternalStore(subscribe, getCalm, () => false);
}

export function useEntered() {
  return useSyncExternalStore(subscribe, getEntered, () => false);
}
