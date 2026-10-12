import assert from "node:assert/strict";
import { test } from "node:test";
import { angleBetween, arcPoints, landRings, lonDelta, project, rotate, toVec } from "./globe.ts";

const close = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test("the view centre projects to the middle of the disc, facing the camera", () => {
  const view = { lon: 105.85, lat: 21.03 };
  const [x, y, z] = rotate(toVec(view.lon, view.lat), view);
  close(x, 0);
  close(y, 0);
  close(z, 1);
});

test("north is up and east is right", () => {
  const view = { lon: 105, lat: 10 };
  assert.ok(project(toVec(105, 30), view).y < 0);
  assert.ok(project(toVec(125, 10), view).x > 0);
});

test("the far side of the globe is hidden", () => {
  assert.equal(project(toVec(-75, -21), { lon: 105, lat: 21 }).front, false);
});

test("arcs start and end on the two points and bow above the surface", () => {
  const a = toVec(105.85, 21.03);
  const b = toVec(139.65, 35.68);
  const pts = arcPoints(a, b, 20);
  close(angleBetween(pts[0]!, a), 0, 1e-6);
  close(angleBetween(pts[20]!, b), 0, 1e-6);
  const mid = pts[10]!;
  assert.ok(Math.hypot(...mid) > 1);
});

test("great-circle angle matches the haversine distance Hanoi to Tokyo (~3,660 km)", () => {
  const km = angleBetween(toVec(105.8542, 21.0285), toVec(139.6503, 35.6762)) * 6371.0088;
  assert.ok(km > 3600 && km < 3720, String(km));
});

test("longitude differences wrap across the date line", () => {
  assert.equal(lonDelta(170, -170), 20);
  assert.equal(lonDelta(-170, 170), -20);
});

test("land outlines decode to unit vectors", () => {
  const rings = landRings();
  assert.ok(rings.length > 300);
  for (const v of rings[0]!) close(Math.hypot(...v), 1, 1e-9);
});
