// Clay-noir app icon: the clay apple and its orbit under a single spotlight.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clay, done, finish, lights, stage } from "./noir.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x0b0a1f, exposure: 1.15 });
const { scene, renderer } = st;
scene.fog = null;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0.9, 14.2);
camera.lookAt(0, 0, 0);
lights(scene, { target: new THREE.Vector3(0, 0, 0), spotPos: [-5, 7, 10], spot: 520, angle: 0.55, rim: 3.2, fill: 0.35 });

const tile = new THREE.Mesh(new RoundedBoxGeometry(12, 12, 1, 8, 0.6), clay(0x2b2668, 0.95));
tile.position.z = -4.2;
tile.receiveShadow = true;
scene.add(tile);

// The apple: a sphere pinched at the poles, with a stem and a leaf.
const appleGeo = new THREE.SphereGeometry(1.32, 128, 96);
{
  const p = appleGeo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = Math.hypot(v.x, v.z) / 1.32; // 0 at the poles, 1 at the equator
    const top = v.y > 0 ? 1 : 0.55;
    v.y -= Math.sign(v.y) * Math.pow(Math.max(0, 1 - r), 2.2) * 0.42 * top; // dimples at the stem and the base
    const bulge = 1 + 0.07 * Math.max(0, v.y / 1.32); // apples are broader at the shoulders
    v.x *= bulge; v.z *= bulge;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  appleGeo.computeVertexNormals();
}
const appleGroup = new THREE.Group();
const apple = new THREE.Mesh(appleGeo, clay(0xd04a3c, 0.62));
apple.castShadow = true;
appleGroup.add(apple);
const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.62, 16), clay(0x6b4a2b));
stem.position.set(0.04, 1.18, 0);
stem.rotation.z = -0.25;
stem.castShadow = true;
appleGroup.add(stem);
const leafShape = new THREE.Shape();
leafShape.moveTo(0, 0);
leafShape.quadraticCurveTo(0.42, 0.28, 0.9, 0);
leafShape.quadraticCurveTo(0.42, -0.28, 0, 0);
const leaf = new THREE.Mesh(
  new THREE.ExtrudeGeometry(leafShape, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4 }),
  clay(0x5fa66a),
);
leaf.position.set(0.12, 1.36, 0.05);
leaf.rotation.set(0.3, -0.2, 0.42);
leaf.castShadow = true;
appleGroup.add(leaf);
appleGroup.rotation.set(0.12, -0.35, 0.05);
appleGroup.position.y = 0.18;
scene.add(appleGroup);

// Orbit: a clay tube ring, tilted, with a cream moon riding on it.
const orbitGroup = new THREE.Group();
const ring = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.16, 32, 200), clay(0x86cdb8, 0.8));
ring.castShadow = true;
orbitGroup.add(ring);
const moon = new THREE.Mesh(new THREE.SphereGeometry(0.42, 64, 48), clay(0xf1e6d3, 0.9));
const a = -0.38;
moon.position.set(2.35 * Math.cos(a), 2.35 * Math.sin(a), 0);
moon.castShadow = true;
orbitGroup.add(moon);
orbitGroup.rotation.set(Math.PI / 2 - 0.42, 0, -0.3);
orbitGroup.position.y = -0.22;
scene.add(orbitGroup);

// Clay stars catching the edge of the light.
for (const [x, y, r] of [[-3.0, 2.6, 0.1], [3.1, 2.2, 0.08], [-2.6, -2.9, 0.07], [2.9, -2.7, 0.09]]) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), clay(0xffd58a, 0.6, { emissive: 0x6a4a10 }));
  s.position.set(x, y, -3.4);
  scene.add(s);
}

renderer.render(scene, camera);
finish(st, { vignette: 0.6, grain: 0.03 });
done();
