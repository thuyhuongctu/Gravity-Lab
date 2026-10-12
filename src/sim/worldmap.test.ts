import { test } from "node:test";
import assert from "node:assert/strict";
import { fitView, greatCircle, landLonLat, unwrapPath, wrapLon } from "./worldmap.ts";

test("longitudes wrap around the Pacific-centred meridian", () => {
  assert.equal(wrapLon(120), 120);
  assert.equal(wrapLon(-98), 262);
  assert.equal(wrapLon(10), 10);
});

test("paths across the date line stay continuous", () => {
  assert.deepEqual(unwrapPath([170, -170, -160]), [170, 190, 200]);
});

test("Vietnam to the United States crosses the Pacific, eastward", () => {
  const path = greatCircle({ lon: 107.6, lat: 16 }, { lon: -98, lat: 39 });
  assert.ok(Math.abs(path[0]![0] - 107.6) < 1e-6);
  assert.ok(Math.abs(path.at(-1)![0] - 262) < 1e-6);
  for (let i = 1; i < path.length; i++) assert.ok(path[i]![0] >= path[i - 1]![0] - 1e-9);
});

test("land rings decode and leave out Antarctica", () => {
  const rings = landLonLat();
  assert.ok(rings.length > 50);
  for (const r of rings) for (const [, lat] of r) assert.ok(lat >= -60);
});

test("the fitted view frames every point", () => {
  const pts: Array<[number, number]> = [[10, 50], [107.6, 16], [262, 39]];
  const v = fitView(pts, 800, 500, 40);
  for (const [lon, lat] of pts) {
    const x = 400 + (lon - v.lon) * v.scale;
    const y = 250 - (lat - v.lat) * v.scale;
    assert.ok(x >= 0 && x <= 800 && y >= 0 && y <= 500);
  }
});
