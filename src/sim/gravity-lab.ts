/** Published gravity-lab numbers and the in-browser estimators behind them.
 * Coefficients are copied from Phan & Đỗ (2019), Table 6, and Xuan & Xing (2008), Table 1.
 */

import { tr } from "../lib/prefs.ts";

export const HANOI: [number, number] = [21.0285, 105.8542];

export const CITE_2019 = "Phan, A. T., & Đỗ, T. H. (2019). Tạp chí Kinh tế Đối ngoại, (114), 14–26.";
export const CITE_2008 = "Xuan, N. T., & Xing, Y. (2008). Economics of Transition, 16(2), 183–197.";

export type Coef = [b: number, se: number, stars: string];

export const VARS: Array<{ id: string; label: string; en: string }> = [
  { id: "cons", label: "Hằng số", en: "Constant" },
  { id: "lagfdi", label: "Độ trễ FDI (log)", en: "Lagged FDI (log)" },
  { id: "geo", label: "Khoảng cách địa lý (log)", en: "Geographic distance (log)" },
  { id: "inst", label: "Khoảng cách thể chế", en: "Institutional distance" },
  { id: "cult", label: "Khoảng cách văn hóa", en: "Cultural distance" },
  { id: "econ", label: "Khoảng cách kinh tế (log)", en: "Economic distance (log)" },
  { id: "gdpvn", label: "Quy mô thị trường Việt Nam (log)", en: "Vietnam market size (log)" },
  { id: "gdppt", label: "Quy mô thị trường đối tác (log)", en: "Partner market size (log)" },
  { id: "open", label: "Độ mở thương mại", en: "Trade openness" },
  { id: "exp", label: "Kinh nghiệm quốc tế", en: "International experience" },
  { id: "corr", label: "Tham nhũng", en: "Corruption" },
  { id: "fta", label: "Khu vực thương mại tự do", en: "Free trade area" },
];

const M = (
  n: number,
  r2: number,
  p: number,
  c: Record<string, Coef>,
): { n: number; r2: number; p: number; c: Record<string, Coef> } => ({ n, r2, p, c });

/** Eight nested REM models. Index 7 is Model 8, the one the impact simulator uses. */
export const MODELS = [
  M(160, 0.0242, 0.1279, { cons: [5.59, 1.89, "***"], open: [2.02, 1.21, "**"], exp: [0.02, 0.87, ""], corr: [-1.26, 1.09, ""], fta: [0.69, 0.4, "**"] }),
  M(159, 0.0058, 0, { cons: [2.53, 1.82, ""], lagfdi: [0.54, 0.07, "***"], open: [2.95, 1.34, "**"], exp: [0.07, 0.05, ""], corr: [-2.2, 0.94, "**"], fta: [0.71, 0.23, "***"] }),
  M(159, 0.006, 0, { cons: [3.68, 2.08, "**"], lagfdi: [0.53, 0.07, "***"], geo: [-0.14, 0.13, ""], open: [2.97, 1.34, "**"], exp: [0.06, 0.05, ""], corr: [-2.1, 0.94, "**"], fta: [0.63, 0.24, "***"] }),
  M(159, 0.0061, 0, { cons: [5.5, 2.18, "**"], lagfdi: [0.48, 0.07, "***"], geo: [-0.38, 0.16, "**"], inst: [0.13, 0.06, "**"], open: [2.88, 1.32, "**"], exp: [0.08, 0.05, ""], corr: [-2.3, 0.93, "**"], fta: [0.86, 0.26, "***"] }),
  M(159, 0.0068, 0, { cons: [5.54, 2.33, "**"], lagfdi: [0.48, 0.07, "***"], geo: [-0.38, 0.18, "**"], inst: [0.13, 0.56, "**"], cult: [0.01, 0.16, ""], open: [2.88, 1.33, "**"], exp: [0.08, 0.57, ""], corr: [-2.31, 0.94, "**"], fta: [0.87, 0.26, "***"] }),
  M(159, 0.0091, 0, { cons: [4.33, 2.47, "**"], lagfdi: [0.47, 0.07, "***"], geo: [-0.42, 0.18, "**"], inst: [0.07, 0.68, ""], cult: [-0.02, 0.16, ""], econ: [0.25, 0.17, ""], open: [2.67, 1.34, "**"], exp: [0.08, 0.57, ""], corr: [-2.4, 0.94, "**"], fta: [0.9, 0.26, "***"] }),
  M(159, 0.0076, 0, { cons: [7.38, 4.6, ""], lagfdi: [0.46, 0.07, "***"], geo: [-0.42, 0.18, "**"], inst: [0.07, 0.07, ""], cult: [0, 0.16, ""], econ: [0.26, 0.18, ""], gdpvn: [-0.89, 1.13, ""], open: [2.89, 1.36, "**"], exp: [0.1, 0.06, ""], corr: [-1.51, 1.48, ""], fta: [0.95, 0.27, "***"] }),
  M(159, 0.0072, 0, { cons: [8.32, 4.72, "**"], lagfdi: [0.45, 0.07, "***"], geo: [-0.38, 0.19, "**"], inst: [0.12, 0.08, ""], cult: [0.03, 0.17, ""], econ: [0.33, 0.19, "**"], gdpvn: [-0.87, 1.13, ""], gdppt: [-0.25, 0.27, ""], open: [2.89, 1.37, "**"], exp: [0.11, 0.63, "**"], corr: [-1.54, 1.48, ""], fta: [1.01, 0.28, "***"] }),
];

