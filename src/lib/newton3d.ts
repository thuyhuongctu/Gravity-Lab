/**
 * Isaac Newton as a clay figure, built in code from primitives (no mesh file):
 * full-bottomed wig, brown coat over a waistcoat, white cravat, breeches,
 * stockings and buckled shoes, holding the apple. After the clay portrait in
 * public/cast/newton.webp. Units are metres; the figure stands about 1.75 tall.
 */
import * as THREE from "three";

const COLOR = {
  skin: "#e9b996",
  cheek: "#e39c86",
  wig: "#9a9590",
  wigDark: "#7d7873",
  coat: "#5a4033",
  coatDark: "#45301f",
  waistcoat: "#3f2c22",
  cravat: "#f1ece4",
  breeches: "#24201e",
  stocking: "#ece6dc",
  shoe: "#1d1b1a",
  buckle: "#c9c6c0",
  button: "#2e2019",
  apple: "#c0201c",
  appleLight: "#e0442e",
  stem: "#4a3424",
  eye: "#2a1d17",
  brow: "#6f665f",
  lip: "#b8695a",
};

/** Clay: matte, slightly soft. */
function clay(color: string, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A capsule from a to b. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material, r2 = r) {
  const len = a.distanceTo(b);
  const geo =
    r2 === r
      ? new THREE.CapsuleGeometry(r, Math.max(0.001, len), 6, 14)
      : new THREE.CylinderGeometry(r2, r, len, 16, 1);
  const m = new THREE.Mesh(geo, mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

function ball(r: number, mat: THREE.Material, p: THREE.Vector3, s?: THREE.Vector3) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
  m.position.copy(p);
  if (s) m.scale.copy(s);
  return m;
}

/** Lathe around y from [radius, height] pairs; z squashed to make the body oval. */
function lathe(
  profile: Array<[number, number]>,
  mat: THREE.Material,
  depth = 0.72,
  phiStart = 0,
  phiLength = Math.PI * 2,
) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 40, phiStart, phiLength), mat);
  m.scale.z = depth;
  return m;
}

