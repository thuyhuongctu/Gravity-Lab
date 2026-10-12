/** Flat world map maths: a Pacific-centred equirectangular projection. */

import { LAND_RINGS, LAND_SCALE } from "../data/land.ts";

export type LonLat = [number, number];

/** Central meridian: Asia in the middle, Europe left, the Americas right. */
export const LON0 = 120;

const RAD = Math.PI / 180;

/** A longitude moved into [lon0 - 180, lon0 + 180). */
export function wrapLon(lon: number, lon0 = LON0): number {
  const d = ((((lon - lon0 + 180) % 360) + 360) % 360) - 180;
  return lon0 + d;
}

/** Longitudes made continuous: each step takes the shorter way round. */
export function unwrapPath(lons: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i < lons.length; i++) {
    if (i === 0) {
      out.push(wrapLon(lons[0]!));
      continue;
    }
    const prev = out[i - 1]!;
    let d = lons[i]! - lons[i - 1]!;
    d = ((((d + 180) % 360) + 360) % 360) - 180;
    out.push(prev + d);
  }
  return out;
}

let landCache: LonLat[][] | null = null;

/** Natural Earth outlines as continuous lon/lat rings; Antarctica is left out. */
export function landLonLat(): LonLat[][] {
  if (landCache) return landCache;
  const rings: LonLat[][] = [];
  for (const ring of LAND_RINGS) {
    const lons: number[] = [];
    const lats: number[] = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < ring.length; i += 2) {
      x += ring[i]!;
      y += ring[i + 1]!;
      lons.push(x / LAND_SCALE);
      lats.push(y / LAND_SCALE);
    }
    if (lats.length < 3 || Math.min(...lats) < -60) continue;
    const un = unwrapPath(lons);
    rings.push(un.map((lon, i) => [lon, lats[i]!]));
  }
  landCache = rings;
  return rings;
}

function toVec(lon: number, lat: number): [number, number, number] {
  const p = lat * RAD;
  const l = lon * RAD;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

/** Points on the great circle from a to b, with continuous longitudes starting at wrapLon(a). */
export function greatCircle(a: { lon: number; lat: number }, b: { lon: number; lat: number }, steps = 48): LonLat[] {
  const va = toVec(a.lon, a.lat);
  const vb = toVec(b.lon, b.lat);
  const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  const s = Math.sin(omega);
  const lons: number[] = [];
  const lats: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let v = va;
    if (s > 1e-6) {
      const wa = Math.sin((1 - t) * omega) / s;
      const wb = Math.sin(t * omega) / s;
      v = [wa * va[0] + wb * vb[0], wa * va[1] + wb * vb[1], wa * va[2] + wb * vb[2]];
    }
    lons.push(Math.atan2(v[0], v[2]) / RAD);
    lats.push(Math.asin(Math.max(-1, Math.min(1, v[1]))) / RAD);
  }
  return unwrapPath(lons).map((lon, i) => [lon, lats[i]!]);
}

export type MapView = { lon: number; lat: number; scale: number };

/** The view that frames the points (lon already wrapped) with a margin, in pixels per degree. */
export function fitView(points: LonLat[], w: number, h: number, margin = 48): MapView {
  const minScale = w / 360;
  if (!points.length) return { lon: LON0, lat: 20, scale: minScale };
  const lons = points.map((p) => p[0]);
  const lats = points.map((p) => p[1]);
  const l0 = Math.min(...lons);
  const l1 = Math.max(...lons);
  const b0 = Math.min(...lats);
  const b1 = Math.max(...lats);
  const sx = (w - 2 * margin) / Math.max(10, l1 - l0);
  const sy = (h - 2 * margin) / Math.max(10, b1 - b0);
  const scale = Math.max(minScale, Math.min(40, Math.min(sx, sy)));
  return { lon: (l0 + l1) / 2, lat: (b0 + b1) / 2, scale };
}