export const COUNTRIES: Array<{ id: string; name: string; en: string; cap: [number, number] }> = [
  { id: "KOR", name: "Hàn Quốc", en: "South Korea", cap: [37.5665, 126.978] },
  { id: "TWN", name: "Đài Loan", en: "Taiwan", cap: [25.033, 121.5654] },
  { id: "HKG", name: "Hồng Kông", en: "Hong Kong", cap: [22.3193, 114.1694] },
  { id: "MYS", name: "Ma-lai-xi-a", en: "Malaysia", cap: [3.139, 101.6869] },
  { id: "CHN", name: "Trung Quốc", en: "China", cap: [39.9042, 116.4074] },
  { id: "SGP", name: "Xin-ga-po", en: "Singapore", cap: [1.3521, 103.8198] },
  { id: "JPN", name: "Nhật Bản", en: "Japan", cap: [35.6762, 139.6503] },
  { id: "THA", name: "Thái Lan", en: "Thailand", cap: [13.7563, 100.5018] },
  { id: "DEU", name: "Đức", en: "Germany", cap: [52.52, 13.405] },
  { id: "FRA", name: "Pháp", en: "France", cap: [48.8566, 2.3522] },
  { id: "NLD", name: "Hà Lan", en: "Netherlands", cap: [52.3676, 4.9041] },
  { id: "RUS", name: "Nga", en: "Russia", cap: [55.7558, 37.6173] },
  { id: "GBR", name: "Anh", en: "United Kingdom", cap: [51.5074, -0.1278] },
  { id: "USA", name: "Hoa Kỳ", en: "United States", cap: [38.9072, -77.0369] },
  { id: "CAN", name: "Ca-na-đa", en: "Canada", cap: [45.4215, -75.6972] },
  { id: "AUS", name: "Úc", en: "Australia", cap: [-35.2809, 149.13] },
];

