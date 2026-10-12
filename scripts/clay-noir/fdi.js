// Clay noir cover for the FDI room: capital, as clay coins, arcing from a source
// economy into a factory in the Mekong Delta on a clay map of Vietnam.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clay, done, finish, lights, stage } from "./noir.js";
import { HOANG_SA, TRUONG_SA, projector, vietnam } from "./vn.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x0b0a1f, exposure: 1.1 });
const { scene, renderer } = st;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
camera.position.set(3.2, 19, 17.5);
camera.lookAt(3.0, 0, 1.2);
lights(scene, { target: new THREE.Vector3(1.5, 0, 0), spotPos: [-12, 14, 6], spot: 2000, angle: 0.6, rim: 1.8, fill: 0.32 });

const sea = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), clay(0x2a2563, 0.92));
sea.rotation.x = -Math.PI / 2;
sea.receiveShadow = true;
scene.add(sea);

const P = projector(106.5, 15.6);
scene.add(vietnam(P, [clay(0xc49563, 0.84), clay(0x9d6f43, 0.9)]));
for (const [lon, lat] of [...HOANG_SA, ...TRUONG_SA]) {
  const p = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), clay(0xc49563));
  p.scale.y = 0.55;
  p.position.set(P.X(lon), 0.03, P.Z(lat));
  p.castShadow = true;
  scene.add(p);
}

// A small clay factory in the Mekong Delta.
const fx = P.X(105.9), fz = P.Z(10.1);
const factory = new THREE.Group();
const hall = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.6, 0.8, 3, 0.08), clay(0xe9dcc6, 0.85));
hall.position.y = 0.72;
factory.add(hall);
for (let i = 0; i < 3; i++) {
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 3), clay(0x006687, 0.8));
  roof.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  roof.position.set(-0.4 + i * 0.4, 1.08, 0);
  factory.add(roof);
}
const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 1.0, 16), clay(0xc93b2f, 0.8));
chimney.position.set(0.48, 1.25, -0.25);
factory.add(chimney);
factory.traverse((m) => (m.castShadow = m.receiveShadow = true));
factory.position.set(fx, 0, fz);
scene.add(factory);

// Source economy: a pedestal of towers to the east.
const sx = 9.6, sz = 1.4;
const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, 0.7, 64), clay(0x3a2a20, 0.9));
ped.position.set(sx, 0.35, sz);
ped.castShadow = ped.receiveShadow = true;
scene.add(ped);
let s = 21;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 9; i++) {
  const a = rnd() * Math.PI * 2, d = rnd() * 1.1, h = 0.6 + rnd() * 1.8;
  const b = new THREE.Mesh(new RoundedBoxGeometry(0.42, h, 0.42, 3, 0.06), clay([0xe9dcc6, 0x7fd3dc, 0xc49563][i % 3], 0.85));
  b.position.set(sx + Math.cos(a) * d, 0.7 + h / 2, sz + Math.sin(a) * d);
  b.castShadow = b.receiveShadow = true;
  scene.add(b);
}

// Coins along the arc, from the source into the factory.
const arc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx - 0.8, 2.6, sz), new THREE.Vector3((sx + fx) / 2, 6.5, (sz + fz) / 2), new THREE.Vector3(fx + 0.3, 1.7, fz));
const gold = clay(0xf0b545, 0.45, { emissive: 0x3a2400 });
for (let i = 0; i < 15; i++) {
  const t = 0.03 + (i / 14) * 0.9;
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.08, 40), gold);
  c.position.copy(arc.getPoint(t));
  c.rotation.set(Math.PI / 2 - 0.5 + i * 0.25, i * 0.4, 0.3);
  c.castShadow = true;
  scene.add(c);
}

renderer.render(scene, camera);
finish(st, { vignette: 0.78, grain: 0.05 });
done();
