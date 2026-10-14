import assert from "node:assert/strict";
import { test } from "node:test";
import { exercises, mark, parseAnswer } from "./exercises.ts";
import { impactOf } from "./gravity-lab.ts";

test("there are six exercises and the answers come from the app's own formulas", () => {
  const ex = exercises();
  assert.equal(ex.length, 6);
  const byId = Object.fromEntries(ex.map((e) => [e.id, e]));
  assert.equal(byId.newton!.answer, 25);
  assert.ok(Math.abs(byId.trade!.answer - 53.6) < 0.1);
  assert.equal(byId.log!.answer, -0.9);
  const geo = impactOf({ a: "JPN", b: "RUS", econPct: 0, inst: 0, open: 0, fta: false }).geoPct;
  assert.equal(byId.distance!.answer, geo);
  assert.ok(geo < -20 && geo > -21.5, String(geo));
  assert.ok(Math.abs(byId.fta!.answer - 174.6) < 0.5, String(byId.fta!.answer));
  assert.ok(Math.abs(byId.longrun!.answer - -0.69) < 0.01, String(byId.longrun!.answer));
});

test("typed answers accept Vietnamese and English formats and a trailing percent", () => {
  assert.equal(parseAnswer("53,6 %"), 53.6);
  assert.equal(parseAnswer("−0,9"), -0.9);
  assert.equal(parseAnswer(" -0.69"), -0.69);
  assert.ok(Number.isNaN(parseAnswer("abc")));
});

test("marking uses the tolerance", () => {
  const ex = exercises();
  const trade = ex.find((e) => e.id === "trade")!;
  assert.equal(mark(trade, "54"), "ok");
  assert.equal(mark(trade, "50"), "no");
  assert.equal(mark(trade, ""), "empty");
});