const XX_YEARS = [1990, 1991, 1992, 1993, 1994, 1995, 1996, 1997, 1998, 1999, 2000, 2001, 2002, 2003, 2004];
const XX: Array<{ id: string; cap: [number, number]; v: number[] }> = [
  { id: "JPN", cap: [35.6762, 139.6503], v: [0, 76.4, 1125.4, 114.6, 234.4, 1359, 622.65, 324.7, 152.5, 56.3, 56.5, 203.2, 57.7, 40.8, 35.7] },
  { id: "SGP", cap: [1.3521, 103.8198], v: [0, 527.3, 193.1, 577.3, 542.2, 345.4, 509, 186.9, 57.2, 26.3, 52, 75.3, 442.1, 78.5, 2.7] },
  { id: "TWN", cap: [25.033, 121.5654], v: [61, 158.9, 512.9, 340.6, 468.6, 264.3, 268.5, 134.1, 81.2, 98.7, 165.5, 177.5, 98.2, 88.4, 17.3] },
  { id: "KOR", cap: [37.5665, 126.978], v: [0, 52.3, 235.8, 408.2, 340.6, 419.4, 508.6, 54.9, 18.8, 32.8, 41.4, 75.4, 138, 79.1, 50.3] },
  { id: "HKG", cap: [22.3193, 114.1694], v: [49.5, 123.7, 341.5, 295.3, 390.8, 72.7, 329.8, 29.3, 55.2, 28.5, 14.3, 50, 50.6, 16.9, 8] },
  { id: "NLD", cap: [52.3676, 4.9041], v: [0, 107.4, 6.6, 6.2, 44.2, 149.7, 46.9, 0, 441, 2, 508.1, 430, 0, 18, 24.5] },
  { id: "FRA", cap: [48.8566, 2.3522], v: [0, 61, 68.2, 192.1, 14.1, 135.7, 50.5, 203.3, 25, 18.8, 1.9, 346.1, 1.2, 3.4, 0] },
  { id: "MYS", cap: [3.139, 101.6869], v: [152, 25.4, 26.2, 117.6, 181.5, 183.4, 13.5, 23.7, 3.6, 9.7, 5.5, 11.8, 60.6, 10.1, 5.3] },
  { id: "THA", cap: [13.7563, 100.5018], v: [0, 0, 29.3, 204, 207.1, 167.7, 50, 15.7, 3.7, 34.5, 8.9, 41.5, 10.8, 32.9, 0] },
  { id: "USA", cap: [38.9072, -77.0369], v: [0, 18.6, 0, 0, 73.7, 282.9, 108, 58.7, 17.3, 66.5, 56.1, 15.2, 14.2, 14.4, 1.6] },
];