/** Seeded random, so the wig is the same on every load. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type Figure = { group: THREE.Group; update: (t: number) => void };

export function createNewton(): Figure {
  const group = new THREE.Group();
  group.name = "newton";
  const mats = Object.fromEntries(Object.entries(COLOR).map(([k, c]) => [k, clay(c)])) as Record<
    keyof typeof COLOR,
    THREE.MeshStandardMaterial
  >;
  mats.apple.roughness = 0.45;
  mats.shoe.roughness = 0.5;
  mats.buckle.metalness = 0.6;
  mats.buckle.roughness = 0.35;
  for (const k of ["coat", "coatDark"] as const) mats[k].side = THREE.DoubleSide;

  // Legs: shoes, stockings to the knee, breeches above.
  for (const side of [-1, 1]) {
    const x = side * 0.085;
    const leg = new THREE.Group();
    const shoe = ball(0.06, mats.shoe, V(0, 0.035, 0.045), V(0.95, 0.6, 1.9));
    const heel = limb(V(0, 0.0, -0.03), V(0, 0.05, -0.03), 0.045, mats.shoe);
    const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), mats.shoe);
    tongue.position.set(0, 0.075, 0.06);
    tongue.rotation.x = -0.35;
    const buckle = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 6, 4), mats.buckle);
    buckle.position.set(0, 0.075, 0.075);
    buckle.rotation.set(-0.35, 0, Math.PI / 4);
    const stocking = limb(V(0, 0.07, 0), V(0, 0.47, 0), 0.042, mats.stocking, 0.05);
    const calf = ball(0.05, mats.stocking, V(0, 0.3, -0.008), V(1, 1.8, 1));
    const knee = ball(0.062, mats.breeches, V(0, 0.5, 0), V(1, 0.7, 1));
    const breeches = limb(V(0, 0.5, 0), V(side * 0.015, 0.86, 0), 0.078, mats.breeches, 0.064);
    leg.add(shoe, heel, tongue, buckle, stocking, calf, knee, breeches);
    leg.position.x = x;
    leg.rotation.y = side * 0.18;
    group.add(leg);
  }

  // Body: waistcoat underneath, coat open at the front, flaring to the knee.
  const torso = new THREE.Group();
  torso.name = "torso";
  group.add(torso);
  const waistcoat = lathe(
    [
      [0.001, 0.62],
      [0.17, 0.62],
      [0.175, 0.8],
      [0.168, 1.0],
      [0.178, 1.2],
      [0.16, 1.36],
      [0.09, 1.43],
      [0.001, 1.44],
    ],
    mats.waistcoat,
    0.7,
  );
  torso.add(waistcoat);
  const gap = 0.55; // radians of open front
  const coat = lathe(
    [
      [0.27, 0.6],
      [0.25, 0.68],
      [0.21, 0.84],
      [0.19, 0.98],
      [0.2, 1.16],
      [0.205, 1.3],
      [0.18, 1.39],
      [0.11, 1.45],
      [0.06, 1.47],
    ],
    mats.coat,
    0.72,
    gap / 2,
    Math.PI * 2 - gap,
  );
  torso.add(coat);
  // Coat edges, so the opening reads as cloth with thickness.
  for (const side of [-1, 1]) {
    const a = side * (gap / 2);
    const at = (r: number, y: number) => V(Math.sin(a) * r, y, Math.cos(a) * r * 0.72);
    torso.add(limb(at(0.268, 0.61), at(0.21, 0.84), 0.011, mats.coatDark));
    torso.add(limb(at(0.21, 0.84), at(0.2, 1.16), 0.011, mats.coatDark));
    torso.add(limb(at(0.2, 1.16), at(0.16, 1.41), 0.011, mats.coatDark));
    // Pocket flap on the hip.
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.025), mats.coatDark);
    flap.position.set(side * 0.19, 0.84, 0.09);
    flap.rotation.y = side * 0.75;
    torso.add(flap);
  }
  // Buttons on the coat's edge and the waistcoat.
  for (let i = 0; i < 6; i++) {
    const y = 0.88 + i * 0.075;
    torso.add(ball(0.009, mats.button, V(-0.04, y, 0.125 + (y > 1.25 ? -0.01 : 0))));
  }
  for (let i = 0; i < 5; i++) torso.add(ball(0.012, mats.button, V(0.105, 0.86 + i * 0.1, 0.12)));

  // Cravat: a white band and two falling tabs.
  const neck = limb(V(0, 1.42, 0), V(0, 1.52, 0), 0.05, mats.skin);
  const band = limb(V(0, 1.43, 0.005), V(0, 1.48, 0.005), 0.062, mats.cravat);
  const tabL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.19, 0.018), mats.cravat);
  tabL.position.set(-0.018, 1.37, 0.135);
  tabL.rotation.set(0.12, 0, 0.1);
  const tabR = tabL.clone();
  tabR.position.x = 0.02;
  tabR.rotation.z = -0.12;
  tabR.position.z = 0.14;
  torso.add(neck, band, tabL, tabR);

  // Arms: both forearms come up to hold the apple at the chest.
  const apple = new THREE.Group();
  apple.name = "apple";
  const fruit = ball(0.05, mats.apple, V(0, 0, 0), V(1.05, 0.92, 1.05));
  const shine = ball(0.016, clay(COLOR.appleLight, 0.3), V(-0.022, 0.018, 0.035));
  const stem = limb(V(0, 0.035, 0), V(0.008, 0.07, 0), 0.0045, mats.stem);
  apple.add(fruit, shine, stem);
  apple.position.set(0.14, 1.36, 0.25);
  group.add(apple);

  const arms = new THREE.Group();
  arms.name = "arms";
  torso.add(arms);
  const armPose = [
    // shoulder, elbow, wrist, hand offset
    { side: -1, s: V(-0.19, 1.37, 0), e: V(-0.2, 1.12, 0.06), w: V(0.02, 1.32, 0.25) },
    { side: 1, s: V(0.19, 1.37, 0), e: V(0.24, 1.13, 0.04), w: V(0.235, 1.34, 0.23) },
  ];
  for (const { side, s, e, w } of armPose) {
    arms.add(ball(0.062, mats.coat, s, V(1, 0.8, 0.9)));
    arms.add(limb(s, e, 0.06, mats.coat, 0.055));
    arms.add(ball(0.056, mats.coat, e));
    const cuffAt = e.clone().lerp(w, 0.78);
    arms.add(limb(e, cuffAt, 0.055, mats.coat, 0.06));
    // Wide turned-back cuff and the shirt ruffle.
    arms.add(limb(cuffAt.clone().lerp(e, 0.18), cuffAt, 0.066, mats.coatDark));
    arms.add(limb(cuffAt, cuffAt.clone().lerp(w, 0.55), 0.045, mats.cravat, 0.05));
    // Hand: palm cupped toward the apple, thumb on top.
    const palm = ball(0.042, mats.skin, w, V(0.8, 1.15, 0.65));
    palm.lookAt(apple.position);
    arms.add(palm);
    const thumb = limb(w.clone().add(V(0, 0.025, 0)), apple.position.clone().lerp(w, 0.45).add(V(0, 0.04, 0)), 0.013, mats.skin);
    arms.add(thumb);
    for (let f = 0; f < 3; f++) {
      const base = w.clone().add(V(side * -0.01, -0.02 + f * -0.014, 0.015));
      const tip = apple.position.clone().add(V(side * 0.035, -0.025 - f * 0.012, -0.01 + f * 0.012));
      arms.add(limb(base, tip, 0.011, mats.skin));
    }
  }

  // Head, turned toward the apple.
  const head = new THREE.Group();
  head.name = "head";
  head.position.set(0, 1.64, 0.015);
  head.rotation.set(0.1, 0.42, 0.03);
  head.scale.setScalar(1.22);
  group.add(head);
  head.add(ball(0.095, mats.skin, V(0, 0, 0), V(0.92, 1.08, 0.98)));
  head.add(ball(0.06, mats.skin, V(0, -0.055, 0.025), V(1, 0.8, 1))); // jaw
  head.add(limb(V(0, 0.005, 0.088), V(0, -0.03, 0.105), 0.016, mats.skin)); // nose
  for (const side of [-1, 1]) {
    head.add(ball(0.011, mats.eye, V(side * 0.034, 0.012, 0.083), V(1, 1.2, 0.6)));
    head.add(limb(V(side * 0.018, 0.04, 0.089), V(side * 0.052, 0.035, 0.078), 0.005, mats.brow));
    head.add(ball(0.02, mats.cheek, V(side * 0.05, -0.03, 0.07), V(1, 0.7, 0.4)));
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.0045, 6, 16, Math.PI * 0.75), mats.lip);
  smile.position.set(0, -0.045, 0.088);
  smile.rotation.set(0.25, 0, Math.PI + Math.PI * 0.125);
  head.add(smile);

  // Full-bottomed wig: a crown cap and clusters of curls falling to the shoulders.
  const wig = new THREE.Group();
  wig.name = "wig";
  head.add(wig);
  wig.add(ball(0.104, mats.wig, V(0, 0.05, -0.03), V(1.04, 0.9, 1.02)));
  const rand = rng(1642);
  const curl = (p: THREE.Vector3, r: number) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.8, 8, 14), rand() > 0.3 ? mats.wig : mats.wigDark);
    m.position.copy(p);
    m.rotation.set(rand() * Math.PI, rand() * Math.PI, 0);
    wig.add(m);
  };
  // Top ridge of curls along the parting.
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + (i / 8) * 2.4;
    curl(V(Math.sin(a) * 0.088, 0.115 + Math.cos(a) * 0.015, Math.cos(a) * 0.015 - 0.02), 0.024);
  }
  // Side and back falls: rows from the temple down past the shoulder.
  for (let row = 0; row < 6; row++) {
    const y = 0.07 - row * 0.048;
    const spread = 0.1 + row * 0.007;
    const n = 9 + row;
    for (let i = 0; i < n; i++) {
      // Leave the face open: angles from 70° on one side round the back to the other.
      const a = THREE.MathUtils.degToRad(92 + (i / (n - 1)) * 176);
      const r = spread + (rand() - 0.5) * 0.015;
      curl(V(Math.sin(a) * r, y + (rand() - 0.5) * 0.02, Math.cos(a) * r * 0.85 - 0.015), 0.026 + rand() * 0.006);
    }
  }

  // Soft contact shadow.
  const shadowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(60,40,30,0.35)");
    grad.addColorStop(1, "rgba(60,40,30,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.5),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  group.add(shadow);

  group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o !== shadow) o.castShadow = true;
  });

  const restHead = head.rotation.clone();
  return {
    group,
    /** Idle: breathing, a slow look at the apple, the apple turning in his hands. */
    update(t: number) {
      const breath = Math.sin(t * 1.6) * 0.004;
      torso.position.y = breath;
      apple.position.y = 1.36 + breath;
      apple.rotation.y = t * 0.6;
      head.position.y = 1.64 + breath;
      head.rotation.y = restHead.y + Math.sin(t * 0.5) * 0.06;
      head.rotation.x = restHead.x + Math.sin(t * 0.7 + 1) * 0.025;
    },
  };
}

