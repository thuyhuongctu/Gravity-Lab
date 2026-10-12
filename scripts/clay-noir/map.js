// Clay-noir map of Vietnam, with the Hoàng Sa and Trường Sa archipelagos.
// Mainland: Natural Earth 1:50m (public domain); islands placed from their coordinates.
import * as THREE from "three";
import { HOANG_SA, TRUONG_SA, projector, vietnam } from "./vn.js";
import { clay, done, finish, lights, stage } from "./noir.js";

const W = window.W, H = window.H;
const st = stage({ width: W, height: H, bg: 0x0b0a1f, exposure: 1.05 });
const { scene, renderer } = st;

const { X, Z } = projector(108.6, 15.2);

const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
camera.position.set(1.2, 21, 17);
camera.lookAt(0.6, 0, 0.6);

lights(scene, { target: new THREE.Vector3(0.5, 0, 0.5), spotPos: [-15, 13, 4], spot: 2600, angle: 0.62, rim: 1.6, fill: 0.32 });

// The sea: a dark clay slab with low ripples.
const seaGeo = new THREE.PlaneGeometry(60, 50, 240, 200);
{
  const p = seaGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, 0.045 * Math.sin(x * 2.1 + y * 0.7) + 0.03 * Math.sin(y * 2.7 - x * 0.4));
  }
  seaGeo.computeVertexNormals();
}
const sea = new THREE.Mesh(seaGeo, clay(0x2a2563, 0.92));
sea.rotation.x = -Math.PI / 2;
sea.receiveShadow = true;
scene.add(sea);

// Land: pressed clay with a soft bevel.
const land = clay(0xc49563, 0.84);
scene.add(vietnam({ X, Z }, [land, clay(0x9d6f43, 0.9)]));

// Archipelagos: clay pebbles.
let s = 5;
const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
for (const [lon, lat] of [...HOANG_SA, ...TRUONG_SA]) {
  const r = 0.06 + rnd() * 0.05;
  const p = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), land);
  p.scale.y = 0.55;
  p.position.set(X(lon), r * 0.3, Z(lat));
  p.castShadow = true;
  scene.add(p);
}

// Hà Nội: a red clay star standing on a short pin.
const star = new THREE.Shape();
for (let i = 0; i < 10; i++) {
  const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
  const r = i % 2 ? 0.17 : 0.42;
  const v = [Math.cos(a) * r, Math.sin(a) * r];
  i ? star.lineTo(...v) : star.moveTo(...v);
}
const starMesh = new THREE.Mesh(
  new THREE.ExtrudeGeometry(star, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4 }),
  clay(0xd8322a, 0.6, { emissive: 0x3a0705 }),
);
starMesh.position.set(X(105.85), 1.25, Z(21.03));
starMesh.rotation.set(-0.2, 0.35, Math.PI);
starMesh.castShadow = true;
scene.add(starMesh);
const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 12), clay(0xe9dcc6));
pin.position.set(X(105.85), 0.75, Z(21.03));
pin.castShadow = true;
scene.add(pin);

// Cần Thơ: a glowing amber bead.
const bead = new THREE.Mesh(new THREE.SphereGeometry(0.17, 32, 24), clay(0xffc56a, 0.4, { emissive: 0xff9a2a, emissiveIntensity: 0.9 }));
bead.position.set(X(105.78), 0.62, Z(10.03));
scene.add(bead);
const glow = new THREE.PointLight(0xffa640, 2.5, 2.2, 2);
glow.position.copy(bead.position).add(new THREE.Vector3(0, 0.25, 0));
scene.add(glow);

renderer.render(scene, camera);
finish(st, { vignette: 0.78, grain: 0.05 });

// Labels, projected from the scene.
const c = document.querySelectorAll("canvas")[1];
const g = c.getContext("2d");
const label = (lon, lat, text, dy = -22, size = 34) => {
  const v = new THREE.Vector3(X(lon), 0.2, Z(lat)).project(camera);
  const x = ((v.x + 1) / 2) * W, y = ((1 - v.y) / 2) * H + dy;
  g.font = `700 ${size}px "DejaVu Sans", sans-serif`;
  g.textAlign = "center";
  g.fillStyle = "rgba(0,0,0,0.55)";
  g.fillText(text, x + 1.5, y + 2);
  g.fillStyle = "#f3e6cf";
  g.fillText(text, x, y);
};
label(112.0, 17.3, "QĐ. Hoàng Sa");
label(114.3, 12.0, "QĐ. Trường Sa");
label(105.85, 21.03, "Hà Nội", -88, 32);
label(103.9, 10.03, "Cần Thơ", 10, 32);
done();