export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371.0088;
  const rad = Math.PI / 180;
  const dLat = (b[0] - a[0]) * rad;
  const dLon = (b[1] - a[1]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Country name in the current language. */
export function countryName(id: string): string {
  const c = COUNTRIES.find((x) => x.id === id);
  return c ? tr(c.name, c.en) : id;
}

export function kmFromHanoi(id: string): number {
  const c = COUNTRIES.find((x) => x.id === id);
  return c ? haversineKm(HANOI, c.cap) : 0;
}

export function pctChange(b: number, dx: number): number {
  return (Math.exp(b * dx) - 1) * 100;
}

export function longRun(beta: number, rho: number): number {
  return rho < 1 ? beta / (1 - rho) : Number.NaN;
}

function normCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

export function pValue(b: number, se: number): number {
  if (!(se > 0) || !Number.isFinite(b)) return Number.NaN;
  return 2 * (1 - normCdf(Math.abs(b / se)));
}

export function starsOf(p: number): string {
  return p < 0.01 ? "***" : p < 0.05 ? "**" : p < 0.1 ? "*" : "";
}

export function varLabel(id: string): string {
  const v = VARS.find((x) => x.id === id);
  return v ? tr(v.label, v.en) : id;
}

export type ImpactPart = {
  id: string;
  dx: number;
  pct: number;
  sig: boolean;
};

export type Impact = {
  geoPct: number;
  kmA: number;
  kmB: number;
  betaGeo: number;
  shortRun: number;
  longRun: number;
  parts: ImpactPart[];
};

export function impactOf(input: {
  a: string;
  b: string;
  econPct: number;
  inst: number;
  open: number;
  fta: boolean;
}): Impact {
  const c = MODELS[7]!.c;
  const rho = c.lagfdi![0];
  const kmA = kmFromHanoi(input.a);
  const kmB = kmFromHanoi(input.b);
  const geoPct = pctChange(c.geo![0], Math.log(kmB / kmA));
  const raw = [
    { id: "fta", dx: input.fta ? 1 : 0 },
    { id: "econ", dx: Math.log(1 + input.econPct / 100) },
    { id: "inst", dx: input.inst },
    { id: "open", dx: input.open },
  ];
  const parts = raw.map((p) => {
    const coef = c[p.id]!;
    return {
      id: p.id,
      dx: p.dx,
      pct: pctChange(coef[0], p.dx),
      sig: pValue(coef[0], coef[1]) < 0.05,
    };
  });
  const sumLog = raw.reduce((s, p) => s + c[p.id]![0] * p.dx, 0);
  return {
    geoPct,
    kmA,
    kmB,
    betaGeo: c.geo![0],
    shortRun: (Math.exp(sumLog) - 1) * 100,
    longRun: (Math.exp(longRun(sumLog, rho)) - 1) * 100,
    parts: parts.filter((p) => p.dx !== 0),
  };
}

export type CoefRow = {
  id: string;
  label: string;
  b: number;
  se: number;
  published: string;
  p: number;
  recomputed: string;
  mismatch: boolean;
};

export function coefRows(modelIndex: number): CoefRow[] {
  const m = MODELS[modelIndex]!;
  return VARS.filter((v) => m.c[v.id]).map((v) => {
    const [b, se, published] = m.c[v.id]!;
    const p = pValue(b, se);
    const recomputed = starsOf(p);
    return { id: v.id, label: tr(v.label, v.en), b, se, published, p, recomputed, mismatch: published !== recomputed };
  });
}

type Row = Record<string, number | string>;

function transposeMul(X: number[][], w?: number[]): number[][] {
  const k = X[0]!.length;
  const out = Array.from({ length: k }, () => new Array(k).fill(0));
  for (let i = 0; i < X.length; i++) {
    const xi = X[i]!;
    const wi = w ? w[i]! : 1;
    for (let a = 0; a < k; a++) {
      const v = xi[a]! * wi;
      if (v === 0) continue;
      for (let b = a; b < k; b++) out[a]![b]! += v * xi[b]!;
    }
  }
  for (let a = 0; a < k; a++) for (let b = 0; b < a; b++) out[a]![b] = out[b]![a]!;
  return out;
}

function transposeVec(X: number[][], v: number[], w?: number[]): number[] {
  const k = X[0]!.length;
  const out = new Array(k).fill(0);
  for (let i = 0; i < X.length; i++) {
    const s = v[i]! * (w ? w[i]! : 1);
    for (let a = 0; a < k; a++) out[a] += X[i]![a]! * s;
  }
  return out;
}

function invert(M: number[][]): number[][] | null {
  const n = M.length;
  const A = M.map((row, i) => row.concat(Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))));
  const scale = Math.max(1e-300, ...M.map((r) => Math.max(...r.map(Math.abs))));
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(A[r]![c]!) > Math.abs(A[p]![c]!)) p = r;
    if (Math.abs(A[p]![c]!) < 1e-12 * scale) return null;
    [A[c], A[p]] = [A[p]!, A[c]!];
    const piv = A[c]![c]!;
    for (let j = 0; j < 2 * n; j++) A[c]![j]! /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = A[r]![c]!;
      if (f === 0) continue;
      for (let j = 0; j < 2 * n; j++) A[r]![j]! -= f * A[c]![j]!;
    }
  }
  return A.map((row) => row.slice(n));
}

function matVec(M: number[][], v: number[]): number[] {
  return M.map((row) => row.reduce((s, x, j) => s + x * v[j]!, 0));
}

function sandwich(Binv: number[][], meat: number[][]): number[][] {
  const k = Binv.length;
  const tmp = Binv.map((row) => Array.from({ length: k }, (_, j) => row.reduce((s, x, m) => s + x * meat[m]![j]!, 0)));
  return tmp.map((row) => Array.from({ length: k }, (_, j) => row.reduce((s, x, m) => s + x * Binv[m]![j]!, 0)));
}

function meatOf(X: number[][], e: number[], cluster?: string[]): { M: number[][]; G: number } {
  const k = X[0]!.length;
  const groups = new Map<string | number, number[]>();
  for (let i = 0; i < X.length; i++) {
    const g = cluster ? cluster[i]! : i;
    let s = groups.get(g);
    if (!s) {
      s = new Array(k).fill(0);
      groups.set(g, s);
    }
    for (let a = 0; a < k; a++) s[a]! += X[i]![a]! * e[i]!;
  }
  const M = Array.from({ length: k }, () => new Array(k).fill(0));
  for (const s of groups.values()) for (let a = 0; a < k; a++) for (let b = 0; b < k; b++) M[a]![b]! += s[a]! * s[b]!;
  return { M, G: groups.size };
}