export type FigureHandle = { dispose: () => void; setActive: (on: boolean) => void };

/** Show the figure in host: drag to turn it, a slow idle when left alone. */
export function mountNewton(host: HTMLElement, opts: { still: boolean }): FigureHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const el = renderer.domElement;
  el.style.display = "block";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.touchAction = "pan-y";
  host.appendChild(el);

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#fff6ea", "#cbb9a6", 1.4));
  const key = new THREE.DirectionalLight("#fff3e2", 2.2);
  key.position.set(-1.5, 3, 2.5);
  const rim = new THREE.DirectionalLight("#ffe9d0", 0.8);
  rim.position.set(2, 2, -2);
  scene.add(key, rim);
  const figure = createNewton();
  scene.add(figure.group);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);

  // Rest pose matches the clay portrait: turned a little to his left.
  const rest = -0.35;
  let yaw = rest;
  let drag: { x: number; yaw: number } | null = null;
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, yaw };
  };
  const move = (e: PointerEvent) => {
    if (drag) yaw = drag.yaw + (e.clientX - drag.x) * 0.012;
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
    if (!drag) yaw += (rest - yaw) * 0.02;
    figure.update(t);
    // Fit the full height whatever the aspect ratio.
    const d = Math.max(5, 5 * (0.75 / camera.aspect) * 0.95);
    camera.position.set(Math.sin(yaw) * d, 1.08, Math.cos(yaw) * d);
    camera.lookAt(0, 0.9, 0);
    renderer.render(scene, camera);
    if (active && (!opts.still || drag)) raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  // With reduced motion there is no idle loop, so redraw while dragging.
  const kick = () => {
    if (opts.still && active) raf = requestAnimationFrame(frame);
  };
  el.addEventListener("pointermove", kick);

  return {
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      } else cancelAnimationFrame(raf);
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", kick);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.MeshStandardMaterial | THREE.MeshStandardMaterial[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => {
          x.map?.dispose();
          x.dispose();
        });
      });
      renderer.dispose();
      el.remove();
    },
  };
}
