/** Shareable lab state in the URL hash (#s=…). Nothing leaves the device; the link only carries UI state. */
export type Room = "story" | "cast" | "orbit" | "trade" | "lab" | "me";
export interface ShareState {
  room: Room;
  scene?: number; // story scene 1–9
  view?: "map" | "plane" | "globe";
  gamma?: number; // distance exponent
  beta?: number; // size exponent
  pair?: string; // partner id, e.g. "kr"
  cam?: [number, number, number]; // lon, lat, zoom
  caseId?: string; // case file id
  step?: number; // case step 1–4
}

const KEYS: Record<keyof ShareState, string> = { room: "r", scene: "sc", view: "v", gamma: "g", beta: "b", pair: "p", cam: "c", caseId: "k", step: "st" };
const ROOMS: Room[] = ["story", "cast", "orbit", "trade", "lab", "me"];
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;

export function encodeState(s: ShareState): string {
  const q = new URLSearchParams();
  (Object.keys(KEYS) as (keyof ShareState)[]).forEach((k) => {
    const v = s[k];
    if (v === undefined) return;
    q.set(KEYS[k], Array.isArray(v) ? v.map((n) => round(n)).join(",") : typeof v === "number" ? String(round(v)) : String(v));
  });
  return q.toString();
}

export function decodeState(hash = location.hash): ShareState | null {
  const m = hash.match(/[#&]s=([^&]*)/);
  if (!m) return null;
  const q = new URLSearchParams(decodeURIComponent(m[1]));
  const room = q.get("r") as Room;
  if (!ROOMS.includes(room)) return null;
  const num = (k: string, lo: number, hi: number) => {
    const n = Number(q.get(k));
    return q.has(k) && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : undefined;
  };
  const cam = q.get("c")?.split(",").map(Number);
  const view = q.get("v");
  return {
    room,
    scene: num("sc", 1, 9),
    view: view === "map" || view === "plane" || view === "globe" ? view : undefined,
    gamma: num("g", 0, 3),
    beta: num("b", 0, 2),
    pair: q.get("p")?.replace(/[^a-z]/g, "").slice(0, 3) || undefined,
    cam: cam?.length === 3 && cam.every(Number.isFinite) ? (cam as [number, number, number]) : undefined,
    caseId: q.get("k")?.replace(/[^a-z0-9-]/g, "").slice(0, 24) || undefined,
    step: num("st", 1, 4),
  };
}

export function shareUrl(s: ShareState): string {
  return `${location.origin}${location.pathname}#s=${encodeURIComponent(encodeState(s))}`;
}

/** Native share sheet on Android/PWA, clipboard elsewhere. Returns "shared" | "copied" | "failed". */
export async function shareState(s: ShareState, title: string): Promise<"shared" | "copied" | "failed"> {
  const url = shareUrl(s);
  try {
    if (navigator.share) {
      await navigator.share({ title, url });
      return "shared";
    }
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
