/**
 * Whether the page runs inside the Android app on Google Play (a Trusted Web Activity).
 *
 * The Play build opens the site with `?src=play` (twa-manifest.json, startUrl and shortcuts), and Chrome
 * also passes the app as referrer (`android-app://<package>/`). Either signal is enough. The web edition
 * is unchanged; the Play edition only differs where the listing must not imply more than the app is:
 * it names no institution and shows no planned prices, because the Android app is free and sells nothing.
 */

export const PLAY_PACKAGE = "io.github.thuyhuongctu.gravitylab";

export type PlaySignals = {
  /** window.location.search, e.g. "?src=play". */
  search: string;
  /** document.referrer. */
  referrer: string;
  /** A flag kept for the current tab, so in-app navigation keeps the Play edition. */
  remembered: boolean;
};

export function isPlayLaunch(s: PlaySignals): boolean {
  if (s.remembered) return true;
  if (new URLSearchParams(s.search).get("src") === "play") return true;
  return s.referrer.startsWith(`android-app://${PLAY_PACKAGE}`);
}
