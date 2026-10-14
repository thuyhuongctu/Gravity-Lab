/**
 * Simulated data for the formula bridge (steps 5 and 6).
 * Deterministic: the same seed always gives the same draw, so the pictures are stable
 * across renders and the tests never flake.
 */
import { ols, ppml } from "./gravity-lab.ts";

export const TRUE_GAMMA = 0.9;

/** Small seeded generator (mulberry32). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rnd: () => number): number {
  return Math.sqrt(-2 * Math.log(rnd() || 1e-9)) * Math.cos(2 * Math.PI * rnd());
}

/* ------------------------------------------------------------------ */
/* Step 5: multilateral resistance                                      */
/* ------------------------------------------------------------------ */

export type MrtDraw = {
  /** Which of the 24 countries sit far from the centre of the world. */
  remote: boolean[];
  pairs: Array<{ i: number; j: number; lnD: number; z: number }>;
};

export const MRT_COUNTRIES = 24;

/** 24 countries on a plane: 14 central, 10 remote; all 552 directed pairs. */
export function mrtDraw(seed: number): MrtDraw {
  const rnd = seeded(seed);
  const c = Array.from({ length: MRT_COUNTRIES }, (_, i) => {
    const remote = i >= 14;
    const r = remote ? 2.2 + rnd() * 2 : 0.2 + rnd() * 0.9;
    const t = rnd() * 2 * Math.PI;
    return { x: r * Math.cos(t), y: r * Math.sin(t), remote };
  });
  const pairs: MrtDraw["pairs"] = [];
  for (let i = 0; i < MRT_COUNTRIES; i++) {
    for (let j = 0; j < MRT_COUNTRIES; j++) {
      if (i === j) continue;
      const dist = Math.max(0.15, Math.hypot(c[i]!.x - c[j]!.x, c[i]!.y - c[j]!.y));
      pairs.push({ i, j, lnD: Math.log(1500 * dist), z: gaussian(rnd) });
    }
  }
  return { remote: c.map((k) => k.remote), pairs };
}

export type MrtFit = {
  /** Raw ln D and ln T per pair. */
  x: number[];
  y: number[];
  /** The same after removing exporter and importer means (means added back for plotting). */
  xFe: number[];
  yFe: number[];
  gammaOls: number;
  gammaFe: number;
};

/**
 * ln T = 9 + a_i + a_j − γ ln D + noise, where a_k grows with country k's remoteness
 * (its mean log distance to everyone else) scaled by `kappa`. With kappa = 0 there is
 * no multilateral resistance and plain OLS is fine.
 */
export function mrtFit(draw: MrtDraw, kappa: number, gamma = TRUE_GAMMA): MrtFit {
  const n = MRT_COUNTRIES;
  const remoteness = new Array<number>(n).fill(0);
  draw.pairs.forEach((p) => {
    remoteness[p.i]! += p.lnD / (n - 1);
  });
  const mean = remoteness.reduce((s, v) => s + v, 0) / n;
  const a = remoteness.map((r) => kappa * 0.5 * (r - mean));
  const x = draw.pairs.map((p) => p.lnD);
  const y = draw.pairs.map((p) => 9 + a[p.i]! + a[p.j]! - gamma * p.lnD + 0.35 * p.z);
  const gammaOls = -slope(x, y);
  const xt = twoWayDemean(draw, x);
  const yt = twoWayDemean(draw, y);
  const gammaFe = -slope(xt, yt);
  const mx = avg(x);
  const my = avg(y);
  return { x, y, xFe: xt.map((v) => v + mx), yFe: yt.map((v) => v + my), gammaOls, gammaFe };
}

/* ------------------------------------------------------------------ */
/* Step 6: zeros and heteroskedasticity                                 */
/* ------------------------------------------------------------------ */

export type PpmlDraw = Array<{ u: number; v: number; z: number }>;

