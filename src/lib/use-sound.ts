import { useSyncExternalStore } from "react";
import { getSound, subscribeSound, type SoundState } from "@/lib/sound";

/** Re-render when a sound setting changes. */
export function useSound(): SoundState {
  return useSyncExternalStore(subscribeSound, getSound, getSound);
}
