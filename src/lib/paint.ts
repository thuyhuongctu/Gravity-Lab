/**
 * Canvas colours. The scenes are authored on the dark sky; in the light theme each
 * colour maps to a darker counterpart that keeps its contrast on a paper background.
 */

import { getTheme } from "@/lib/prefs";

const LIGHT: Record<string, string> = {
  "#101614": "#f4f1ff", // sky / stage: pearl dawn
  "#22302a": "#fbfaff", // sea, lit side
  "#141c18": "#e6e0ff", // sea, limb
  "#f3ece1": "#1a1640", // ink on the sky: midnight indigo
  "#c4bbb0": "#4b4577", // mist
  "#8fd4c0": "#0b7285", // aurora
  "#7ec8b8": "#0e7490",
  "#9ec4b6": "#5b4bb5",
  "#e7c27a": "#b4530a", // solar amber
  "#d4a04a": "#9a4a0c",
  "#e0a090": "#c2185b", // flare
  "#c46a4a": "#a3134c",
  "#f0dcc0": "#6d28d9", // nebula violet
};

/** The colour to draw for a dark-theme colour, under the current theme. */
/** Dark theme: midnight indigo sky, aurora, solar amber, flare pink, nebula violet. */
const DARK: Record<string, string> = {
  "#101614": "#0b0a1f",
  "#22302a": "#1b1942",
  "#141c18": "#110f2b",
  "#f3ece1": "#eeeafb",
  "#c4bbb0": "#a9a3d6",
  "#8fd4c0": "#5eead4",
  "#7ec8b8": "#22d3ee",
  "#9ec4b6": "#a78bfa",
  "#e7c27a": "#ffc56b",
  "#d4a04a": "#f59e0b",
  "#e0a090": "#ff7a9c",
  "#c46a4a": "#ff5e8a",
  "#f0dcc0": "#c4b5fd",
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
