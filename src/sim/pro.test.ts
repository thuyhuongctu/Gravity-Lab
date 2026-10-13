import assert from "node:assert/strict";
import { test } from "node:test";
import { crc32, datasetCSV, datasetDo, datasetPanel, draftFromEstimate, draftFromModel, draftToDocx, draftToLatex, interpret, kindOf, zipStore } from "./pro.ts";
import { estimatePanel, xuanXingTable } from "./gravity-lab.ts";

test("the panel has 10 partners x 15 years with zero years kept and distances filled", () => {
  const rows = datasetPanel();
  assert.equal(rows.length, 150);
  assert.equal(new Set(rows.map((r) => r.iso3)).size, 10);
  assert.ok(rows.filter((r) => r.fdi_zero === 1).length > 10);
  for (const r of rows) {
    assert.ok(r.dist_km > 500 && r.dist_km < 20000, `${r.iso3} ${r.dist_km}`);
    assert.ok(Math.abs(Math.log(r.dist_km) - r.ln_dist) < 0.01);
  }
  const csv = datasetCSV();
  assert.equal(csv.split("\n")[0], "iso3,partner,year,fdi_musd,fdi_zero,dist_km,ln_dist");
  assert.equal(csv.trim().split("\n").length, 151);
  assert.match(datasetDo(), /xtset partner_id year/);
});

test("variable kinds from names", () => {
  assert.equal(kindOf("ln_dist"), "log");
  assert.equal(kindOf("lndist"), "log");
  assert.equal(kindOf("lnfdi_lag"), "log");
  assert.equal(kindOf("fta"), "dummy");
  assert.equal(kindOf("openness"), "unit");
  assert.equal(kindOf("lat"), "unit");
});

test("interpretation uses exp(b) - 1 for dummies and b for logs", () => {
  const en = interpret("fta", "dummy", 1.01, 0.28, "en");
  assert.match(en, /174\.6%/);
  assert.match(en, /1% level/);
  const vi = interpret("khoảng cách", "log", -0.38, 0.19, "vi");
  assert.match(vi, /0,38%/);
  assert.match(vi, /mức 5%/);
});

test("the published Model 8 draft carries stars, stats and references", () => {
  const d = draftFromModel(7);
  assert.equal(d.heads.length, 1);
  const fta = d.rows.find((r) => r.label.en === "Free trade area")!;
  assert.equal(fta.cells[0]!.stars, "***");
  assert.equal(d.stats[0]!.values[0], "159");
  assert.ok(d.refs.some((r) => r.startsWith("Phan, A. T., & Do, T. H. (2019)")));
  assert.ok(d.refs.some((r) => r.startsWith("Santos Silva")));
  const tex = draftToLatex(d);
  assert.match(tex, /\\begin\{tabular\}\{lc\}/);
  assert.match(tex, /1\.010\$\^\{\*\*\*\}\$/);
  assert.match(tex, /\\item Phan, A\. T\./);
});

test("an estimate on the Xuan & Xing panel becomes a two-column draft and a valid docx zip", () => {
  const t = xuanXingTable();
  const est = estimatePanel({ rows: t.rows, y: "fdi", xs: ["lndist"], unit: "country", year: "year", yearFE: true, cluster: true, yLevel: true });
  const d = draftFromEstimate(est, { y: "fdi", yearFE: true, cluster: true, unit: "country" });
  assert.deepEqual(d.heads, ["OLS log(fdi)", "PPML fdi"]);
  assert.ok(d.rows.some((r) => r.label.en === "lndist"));
  assert.equal(d.rows[d.rows.length - 1]!.label.en, "Constant");
  assert.ok(!d.rows.some((r) => r.label.en.includes("=")));
  assert.equal(d.paragraphs.vi.length, 1);
  assert.equal(d.paragraphs.en.length, 1);
  const docx = draftToDocx(d);
  assert.equal(docx[0], 0x50);
  assert.equal(docx[1], 0x4b);
  const text = new TextDecoder("latin1").decode(docx);
  assert.ok(text.includes("word/document.xml"));
  assert.ok(text.includes("[Content_Types].xml"));
  assert.ok(text.includes("Gravity-model estimates"));
  // End-of-central-directory record is the last 22 bytes.
  assert.equal(docx[docx.length - 22], 0x50);
  assert.equal(docx[docx.length - 21], 0x4b);
  assert.equal(docx[docx.length - 20], 0x05);
  assert.equal(docx[docx.length - 19], 0x06);
});

test("crc32 and the store-only zip match the reference values", () => {
  assert.equal(crc32(new TextEncoder().encode("123456789")), 0xcbf43926);
  const z = zipStore([{ name: "a.txt", data: new TextEncoder().encode("hi") }]);
  // local header + name + data + central header + name + eocd
  assert.equal(z.length, 30 + 5 + 2 + 46 + 5 + 22);
});
