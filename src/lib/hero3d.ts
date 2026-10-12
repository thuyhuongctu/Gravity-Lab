/**
 * Hero scene: a clay Earth with Vietnam lit, the Moon and Newton's apple on
 * glowing orbits, and FDI arcs flowing from source economies into Vietnam.
 * Loaded on demand (three.js lives in its own chunk).
 */
import * as THREE from "three";
import { LAND_RINGS, LAND_SCALE } from "@/data/land";
import { arcPoints, toVec, type Vec3 } from "@/sim/globe";
import { VN_OUTLINE } from "@/lib/vn-outline";

/** Sources of FDI into Vietnam named in Phan and Do (2019), plus the US and EU. */
const SOURCES: Array<{ lon: number; lat: number; w: number }> = [
  { lon: 126.98, lat: 37.57, w: 1 }, // Seoul
  { lon: 139.69, lat: 35.69, w: 1 }, // Tokyo
  { lon: 103.82, lat: 1.35, w: 0.9 }, // Singapore
  { lon: 121.56, lat: 25.03, w: 0.8 }, // Taipei
  { lon: 114.17, lat: 22.32, w: 0.7 }, // Hong Kong
  { lon: 116.4, lat: 39.9, w: 0.7 }, // Beijing
  { lon: 151.21, lat: -33.87, w: 0.5 }, // Sydney
  { lon: -77.04, lat: 38.9, w: 0.6 }, // Washington
  { lon: 2.35, lat: 48.86, w: 0.5 }, // Paris
  { lon: 13.4, lat: 52.52, w: 0.5 }, // Berlin
];
const HANOI = { lon: 105.85, lat: 21.03 };
const CAN_THO = { lon: 105.78, lat: 10.03 };
const HCMC = { lon: 106.7, lat: 10.78 };

const C = {
  void: 0x0b0a1f,
  ocean: "#221e63",
  ocean2: "#2f2a86",
  land: "#9b97d6",
  landEdge: "#c4c0f0",
  vn: "#ffc56b",
  teal: 0x5eead4,
  violet: 0xa78bfa,
  amber: 0xffc56b,
  flare: 0xff5e8a,
};

function v3(v: Vec3, r = 1) {
  return new THREE.Vector3(v[0] * r, v[1] * r, v[2] * r);
}

/** Equirectangular texture painted from the Natural Earth rings; Vietnam in amber. */
function earthTextures(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const W = 2048;
  const H = 1024;
  const make = () => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    return c;
  };
  const px = (lon: number) => ((lon + 180) / 360) * W;
  const py = (lat: number) => ((90 - lat) / 180) * H;
  const trace = (g: CanvasRenderingContext2D, ring: number[]) => {
    let x = 0;
    let y = 0;
    let prev = 0;
    for (let i = 0; i + 1 < ring.length; i += 2) {
      x += ring[i]!;
      y += ring[i + 1]!;
      const lon = x / LAND_SCALE;
      const lat = y / LAND_SCALE;
      const X = px(lon);
      if (i === 0 || Math.abs(X - prev) > W / 2) g.moveTo(X, py(lat));
      else g.lineTo(X, py(lat));
      prev = X;
    }
    g.closePath();
  };
  const paint = (g: CanvasRenderingContext2D, ocean: CanvasFillStrokeStyles["fillStyle"], land: string, vn: string, edge?: string) => {
    g.fillStyle = ocean;
    g.fillRect(0, 0, W, H);
    g.beginPath();
    for (const ring of LAND_RINGS) trace(g, ring);
    g.fillStyle = land;
    g.fill("evenodd");
    if (edge) {
      g.strokeStyle = edge;
      g.lineWidth = 1.5;
      g.stroke();
    }
    g.beginPath();
    VN_OUTLINE.forEach(([lon, lat], i) => (i ? g.lineTo(px(lon), py(lat)) : g.moveTo(px(lon), py(lat))));
    g.closePath();
    g.fillStyle = vn;
    g.fill();
  };

  const color = make();
  const g = color.getContext("2d")!;
  const sea = g.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, C.ocean);
  sea.addColorStop(0.5, C.ocean2);
  sea.addColorStop(1, C.ocean);
  paint(g, sea, C.land, C.vn, C.landEdge);
  // Paracel and Spratly islands.
  g.fillStyle = C.vn;
  for (const [lon, lat] of [
    [111.6, 16.5],
    [112.3, 16.8],
    [114.3, 10.4],
    [112.9, 9.9],
    [115.8, 10.7],
  ] as const) {
    g.beginPath();
    g.arc(px(lon), py(lat), 2.2, 0, Math.PI * 2);
    g.fill();
  }

  const bump = make();
  const b = bump.getContext("2d")!;
  paint(b, "#000", "#9a9a9a", "#ffffff");
  b.filter = "blur(2px)";
  b.drawImage(bump, 0, 0);

  const map = new THREE.CanvasTexture(color);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  return { map, bump: new THREE.CanvasTexture(bump) };
}

