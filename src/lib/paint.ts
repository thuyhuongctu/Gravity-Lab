/**
 * Canvas colours. The scenes are authored on the dark sky; in the light theme each
 * colour maps to a darker counterpart that keeps its contrast on a paper background.
 */

import { getTheme } from "@/lib/prefs";

const LIGHT: Record<string, string> = {
  "#101614": "#f3eee4", // sky / stage: warm bone
  "#22302a": "#fbf8f1", // sea, lit side
  "#141c18": "#e6dfd1", // sea, limb
  "#f3ece1": "#1d1e22", // ink on the sky: graphite
  "#c4bbb0": "#55504a", // mist
  "#8fd4c0": "#0b7285", // teal rim light
  "#7ec8b8": "#0e7490",
  "#9ec4b6": "#6d5a3a", // clay sand
  "#e7c27a": "#b4530a", // amber key light
  "#d4a04a": "#9a4a0c",
  "#e0a090": "#c2185b", // flare
  "#c46a4a": "#a3134c",
  "#f0dcc0": "#6d5a3a", // bone
};

/** The colour to draw for a dark-theme colour, under the current theme. */
/** Dark theme (clay noir, graphite): near-black sky, teal rim, amber key, flare pink, bone. No purple. */
const DARK: Record<string, string> = {
  "#101614": "#0a0b0d",
  "#22302a": "#1c1e22",
  "#141c18": "#111215",
  "#f3ece1": "#f1ece2",
  "#c4bbb0": "#a8a297",
  "#8fd4c0": "#4fd1c5",
  "#7ec8b8": "#4fd1c5",
  "#9ec4b6": "#e8d9b8",
  "#e7c27a": "#ffc56b",
  "#d4a04a": "#f59e0b",
  "#e0a090": "#ff7a9c",
  "#c46a4a": "#ff5e8a",
  "#f0dcc0": "#e8d9b8",
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
