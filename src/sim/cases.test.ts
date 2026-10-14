import assert from "node:assert/strict";
import { test } from "node:test";
import { CASES, caseById, compare, computeCase, sizeHelps } from "./cases.ts";
import { decodeState, encodeState } from "../lib/shareState.ts";

const near = (a: number, b: number, tol = 0.01) => assert.ok(Math.abs(a - b) < tol, `${a} ≉ ${b}`);

test("case 01 Japan/Korea: distance alone under-predicts, size closes the gap", () => {
  const n = computeCase(caseById("jp-kr"));
  near(n.geo, -0.38, 1e-9);
  near(n.distOnly, 0.896);
  near(n.observed, 1.816);
  near(n.withSize, 2.16);
  assert.equal(compare(n), "above");
  assert.equal(sizeHelps(n), true);
});

test("case 02 Singapore/Korea: adding size makes the fit worse", () => {
  const n = computeCase(caseById("sg-kr"));
  near(n.distOnly, 1.087);
  near(n.observed, 1.472);
  near(n.withSize, 0.339);
  assert.equal(compare(n), "above");
  assert.equal(sizeHelps(n), false);
});

test("every case has exactly one correct step-4 answer and complete bilingual text", () => {
  for (const c of CASES) {
    assert.equal(c.why.choices.filter((x) => x.correct).length, 1, c.id);
    for (const b of [c.nameA, c.nameB, c.question, c.hint, c.level, c.why.prompt]) {
      assert.ok(b[0].length > 0 && b[1].length > 0, c.id);
    }
    computeCase(c); // throws if a series or GDP id is missing
  }
  assert.equal(caseById("nope").id, CASES[0]!.id);
});

test("share state round-trips and rejects junk", () => {
  const s = { room: "trade" as const, view: "globe" as const, gamma: 0.9, pair: "kr", cam: [105.8, 21.0, 2.5] as [number, number, number] };
  const back = decodeState(`#s=${encodeURIComponent(encodeState(s))}`)!;
  assert.equal(back.room, "trade");
  assert.equal(back.view, "globe");
  assert.equal(back.gamma, 0.9);
  assert.equal(back.pair, "kr");
  assert.deepEqual(back.cam, [105.8, 21, 2.5]);

  const lab = decodeState(`#s=${encodeURIComponent(encodeState({ room: "lab", caseId: "sg-kr", step: 3 }))}`)!;
  assert.equal(lab.caseId, "sg-kr");
  assert.equal(lab.step, 3);

  assert.equal(decodeState("#s=r%3Dhack"), null);
  assert.equal(decodeState(""), null);
  const clamped = decodeState(`#s=${encodeURIComponent("r=orbit&g=99&st=-4&p=<script>")}`)!;
  assert.equal(clamped.gamma, 3);
  assert.equal(clamped.step, 1);
  assert.equal(clamped.pair, "scr");
});
