import assert from "node:assert/strict";
import { test } from "node:test";
import { explainEstimate } from "./explain.ts";
import { estimatePanel } from "./gravity-lab.ts";
import { datasetPanel } from "./pro.ts";

const rows = datasetPanel().map((r) => ({ ...r })) as Array<Record<string, number | string>>;
const columns = Object.keys(rows[0]!);

function run(yLevel: boolean) {
  const est = estimatePanel({
    rows,
    y: "fdi_musd",
    xs: ["ln_dist"],
    unit: "iso3",
    year: "year",
    yearFE: true,
    cluster: true,
    yLevel,
  });
  const input = {
    columns,
    rows,
    y: "fdi_musd",
    xs: ["ln_dist"],
    unit: "iso3",
    year: "year",
    yLevel,
    yearFE: true,
  };
  return explainEstimate(est, input);
}

test("the explanation of a PPML run names the two columns, the distance coefficient and the checks", () => {
  const ex = run(true);
  assert.equal(ex.paragraphs.vi.length, ex.paragraphs.en.length);
  assert.ok(ex.paragraphs.en[0]!.includes("two columns"));
  assert.ok(ex.paragraphs.en[0]!.includes("PPML"));
  assert.ok(ex.paragraphs.en[1]!.startsWith("The distance coefficient (ln_dist)"));
  assert.ok(ex.paragraphs.en.some((p) => p.includes("Model checks") || p.includes("All six")));
  assert.ok(ex.paragraphs.vi[1]!.startsWith("Hệ số khoảng cách (ln_dist)"));
  assert.ok(ex.title.en.startsWith("Lumina reads the results"));
});

test("an OLS-only run explains one column and never mentions PPML as the main column", () => {
  const ex = run(false);
  assert.ok(ex.paragraphs.en[0]!.includes("one OLS column"));
  assert.ok(!ex.paragraphs.en[0]!.includes("PPML"));
});
