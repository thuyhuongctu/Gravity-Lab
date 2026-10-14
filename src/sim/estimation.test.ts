import assert from "node:assert/strict";
import { test } from "node:test";
import { ols, ppml } from "./gravity-lab.ts";

// ols/ppml take the design matrix as is, so the constant is an explicit first column.
const coef = (fit: { coef: Array<{ name: string; b: number }> }, name: string) => fit.coef.find((c) => c.name === name)!.b;

const xs = Array.from({ length: 40 }, (_, i) => Math.log(700) + (i / 39) * (Math.log(16000) - Math.log(700)));
const mu = (x: number) => Math.exp(2 - 0.9 * x);

test("PPML and OLS on logs both recover gamma exactly on noiseless data", () => {
  const y = xs.map(mu);
  const p = ppml(y, xs.map((x) => [1, x]), ["cons", "ln_dist"]);
  const o = ols(y.map(Math.log), xs.map((x) => [1, x]), ["cons", "ln_dist"]);
  assert.ok(Math.abs(coef(p, "ln_dist") + 0.9) < 1e-6, String(coef(p, "ln_dist")));
  assert.ok(Math.abs(coef(o, "ln_dist") + 0.9) < 1e-9, String(coef(o, "ln_dist")));
});

test("PPML stays exact when the spread of the error grows with distance; OLS on logs does not", () => {
  // Two draws per distance with E[eta | x] = 1 but a spread that widens with x.
  const X: number[] = [], Y: number[] = [];
  xs.forEach((x, i) => {
    const s = 0.1 + 0.8 * (i / 39);
    for (const eta of [1 - s, 1 + s]) { X.push(x); Y.push(mu(x) * eta); }
  });
  const p = coef(ppml(Y, X.map((x) => [1, x]), ["cons", "ln_dist"]), "ln_dist");
  const o = coef(ols(Y.map(Math.log), X.map((x) => [1, x]), ["cons", "ln_dist"]), "ln_dist");
  assert.ok(Math.abs(p + 0.9) < 1e-6, `PPML ${p}`);
  assert.ok(o < -0.95, `OLS on logs should overstate distance, got ${o}`);
});

test("PPML keeps zero flows that OLS on logs must drop", () => {
  const y = xs.map((x, i) => (i % 5 === 4 ? 0 : mu(x) * 1.25));
  const fit = ppml(y, xs.map((x) => [1, x]), ["cons", "ln_dist"]);
  assert.equal(fit.n, xs.length);
  const pos = y.map((v, i) => [v, xs[i]!] as const).filter(([v]) => v > 0);
  const o = ols(pos.map(([v]) => Math.log(v)), pos.map(([, x]) => [1, x]), ["cons", "ln_dist"]);
  assert.equal(o.n, xs.length - 8);
});
