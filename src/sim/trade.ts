import { fmt, tr } from "../lib/prefs.ts";

/** Tinbergen gravity model of trade, read as Newton's law with a free distance elasticity. */

export type EconId = string;

export type Economy = {
  id: EconId;
  name: string;
  nameEn: string;
  short: string;
  shortEn: string;
  gdp: number;
  lat: number;
  lon: number;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  color: string;
};

export type TradeSceneId = "lecture" | "partners";

export const TRADE_SCENES: Array<{ id: TradeSceneId; name: string; nameEn: string }> = [
  { id: "lecture", name: "Bài giảng", nameEn: "Lecture" },
  { id: "partners", name: "Đối tác", nameEn: "Partners" },
];

type Seed = Omit<Economy, "x" | "y" | "homeX" | "homeY"> & { x: number; y: number };

// One meaning per colour: Vietnam is flare pink, every partner is bone.
const VN = "#c46a4a";
const BONE = "#f0dcc0";

/** GDP: nominal USD trillions, rounded, circa 2024. Coordinates: rough economic centers. */
const ALL: Seed[] = [
  { id: "vn", name: "Việt Nam", nameEn: "Vietnam", short: "VN", shortEn: "VN", gdp: 0.46, lat: 16.0, lon: 107.6, x: 0, y: 24, color: VN },
  { id: "th", name: "Thái Lan", nameEn: "Thailand", short: "TH", shortEn: "TH", gdp: 0.53, lat: 13.8, lon: 100.5, x: -118, y: 8, color: BONE },
  { id: "sg", name: "Singapore", nameEn: "Singapore", short: "SG", shortEn: "SG", gdp: 0.53, lat: 1.3, lon: 103.8, x: -62, y: 128, color: BONE },
  { id: "id", name: "Indonesia", nameEn: "Indonesia", short: "ID", shortEn: "ID", gdp: 1.4, lat: -6.2, lon: 106.8, x: 18, y: 188, color: BONE },
  { id: "cn", name: "Trung Quốc", nameEn: "China", short: "TQ", shortEn: "CN", gdp: 18.5, lat: 31.2, lon: 121.5, x: 36, y: -150, color: BONE },
  { id: "kr", name: "Hàn Quốc", nameEn: "South Korea", short: "HQ", shortEn: "KR", gdp: 1.7, lat: 37.5, lon: 127.0, x: 132, y: -168, color: BONE },
  { id: "jp", name: "Nhật Bản", nameEn: "Japan", short: "NB", shortEn: "JP", gdp: 4.1, lat: 35.7, lon: 139.7, x: 210, y: -118, color: BONE },
  { id: "us", name: "Hoa Kỳ", nameEn: "United States", short: "HK", shortEn: "US", gdp: 29.0, lat: 39.0, lon: -98.0, x: 250, y: 36, color: BONE },
  { id: "eu", name: "Liên minh châu Âu", nameEn: "European Union", short: "EU", shortEn: "EU", gdp: 19.0, lat: 50.1, lon: 10.0, x: -230, y: -150, color: BONE },
];

const LECTURE_IDS = ["vn", "th", "cn", "jp", "us", "eu"];

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const p = Math.PI / 180;
  const dLat = (b.lat - a.lat) * p;
  const dLon = (b.lon - a.lon) * p;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos(a.lat * p) * Math.cos(b.lat * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s1 + s2)));
}

export function makeEconomies(scene: TradeSceneId): Economy[] {
  const ids = scene === "lecture" ? LECTURE_IDS : ALL.map((e) => e.id);
  return ALL.filter((e) => ids.includes(e.id)).map((e) => ({
    ...e,
    homeX: e.x,
    homeY: e.y,
  }));
}

export function pairKm(a: Economy, b: Economy): number {
  const base = haversineKm(a, b);
  const home = Math.hypot(a.homeX - b.homeX, a.homeY - b.homeY);
  const now = Math.hypot(a.x - b.x, a.y - b.y);
  if (home < 1) return base;
  return Math.max(40, base * (now / home));
}

export function rawFlow(a: Economy, b: Economy, gamma: number, barrier: number): number {
  const d = pairKm(a, b);
  return (barrier * a.gdp * b.gdp) / Math.pow(d, gamma);
}

export function radiusForGdp(gdp: number): number {
  return 13 + 8.2 * Math.log10(gdp * 12);
}

export function formatKm(km: number): string {
  if (km >= 1000) {
    const v = km / 1000;
    const digits = v >= 10 ? 0 : 1;
    return tr(`${fmt(v, digits)} nghìn km`, `${fmt(v, digits)} thousand km`);
  }
  return `${Math.round(km)} km`;
}

export function formatGdp(gdp: number): string {
  if (gdp >= 10) {
    const s = fmt(gdp, 1);
    return s.endsWith("0") ? s.slice(0, -2) : s;
  }
  if (gdp >= 1) return fmt(gdp, 1);
  return fmt(gdp, 2);
}

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export type PartnerRow = {
  econ: Economy;
  km: number;
  share: number;
  newtonShare: number;
  /** Flow at γ = 2 as a percent of the flow at the chosen γ (same G, no FTA). */
  newtonPct: number;
};

export function partnerRows(
  ecos: Economy[],
  focusId: string,
  gamma: number,
  pairId: string | null,
  boosts: Record<string, number>,
): PartnerRow[] {
  const focus = ecos.find((e) => e.id === focusId);
  if (!focus) return [];
  const rows = ecos
    .filter((e) => e.id !== focusId)
    .map((e) => {
      const boosted = pairId === e.id ? (boosts[pairKey(focusId, e.id)] ?? 1) : 1;
      const shaped = rawFlow(focus, e, gamma, 1);
      const newton = rawFlow(focus, e, 2, 1);
      return {
        econ: e,
        km: pairKm(focus, e),
        raw: rawFlow(focus, e, gamma, boosted),
        shaped,
        newton,
      };
    });
  const sumT = rows.reduce((s, r) => s + r.raw, 0) || 1;
  const sumN = rows.reduce((s, r) => s + r.newton, 0) || 1;
  return rows
    .map((r) => ({
      econ: r.econ,
      km: r.km,
      share: (r.raw / sumT) * 100,
      newtonShare: (r.newton / sumN) * 100,
      newtonPct: r.shaped <= 0 ? 100 : (r.newton / r.shaped) * 100,
    }))
    .sort((a, b) => b.share - a.share);
}