/** Soft rim glow around a sphere (backside fresnel). */
function atmosphere(radius: number, color: number) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { c: { value: new THREE.Color(color) }, k: { value: 1 / Math.sqrt(1 - 1 / (radius * radius)) } },
    vertexShader: `varying vec3 n; varying vec3 v;
      void main(){ n = normalize(normalMatrix * normal); vec4 p = modelViewMatrix * vec4(position,1.0); v = normalize(-p.xyz); gl_Position = projectionMatrix * p; }`,
    fragmentShader: `uniform vec3 c; uniform float k; varying vec3 n; varying vec3 v;
      void main(){ float f = pow(clamp(-dot(n, v) * k, 0.0, 1.0), 2.6); gl_FragColor = vec4(c, f * 0.85); }`,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 64), mat);
}

function glowSprite(color: number, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }),
  );
  s.scale.setScalar(size);
  return s;
}

function clayApple() {
  const g = new THREE.Group();
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = (i / 24) * Math.PI;
    const r = Math.sin(t) * (1 + 0.12 * Math.cos(t) - 0.08 * Math.sin(3 * t) * 0.3);
    pts.push(new THREE.Vector2(Math.max(0.001, r) * 0.5, -Math.cos(t) * 0.46 - (i === 0 ? -0.06 : 0)));
  }
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(pts, 48),
    new THREE.MeshStandardMaterial({ color: 0xd8343f, roughness: 0.55, emissive: 0x4a0710, emissiveIntensity: 0.6 }),
  );
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.04, 0.26, 8),
    new THREE.MeshStandardMaterial({ color: 0x5b3a1e, roughness: 0.9 }),
  );
  stem.position.set(0.02, 0.5, 0);
  stem.rotation.z = -0.25;
  const leaf = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 16, 8),
    new THREE.MeshStandardMaterial({ color: 0x4caf50, roughness: 0.7 }),
  );
  leaf.scale.set(1, 0.35, 0.55);
  leaf.position.set(0.17, 0.52, 0);
  leaf.rotation.z = 0.5;
  g.add(body, stem, leaf, glowSprite(C.flare, 2.2));
  return g;
}

function orbitRing(radius: number, color: number, opacity: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i++) {
    const a = (i / 256) * Math.PI * 2;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
}

function starfield(n: number) {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const palette = [new THREE.Color(0xffffff), new THREE.Color(C.teal), new THREE.Color(C.violet), new THREE.Color(C.amber)];
  for (let i = 0; i < n; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(40 + Math.random() * 40);
    pos.set([v.x, v.y, v.z], i * 3);
    const c = palette[Math.random() < 0.7 ? 0 : 1 + Math.floor(Math.random() * 3)]!;
    col.set([c.r, c.g, c.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false }),
  );
}

export type HeroHandle = { dispose: () => void; setActive: (on: boolean) => void };

