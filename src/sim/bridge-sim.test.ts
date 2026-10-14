import assert from "node:assert/strict";
import { test } from "node:test";
import { mrtDraw, mrtFit, ppmlDraw, ppmlFit, ppmlSample, TRUE_GAMMA } from "./bridge-sim.ts";

const near = (v: number, target: number, tol: number, msg: string) =>
  assert.ok(Math.abs(v - target) <= tol, `${msg}: ${v.toFixed(3)} vs ${target} ± ${tol}`);

test("seeded draws are reproducible", () => {
  assert.deepEqual(mrtDraw(3).pairs[10], mrtDraw(3).pairs[10]);
  assert.deepEqual(ppmlDraw(7)[5], ppmlDraw(7)[5]);
  assert.equal(mrtDraw(3).pairs.length, 24 * 23);
});

test("without multilateral resistance, OLS and fixed effects both recover gamma", () => {
  const fit = mrtFit(mrtDraw(3), 0);
  near(fit.gammaOls, TRUE_GAMMA, 0.08, "OLS");
  near(fit.gammaFe, TRUE_GAMMA, 0.08, "FE");
});

test("with strong multilateral resistance, fixed effects beat plain OLS", () => {
  const fit = mrtFit(mrtDraw(3), 2);
  const errOls = Math.abs(fit.gammaOls - TRUE_GAMMA);
  const errFe = Math.abs(fit.gammaFe - TRUE_GAMMA);
  assert.ok(errFe < errOls, `FE ${errFe.toFixed(3)} should beat OLS ${errOls.toFixed(3)}`);
  near(fit.gammaFe, TRUE_GAMMA, 0.08, "FE");
});

test("with no zeros and even errors, OLS on logs and PPML agree with the true gamma", () => {
  const fit = ppmlFit(ppmlSample(ppmlDraw(7), 0, 0));
  near(fit.gammaOls, TRUE_GAMMA, 0.1, "OLS");
  near(fit.gammaPpml, TRUE_GAMMA, 0.1, "PPML");
  assert.equal(fit.nPositive, 400);
});

test("zeros that cluster far away pull OLS on logs below PPML", () => {
  const sample = ppmlSample(ppmlDraw(7), 0.4, 0);
  const fit = ppmlFit(sample);
  assert.ok(fit.nPositive < 400, "some zeros were drawn");
  assert.ok(
    fit.gammaOls < fit.gammaPpml,
    `OLS ${fit.gammaOls.toFixed(3)} < PPML ${fit.gammaPpml.toFixed(3)}`,
  );
  near(fit.gammaPpml, TRUE_GAMMA, 0.12, "PPML");
});
