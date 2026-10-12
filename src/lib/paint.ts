/**
 * Canvas colours. The scenes are authored on the dark sky; in the light theme each
 * colour maps to a darker counterpart that keeps its contrast on a paper background.
 */

import { getTheme } from "@/lib/prefs";

const LIGHT: Record<string, string> = {
  "#101614": "#fbf4e8", // sky / stage: BizOn cream
  "#22302a": "#fffbf4", // sea, lit side
  "#141c18": "#f3e6cf", // sea, limb
  "#f3ece1": "#033337", // ink on the sky: BizOn deep teal
  "#c4bbb0": "#3e5a5c", // mist
  "#8fd4c0": "#006687", // teal
  "#7ec8b8": "#1e7e8c",
  "#9ec4b6": "#3e7f86",
  "#e7c27a": "#c2581b", // amber → BizOn burnt orange
  "#d4a04a": "#a8541c",
  "#e0a090": "#c2581b", // clay
  "#c46a4a": "#a84e30",
  "#f0dcc0": "#6b5a40",
};

/** The colour to draw for a dark-theme colour, under the current theme. */
/** Dark theme: the night sky takes BizOn's deep teal. */
const DARK: Record<string, string> = {
  "#101614": "#04191b",
  "#22302a": "#0f3336",
  "#141c18": "#08221f",
};

export function paint(hex: string): string {
  if (getTheme() !== "light") return DARK[hex.toLowerCase()] ?? hex;
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
