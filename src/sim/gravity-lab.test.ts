import assert from "node:assert/strict";
import { test } from "node:test";
import { impactOf, kmFromHanoi, pctChange, xuanXingSeries } from "./gravity-lab.ts";

test("distance-only impact follows (kmB / kmA)^beta - 1 with Model 8's beta", () => {
  const imp = impactOf({ a: "JPN", b: "RUS", econPct: 0, inst: 0, open: 0, fta: false });
  const expected = (Math.pow(kmFromHanoi("RUS") / kmFromHanoi("JPN"), -0.38) - 1) * 100;
  assert.ok(Math.abs(imp.geoPct - expected) < 1e-9);
  assert.ok(Math.abs(imp.geoPct - -20.7) < 0.1, String(imp.geoPct));
});

test("an FTA effect is exp(beta) - 1, not beta x 100", () => {
  assert.ok(Math.abs(pctChange(1.01, 1) - (Math.exp(1.01) - 1) * 100) < 1e-9);
});

test("the Xuan & Xing replay series is complete and has zero years", () => {
  const { years, series } = xuanXingSeries();
  assert.equal(years.length, 15);
  assert.equal(series.length, 10);
  for (const s of series) assert.equal(s.v.length, years.length);
  const zeros1990 = series.filter((s) => s.v[0] === 0).length;
  assert.equal(zeros1990, 7);
  const nld = series.find((s) => s.id === "NLD")!;
  assert.equal(nld.v[years.indexOf(1998)], 441);
});
