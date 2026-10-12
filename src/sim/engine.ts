/** Pixel-space Newtonian n-body. Leapfrog + Plummer softening. */

import { tr } from "../lib/prefs.ts";

export const G = 980;
export const EPS = 10;

export const MASS_PRESETS = [
  { id: "dust", label: "Bụi", en: "Dust", mass: 3 },
  { id: "moon", label: "Trăng", en: "Moon", mass: 16 },
  { id: "planet", label: "Hành tinh", en: "Planet", mass: 56 },
  { id: "giant", label: "Khổng lồ", en: "Giant", mass: 340 },
  { id: "star", label: "Sao", en: "Star", mass: 5600 },
] as const;

export type MassId = (typeof MASS_PRESETS)[number]["id"];

const PALETTE = ["#f3ece1", "#e7c27a", "#7ec8b8", "#e0a090", "#d4a04a", "#9ec4b6", "#f0dcc0"];

export type SlingTrack = {
  peerId: number;
  speedIn: number;
  headingIn: number;
  minDist: number;
};

export type Body = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  mass: number;
  radius: number;
  color: string;
  trail: Array<{ x: number; y: number }>;
  sling: SlingTrack | null;
  slingCooldown: number;
};

export type Fx = {
  kind: "spark" | "ring";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  radius: number;
};

export type CollisionMode = "merge" | "bounce";

export type Banner = { text: string; life: number };

const MAX_BODIES = 48;
const MAX_FX = 160;
const TRAIL_MAX = 380;
const PREVIEW_N = MAX_BODIES + 1;

export function radiusFor(mass: number): number {
  return Math.max(5.2, 2.8 + 2.05 * Math.cbrt(mass));
}

export function softenedAccel(mass: number, dist: number): number {
  const r2 = dist * dist + EPS * EPS;
  const inv = 1 / Math.sqrt(r2);
  return G * mass * inv * inv * inv * dist;
}

/** Circular speed around a fixed central mass, consistent with softening. */
export function circularSpeed(centralMass: number, radius: number): number {
  const accel = softenedAccel(centralMass, radius);
  return Math.sqrt(Math.max(0, accel * radius));
}

export class Simulation {
  bodies: Body[] = [];
  fx: Fx[] = [];
  nextId = 1;
  colorTick = 0;
  collision: CollisionMode = "merge";
  trails = true;
  timeScale = 1;
  paused = false;
  selectedId: number | null = null;
  banner: Banner | null = null;
  generation = 0;
  requestFit = false;
  frameLead = 0;
  /** Reused trajectory for the drag preview. `previewCount` is the live length. */
  preview: Array<{ x: number; y: number }> = [];
  previewCount = 0;
  private bannerCooldown = 0;
  private readonly sx = new Float64Array(PREVIEW_N);
  private readonly sy = new Float64Array(PREVIEW_N);
  private readonly svx = new Float64Array(PREVIEW_N);
  private readonly svy = new Float64Array(PREVIEW_N);
  private readonly sm = new Float64Array(PREVIEW_N);
  private readonly sr = new Float64Array(PREVIEW_N);
  private readonly sax = new Float64Array(PREVIEW_N);
  private readonly saccY = new Float64Array(PREVIEW_N);

  clear() {
    this.bodies = [];
    this.fx = [];
    this.selectedId = null;
    this.banner = null;
    this.generation += 1;
    this.requestFit = true;
    this.frameLead = 0;
  }

  add(spec: {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    mass: number;
    color?: string;
  }): Body | null {
    if (this.bodies.length >= MAX_BODIES) {
      this.say(tr("Bầu trời đã đầy", "The sky is full"));
      return null;
    }
    const mass = Math.max(0.4, spec.mass);
    const heavy = mass >= 1800;
    const body: Body = {
      id: this.nextId++,
      x: spec.x,
      y: spec.y,
      vx: spec.vx ?? 0,
      vy: spec.vy ?? 0,
      ax: 0,
      ay: 0,
      mass,
      radius: radiusFor(mass),
      color: spec.color ?? (heavy ? "#e7c27a" : PALETTE[this.colorTick++ % PALETTE.length]!),
      trail: [],
      sling: null,
      slingCooldown: 0,
    };
    if (heavy) body.color = spec.color ?? "#e7c27a";
    this.bodies.push(body);
    return body;
  }

