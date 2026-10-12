import { useEffect, useRef } from "react";
import { circularSpeed, EPS, radiusFor, type Simulation } from "@/sim/engine";
import { paint, paintA } from "@/lib/paint";
import { tr } from "@/lib/prefs";
import { orbitFrame } from "@/lib/sound";

const LAUNCH = 1.55;

export type OrbitSnap = {
  count: number;
  banner: string | null;
  selected: {
    mass: number;
    speed: number;
    vCirc: number | null;
    vEsc: number | null;
    bound: boolean | null;
  } | null;
};

type Props = {
  sim: Simulation;
  active: boolean;
  mass: number;
  panMode: boolean;
  follow: boolean;
  onFollowChange: (next: boolean) => void;
  onSnapshot: (snap: OrbitSnap) => void;
  onSpawn: () => void;
};

type Cam = { x: number; y: number; k: number };

type Gesture =
  | {
      kind: "spawn" | "fling";
      pointerId: number;
      bodyId?: number;
      ox: number;
      oy: number;
      x: number;
      y: number;
    }
  | {
      kind: "pan";
      pointerId: number;
      ox: number;
      oy: number;
      camX: number;
      camY: number;
    }
  | {
      kind: "pinch";
      dist: number;
      midX: number;
      midY: number;
      camK: number;
      camX: number;
      camY: number;
    };

function hexAlpha(hex: string, a: number): string {
  return paintA(hex, a);
}

type Aim =
  | { kind: "still"; text: string }
  | { kind: "free"; text: string }
  | { kind: "fall" | "orbit" | "escape"; text: string; vc: number; ve: number };

const AIM_COLOR = {
  still: "#c4bbb0",
  free: "#c4bbb0",
  fall: "#e0a090",
  orbit: "#8fd4c0",
  escape: "#e7c27a",
} as const;

function aimOf(sim: Simulation, x: number, y: number, vx: number, vy: number, ignoreId?: number): Aim {
  const speed = Math.hypot(vx, vy);
  let best: { mass: number; dist: number } | null = null;
  let score = 0;
  for (const b of sim.bodies) {
    if (b.id === ignoreId) continue;
    const dist = Math.hypot(b.x - x, b.y - y);
    const s = b.mass / (dist * dist + EPS * EPS);
    if (s > score && dist > b.radius * 0.85) {
      score = s;
      best = { mass: b.mass, dist };
    }
  }
  if (speed < 8) return { kind: "still", text: tr("Đứng yên — sẽ bị kéo vào", "At rest — will be pulled in") };
  if (!best) return { kind: "free", text: tr("Trôi tự do", "Drifting free") };
  const vc = circularSpeed(best.mass, best.dist);
  const ve = vc * Math.SQRT2;
  if (speed < vc * 0.72) return { kind: "fall", text: tr("Chậm — dễ rơi vào", "Slow — likely to fall in"), vc, ve };
  if (speed < ve * 0.98) return { kind: "orbit", text: tr("Trong cửa sổ quỹ đạo", "Inside the orbit window"), vc, ve };
  return { kind: "escape", text: tr("Nhanh — có thể thoát ly", "Fast — may escape"), vc, ve };
}

