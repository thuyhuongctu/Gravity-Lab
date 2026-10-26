/** True inside the Android app on Google Play; decided once per page load. See src/sim/play-app.ts. */
import { isPlayLaunch } from "@/sim/play-app";

const KEY = "gravity-lab:play";

function detect(): boolean {
  if (typeof window === "undefined") return false;
  let remembered = false;
  try {
    remembered = window.sessionStorage.getItem(KEY) === "1";
  } catch {
    // Storage blocked: fall back to the launch signals alone.
  }
  const play = isPlayLaunch({
    search: window.location.search,
    referrer: document.referrer,
    remembered,
  });
  if (play) {
    try {
      window.sessionStorage.setItem(KEY, "1");
    } catch {
      // Not remembered for the tab; the launch signals still hold for this load.
    }
  }
  return play;
}

export const PLAY_APP = detect();

/** Pick the text for the Play edition or the web edition. */
export function forPlay<T>(play: T, web: T): T {
  return PLAY_APP ? play : web;
}