  remove(id: number) {
    const i = this.bodies.findIndex((b) => b.id === id);
    if (i >= 0) this.bodies.splice(i, 1);
    if (this.selectedId === id) this.selectedId = null;
  }

  bodyAt(x: number, y: number, slop = 0): Body | null {
    let best: Body | null = null;
    let bestD = Infinity;
    for (const b of this.bodies) {
      const d = Math.hypot(b.x - x, b.y - y);
      const hit = b.radius + slop;
      if (d <= hit && d < bestD) {
        best = b;
        bestD = d;
      }
    }
    return best;
  }

  centerOfMass(): { x: number; y: number } | null {
    let m = 0;
    let x = 0;
    let y = 0;
    for (const b of this.bodies) {
      m += b.mass;
      x += b.mass * b.x;
      y += b.mass * b.y;
    }
    if (m <= 0) return null;
    return { x: x / m, y: y / m };
  }

  neutralizeMomentum() {
    let m = 0;
    let px = 0;
    let py = 0;
    for (const b of this.bodies) {
      m += b.mass;
      px += b.mass * b.vx;
      py += b.mass * b.vy;
    }
    if (m <= 0) return;
    const vx = px / m;
    const vy = py / m;
    for (const b of this.bodies) {
      b.vx -= vx;
      b.vy -= vy;
    }
  }

  dominantPeer(body: Body): { peer: Body; dist: number } | null {
    let best: Body | null = null;
    let bestScore = 0;
    let bestDist = 0;
    for (const o of this.bodies) {
      if (o.id === body.id) continue;
      const dist = Math.hypot(o.x - body.x, o.y - body.y);
      const score = o.mass / (dist * dist + EPS * EPS);
      if (score > bestScore) {
        bestScore = score;
        best = o;
        bestDist = dist;
      }
    }
    return best ? { peer: best, dist: bestDist } : null;
  }

  step(frameDt: number) {
    const dt = Math.min(Math.max(frameDt, 0), 0.05);
    if (this.banner) {
      this.banner.life -= dt;
      if (this.banner.life <= 0) this.banner = null;
    }
    this.bannerCooldown = Math.max(0, this.bannerCooldown - dt);

    if (!this.paused && this.bodies.length) {
      const scaled = dt * this.timeScale;
      const h0 = 1 / 120;
      let n = Math.max(1, Math.round(scaled / h0));
      if (n > 24) n = 24;
      const h = scaled / n;
      for (let i = 0; i < n; i++) {
        this.substep(h);
        this.sampleTrails();
      }
      this.detectSlingshots(scaled);
      this.cull();
    }

    const fxDt = this.paused ? dt : dt * Math.min(this.timeScale, 3);
    this.ageFx(fxDt);
  }

  private substep(h: number) {
    this.accelerate();
    const bodies = this.bodies;
    for (const b of bodies) {
      b.vx += b.ax * h * 0.5;
      b.vy += b.ay * h * 0.5;
      b.x += b.vx * h;
      b.y += b.vy * h;
    }
    this.collide();
    this.accelerate();
    for (const b of this.bodies) {
      b.vx += b.ax * h * 0.5;
      b.vy += b.ay * h * 0.5;
    }
  }