function mix(hex: string, toward: number, t: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const ch = (shift: number) => {
    const c = (n >> shift) & 255;
    return Math.round(c + (toward - c) * t);
  };
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export function OrbitCanvas({
  sim,
  active,
  mass,
  panMode,
  follow,
  onFollowChange,
  onSnapshot,
  onSpawn,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ mass, panMode, follow, onFollowChange, onSnapshot, onSpawn, active });
  propsRef.current = { mass, panMode, follow, onFollowChange, onSnapshot, onSpawn, active };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cam: Cam = { x: 0, y: 0, k: 1 };
    let viewW = 1;
    let viewH = 1;
    let dpr = 1;
    let gesture: Gesture | null = null;
    const pointers = new Map<number, { x: number; y: number }>();
    let raf = 0;
    let last = performance.now();
    let lastSnap = 0;
    let fittedGen = -1;
    const stars = Array.from({ length: 72 }, (_, i) => ({
      x: ((i * 97) % 100) / 100,
      y: ((i * 53) % 100) / 100,
      r: 0.4 + (i % 5) * 0.22,
      a: 0.15 + (i % 7) * 0.06,
    }));

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = rect.width;
      viewH = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    const toWorld = (x: number, y: number) => ({
      x: (x - viewW / 2) / cam.k + cam.x,
      y: (y - viewH / 2) / cam.k + cam.y,
    });

    const toScreen = (x: number, y: number) => ({
      x: (x - cam.x) * cam.k + viewW / 2,
      y: (y - cam.y) * cam.k + viewH / 2,
    });

    const localOf = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const fit = () => {
      const bodies = sim.bodies;
      if (!bodies.length) {
        cam.x = 0;
        cam.y = 0;
        cam.k = 1;
        return;
      }
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const lead = sim.frameLead;
      const cap = lead > 0 ? 560 : 0;
      for (const b of bodies) {
        const dx = Math.max(-cap, Math.min(cap, b.vx * lead));
        const dy = Math.max(-cap, Math.min(cap, b.vy * lead));
        minX = Math.min(minX, b.x - b.radius, b.x + dx - b.radius);
        maxX = Math.max(maxX, b.x + b.radius, b.x + dx + b.radius);
        minY = Math.min(minY, b.y - b.radius, b.y + dy - b.radius);
        maxY = Math.max(maxY, b.y + b.radius, b.y + dy + b.radius);
      }
      const bw = Math.max(120, maxX - minX);
      const bh = Math.max(120, maxY - minY);
      cam.x = (minX + maxX) / 2;
      cam.y = (minY + maxY) / 2;
      cam.k = Math.min(4, Math.max(0.08, Math.min(viewW / (bw + 96), viewH / (bh + 96))));
    };

    const zoomAt = (sx: number, sy: number, factor: number) => {
      const next = Math.min(4.5, Math.max(0.08, cam.k * factor));
      const world = toWorld(sx, sy);
      cam.k = next;
      cam.x = world.x - (sx - viewW / 2) / cam.k;
      cam.y = world.y - (sy - viewH / 2) / cam.k;
      if (propsRef.current.follow) propsRef.current.onFollowChange(false);
    };

    const publish = (force = false) => {
      const now = performance.now();
      if (!force && now - lastSnap < 120) return;
      lastSnap = now;
      const selected = sim.bodies.find((b) => b.id === sim.selectedId) ?? null;
      let card: OrbitSnap["selected"] = null;
      if (selected) {
        const peer = sim.dominantPeer(selected);
        const speed = Math.hypot(selected.vx, selected.vy);
        if (peer && peer.dist > 1) {
          const vCirc = circularSpeed(peer.peer.mass, peer.dist);
          const vEsc = vCirc * Math.SQRT2;
          card = { mass: selected.mass, speed, vCirc, vEsc, bound: speed < vEsc };
        } else {
          card = { mass: selected.mass, speed, vCirc: null, vEsc: null, bound: null };
        }
      }
      propsRef.current.onSnapshot({
        count: sim.bodies.length,
        banner: sim.banner?.text ?? null,
        selected: card,
      });
    };

    const drawArrow = (x0: number, y0: number, x1: number, y1: number) => {
      const ang = Math.atan2(y1 - y0, x1 - x0);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      const len = Math.hypot(x1 - x0, y1 - y0);
      if (len < 10) return;
      const ah = 10;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - ah * Math.cos(ang - 0.42), y1 - ah * Math.sin(ang - 0.42));
      ctx.lineTo(x1 - ah * Math.cos(ang + 0.42), y1 - ah * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = paint("#101614");
      ctx.fillRect(0, 0, viewW, viewH);

      for (const s of stars) {
        ctx.fillStyle = paintA("#f3ece1", s.a);
        ctx.beginPath();
        ctx.arc(s.x * viewW, s.y * viewH, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const com = sim.centerOfMass();
      if (com) {
        ctx.strokeStyle = paintA("#f3ece1", 0.06);
        ctx.lineWidth = 1;
        for (const r of [120, 240, 420, 680]) {
          const p = toScreen(com.x, com.y);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * cam.k, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const b of sim.bodies) {
        const n = b.trail.length;
        if (n < 2) continue;
        const buckets = 8;
        const width = Math.max(1.35, Math.min(4.2, b.radius * cam.k * 0.28));
        for (let k = 0; k < buckets; k++) {
          const i0 = Math.floor((k * (n - 1)) / buckets);
          const i1 = Math.floor(((k + 1) * (n - 1)) / buckets);
          if (i1 <= i0) continue;
          ctx.beginPath();
          const p0 = toScreen(b.trail[i0]!.x, b.trail[i0]!.y);
          ctx.moveTo(p0.x, p0.y);
          for (let i = i0 + 1; i <= i1; i++) {
            const p = toScreen(b.trail[i]!.x, b.trail[i]!.y);
            ctx.lineTo(p.x, p.y);
          }
          ctx.strokeStyle = hexAlpha(b.color, 0.1 + 0.82 * ((k + 1) / buckets));
          ctx.lineWidth = width;
          ctx.stroke();
        }
      }

      for (const b of sim.bodies) {
        const p = toScreen(b.x, b.y);
        const worldR = b.radius * cam.k;
        const r = Math.max(worldR, b.mass >= 1800 ? 18 : 11);
        const glow = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * (b.mass > 1500 ? 3.4 : 2.6));
        glow.addColorStop(0, hexAlpha(b.color, b.mass > 1500 ? 0.5 : 0.32));
        glow.addColorStop(1, hexAlpha(b.color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * (b.mass > 1500 ? 3.4 : 2.6), 0, Math.PI * 2);
        ctx.fill();
        const marble = ctx.createRadialGradient(p.x - r * 0.34, p.y - r * 0.38, r * 0.08, p.x, p.y, r);
        marble.addColorStop(0, mix(paint(b.color), 255, 0.55));
        marble.addColorStop(0.55, paint(b.color));
        marble.addColorStop(1, mix(paint(b.color), 16, 0.45));
        ctx.fillStyle = marble;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (b.id === sim.selectedId) {
          ctx.strokeStyle = paint("#f3ece1");
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      for (const f of sim.fx) {
        const p = toScreen(f.x, f.y);
        const alpha = Math.max(0, f.life / f.max);
        if (f.kind === "ring") {
          const rr = f.radius * cam.k * (1 + (1 - alpha) * 3.2);
          ctx.strokeStyle = hexAlpha(f.color, alpha * 0.8);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = hexAlpha(f.color, alpha);
          ctx.beginPath();
          ctx.arc(p.x, p.y, f.radius * cam.k, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const drag = gesture;
      if (drag && (drag.kind === "spawn" || drag.kind === "fling")) {
        const origin =
          drag.kind === "fling" ? sim.bodies.find((b) => b.id === drag.bodyId) : null;
        const ow =
          drag.kind === "spawn"
            ? toWorld(drag.ox, drag.oy)
            : origin
              ? { x: origin.x, y: origin.y }
              : null;
        if (ow) {
          const a = toScreen(ow.x, ow.y);
          const bw = toWorld(drag.x, drag.y);
          const bpt = toScreen(bw.x, bw.y);
          const vx = (bw.x - ow.x) * LAUNCH;
          const vy = (bw.y - ow.y) * LAUNCH;
          const ignore = drag.kind === "fling" ? drag.bodyId : undefined;
          const aim = aimOf(sim, ow.x, ow.y, vx, vy, ignore);
          const ink = paint(AIM_COLOR[aim.kind]);
          const mass = drag.kind === "spawn" ? propsRef.current.mass : (origin?.mass ?? propsRef.current.mass);
          const count = sim.predict(
            { x: ow.x, y: ow.y, vx, vy, mass, replaceId: ignore },
            3.1,
          );
          if (count > 1) {
            ctx.beginPath();
            const p0 = toScreen(sim.preview[0]!.x, sim.preview[0]!.y);
            ctx.moveTo(p0.x, p0.y);
            for (let i = 1; i < count; i++) {
              const p = toScreen(sim.preview[i]!.x, sim.preview[i]!.y);
              ctx.lineTo(p.x, p.y);
            }
            ctx.strokeStyle = hexAlpha(ink, 0.85);
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
            const end = toScreen(sim.preview[count - 1]!.x, sim.preview[count - 1]!.y);
            ctx.fillStyle = ink;
            ctx.beginPath();
            ctx.arc(end.x, end.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          const span = Math.hypot(bw.x - ow.x, bw.y - ow.y);
          if (span > 6 && (aim.kind === "fall" || aim.kind === "orbit" || aim.kind === "escape")) {
            const ux = (bw.x - ow.x) / span;
            const uy = (bw.y - ow.y) / span;
            const tick = (speed: number, label: string) => {
              const wx = ow.x + ux * (speed / LAUNCH);
              const wy = ow.y + uy * (speed / LAUNCH);
              const p = toScreen(wx, wy);
              if (p.x < -40 || p.y < -40 || p.x > viewW + 40 || p.y > viewH + 40) return;
              const px = -uy;
              const py = ux;
              ctx.strokeStyle = hexAlpha(ink, 0.9);
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(p.x - px * 7, p.y - py * 7);
              ctx.lineTo(p.x + px * 7, p.y + py * 7);
              ctx.stroke();
              ctx.font = "500 11px 'Be Vietnam Pro', sans-serif";
              ctx.fillStyle = paint("#f3ece1");
              ctx.fillText(label, p.x + 8, p.y - 6);
            };
            tick(aim.vc, tr("vòng", "circular"));
            tick(aim.ve, tr("thoát", "escape"));
          }
          ctx.strokeStyle = ink;
          ctx.fillStyle = ink;
          ctx.lineWidth = 1.75;
          drawArrow(a.x, a.y, bpt.x, bpt.y);
          if (drag.kind === "spawn") {
            const r = Math.max(7, radiusFor(propsRef.current.mass) * cam.k);
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.font = "500 13px 'Be Vietnam Pro', sans-serif";
          ctx.fillStyle = paint("#f3ece1");
          ctx.fillText(aim.text, bpt.x + 10, bpt.y - 8);
        }
      }
    };

    const finishGesture = (g: Extract<Gesture, { kind: "spawn" | "fling" }>) => {
      const screenDrag = Math.hypot(g.x - g.ox, g.y - g.oy);
      if (g.kind === "fling") {
        const body = sim.bodies.find((b) => b.id === g.bodyId);
        if (!body) return;
        sim.selectedId = body.id;
        if (screenDrag < 8) {
          publish(true);
          return;
        }
        const w = toWorld(g.x, g.y);
        body.vx = (w.x - body.x) * LAUNCH;
        body.vy = (w.y - body.y) * LAUNCH;
        body.trail = [];
        publish(true);
        return;
      }
      const origin = toWorld(g.ox, g.oy);
      const w = toWorld(g.x, g.y);
      const vx = screenDrag < 8 ? 0 : (w.x - origin.x) * LAUNCH;
      const vy = screenDrag < 8 ? 0 : (w.y - origin.y) * LAUNCH;
      const body = sim.add({ x: origin.x, y: origin.y, vx, vy, mass: propsRef.current.mass });
      if (body) {
        sim.selectedId = body.id;
        propsRef.current.onSpawn();
      }
      publish(true);
    };

    const onDown = (e: PointerEvent) => {
      if (e.button === 2) e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = localOf(e);
      pointers.set(e.pointerId, p);
      if (pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        gesture = {
          kind: "pinch",
          dist: Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)),
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
          camK: cam.k,
          camX: cam.x,
          camY: cam.y,
        };
        return;
      }
      if (e.button === 1 || e.button === 2 || e.shiftKey || propsRef.current.panMode) {
        gesture = { kind: "pan", pointerId: e.pointerId, ox: p.x, oy: p.y, camX: cam.x, camY: cam.y };
        if (propsRef.current.follow) propsRef.current.onFollowChange(false);
        return;
      }
      const world = toWorld(p.x, p.y);
      const hit = sim.bodyAt(world.x, world.y, 18 / cam.k);
      if (hit) {
        gesture = { kind: "fling", pointerId: e.pointerId, bodyId: hit.id, ox: p.x, oy: p.y, x: p.x, y: p.y };
        sim.selectedId = hit.id;
        publish(true);
      } else {
        gesture = { kind: "spawn", pointerId: e.pointerId, ox: p.x, oy: p.y, x: p.x, y: p.y };
      }
    };

    const onMove = (e: PointerEvent) => {
      const p = localOf(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (!gesture) return;
      if (gesture.kind === "pinch" && pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        const dist = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        const factor = dist / gesture.dist;
        cam.k = Math.min(4.5, Math.max(0.08, gesture.camK * factor));
        const worldMidX = (gesture.midX - viewW / 2) / gesture.camK + gesture.camX;
        const worldMidY = (gesture.midY - viewH / 2) / gesture.camK + gesture.camY;
        cam.x = worldMidX - (midX - viewW / 2) / cam.k - (midX - gesture.midX) / cam.k;
        cam.y = worldMidY - (midY - viewH / 2) / cam.k - (midY - gesture.midY) / cam.k;
        if (propsRef.current.follow) propsRef.current.onFollowChange(false);
        return;
      }
      if (gesture.kind === "pan" && gesture.pointerId === e.pointerId) {
        cam.x = gesture.camX - (p.x - gesture.ox) / cam.k;
        cam.y = gesture.camY - (p.y - gesture.oy) / cam.k;
        return;
      }
      if ((gesture.kind === "spawn" || gesture.kind === "fling") && gesture.pointerId === e.pointerId) {
        gesture.x = p.x;
        gesture.y = p.y;
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (gesture?.kind === "pinch") {
        if (pointers.size < 2) gesture = null;
        return;
      }
      if (gesture && "pointerId" in gesture && gesture.pointerId === e.pointerId) {
        if (gesture.kind === "spawn" || gesture.kind === "fling") finishGesture(gesture);
        gesture = null;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = localOf(e as unknown as PointerEvent);
      const factor = Math.exp(-e.deltaY * 0.0011);
      zoomAt(p.x, p.y, factor);
    };

    const onContext = (e: Event) => e.preventDefault();

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (propsRef.current.active) {
        if (sim.requestFit || sim.generation !== fittedGen) {
          if (viewW > 2) {
            fit();
            sim.requestFit = false;
            fittedGen = sim.generation;
          }
        }
        sim.step(dt);
        if (propsRef.current.follow) {
          const com = sim.centerOfMass();
          if (com) {
            const t = 1 - Math.exp(-3.2 * dt);
            cam.x += (com.x - cam.x) * t;
            cam.y += (com.y - cam.y) * t;
          }
        }
        publish();
      }
      orbitFrame(sim.bodies, propsRef.current.active && !sim.paused, now);
      draw();
      raf = requestAnimationFrame(loop);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("contextmenu", onContext);
    raf = requestAnimationFrame(loop);

    const w = window as Window & { __grav?: Record<string, unknown> };
    const prev = w.__grav ?? {};
    w.__grav = {
      ...prev,
      count: () => sim.bodies.length,
      banner: () => sim.banner?.text ?? "",
      paused: () => sim.paused,
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [sim]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      role="application"
      aria-label={tr(
        "Mô phỏng quỹ đạo. Chạm chỗ trống và kéo để phóng thiên thể. Kéo một thiên thể để đặt vận tốc.",
        "Orbit simulation. Touch empty space and drag to launch a body. Drag a body to set its velocity.",
      )}
    />
  );
}