export function design(rows: Row[], xs: string[], yearCol?: string): { X: number[][]; names: string[] } {
  const names = ["_cons", ...xs];
  const levels = yearCol ? Array.from(new Set(rows.map((r) => String(r[yearCol])))).sort().slice(1) : [];
  for (const level of levels) names.push(`${yearCol}=${level}`);
  const X = rows.map((r) => {
    const v = [1, ...xs.map((x) => Number(r[x]))];
    for (const level of levels) v.push(String(r[yearCol!]) === level ? 1 : 0);
    return v;
  });
  return { X, names };
}

function dropCollinear(X: number[][], names: string[]): { X: number[][]; names: string[]; dropped: string[] } {
  const dropped: string[] = [];
  for (let j = 1; j < names.length; j++) {
    const trial = names.map((_, i) => i).filter((c) => c <= j && !dropped.includes(names[c]!));
    const sub = X.map((r) => trial.map((c) => r[c]!));
    if (!invert(transposeMul(sub))) dropped.push(names[j]!);
  }
  const keep = names.map((_, i) => i).filter((c) => !dropped.includes(names[c]!));
  return { X: X.map((r) => keep.map((c) => r[c]!)), names: keep.map((c) => names[c]!), dropped };
}

export type FitCoef = { name: string; b: number; se: number; p: number; stars: string };
export type Fit = { method: string; n: number; coef: FitCoef[]; r2: number; dropped: string[] };

function finalize(names: string[], b: number[], V: number[][], method: string, n: number, r2: number, dropped: string[]): Fit {
  return {
    method,
    n,
    r2,
    dropped,
    coef: names.map((name, j) => {
      const se = Math.sqrt(Math.max(V[j]![j]!, 0));
      const p = pValue(b[j]!, se);
      return { name, b: b[j]!, se, p, stars: starsOf(p) };
    }),
  };
}

export function ols(y: number[], X0: number[][], names0: string[], cluster?: string[]): Fit {
  const { X, names, dropped } = dropCollinear(X0, names0);
  const n = X.length;
  const k = X[0]!.length;
  const XtXi = invert(transposeMul(X));
  if (!XtXi) throw new Error(tr("Ma trận X′X suy biến", "X′X matrix is singular"));
  const b = matVec(XtXi, transposeVec(X, y));
  const e = y.map((yi, i) => yi - X[i]!.reduce((s, x, j) => s + x * b[j]!, 0));
  const { M, G } = meatOf(X, e, cluster);
  const c = cluster ? (G / (G - 1)) * ((n - 1) / (n - k)) : n / (n - k);
  const V = sandwich(XtXi, M).map((r) => r.map((x) => x * c));
  const ybar = y.reduce((s, v) => s + v, 0) / n;
  const sst = y.reduce((s, v) => s + (v - ybar) ** 2, 0);
  const sse = e.reduce((s, v) => s + v * v, 0);
  return finalize(names, b, V, "OLS", n, 1 - sse / sst, dropped);
}

export function ppml(y: number[], X0: number[][], names0: string[], cluster?: string[]): Fit {
  if (y.some((v) => v < 0)) throw new Error(tr("PPML cần biến không âm", "PPML needs a non-negative outcome"));
  const { X, names, dropped } = dropCollinear(X0, names0);
  const n = X.length;
  const k = X[0]!.length;
  const ybar = y.reduce((s, v) => s + v, 0) / n;
  let mu = y.map((v) => (v + ybar) / 2);
  let eta = mu.map(Math.log);
  let b = new Array(k).fill(0);
  let dev = Infinity;
  for (let iter = 0; iter < 200; iter++) {
    const z = eta.map((e, i) => e + (y[i]! - mu[i]!) / mu[i]!);
    const XtWXi = invert(transposeMul(X, mu));
    if (!XtWXi) throw new Error(tr("Ma trận thông tin suy biến", "Information matrix is singular"));
    b = matVec(XtWXi, transposeVec(X, z, mu));
    eta = X.map((r) => r.reduce((s, x, j) => s + x * b[j]!, 0));
    mu = eta.map((e) => Math.exp(Math.min(e, 700)));
    const d = 2 * y.reduce((s, v, i) => s + (v > 0 ? v * Math.log(v / mu[i]!) : 0) - (v - mu[i]!), 0);
    if (Math.abs(d - dev) / (Math.abs(d) + 0.1) < 1e-10) {
      dev = d;
      break;
    }
    dev = d;
  }
  const Bi = invert(transposeMul(X, mu));
  if (!Bi) throw new Error(tr("Ma trận thông tin suy biến", "Information matrix is singular"));
  const e = y.map((v, i) => v - mu[i]!);
  const { M, G } = meatOf(X, e, cluster);
  const c = cluster ? G / (G - 1) : n / (n - k);
  const V = sandwich(Bi, M).map((r) => r.map((x) => x * c));
  const mbar = mu.reduce((s, v) => s + v, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxy += (y[i]! - ybar) * (mu[i]! - mbar);
    sxx += (mu[i]! - mbar) ** 2;
    syy += (y[i]! - ybar) ** 2;
  }
  return finalize(names, b, V, "PPML", n, (sxy * sxy) / (sxx * syy), dropped);
}

