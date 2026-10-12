// Clay noir cover for the Orbit room: a glowing clay sun, planets on tilted clay rings, a comet.
import * as THREE from "three";
import { clay, done, finish, lights, stage } from "./noir.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x070d0f, exposure: 1.05 });
const { scene, renderer } = st;
const camera = new THREE.PerspectiveCamera(34, W / H, 0.1, 100);
camera.position.set(0, 5.5, 15);
camera.lookAt(0, -0.3, 0);
lights(scene, { spotPos: [-8, 12, 6], spot: 500, angle: 0.6, rim: 2.0, fill: 0.25 });

const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), clay(0x0f1d20, 0.98));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2.2;
floor.receiveShadow = true;
scene.add(floor);

const sun = new THREE.Mesh(new THREE.SphereGeometry(1.35, 96, 64), clay(0xf0a040, 0.6, { emissive: 0xe0661a, emissiveIntensity: 1.1 }));
scene.add(sun);
const sunLight = new THREE.PointLight(0xffa24a, 60, 18, 1.6);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
scene.add(sunLight);
const halo = new THREE.Mesh(new THREE.SphereGeometry(1.9, 48, 32), new THREE.MeshBasicMaterial({ color: 0xff8a2a, transparent: true, opacity: 0.12 }));
scene.add(halo);

const tilt = new THREE.Group();
tilt.rotation.set(0.32, 0, -0.12);
scene.add(tilt);
const planets = [
  [2.6, 0.26, 0x7fd3dc, 0.6],
  [4.0, 0.42, 0xc49563, 2.2],
  [5.6, 0.34, 0xe0a090, 4.1],
  [7.2, 0.58, 0xd8c8a8, 5.3],
];
for (const [r, size, color, a] of planets) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 12, 220), clay(0x5c7d80, 0.85));
  ring.rotation.x = Math.PI / 2;
  ring.receiveShadow = true;
  tilt.add(ring);
  const p = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 48), clay(color, 0.8));
  p.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
  p.castShadow = true;
  p.receiveShadow = true;
  tilt.add(p);
  if (size > 0.5) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(size * 1.6, 0.06, 12, 96), clay(0xb8a07a, 0.8));
    band.position.copy(p.position);
    band.rotation.set(Math.PI / 2 - 0.4, 0.2, 0);
    band.castShadow = true;
    tilt.add(band);
  }
}

// Comet: a clay head with a tapering trail of beads.
for (let i = 0; i < 14; i++) {
  const t = i / 13;
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.22 * (1 - t * 0.85), 24, 16), clay(0xe9f3f3, 0.7, { transparent: true, opacity: 1 - t * 0.8 }));
  b.position.set(-5.2 - t * 3.2, 2.9 + t * 1.4, -1.5 - t * 0.6);
  scene.add(b);
}

// Starfield of clay crumbs.
let s = 9;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 120; i++) {
  const d = new THREE.Mesh(new THREE.SphereGeometry(0.03 + rnd() * 0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xe9dcc6 }));
  d.position.set((rnd() - 0.5) * 40, 1 + rnd() * 12, -12 - rnd() * 8);
  scene.add(d);
}

renderer.render(scene, camera);
finish(st, { vignette: 0.75, grain: 0.05 });
done();
