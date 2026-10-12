/** Orthographic globe math: lon/lat to unit vectors, camera rotation, great-circle arcs. */

import { LAND_RINGS, LAND_SCALE } from "@/data/land";

export type Vec3 = [number, number, number];
export type View = { lon: number; lat: number };
export type Projected = { x: number; y: number; z: number; front: boolean };

const RAD = Math.PI / 180;

export function toVec(lon: number, lat: number): Vec3 {
  const p = lat * RAD;
  const l = lon * RAD;
  return [Math.cos(p) * Math.sin(l), Math.sin(p), Math.cos(p) * Math.cos(l)];
}

/** Rotate a world vector into camera space: the view centre lands on +z, north up. */
export function rotate(v: Vec3, view: View): Vec3 {
  const l = -view.lon * RAD;
  const x1 = v[0] * Math.cos(l) + v[2] * Math.sin(l);
  const z1 = -v[0] * Math.sin(l) + v[2] * Math.cos(l);
  const p = view.lat * RAD;
  const y2 = v[1] * Math.cos(p) - z1 * Math.sin(p);
  const z2 = v[1] * Math.sin(p) + z1 * Math.cos(p);
  return [x1, y2, z2];
}

/**
 * Screen position relative to the globe centre, in units of the globe radius.
 * A point is drawn when it faces the camera, or when it is lifted above the
 * surface far enough to clear the limb (arcs that bow over the horizon).
 */
export function project(v: Vec3, view: View): Projected {
  const [x, y, z] = rotate(v, view);
  const front = z >= 0 || Math.hypot(x, y) > 1;
  return { x, y: -y, z, front };
}

/** Central angle between two unit vectors, in radians. */
export function angleBetween(a: Vec3, b: Vec3): number {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  return Math.acos(dot);
}

/**
 * Points along the great circle from a to b, lifted off the surface by a bow
 * that grows with the distance covered (lift is a fraction of the radius).
 */
export function arcPoints(a: Vec3, b: Vec3, steps = 48, maxLift = 0.22): Vec3[] {
  const omega = angleBetween(a, b);
  const lift = maxLift * Math.min(1, omega / Math.PI) + 0.02;
  const out: Vec3[] = [];
  const s = Math.sin(omega);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    let p: Vec3;
    if (s < 1e-6) {
      p = [a[0], a[1], a[2]];
    } else {
      const wa = Math.sin((1 - t) * omega) / s;
      const wb = Math.sin(t * omega) / s;
      p = [wa * a[0] + wb * b[0], wa * a[1] + wb * b[1], wa * a[2] + wb * b[2]];
    }
    const h = 1 + lift * Math.sin(Math.PI * t);
    out.push([p[0] * h, p[1] * h, p[2] * h]);
  }
  return out;
}

/** Decoded land outlines as unit vectors, built once. */
let landCache: Vec3[][] | null = null;

export function landRings(): Vec3[][] {
  if (landCache) return landCache;
  landCache = LAND_RINGS.map((ring) => {
    const pts: Vec3[] = [];
    let x = 0;
    let y = 0;
    for (let i = 0; i + 1 < ring.length; i += 2) {
      x += ring[i]!;
      y += ring[i + 1]!;
      pts.push(toVec(x / LAND_SCALE, y / LAND_SCALE));
    }
    return pts;
  });
  return landCache;
}

/** Shortest signed difference between two longitudes, in degrees. */
export function lonDelta(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}

export function clampLat(lat: number): number {
  return Math.max(-70, Math.min(70, lat));
}
