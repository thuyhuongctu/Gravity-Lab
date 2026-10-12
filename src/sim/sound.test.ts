import { test } from "node:test";
import assert from "node:assert/strict";
import { orbitPitch, planetTone, snapPentatonic, PLANETS } from "../lib/sound.ts";

test("Earth's year raised 32 octaves is about 136.1 Hz", () => {
  const t = planetTone(365.256);
  assert.equal(t.octaves, 32);
  assert.ok(Math.abs(t.hz - 136.1) < 0.1);
});

test("every planet lands in the 110-220 Hz octave", () => {
  for (const p of PLANETS) {
    const { hz } = planetTone(p.days);
    assert.ok(hz >= 110 && hz < 220, p.id);
  }
});

test("pentatonic snapping keeps A and maps near notes onto the scale", () => {
  assert.equal(snapPentatonic(220), 220);
  assert.ok(Math.abs(snapPentatonic(440) - 440) < 1e-9);
  const cs = 220 * Math.pow(2, 4 / 12);
  assert.ok(Math.abs(snapPentatonic(cs * 1.01) - cs) < 1e-9);
});

test("faster (inner) orbits sing higher, within the audible clamp", () => {
  assert.ok(orbitPitch(2, 1) > orbitPitch(1, 1));
  assert.ok(orbitPitch(1000, 1) <= 1320 * 1.03);
  assert.ok(orbitPitch(0, 1) >= 110);
});