export function mountHero(host: HTMLElement, opts: { still: boolean }): HeroHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(C.void, 1);
  host.appendChild(renderer.domElement);
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.touchAction = "pan-y";

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(C.void, 0.006);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);

  // Lights: warm key, cool rim, faint fill.
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4);
  key.position.set(4, 3, 5);
  const rim = new THREE.DirectionalLight(C.teal, 2.2);
  rim.position.set(-5, 1.5, -4);
  scene.add(key, rim, new THREE.AmbientLight(0x8b7cf0, 0.9));

  const stars = starfield(1800);
  scene.add(stars);

  // Earth, tilted so Vietnam faces the camera at rest.
  const world = new THREE.Group();
  scene.add(world);
  const spin = new THREE.Group();
  world.add(spin);
  const { map, bump } = earthTextures();
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1, 128, 96),
    new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 3, roughness: 0.85, metalness: 0 }),
  );
  // Sphere UV: u=0 at lon −180 on −x; rotate so the texture matches toVec().
  earth.rotation.y = -Math.PI / 2;
  spin.add(earth, atmosphere(1.07, C.teal));
  const halo = atmosphere(1.16, C.violet);
  (halo.material as THREE.ShaderMaterial).uniforms.c!.value = new THREE.Color(C.violet);
  world.add(halo);

  // Vietnam beacons.
  const beacon = glowSprite(C.amber, 0.32);
  beacon.position.copy(v3(toVec(HANOI.lon, HANOI.lat), 1.01));
  const beacon2 = glowSprite(C.amber, 0.36);
  beacon2.position.copy(v3(toVec(CAN_THO.lon, CAN_THO.lat), 1.01));
  spin.add(beacon, beacon2);

  // FDI arcs into Vietnam, with pulses travelling inward.
  type Flow = { curve: THREE.CatmullRomCurve3; dots: THREE.Sprite[]; speed: number };
  const flows: Flow[] = [];
  const target = toVec(HCMC.lon, HCMC.lat);
  SOURCES.forEach((s, i) => {
    const pts = arcPoints(toVec(s.lon, s.lat), target, 64, 0.35).map((p) => v3(p, 1.004));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 96, 0.0045 + 0.004 * s.w, 6, false),
      new THREE.MeshBasicMaterial({
        color: i % 3 === 0 ? C.violet : C.teal,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    spin.add(tube);
    const dots = [0, 1, 2].map(() => {
      const d = glowSprite(i % 3 === 0 ? C.flare : C.amber, 0.09 + 0.05 * s.w);
      spin.add(d);
      return d;
    });
    flows.push({ curve, dots, speed: 0.07 + 0.05 * s.w });
  });

  // The Moon and the apple on inclined orbits.
  const moonOrbit = new THREE.Group();
  moonOrbit.rotation.set(0.32, 0, -0.18);
  world.add(moonOrbit);
  moonOrbit.add(orbitRing(2.05, C.teal, 0.55));
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 48, 32),
    new THREE.MeshStandardMaterial({ color: 0xd9d4ea, roughness: 0.95 }),
  );
  moonOrbit.add(moon);

  const appleOrbit = new THREE.Group();
  appleOrbit.rotation.set(-0.5, 0, 0.35);
  world.add(appleOrbit);
  appleOrbit.add(orbitRing(1.55, C.amber, 0.5));
  const apple = clayApple();
  apple.scale.setScalar(0.3);
  appleOrbit.add(apple);
  world.add(orbitRing(2.7, C.violet, 0.22));

  // Face Vietnam (lon ≈ 106°E, lat ≈ 16°N) towards the camera.
  const restY = -106 * (Math.PI / 180);
  const restX = 16 * (Math.PI / 180);
  spin.rotation.y = restY;
  world.rotation.x = restX * 0.9;
  world.rotation.z = -0.12;

  // Interaction: drag to turn, eases back to Vietnam.
  let drag: { x: number; y: number; ry: number; rx: number } | null = null;
  let offY = 0;
  let offX = 0;
  let px = 0;
  let py = 0;
  const el = renderer.domElement;
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY, ry: offY, rx: offX };
  };
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    px = ((e.clientX - r.left) / r.width - 0.5) * 2;
    py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (!drag) return;
    offY = drag.ry + (e.clientX - drag.x) * 0.008;
    offX = Math.max(-0.8, Math.min(0.8, drag.rx + (e.clientY - drag.y) * 0.004));
  };
  const up = () => {
    drag = null;
  };
  el.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", up);

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole system in frame on narrow screens.
    const fit = w < h ? 9.2 + (h / w - 1) * 3.2 : 8.2;
    camera.position.set(0, 0.35, fit);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  let raf = 0;
  let active = true;
  let last = performance.now();
  let t = 0;
  const frame = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    if (!opts.still) t += dt;

    // A slow sway around Vietnam, plus the drag offset easing back.
    if (!drag) {
      offY *= 0.985;
      offX *= 0.985;
    }
    spin.rotation.y = restY + Math.sin(t * 0.12) * 0.55 + offY;
    world.rotation.x = restX * 0.9 + offX;
    moon.position.set(Math.cos(t * 0.35) * 2.05, 0, Math.sin(t * 0.35) * 2.05);
    apple.position.set(Math.cos(-t * 0.6 + 1) * 1.55, 0, Math.sin(-t * 0.6 + 1) * 1.55);
    apple.rotation.y = t * 0.8;
    stars.rotation.y = t * 0.01;
    flows.forEach((f, i) =>
      f.dots.forEach((d, k) => {
        const u = (((t * f.speed + k / 3 + i * 0.137) % 1) + 1) % 1;
        d.position.copy(f.curve.getPointAt(u));
        (d.material as THREE.SpriteMaterial).opacity = Math.sin(Math.PI * u);
      }),
    );
    const pulse = 0.32 + Math.sin(t * 2.2) * 0.06;
    beacon.scale.setScalar(pulse);
    beacon2.scale.setScalar(pulse * 1.1);

    // Gentle parallax from the pointer.
    camera.position.x += (px * 0.5 - camera.position.x) * 0.04;
    camera.position.y += (0.35 - py * 0.3 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    if (active && !opts.still) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on && !opts.still) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      map.dispose();
      bump.dispose();
      renderer.dispose();
      el.remove();
    },
  };
}