export function ppmlDraw(seed: number, n = 400): PpmlDraw {
  const rnd = seeded(seed);
  return Array.from({ length: n }, () => ({ u: rnd(), v: rnd(), z: gaussian(rnd) }));
}

export type PpmlSample = Array<{ lnD: number; T: number }>;

export const PPML_LN_D_MIN = Math.log(700);
export const PPML_LN_D_MAX = Math.log(16000);

/**
 * T = 100 · (D / 1000)^−γ · η with E[η | D] = 1. `het` (0–1) makes the spread of η grow
 * with distance; `zeroShare` (0–0.4) is the share of pairs set to zero, more often far away.
 */
export function ppmlSample(
  draw: PpmlDraw,
  zeroShare: number,
  het: number,
  gamma = TRUE_GAMMA,
): PpmlSample {
  return draw.map(({ u, v, z }) => {
    const lnD = PPML_LN_D_MIN + u * (PPML_LN_D_MAX - PPML_LN_D_MIN);
    const s2 = 0.15 + het * 2.2 * u;
    const mu = 100 * Math.exp(-gamma * (lnD - Math.log(1000)));
    const p = zeroShare * (0.4 + 1.2 * u);
    const T = mu * Math.exp(Math.sqrt(s2) * z - s2 / 2);
    return { lnD, T: v < p ? 0 : T / (1 - p) };
  });
}

export type PpmlFit = {
  gammaOls: number;
  gammaPpml: number;
  /** Fitted T at a given ln D, for drawing the two curves. */
  olsCurve: (lnD: number) => number;
  ppmlCurve: (lnD: number) => number;
  nPositive: number;
};

export function ppmlFit(sample: PpmlSample): PpmlFit {
  const centre = Math.log(3000);
  const pos = sample.filter((d) => d.T > 0);
  const o = ols(
    pos.map((d) => Math.log(d.T)),
    pos.map((d) => [1, d.lnD - centre]),
    ["cons", "ln_dist"],
  );
  const p = ppml(
    sample.map((d) => d.T),
    sample.map((d) => [1, d.lnD - centre]),
    ["cons", "ln_dist"],
  );
  const coef = (fit: typeof o, name: string) => fit.coef.find((c) => c.name === name)!.b;
  const aO = coef(o, "cons");
  const bO = coef(o, "ln_dist");
  const aP = coef(p, "cons");
  const bP = coef(p, "ln_dist");
  return {
    gammaOls: -bO,
    gammaPpml: -bP,
    olsCurve: (lnD) => Math.exp(aO + bO * (lnD - centre)),
    ppmlCurve: (lnD) => Math.exp(aP + bP * (lnD - centre)),
    nPositive: pos.length,
  };
}

/* ------------------------------------------------------------------ */
/* helpers                                                              */
/* ------------------------------------------------------------------ */

function avg(v: number[]): number {
  return v.reduce((s, x) => s + x, 0) / v.length;
}

function slope(xs: number[], ys: number[]): number {
  const mx = avg(xs);
  const my = avg(ys);
  let sxy = 0;
  let sxx = 0;
  xs.forEach((x, i) => {
    sxy += (x - mx) * (ys[i]! - my);
    sxx += (x - mx) ** 2;
  });
  return sxy / sxx;
}

/** Remove exporter and importer means by alternating projections (30 sweeps). */
function twoWayDemean(draw: MrtDraw, v: number[]): number[] {
  const n = MRT_COUNTRIES;
  let r = v.slice();
  for (let it = 0; it < 30; it++) {
    for (const key of ["i", "j"] as const) {
      const sum = new Array<number>(n).fill(0);
      const cnt = new Array<number>(n).fill(0);
      draw.pairs.forEach((p, q) => {
        sum[p[key]]! += r[q]!;
        cnt[p[key]]! += 1;
      });
      r = r.map((x, q) => x - sum[draw.pairs[q]![key]]! / cnt[draw.pairs[q]![key]]!);
    }
  }
  return r;
}
