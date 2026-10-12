// Clay noir: the falling apple, an open Principia and the Moon held by the same force.
import * as THREE from "three";
import { clay, done, finish, lights, stage } from "./noir.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x0a1112, exposure: 1.1 });
const { scene, renderer } = st;
const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
camera.position.set(0.2, 1.2, 18.5);
camera.lookAt(0.2, 0.1, 0);
lights(scene, { target: new THREE.Vector3(0, -0.5, 0), spotPos: [-7, 10, 7], spot: 900, angle: 0.5, rim: 2.4, fill: 0.3 });

// Table.
const table = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 14), clay(0x3a2a20, 0.95));
table.position.set(0, -3.6, -2);
table.receiveShadow = true;
scene.add(table);
const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), clay(0x142224, 0.98));
wall.position.set(0, 4, -8);
wall.receiveShadow = true;
scene.add(wall);

// Branch from the upper left with leaves.
const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-6.5, 5.6, -1),
  new THREE.Vector3(-4.2, 4.7, -0.5),
  new THREE.Vector3(-2.0, 4.2, 0),
  new THREE.Vector3(0.4, 3.6, 0.4),
]);
const branch = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.16, 16, false), clay(0x5a3d26, 0.95));
branch.castShadow = true;
scene.add(branch);
const leafMat = clay(0x5e8a52, 0.8);
for (const [t, rz, ry] of [[0.25, 0.6, 0.3], [0.45, -0.5, -0.4], [0.62, 0.9, 0.2], [0.8, -0.3, 0.6], [0.95, 0.4, -0.2], [0.55, 2.4, 0.5]]) {
  const p = curve.getPoint(t);
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.6, 32, 16), leafMat);
  leaf.scale.set(1, 0.22, 0.62);
  leaf.position.copy(p).add(new THREE.Vector3(0.25, -0.18, 0.1));
  leaf.rotation.set(0.3, ry, rz);
  leaf.castShadow = true;
  scene.add(leaf);
}

// The apple, mid-fall, with clay motion streaks above it.
function apple(r, color) {
  const geo = new THREE.SphereGeometry(r, 96, 64);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const k = Math.hypot(v.x, v.z) / r;
    v.y -= Math.sign(v.y) * Math.pow(Math.max(0, 1 - k), 2.2) * 0.32 * r * (v.y > 0 ? 1 : 0.55);
    const b = 1 + 0.07 * Math.max(0, v.y / r);
    v.x *= b; v.z *= b;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, clay(color, 0.55));
  m.castShadow = true;
  g.add(m);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 12), clay(0x5a3d26));
  stem.position.y = r * 0.95;
  stem.rotation.z = -0.3;
  g.add(stem);
  return g;
}
const a = apple(0.72, 0xc93b2f);
a.position.set(0.3, 0.9, 0.6);
a.rotation.set(0.2, 0.4, 0.35);
scene.add(a);
for (const [dx, h, o] of [[-0.32, 0.9, 0.5], [0.0, 1.25, 0.75], [0.32, 0.8, 0.5]]) {
  const m = clay(0xe9dcc6, 0.9, { transparent: true, opacity: o });
  const s = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, h, 8, 16), m);
  s.position.set(0.3 + dx, 0.9 + 1.0 + h / 2, 0.6);
  scene.add(s);
}

// The Moon, top right, on a dotted orbit.
const moonTex = (() => {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 256, 256);
  let s = 3;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 40; i++) {
    const x = r() * 256, y = r() * 256, rad = 4 + r() * 16;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, "#5a5a5a");
    gr.addColorStop(0.8, "#7a7a7a");
    gr.addColorStop(1, "#909090");
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, rad, 0, Math.PI * 2);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
})();
const moon = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 48), new THREE.MeshStandardMaterial({ color: 0xe9e1cf, roughness: 0.95, bumpMap: moonTex, bumpScale: 3 }));
moon.position.set(3.6, 3.3, -3);
moon.castShadow = true;
scene.add(moon);
for (let i = 0; i < 22; i++) {
  const t = -0.4 + (i / 22) * 2.6;
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), clay(0xe9dcc6));
  d.position.set(1.0 + Math.cos(t) * 3.6, 1.5 + Math.sin(t) * 1.8, -3);
  scene.add(d);
}

// Open book: two curved pages on a cover, the law pressed into the right page.
const pageTex = (formula) => {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 640;
  const g = c.getContext("2d");
  g.fillStyle = "#efe4cd";
  g.fillRect(0, 0, 512, 640);
  g.fillStyle = "#3a2a20";
  g.textAlign = "center";
  if (formula) {
    g.font = "italic 700 50px 'DejaVu Serif', serif";
    g.fillText("F = G m₁m₂ / r²", 256, 300);
    g.font = "600 36px 'DejaVu Serif', serif";
    g.fillText("PRINCIPIA · 1687", 256, 420);
  } else {
    g.globalAlpha = 0.35;
    for (let y = 120; y < 560; y += 36) g.fillRect(70, y, 372 - (y % 72 ? 60 : 0), 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
function page(side) {
  const geo = new THREE.PlaneGeometry(2.4, 3.0, 40, 4);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const u = (x + 1.2) / 2.4; // 0 at spine for the right page
    p.setZ(i, Math.sin(u * Math.PI) * 0.22 + (1 - u) * 0.05);
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: pageTex(side > 0), roughness: 0.9, bumpMap: moonTex, bumpScale: 0.3, side: THREE.DoubleSide }));
  m.position.x = side * 1.22;
  if (side < 0) m.scale.x = -1;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
const book = new THREE.Group();
const cover = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.14, 3.3), clay(0x6b2a22, 0.8));
cover.position.y = -0.12;
cover.receiveShadow = true;
cover.castShadow = true;
book.add(cover);
const pages = new THREE.Group();
pages.add(page(-1), page(1));
pages.rotation.x = -Math.PI / 2;
pages.position.y = 0.02;
book.add(pages);
book.position.set(-0.4, -3.15, 0.8);
book.rotation.set(0.32, 0.05, 0);
scene.add(book);

// Quill in an inkpot.
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.7, 32), clay(0x1d2a33, 0.4));
pot.position.set(3.3, -2.95, 0.6);
pot.castShadow = true;
scene.add(pot);
const quill = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), clay(0xf3ece1, 0.9));
quill.scale.set(0.22, 2.2, 0.06);
quill.position.set(3.55, -1.4, 0.6);
quill.rotation.z = -0.35;
quill.castShadow = true;
scene.add(quill);

renderer.render(scene, camera);
finish(st, { vignette: 0.8, grain: 0.05 });
done();
