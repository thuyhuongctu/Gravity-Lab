/**
 * Canvas colours. The scenes are authored on the dark sky; in the light theme each
 * colour maps to a darker counterpart that keeps its contrast on a paper background.
 */

import { getTheme } from "@/lib/prefs";

const LIGHT: Record<string, string> = {
  "#101614": "#ebe4d6", // sky / stage
  "#22302a": "#f4efe6", // sea, lit side
  "#141c18": "#dcd4c4", // sea, limb
  "#f3ece1": "#1c1915", // ink on the sky
  "#c4bbb0": "#5c554c", // mist
  "#8fd4c0": "#2f7a68", // teal
  "#7ec8b8": "#3f8a78",
  "#9ec4b6": "#4f7f72",
  "#e7c27a": "#a2701c", // amber
  "#d4a04a": "#8f6418",
  "#e0a090": "#b0583a", // clay
  "#c46a4a": "#a84e30",
  "#f0dcc0": "#6b5a40",
};

/** The colour to draw for a dark-theme colour, under the current theme. */
export function paint(hex: string): string {
  if (getTheme() !== "light") return hex;
  return LIGHT[hex.toLowerCase()] ?? hex;
}

/** paint() with an alpha channel. */
export function paintA(hex: string, alpha: number): string {
  const h = paint(hex).replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
