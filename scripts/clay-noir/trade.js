// Clay noir cover for the Trade room: two economies on pedestals, size by GDP,
// a bridge of clay containers between them, thinner as distance grows.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clay, done, finish, lights, stage } from "./noir.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x0a1112, exposure: 1.1 });
const { scene, renderer } = st;
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.set(0, 5.2, 16);
camera.lookAt(0, 0.4, 0);
lights(scene, { target: new THREE.Vector3(0, 0, 0), spotPos: [-6, 13, 8], spot: 900, angle: 0.62, rim: 2.2, fill: 0.3 });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), clay(0x17282b, 0.96));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1.6;
floor.receiveShadow = true;
scene.add(floor);

function economy(x, r, color, rows, tall) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, 1.0, 64), clay(0x3a2a20, 0.9));
  base.position.y = -1.1;
  base.castShadow = base.receiveShadow = true;
  g.add(base);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.2, 64), clay(color, 0.85));
  top.position.y = -0.5;
  top.castShadow = top.receiveShadow = true;
  g.add(top);
  // Stacked city blocks: the size of the economy.
  let s = Math.abs(Math.round(x * 13)) + 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < rows; i++) {
    const a = rnd() * Math.PI * 2, d = rnd() * r * 0.7, h = 0.35 + rnd() * tall;
    const b = new THREE.Mesh(new RoundedBoxGeometry(0.42, h, 0.42, 3, 0.06), clay([0xe9dcc6, 0xc49563, 0x7fd3dc][i % 3], 0.85));
    b.position.set(Math.cos(a) * d, -0.4 + h / 2, Math.sin(a) * d);
    b.castShadow = b.receiveShadow = true;
    g.add(b);
  }
  g.position.x = x;
  scene.add(g);
  return g;
}
economy(-4.6, 2.0, 0x5e8a52, 18, 2.6);
economy(4.9, 1.35, 0xc93b2f, 6, 1.0);

// The flow: containers along an arc from i to j and back.
const colors = [0xe8762d, 0x006687, 0xffd58a, 0xc93b2f, 0x7fd3dc];
const arc = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-3.0, 0.6, 0.3), new THREE.Vector3(0, 4.2, 0.6), new THREE.Vector3(3.8, 0.4, 0.3));
for (let i = 0; i < 13; i++) {
  const t = 0.04 + (i / 12) * 0.92;
  const p = arc.getPoint(t), tan = arc.getTangent(t);
  const c = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.32, 0.3, 3, 0.05), clay(colors[i % colors.length], 0.75));
  c.position.copy(p);
  c.rotation.z = Math.atan2(tan.y, tan.x);
  c.castShadow = true;
  scene.add(c);
}
const back = new THREE.QuadraticBezierCurve3(new THREE.Vector3(3.8, -0.1, 1.4), new THREE.Vector3(0, 1.8, 2.4), new THREE.Vector3(-3.0, 0.0, 1.4));
for (let i = 0; i < 8; i++) {
  const t = 0.06 + (i / 7) * 0.88;
  const p = back.getPoint(t), tan = back.getTangent(t);
  const c = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.26, 0.26, 3, 0.05), clay(colors[(i + 2) % colors.length], 0.75));
  c.position.copy(p);
  c.rotation.z = Math.atan2(tan.y, tan.x) + Math.PI;
  c.castShadow = true;
  scene.add(c);
}

// The distance between them, as a dashed clay ruler on the floor.
for (let i = 0; i < 16; i++) {
  const d = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.06, 0.1, 2, 0.02), clay(0xe9dcc6, 0.9));
  d.position.set(-2.5 + i * 0.36, -1.55, 2.9);
  if (i % 2 === 0) scene.add(d);
}

renderer.render(scene, camera);
finish(st, { vignette: 0.78, grain: 0.05 });
done();