export type DistanceLesson = {
  n: number;
  zeros: number;
  rows: Array<{ label: string; n: number; b: number; se: number; p: number; stars: string }>;
};

// The fits are cached; their labels are translated on every call so they follow the language.
let lessonCache: DistanceLesson | null = null;

export function distanceLesson(): DistanceLesson {
  if (!lessonCache) lessonCache = fitLesson();
  const labels = [
    tr("OLS, log(FDI), bỏ năm bằng 0", "OLS, log(FDI), zero years dropped"),
    "OLS, log(FDI + 1)",
    tr("PPML, FDI ở dạng mức", "PPML, FDI in levels"),
  ];
  return { ...lessonCache, rows: lessonCache.rows.map((r, i) => ({ ...r, label: labels[i]! })) };
}

function fitLesson(): DistanceLesson {
  const rows: Row[] = [];
  for (const s of XX) {
    const lndist = Math.log(haversineKm(HANOI, s.cap));
    XX_YEARS.forEach((year, j) => rows.push({ id: s.id, year, fdi: s.v[j]!, lndist }));
  }
  const zeros = rows.filter((r) => r.fdi === 0).length;
  const fit = (rs: Row[], y: number[], est: "ols" | "ppml") => {
    const d = design(rs, ["lndist"], "year");
    const cluster = rs.map((r) => String(r.id));
    const fitResult = est === "ols" ? ols(y, d.X, d.names, cluster) : ppml(y, d.X, d.names, cluster);
    return fitResult.coef.find((c) => c.name === "lndist")!;
  };
  const pos = rows.filter((r) => Number(r.fdi) > 0);
  const c1 = fit(pos, pos.map((r) => Math.log(Number(r.fdi))), "ols");
  const c2 = fit(rows, rows.map((r) => Math.log(Number(r.fdi) + 1)), "ols");
  const c3 = fit(rows, rows.map((r) => Number(r.fdi)), "ppml");
  return {
    n: rows.length,
    zeros,
    rows: [
      { label: "", n: pos.length, b: c1.b, se: c1.se, p: c1.p, stars: c1.stars },
      { label: "", n: rows.length, b: c2.b, se: c2.se, p: c2.p, stars: c2.stars },
      { label: "", n: rows.length, b: c3.b, se: c3.se, p: c3.p, stars: c3.stars },
    ],
  };
}

export type CsvTable = { columns: string[]; rows: Row[] };

export function parseCSV(text: string): CsvTable {
  const firstLine = text.split("\n")[0] ?? "";
  const semi = (firstLine.match(/;/g) || []).length;
  const commaN = (firstLine.match(/,/g) || []).length;
  const sep = semi > commaN ? ";" : ",";
  const lines: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      if (row.some((c) => c.trim() !== "")) lines.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) lines.push(row);
  if (!lines.length) throw new Error(tr("CSV trống", "The CSV is empty"));
  const head = lines.shift()!.map((h) => h.trim());
  if (head.some((h) => !h) || new Set(head).size !== head.length) throw new Error(tr("Tên cột không hợp lệ", "Invalid column names"));
  const num = (s: string): number | string => {
    const t = s.trim();
    if (t === "" || t === "." || /^na$/i.test(t)) return Number.NaN;
    const v = Number(sep === ";" ? t.replace(",", ".") : t);
    return Number.isFinite(v) ? v : t;
  };
  return {
    columns: head,
    rows: lines.map((l) => Object.fromEntries(head.map((h, j) => [h, num(l[j] || "")]))),
  };
}

