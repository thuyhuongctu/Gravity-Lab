import { circularSpeed, softenedAccel, type Simulation } from "@/sim/engine";

export type SceneId = "solar" | "binary" | "sling" | "flower" | "cloud" | "empty";

export const SCENES: Array<{ id: SceneId; name: string; blurb: string }> = [
  {
    id: "solar",
    name: "Hệ sao",
    blurb: "Ba hành tinh trên quỹ đạo gần tròn. Kéo một vật để phá quỹ đạo.",
  },
  {
    id: "flower",
    name: "Hoa",
    blurb: "Ba elip lệch tâm. Vệt khép thành những vành hoa.",
  },
  {
    id: "binary",
    name: "Sao đôi",
    blurb: "Hai sao quay quanh khối tâm, một hành tinh ở ngoài.",
  },
  {
    id: "sling",
    name: "Ná hấp dẫn",
    blurb: "Tàu nhẹ lướt sau một hành tinh đang chuyển động và được ném nhanh hơn.",
  },
  {
    id: "cloud",
    name: "Đám mây",
    blurb: "Đám bụi có ít mô-men quay, dần cụm lại và hợp nhất.",
  },
  {
    id: "empty",
    name: "Trống",
    blurb: "Chạm khoảng trống, kéo rồi thả. Hướng kéo là hướng vận tốc.",
  },
];

function binarySpeed(otherMass: number, separation: number): number {
  const accel = softenedAccel(otherMass, separation);
  return Math.sqrt(Math.max(0, accel * (separation / 2)));
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function loadScene(sim: Simulation, id: SceneId) {
  sim.clear();
  if (id === "solar") {
    const star = 5200;
    sim.add({ x: 0, y: 0, mass: star, color: "#e7c27a" });
    const orbits: Array<[number, number, number, string]> = [
      [124, 12, 0.35, "#f3ece1"],
      [210, 26, 2.15, "#7ec8b8"],
      [318, 48, 4.05, "#e0a090"],
    ];
    for (const [r, mass, ang, color] of orbits) {
      const v = circularSpeed(star, r);
      sim.add({
        x: Math.cos(ang) * r,
        y: Math.sin(ang) * r,
        vx: -Math.sin(ang) * v,
        vy: Math.cos(ang) * v,
        mass,
        color,
      });
    }
  } else if (id === "flower") {
    const star = 5200;
    sim.add({ x: 0, y: 0, mass: star, color: "#e7c27a" });
    const petals: Array<[number, number, number, number, string]> = [
      [120, 0.26, 0.3, 16, "#f3ece1"],
      [198, 0.2, 2.4, 28, "#7ec8b8"],
      [286, 0.15, 4.4, 44, "#e0a090"],
    ];
    for (const [a, e, ang, mass, color] of petals) {
      const r = a * (1 - e);
      const v = circularSpeed(star, r) * Math.sqrt(Math.max(0.2, 2 - r / a));
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      sim.add({
        x: c * r,
        y: s * r,
        vx: -s * v,
        vy: c * v,
        mass,
        color,
      });
    }
  } else if (id === "binary") {
    const m = 2100;
    const sep = 172;
    const v = binarySpeed(m, sep);
    sim.add({ x: -sep / 2, y: 0, vx: 0, vy: v, mass: m, color: "#e7c27a" });
    sim.add({ x: sep / 2, y: 0, vx: 0, vy: -v, mass: m, color: "#e0a090" });
    const planetR = 292;
    const vp = circularSpeed(m * 2, planetR);
    sim.add({ x: planetR, y: 0, vx: 0, vy: vp, mass: 12, color: "#7ec8b8" });
  } else if (id === "sling") {
    // Probe catches a planet from the flank and leaves faster — measured flyby.
    sim.add({ x: 0, y: 0, vx: 0, vy: 160, mass: 3800, color: "#e7c27a" });
    sim.add({ x: -820, y: 140, vx: 230, vy: 90, mass: 4, color: "#8fd4c0" });
    sim.frameLead = 3;
  } else if (id === "cloud") {
    const rand = mulberry32(11);
    const n = 22;
    const spread = 240;
    for (let i = 0; i < n; i++) {
      const ang = rand() * Math.PI * 2;
      const rad = 40 + rand() * spread;
      const mass = 5 + rand() * 14;
      const tangential = circularSpeed(n * 8, rad) * (0.28 + rand() * 0.22);
      const jitter = (rand() - 0.5) * 8;
      sim.add({
        x: Math.cos(ang) * rad,
        y: Math.sin(ang) * rad,
        vx: -Math.sin(ang) * tangential + jitter,
        vy: Math.cos(ang) * tangential + (rand() - 0.5) * 8,
        mass,
      });
    }
  }
  if (id !== "sling") sim.neutralizeMomentum();
  sim.generation += 1;
  sim.requestFit = true;
}
