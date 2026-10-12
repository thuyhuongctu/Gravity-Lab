// Shared clay-noir set: renderer, clay material, one warm spotlight, a cool rim,
// little ambient, then vignette and film grain over the frame.
import * as THREE from "three";

export function stage({ width, height, bg = 0x0b0a1f, exposure = 1.0 }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.position = "absolute";
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, 18, 42);
  return { renderer, scene, width, height };
}

function grainTexture(seed = 1) {
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
const bump = grainTexture(7);

export const clay = (color, rough = 0.86, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, bumpMap: bump, bumpScale: 1.1, ...extra });

/** Noir lighting: a warm spot from upper left, a cool rim from behind right, a low fill. */
export function lights(scene, { target = new THREE.Vector3(0, 0, 0), spotPos = [-6, 9, 8], spot = 260, rim = 2.2, fill = 0.25, angle = 0.42, shadowSize = 6 } = {}) {
  scene.add(new THREE.HemisphereLight(0x3a3380, 0x05040f, fill));
  const key = new THREE.SpotLight(0xffd9a8, spot, 0, angle, 0.55, 2);
  key.position.set(...spotPos);
  key.target.position.copy(target);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 4;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.03;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 60;
  scene.add(key, key.target);
  const rimLight = new THREE.DirectionalLight(0x9d7bff, rim);
  rimLight.position.set(6, 4, -7);
  scene.add(rimLight);
  void shadowSize;
  return { key, rimLight };
}

/** Vignette and film grain, drawn on a 2D canvas laid over the WebGL frame. */
export function finish({ width, height }, { vignette = 0.72, grain = 0.06 } = {}) {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  c.style.position = "absolute";
  document.body.appendChild(c);
  const g = c.getContext("2d");
  const r = Math.hypot(width, height) / 2;
  const v = g.createRadialGradient(width / 2, height * 0.46, r * 0.35, width / 2, height / 2, r);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, `rgba(0,0,0,${vignette})`);
  g.fillStyle = v;
  g.fillRect(0, 0, width, height);
  const img = g.getImageData(0, 0, width, height);
  let s = 11;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 255 * grain;
    if (n > 0) {
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
      img.data[i + 3] = Math.max(img.data[i + 3], Math.abs(n) * 1.4);
    } else {
      img.data[i + 3] = Math.max(img.data[i + 3], Math.abs(n) * 1.4);
    }
  }
  g.putImageData(img, 0, 0);
}

export function done() {
  window.done = true;
}