export function xuanXingTable(): CsvTable {
  const rows: Row[] = [];
  for (const s of XX) {
    const lndist = Math.log(haversineKm(HANOI, s.cap));
    XX_YEARS.forEach((year, j) => rows.push({ country: s.id, year, fdi: s.v[j]!, lndist }));
  }
  return { columns: ["country", "year", "fdi", "lndist"], rows };
}

/** Xuan & Xing (2008) series with each source country's capital, for the year-by-year globe replay. */
export function xuanXingSeries(): {
  years: number[];
  series: Array<{ id: string; name: string; cap: [number, number]; v: number[] }>;
} {
  return {
    years: XX_YEARS,
    series: XX.map((s) => ({ id: s.id, name: countryName(s.id), cap: s.cap, v: s.v })),
  };
}

export function xuanXingGrid(): { years: number[]; series: Array<{ name: string; v: number[] }> } {
  return {
    years: XX_YEARS,
    series: XX.map((s) => ({ name: countryName(s.id), v: s.v })),
  };
}

export type PanelEstimate = { fits: Array<{ label: string; fit: Fit }>; note: string };

export function estimatePanel(input: {
  rows: Row[];
  y: string;
  xs: string[];
  unit: string;
  year: string;
  yearFE: boolean;
  cluster: boolean;
  yLevel: boolean;
}): PanelEstimate {
  const xs = input.xs.filter((x) => x && x !== input.y);
  if (!xs.length) throw new Error(tr("Chọn ít nhất một biến giải thích.", "Choose at least one explanatory variable."));
  const need = [input.y, ...xs];
  const ok = input.rows.filter((r) => need.every((c) => typeof r[c] === "number" && Number.isFinite(r[c])));
  if (!ok.length) throw new Error(tr("Không còn dòng nào đủ số cho các biến đã chọn.", "No rows have numbers for all the chosen variables."));
  const yearCol = input.yearFE && input.year ? input.year : undefined;
  const clusterOf = (rs: Row[]) => (input.cluster && input.unit ? rs.map((r) => String(r[input.unit])) : undefined);
  const guard = (d: { X: number[][]; names: string[] }) => {
    if (!d.X.length || d.X.length <= d.names.length) throw new Error(tr("Quá ít dòng so với số biến.", "Too few rows for the number of variables."));
  };
  const fits: PanelEstimate["fits"] = [];
  if (input.yLevel) {
    if (ok.some((r) => Number(r[input.y]) < 0)) throw new Error(tr("PPML cần biến không âm", "PPML needs a non-negative outcome"));
    const pos = ok.filter((r) => Number(r[input.y]) > 0);
    if (!pos.length) throw new Error(tr("Không còn quan sát dương để lấy log.", "No positive observations left to take logs of."));
    const dp = design(pos, xs, yearCol);
    const da = design(ok, xs, yearCol);
    guard(dp);
    guard(da);
    fits.push({
      label: `OLS log(${input.y})`,
      fit: ols(pos.map((r) => Math.log(Number(r[input.y]))), dp.X, dp.names, clusterOf(pos)),
    });
    fits.push({
      label: `PPML ${input.y}`,
      fit: ppml(ok.map((r) => Number(r[input.y])), da.X, da.names, clusterOf(ok)),
    });
  } else {
    const d = design(ok, xs, yearCol);
    guard(d);
    fits.push({
      label: `OLS ${input.y}`,
      fit: ols(ok.map((r) => Number(r[input.y])), d.X, d.names, clusterOf(ok)),
    });
  }
  const dropped = [...new Set(fits.flatMap((f) => f.fit.dropped))];
  return { fits, note: dropped.length ? tr(`Đã loại (cộng tuyến hoàn hảo): ${dropped.join(", ")}`, `Dropped (perfect collinearity): ${dropped.join(", ")}`) : "" };
}

export const CSV_TEMPLATE =
  "country,year,fdi,lnfdi_lag,ln_dist,inst_dist,cult_dist,ln_econ_dist,ln_gdp_vn,ln_gdp_partner,openness,experience,corruption,fta\n";