  private accelerate() {
    const bodies = this.bodies;
    for (const b of bodies) {
      b.ax = 0;
      b.ay = 0;
    }
    const n = bodies.length;
    for (let i = 0; i < n; i++) {
      const a = bodies[i]!;
      for (let j = i + 1; j < n; j++) {
        const b = bodies[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const r2 = dx * dx + dy * dy + EPS * EPS;
        const inv = 1 / Math.sqrt(r2);
        const invR3 = inv * inv * inv;
        const s = G * invR3;
        const ax = s * dx;
        const ay = s * dy;
        a.ax += ax * b.mass;
        a.ay += ay * b.mass;
        b.ax -= ax * a.mass;
        b.ay -= ay * a.mass;
      }
    }
  }

  private collide() {
    const bodies = this.bodies;
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i]!;
        const b = bodies[j]!;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let dist = Math.hypot(dx, dy);
        const min = a.radius + b.radius;
        if (dist < 1e-4) {
          dx = 1e-3;
          dy = 0;
          dist = 1e-3;
        }
        if (dist >= min) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        const reln = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
        if (reln >= 0) {
          this.separate(a, b, nx, ny, min - dist);
          continue;
        }
        if (this.collision === "merge") {
          this.merge(i, j);
          j -= 1;
        } else {
          const e = 0.82;
          const invM = 1 / a.mass + 1 / b.mass;
          const impulse = (-(1 + e) * reln) / invM;
          a.vx -= (impulse / a.mass) * nx;
          a.vy -= (impulse / a.mass) * ny;
          b.vx += (impulse / b.mass) * nx;
          b.vy += (impulse / b.mass) * ny;
          this.separate(a, b, nx, ny, min - dist);
          this.burst((a.x + b.x) / 2, (a.y + b.y) / 2, "#e0a090", 8);
          this.say(tr("Va chạm đàn hồi", "Elastic collision"));
        }
      }
    }
  }

  private separate(a: Body, b: Body, nx: number, ny: number, depth: number) {
    const tm = a.mass + b.mass;
    const push = depth + 0.35;
    a.x -= nx * push * (b.mass / tm);
    a.y -= ny * push * (b.mass / tm);
    b.x += nx * push * (a.mass / tm);
    b.y += ny * push * (a.mass / tm);
  }

  private merge(i: number, j: number) {
    const bodies = this.bodies;
    const a = bodies[i];
    const b = bodies[j];
    if (!a || !b) return;
    const mass = a.mass + b.mass;
    const x = (a.x * a.mass + b.x * b.mass) / mass;
    const y = (a.y * a.mass + b.y * b.mass) / mass;
    const vx = (a.vx * a.mass + b.vx * b.mass) / mass;
    const vy = (a.vy * a.mass + b.vy * b.mass) / mass;
    const keeper = a.mass >= b.mass ? a : b;
    const other = keeper === a ? b : a;
    keeper.x = x;
    keeper.y = y;
    keeper.vx = vx;
    keeper.vy = vy;
    keeper.mass = mass;
    keeper.radius = radiusFor(mass);
    keeper.trail = [];
    keeper.sling = null;
    if (keeper.mass >= 1800) keeper.color = "#e7c27a";
    if (this.selectedId === other.id) this.selectedId = keeper.id;
    const idx = bodies.indexOf(other);
    if (idx >= 0) bodies.splice(idx, 1);
    this.burst(x, y, keeper.color, 16);
    this.fx.push({
      kind: "ring",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.7,
      max: 0.7,
      color: keeper.color,
      radius: keeper.radius,
    });
    this.say(tr(`Hợp nhất · khối lượng ${Math.round(mass)}`, `Merged · mass ${Math.round(mass)}`));
  }

  private burst(x: number, y: number, color: string, n: number) {
    for (let k = 0; k < n; k++) {
      if (this.fx.length >= MAX_FX) this.fx.shift();
      const ang = (k / n) * Math.PI * 2 + Math.random() * 0.2;
      const sp = 20 + Math.random() * 70;
      this.fx.push({
        kind: "spark",
        x,
        y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 0.45 + Math.random() * 0.35,
        max: 0.8,
        color,
        radius: 1.4 + Math.random() * 1.8,
      });
    }
  }

  private sampleTrails() {
    if (!this.trails) {
      for (const b of this.bodies) b.trail.length = 0;
      return;
    }
    const cap = this.bodies.length > 24 ? 90 : TRAIL_MAX;
    for (const b of this.bodies) {
      const last = b.trail[b.trail.length - 1];
      if (last && (b.x - last.x) * (b.x - last.x) + (b.y - last.y) * (b.y - last.y) < 2.56) continue;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > cap) b.trail.splice(0, b.trail.length - cap);
    }
  }

  private detectSlingshots(dt: number) {
    for (const b of this.bodies) b.slingCooldown = Math.max(0, b.slingCooldown - dt);
    for (const b of this.bodies) {
      let peer: Body | null = null;
      let best = 0;
      let dist = 0;
      for (const o of this.bodies) {
        if (o.id === b.id) continue;
        if (o.mass < b.mass * 6) continue;
        const d = Math.hypot(o.x - b.x, o.y - b.y);
        const reach = 150 + o.radius * 3.2;
        if (d > reach) continue;
        const influence = o.mass / (d * d + 1);
        if (influence > best) {
          best = influence;
          peer = o;
          dist = d;
        }
      }
      if (!peer) {
        if (b.sling) this.finishSling(b);
        b.sling = null;
        continue;
      }
      const speed = Math.hypot(b.vx, b.vy);
      const heading = Math.atan2(b.vy, b.vx);
      if (!b.sling || b.sling.peerId !== peer.id) {
        b.sling = { peerId: peer.id, speedIn: speed, headingIn: heading, minDist: dist };
      } else if (dist < b.sling.minDist) {
        b.sling.minDist = dist;
      }
    }
  }

  private finishSling(b: Body) {
    const s = b.sling;
    if (!s || b.slingCooldown > 0) return;
    const speed = Math.hypot(b.vx, b.vy);
    const heading = Math.atan2(b.vy, b.vx);
    let turn = Math.abs(heading - s.headingIn);
    if (turn > Math.PI) turn = Math.PI * 2 - turn;
    const gain = (speed - s.speedIn) / Math.max(12, s.speedIn);
    const peer = this.bodies.find((p) => p.id === s.peerId);
    const reach = peer ? 150 + peer.radius * 3.2 : 260;
    if (turn > 0.28 && gain > 0.08 && s.minDist < reach * 0.92) {
      b.slingCooldown = 3.5;
      this.say(tr(`Ná hấp dẫn · nhanh hơn ${Math.round(gain * 100)}%`, `Gravity assist · ${Math.round(gain * 100)}% faster`));
      this.burst(b.x, b.y, "#8fd4c0", 12);
    }
  }

  /**
   * Gravity-only future of a body about to be launched or re-flung.
   * Does not mutate the live system. Stops if the ghost would touch another body.
   * Returns the number of points written into `preview`.
   */
  predict(
    ghost: { x: number; y: number; vx: number; vy: number; mass: number; replaceId?: number },
    seconds = 3.1,
  ): number {
    const src = this.bodies;
    const X = this.sx;
    const Y = this.sy;
    const VX = this.svx;
    const VY = this.svy;
    const M = this.sm;
    const R = this.sr;
    let n = 0;
    let ghostIndex = -1;
    for (let i = 0; i < src.length; i++) {
      const b = src[i]!;
      if (ghost.replaceId === b.id) {
        X[n] = ghost.x;
        Y[n] = ghost.y;
        VX[n] = ghost.vx;
        VY[n] = ghost.vy;
        M[n] = b.mass;
        R[n] = b.radius;
        ghostIndex = n;
      } else {
        X[n] = b.x;
        Y[n] = b.y;
        VX[n] = b.vx;
        VY[n] = b.vy;
        M[n] = b.mass;
        R[n] = b.radius;
      }
      n++;
    }
    if (ghostIndex < 0) {
      if (n >= PREVIEW_N) {
        this.previewCount = 0;
        return 0;
      }
      X[n] = ghost.x;
      Y[n] = ghost.y;
      VX[n] = ghost.vx;
      VY[n] = ghost.vy;
      M[n] = Math.max(0.4, ghost.mass);
      R[n] = radiusFor(M[n]);
      ghostIndex = n;
      n++;
    }
    const h = 1 / 48;
    const steps = Math.min(150, Math.max(8, Math.round(seconds / h)));
    const pts = this.preview;
    const AX = this.sax;
    const AY = this.saccY;
    let count = 0;
    const push = () => {
      const slot = pts[count] ?? { x: 0, y: 0 };
      slot.x = X[ghostIndex]!;
      slot.y = Y[ghostIndex]!;
      pts[count] = slot;
      count++;
    };
    push();
    for (let s = 0; s < steps; s++) {
      this.accelArrays(n, X, Y, M, AX, AY);
      for (let i = 0; i < n; i++) {
        VX[i] = VX[i]! + AX[i]! * h * 0.5;
        VY[i] = VY[i]! + AY[i]! * h * 0.5;
        X[i] = X[i]! + VX[i]! * h;
        Y[i] = Y[i]! + VY[i]! * h;
      }
      let hit = false;
      const gx = X[ghostIndex]!;
      const gy = Y[ghostIndex]!;
      const gr = R[ghostIndex]!;
      for (let j = 0; j < n; j++) {
        if (j === ghostIndex) continue;
        const dx = gx - X[j]!;
        const dy = gy - Y[j]!;
        const min = gr + R[j]!;
        if (dx * dx + dy * dy < min * min) {
          hit = true;
          break;
        }
      }
      this.accelArrays(n, X, Y, M, AX, AY);
      for (let i = 0; i < n; i++) {
        VX[i] = VX[i]! + AX[i]! * h * 0.5;
        VY[i] = VY[i]! + AY[i]! * h * 0.5;
      }
      if (hit || (s & 1) === 1) push();
      if (hit) break;
    }
    this.previewCount = count;
    return count;
  }

  private accelArrays(
    n: number,
    X: Float64Array,
    Y: Float64Array,
    M: Float64Array,
    AX: Float64Array,
    AY: Float64Array,
  ) {
    for (let i = 0; i < n; i++) {
      AX[i] = 0;
      AY[i] = 0;
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = X[j]! - X[i]!;
        const dy = Y[j]! - Y[i]!;
        const r2 = dx * dx + dy * dy + EPS * EPS;
        const inv = 1 / Math.sqrt(r2);
        const s = G * inv * inv * inv;
        const ax = s * dx;
        const ay = s * dy;
        AX[i] = AX[i]! + ax * M[j]!;
        AY[i] = AY[i]! + ay * M[j]!;
        AX[j] = AX[j]! - ax * M[i]!;
        AY[j] = AY[j]! - ay * M[i]!;
      }
    }
  }

  private cull() {
    const com = this.centerOfMass();
    if (!com) return;
    this.bodies = this.bodies.filter((b) => {
      const far = Math.hypot(b.x - com.x, b.y - com.y) > 14000;
      const fast = b.vx * b.vx + b.vy * b.vy > 2800 * 2800;
      if ((far || fast) && this.selectedId === b.id) this.selectedId = null;
      return !far && !fast;
    });
  }

  private ageFx(dt: number) {
    for (const f of this.fx) {
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= 0.98;
      f.vy *= 0.98;
    }
    if (this.fx.some((f) => f.life <= 0)) this.fx = this.fx.filter((f) => f.life > 0);
  }

  private say(text: string) {
    if (this.bannerCooldown > 0 && this.banner?.text === text) return;
    this.banner = { text, life: 2.4 };
    this.bannerCooldown = 0.35;
  }
}
