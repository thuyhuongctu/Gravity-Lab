/**
 * The scroll journey (clay noir, graphite): the camera flies through nine clay scenes,
 * from Newton's apple to FDI into Việt Nam. Ported from the design handoff
 * (design_handoff_gravity_lab_scroll/scroll.js). Loaded on demand; three.js stays in
 * its own chunk.
 */
import * as THREE from "three";
import { LAND_RINGS, LAND_SCALE } from "@/data/land";
import { VN_OUTLINE } from "@/lib/vn-outline";

export type JourneyOptions = {
  /** The element that scrolls; its scroll position drives the camera. */
  scroller: HTMLElement;
  /** The nine scene sections, in order. */
  sections: () => HTMLElement[];
  /** Portrait discs for the crew ring in scene 8. */
  faces: string[];
  /** Light theme: a warm bone sky instead of the graphite void. */
  light?: boolean;
  /** Reduced motion: no hop, idle at a quarter speed. */
  calm: boolean;
  /** Called when the nearest scene changes. */
  onScene?: (index: number) => void;
};

export type JourneyHandle = {
  dispose: () => void;
  setActive: (on: boolean) => void;
};

const N = 9;
const GAP = 70;

export function mountJourney(host: HTMLElement, opts: JourneyOptions): JourneyHandle {
  const low = (navigator.hardwareConcurrency || 8) <= 4 || host.clientWidth < 700;
  const R = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  R.setPixelRatio(Math.min(window.devicePixelRatio, low ? 1.25 : 2));
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 0.95;
  R.outputColorSpace = THREE.SRGBColorSpace;
  const el = R.domElement;
  el.style.display = "block";
  el.style.width = "100%";
  el.style.height = "100%";
  host.appendChild(el);

  const scene = new THREE.Scene();
  const light = !!opts.light;
  const sky = light ? "#ece5d8" : "#0a0b0d";
  scene.background = new THREE.Color(sky);
  scene.fog = new THREE.FogExp2(sky, light ? 0.004 : 0.009);
  const cam = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
  const mobile = () => host.clientWidth < 700;

  const textures: THREE.Texture[] = [];
  const cnv = (w: number, h: number, fn: (g: CanvasRenderingContext2D, w: number, h: number) => void) => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    fn(c.getContext("2d")!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.push(t);
    return t;
  };
  const glow = (col: string) =>
    cnv(128, 128, (g) => {
      const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      r.addColorStop(0, col);
      r.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = r;
      g.fillRect(0, 0, 128, 128);
    });
  // Seeded noise, so the clay grain is the same on every load.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  // Thumbed clay: soft dents and lumps over a fine grain.
  const noise = cnv(512, 512, (g, w, h) => {
    g.fillStyle = "#808080";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = 4 + rand() * 22;
      const v = rand() < 0.5 ? 40 : 200;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(${v},${v},${v},.35)`);
      gr.addColorStop(1, "rgba(128,128,128,0)");
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const d = g.getImageData(0, 0, w, h);
    for (let i = 0; i < d.data.length; i += 4) {
      const n = (rand() - 0.5) * 26;
      d.data[i]! += n;
      d.data[i + 1]! += n;
      d.data[i + 2]! += n;
    }
    g.putImageData(d, 0, 0);
  });
  noise.wrapS = noise.wrapT = THREE.RepeatWrapping;
  noise.repeat.set(2, 2);
  noise.colorSpace = THREE.NoColorSpace;
  const clay = (color: string, x: THREE.MeshStandardMaterialParameters = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.96, metalness: 0, bumpMap: noise, bumpScale: 1.4, ...x });
  const ball = (r: number, col: string, x?: THREE.MeshStandardMaterialParameters) =>
    new THREE.Mesh(new THREE.SphereGeometry(r, 64, 64), clay(col, x));
  const sprite = (col: string, s: number) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: glow(col), blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    sp.scale.set(s, s, 1);
    return sp;
  };

  // A warm spotlight rides with the camera; a teal rim from behind; a soft fill.
  scene.add(light ? new THREE.HemisphereLight("#fff4e2", "#b5a98f", 1.4) : new THREE.HemisphereLight("#3a362f", "#050506", 0.45));
  const key = new THREE.SpotLight("#ffdca0", 700, 0, 0.6, 0.7, 1.2);
  key.position.set(10, 26, 18);
  key.target.position.set(0, -4, -30);
  cam.add(key, key.target);
  const rim = new THREE.DirectionalLight("#4fd1c5", 2.4);
  rim.position.set(-40, 10, -60);
  scene.add(rim);
  const fill = new THREE.PointLight("#ffe2a8", 90, 0, 1.6);
  cam.add(fill);
  scene.add(cam);

  // Stars in bone, teal and amber; three soft nebula glows.
  {
    const n = low ? 1500 : 4000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    // On the bone sky, additive light would vanish: draw darker dust instead.
    const pal = (light ? ["#8a8173", "#b5a98f", "#0a6577", "#b4530a"] : ["#ffffff", "#e8d9b8", "#4fd1c5", "#ffc56b"]).map(
      (c) => new THREE.Color(c),
    );
    for (let i = 0; i < n; i++) {
      pos.set([(rand() - 0.5) * 700, (rand() - 0.5) * 500, 100 - rand() * 900], i * 3);
      const c = pal[i % 4]!;
      col.set([c.r, c.g, c.b], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    scene.add(
      new THREE.Points(
        g,
        new THREE.PointsMaterial({
          size: light ? 1.3 : 1.8,
          map: glow("#fff"),
          vertexColors: true,
          transparent: true,
          opacity: light ? 0.55 : 1,
          depthWrite: false,
          blending: light ? THREE.NormalBlending : THREE.AdditiveBlending,
        }),
      ),
    );
  }
  (
    [
      ["rgba(14,116,144,.45)", [-160, 40, -200], 380],
      ["rgba(194,116,36,.35)", [180, -40, -420], 360],
      ["rgba(14,116,144,.35)", [-120, 60, -620], 320],
    ] as Array<[string, [number, number, number], number]>
  ).forEach(([c, p, s]) => {
    if (light) return;
    const sp = sprite(c, s);
    sp.position.set(...p);
    scene.add(sp);
  });

  const stops: THREE.Group[] = [];
  const anim: Array<(t: number) => void> = [];
  const place = (i: number, side: number) => {
    const g = new THREE.Group();
    g.userData.side = side;
    g.position.set(side * (mobile() ? 0 : 14), mobile() ? 4 : 0, -i * GAP - 22);
    scene.add(g);
    stops.push(g);
    return g;
  };

  // 1. The apple.
  {
    const g = place(0, 1);
    const a = ball(5, "#e2483a");
    a.scale.set(1, 0.92, 1);
    g.add(a);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.4, 12), clay("#6a4422"));
    stem.position.y = 5.4;
    stem.rotation.z = 0.2;
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.4, 24, 16), clay("#4c9a52"));
    leaf.scale.set(1.4, 0.25, 0.7);
    leaf.position.set(1.6, 5.6, 0);
    leaf.rotation.z = 0.5;
    g.add(stem, leaf);
    anim.push((t) => {
      g.rotation.y = t * 0.4;
      g.position.y = (mobile() ? 4 : 0) + Math.sin(t) * 0.6;
    });
  }
  // 2. The Earth and the Moon.
  {
    const g = place(1, -1);
    const e = ball(4.5, "#3d7fa3");
    const piv = new THREE.Group();
    const m = ball(1.2, "#d8d2c4");
    m.position.x = 10;
    piv.add(m);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(10, 0.05, 8, 128),
      new THREE.MeshBasicMaterial({ color: "#4fd1c5", transparent: true, opacity: 0.4 }),
    );
    ring.rotation.x = Math.PI / 2;
    g.add(e, piv, ring);
    g.rotation.x = 0.35;
    anim.push((t) => {
      piv.rotation.y = t * 0.6;
      e.rotation.y = t * 0.3;
    });
  }
  // 3. The Sun and a planet, with orbits at 1×, 2× and 3× the distance: twice as far, a quarter of the pull.
  {
    const g = place(2, 1);
    const s = ball(4, "#ffc56b", { emissive: "#ff8a2a", emissiveIntensity: 1.1 });
    const piv = new THREE.Group();
    const p = ball(1.4, "#4fd1c5");
    p.position.x = 11;
    piv.add(p);
    g.add(s, sprite("rgba(255,170,80,.9)", 22), piv);
    [6, 11, 16].forEach((r, k) => {
      const o = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.04, 6, 128),
        new THREE.MeshBasicMaterial({ color: "#e8d9b8", transparent: true, opacity: 0.35 - k * 0.08 }),
      );
      o.rotation.x = Math.PI / 2;
      g.add(o);
    });
    g.rotation.x = 0.3;
    anim.push((t) => {
      piv.rotation.y = t * 0.5;
    });
  }
  // 4. Two economies joined by a trade arc, a packet travelling along it.
  {
    const g = place(3, -1);
    const a = ball(4, "#e8d9b8");
    a.position.x = -8;
    const b = ball(2.8, "#ff7a9c");
    b.position.x = 8;
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-8, 3, 0),
      new THREE.Vector3(0, 12, 0),
      new THREE.Vector3(8, 2, 0),
    );
    const pk = ball(0.5, "#ffc56b", { emissive: "#ffc56b", emissiveIntensity: 1 });
    g.add(a, b, new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.22, 8), new THREE.MeshBasicMaterial({ color: "#4fd1c5" })), pk);
    anim.push((t) => {
      pk.position.copy(curve.getPoint((t * 0.3) % 1));
      g.rotation.y = Math.sin(t * 0.3) * 0.3;
    });
  }
  // 5. The Earth with Việt Nam, Hoàng Sa and Trường Sa.
  {
    const g = place(4, 1);
    const map = cnv(2048, 1024, (c, w, h) => {
      c.fillStyle = "#1d3d5a";
      c.fillRect(0, 0, w, h);
      const px = (lon: number) => ((lon + 180) / 360) * w;
      const py = (lat: number) => ((90 - lat) / 180) * h;
      const ring = (pts: Array<[number, number]>) => {
        c.beginPath();
        let prev: number | null = null;
        pts.forEach(([lon, lat], i) => {
          // Rings that cross the antimeridian are split rather than smeared across the map.
          if (i === 0 || (prev !== null && Math.abs(lon - prev) > 180)) c.moveTo(px(lon), py(lat));
          else c.lineTo(px(lon), py(lat));
          prev = lon;
        });
        c.closePath();
        c.fill();
      };
      c.fillStyle = "#c9b48d";
      for (const r of LAND_RINGS) {
        const pts: Array<[number, number]> = [];
        let x = 0;
        let y = 0;
        for (let i = 0; i + 1 < r.length; i += 2) {
          x += r[i]!;
          y += r[i + 1]!;
          pts.push([x / LAND_SCALE, y / LAND_SCALE]);
        }
        ring(pts);
      }
      c.fillStyle = "#ff5e8a";
      ring(VN_OUTLINE);
      // Hoàng Sa and Trường Sa.
      c.fillStyle = "#ffc56b";
      for (const [lon, lat] of [
        [112.3, 16.5],
        [114.3, 9.5],
      ] as const) {
        c.beginPath();
        c.arc(px(lon), py(lat), 5, 0, 7);
        c.fill();
      }
    });
    const e = new THREE.Mesh(new THREE.SphereGeometry(6, 96, 96), clay("#ffffff", { map, bumpScale: 0.25 }));
    g.add(e);
    e.rotation.x = 0.3;
    anim.push((t) => {
      // Sphere UV starts at lon −180 on −x; this turn brings Việt Nam (≈106°E) to the camera.
      e.rotation.y = -4.92 + Math.sin(t * 0.25) * 0.35;
    });
  }
  // 6. An FTA: two interlocked clay rings.
  {
    const g = place(5, -1);
    const t1 = new THREE.Mesh(new THREE.TorusGeometry(5, 1.1, 24, 96), clay("#ffc56b"));
    const t2 = new THREE.Mesh(new THREE.TorusGeometry(5, 1.1, 24, 96), clay("#4fd1c5"));
    t2.position.x = 5;
    t2.rotation.y = Math.PI / 2;
    g.add(t1, t2);
    g.position.x -= 2;
    anim.push((t) => {
      g.rotation.y = t * 0.3;
      g.rotation.x = Math.sin(t * 0.4) * 0.2;
    });
  }
  // 7. PPML: a grid of beads on a graphite base; every seventh sits at zero.
  {
    const g = place(6, 1);
    const geo = new THREE.SphereGeometry(0.45, 16, 16);
    const bone = clay("#e8d9b8");
    const amber = clay("#ffc56b");
    for (let i = 0; i < 60; i++) {
      const zero = i % 7 === 0;
      const m = new THREE.Mesh(geo, zero ? amber : bone);
      const x = (i % 10) * 1.6 - 7.2;
      const z = Math.floor(i / 10) * 1.6 - 4;
      m.position.set(x, zero ? -3 : -3 + Math.max(0, 6 - Math.abs(x) * 0.5 + rand() * 2), z);
      g.add(m);
    }
    const base = new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 11), clay("#26282d"));
    base.position.y = -3.6;
    g.add(base);
    g.rotation.x = 0.35;
    anim.push((t) => {
      g.rotation.y = Math.sin(t * 0.3) * 0.5;
    });
  }
  // 8. The class: nine portrait discs with teal clay rims, in a slow ring; each disc stays upright.
  {
    const g = place(7, -1);
    const ring = new THREE.Group();
    g.add(ring);
    const loader = new THREE.TextureLoader();
    const rimMat = clay("#4fd1c5");
    opts.faces.forEach((src, k) => {
      const a = (k / opts.faces.length) * Math.PI * 2;
      const tex = loader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      const p = new THREE.Group();
      p.add(
        new THREE.Mesh(new THREE.CircleGeometry(2, 48), new THREE.MeshBasicMaterial({ map: tex })),
        new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.22, 16, 48), rimMat),
      );
      p.position.set(Math.cos(a) * 9, Math.sin(a) * 9, 0);
      ring.add(p);
    });
    anim.push((t) => {
      ring.rotation.z = t * 0.12;
      ring.children.forEach((c) => (c.rotation.z = -t * 0.12));
    });
  }
  // 9. By the Hậu River: an amber sun, the apple in orbit.
  {
    const g = place(8, 1);
    const s = ball(3.5, "#ffc56b", { emissive: "#ff8a2a", emissiveIntensity: 0.9 });
    const a = ball(1.4, "#e2483a");
    g.add(s, sprite("rgba(255,170,80,.8)", 20), a);
    anim.push((t) => {
      a.position.set(Math.cos(t * 0.7) * 8, Math.sin(t * 0.7) * 3, Math.sin(t * 0.7) * 8);
    });
  }

  // Scroll → target scene (0..8), with the reference line 15% down the viewport.
  let target = 0;
  let cur = 0;
  let shown = -1;
  const onScroll = () => {
    const secs = opts.sections();
    if (!secs.length) return;
    const y = opts.scroller.scrollTop + opts.scroller.clientHeight * 0.15;
    let k = 0;
    while (k < N - 1 && secs[k + 1] && y >= secs[k + 1]!.offsetTop) k++;
    const a = secs[k]!.offsetTop;
    const b = secs[k + 1] ? secs[k + 1]!.offsetTop : a + 1;
    target = Math.min(N - 1, k + Math.max(0, Math.min(1, (y - a) / (b - a))));
    const near = Math.round(target);
    if (near !== shown) {
      shown = near;
      opts.onScene?.(near);
    }
    kick();
  };
  opts.scroller.addEventListener("scroll", onScroll, { passive: true });

  const resize = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    R.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    stops.forEach((g) => {
      g.position.x = (g.userData.side as number) * (mobile() ? 0 : 14);
    });
    onScroll();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(host);

  const look = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let last = performance.now();
  let tt = 0;
  let raf = 0;
  let active = true;
  const frame = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const calm = opts.calm;
    tt += dt * (calm ? 0.25 : 1);
    const t = tt;
    cur += (target - cur) * (calm ? 0.2 : 0.06);
    const i = Math.min(N - 2, Math.floor(cur));
    const f = cur - i;
    const e = f * f * (3 - 2 * f);
    const A = stops[i]!.position;
    const B = stops[i + 1]!.position;
    const mob = mobile();
    const mx = THREE.MathUtils.lerp(A.x, B.x, e) * (mob ? 0 : 0.2);
    const hop = calm ? 0 : Math.sin(e * Math.PI);
    cam.position.set(
      mx + (calm ? 0 : Math.sin(t * 0.2) * 0.6),
      THREE.MathUtils.lerp(A.y, B.y, e) + 2 + hop * 6,
      THREE.MathUtils.lerp(A.z, B.z, e) + 30 - hop * 10,
    );
    tmp.lerpVectors(A, B, e);
    tmp.x = mx;
    look.lerp(tmp, calm ? 0.5 : 0.1);
    cam.lookAt(look);

    anim.forEach((fn) => fn(t));
    R.render(scene, cam);
    // Calm mode still eases to the scroll target, then stops drawing.
    if (active && (!calm || Math.abs(target - cur) > 0.001)) raf = requestAnimationFrame(frame);
  };
  function kick() {
    if (active && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  resize();
  kick();

  return {
    setActive(on) {
      if (on === active) return;
      active = on;
      if (on) kick();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      opts.scroller.removeEventListener("scroll", onScroll);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      textures.forEach((t) => t.dispose());
      R.dispose();
      el.remove();
    },
  };
}
