import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnose, type DiagnosticInput } from "./diagnostics.ts";

const panel = (over: Partial<DiagnosticInput> = {}): DiagnosticInput => ({
  columns: ["iso3", "year", "fdi_musd", "ln_dist", "ln_gdp"],
  rows: [1990, 1991, 1992, 1993].flatMap((year) => [
    { iso3: "JPN", year, fdi_musd: year === 1990 ? 0 : 100, ln_dist: 8.2, ln_gdp: 10 },
    { iso3: "KOR", year, fdi_musd: 50, ln_dist: 7.9, ln_gdp: 9 },
  ]),
  y: "fdi_musd",
  xs: ["ln_dist", "ln_gdp"],
  unit: "iso3",
  year: "year",
  yLevel: true,
  yearFE: true,
  ...over,
});

const status = (input: DiagnosticInput) =>
  Object.fromEntries(diagnose(input).checks.map((c) => [c.id, c.status]));

test("the Pro panel with PPML and year effects passes, with a warning on consecutive years", () => {
  const r = diagnose(panel());
  assert.deepEqual(status(panel()), {
    mrt: "ok",
    directions: "ok",
    deflation: "ok",
    zeros: "ok",
    interval: "warn",
    domestic: "ok",
  });
  assert.equal(r.fail, 0);
  assert.equal(r.warn, 1);
});

test("OLS on logs with zeros and GDP but no fixed effects fails twice", () => {
  const s = status(panel({ yLevel: false, yearFE: false }));
  assert.equal(s.zeros, "fail");
  assert.equal(s.mrt, "fail");
  assert.equal(s.deflation, "warn");
});

test("averaged and deflated trade columns fail the silver and bronze checks", () => {
  const s = status(
    panel({
      columns: ["exporter", "importer", "year", "trade_avg_real", "ln_dist"],
      rows: [{ exporter: "VNM", importer: "JPN", year: 2000, trade_avg_real: 5, ln_dist: 8 }],
      y: "trade_avg_real",
      xs: ["ln_dist"],
      unit: "",
    }),
  );
  assert.equal(s.directions, "fail");
  assert.equal(s.deflation, "fail");
  assert.equal(s.domestic, "warn");
});

test("four-year intervals and domestic rows pass", () => {
  const rows = [1986, 1990, 1994].flatMap((year) => [
    { exporter: "A", importer: "B", year, trade: 10 },
    { exporter: "A", importer: "A", year, trade: 90 },
  ]);
  const s = status(
    panel({
      columns: ["exporter", "importer", "year", "trade"],
      rows,
      y: "trade",
      xs: [],
      unit: "",
    }),
  );
  assert.equal(s.interval, "ok");
  assert.equal(s.domestic, "ok");
  assert.equal(s.directions, "ok");
});
