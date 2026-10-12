// Renders the clay app icon (scripts/clay-icon/icon-1024.png) with three.js in a browser.
// Bundle with esbuild (three@0.169) and screenshot the 1024 px canvas; public/icons/* are resized from it.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const SIZE = 1024;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(SIZE, SIZE);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
camera.position.set(0, 0.9, 14.2);
camera.lookAt(0, 0, 0);

// Clay grain: a soft speckle used as a bump map on every material.
function grain(seed = 1) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#808080";
  g.fillRect(0, 0, 512, 512);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000; i++) {
    const v = 100 + rnd() * 70;
    g.fillStyle = `rgba(${v},${v},${v},0.5)`;
    g.beginPath();
    g.arc(rnd() * 512, rnd() * 512, 0.6 + rnd() * 2.2, 0, Math.PI * 2);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}
const bump = grain(7);
const clay = (color, rough = 0.88) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, bumpMap: bump, bumpScale: 1.1 });

// Lights: warm key from upper left, cool fill, hemisphere for soft clay shading.
scene.add(new THREE.HemisphereLight(0xfff1dc, 0x3c6a5e, 1.9));
const key = new THREE.DirectionalLight(0xfff0d8, 1.9);
key.position.set(-3, 5, 11);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.radius = 14;
key.shadow.blurSamples = 25;
key.shadow.camera.left = -6; key.shadow.camera.right = 6; key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
key.shadow.bias = -0.0004;
scene.add(key);
const fill = new THREE.DirectionalLight(0xbfe8dc, 0.7);
fill.position.set(5, -2, 4);
scene.add(fill);

// Clay tile behind everything (the icon background, receives soft shadows).
const tile = new THREE.Mesh(new RoundedBoxGeometry(12, 12, 1, 8, 0.6), clay(0x2f5a4f, 0.95));
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

// A few clay stars.
for (const [x, y, r] of [[-3.0, 2.6, 0.1], [3.1, 2.2, 0.08], [-2.6, -2.9, 0.07], [2.9, -2.7, 0.09]]) {
  const s = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), clay(0xf3ece1));
  s.position.set(x, y, -3.4);
  scene.add(s);
}

renderer.render(scene, camera);
window.done = true;
