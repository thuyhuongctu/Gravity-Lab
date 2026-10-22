/** Whether to offer Vietnamese to a first-time visitor who sees the default English interface. */

/** Time zones that mark a device set up in Viet Nam. */
const VN_ZONES = new Set(["Asia/Ho_Chi_Minh", "Asia/Saigon"]);

export type LangHintInput = {
  /** navigator.languages (or [navigator.language]). */
  languages: readonly string[];
  /** Intl.DateTimeFormat().resolvedOptions().timeZone. */
  timeZone: string | undefined;
  /** A language already chosen, from ?lang= or storage; null when none. */
  chosen: string | null;
  /** The hint was already answered or closed. */
  dismissed: boolean;
};

/** True when nothing was chosen yet and the device looks Vietnamese (language list or time zone). */
export function shouldSuggestVietnamese(input: LangHintInput): boolean {
  if (input.dismissed || input.chosen === "vi" || input.chosen === "en") return false;
  const speaksVi = input.languages.some((l) => l.toLowerCase().split("-")[0] === "vi");
  return speaksVi || (input.timeZone !== undefined && VN_ZONES.has(input.timeZone));
}
