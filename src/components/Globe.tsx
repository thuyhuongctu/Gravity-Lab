import { useEffect, useRef } from "react";
import {
  arcPoints,
  clampLat,
  landRings,
  lonDelta,
  project,
  toVec,
  type Vec3,
  type View,
} from "@/sim/globe";
import { paint, paintA } from "@/lib/paint";
import { tr } from "@/lib/prefs";

export type GlobeNode = {
  id: string;
  lon: number;
  lat: number;
  label: string;
  /** Dot radius in CSS pixels at zoom 1. */
  r: number;
  color: string;
  ring?: "teal" | "amber";
  tappable?: boolean;
};

export type GlobeArc = {
  id: string;
  from: { lon: number; lat: number };
  to: { lon: number; lat: number };
  /** 0..1, drives width and opacity. */
  weight: number;
  highlight?: boolean;
};

type Props = {
  nodes: GlobeNode[];
  arcs: GlobeArc[];
  /** Points the globe turns to; their spherical midpoint is centred. */
  focus: Array<{ lon: number; lat: number }>;
  onTap?: (id: string) => void;
  label: string;
};

const RAD = Math.PI / 180;
const RING = { teal: "#8fd4c0", amber: "#e7c27a" } as const;

const GRATICULE: Vec3[][] = (() => {
  const lines: Vec3[][] = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const line: Vec3[] = [];
    for (let lat = -80; lat <= 80; lat += 4) line.push(toVec(lon, lat));
    lines.push(line);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const line: Vec3[] = [];
    for (let lon = -180; lon <= 180; lon += 4) line.push(toVec(lon, lat));
    lines.push(line);
  }
  return lines;
})();

function centreOf(points: Array<{ lon: number; lat: number }>): View | null {
  if (!points.length) return null;
  const m: Vec3 = [0, 0, 0];
  for (const p of points) {
    const v = toVec(p.lon, p.lat);
    m[0] += v[0];
    m[1] += v[1];
    m[2] += v[2];
  }
  const n = Math.hypot(m[0], m[1], m[2]);
  // Antipodal pairs have no midpoint; fall back to the first point.
  if (n < 0.2 * points.length) return { lon: points[0]!.lon, lat: clampLat(points[0]!.lat) };
  return { lon: Math.atan2(m[0], m[2]) / RAD, lat: clampLat(Math.asin(m[1] / n) / RAD) };
}

export function Globe({ nodes, arcs, focus, onTap, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ nodes, arcs, onTap });
  propsRef.current = { nodes, arcs, onTap };
  const targetRef = useRef<View | null>(centreOf(focus));
  const focusKey = focus.map((p) => `${p.lon.toFixed(2)},${p.lat.toFixed(2)}`).join("|");

  useEffect(() => {
    targetRef.current = centreOf(focus);
    // focusKey captures the content of `focus`; the array identity changes every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const view: View = { ...(targetRef.current ?? { lon: 105, lat: 18 }) };
    let zoom = 1;
    let viewW = 1;
    let viewH = 1;
    let dpr = 1;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = landRings();
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { ox: number; oy: number; lon: number; lat: number; moved: boolean } | null = null;
    let pinch: { dist: number; zoom: number } | null = null;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = rect.width;
      viewH = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
    };

    const radius = () => Math.min(viewW, viewH) * 0.42 * zoom;
    const centre = () => ({ x: viewW / 2, y: viewH / 2 + 8 });

    const localOf = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const strokePath = (pts: Vec3[], closed: boolean) => {
      const R = radius();
      const c = centre();
      let pen = false;
      ctx.beginPath();
      for (let i = 0; i <= pts.length; i++) {
        if (i === pts.length && !closed) break;
        const p = project(pts[i % pts.length]!, view);
        if (!p.front) {
          pen = false;
          continue;
        }
        const x = c.x + p.x * R;
        const y = c.y + p.y * R;
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      }
      ctx.stroke();
    };

    const dotRadius = (n: GlobeNode) => Math.max(4, n.r * zoom);

    const nodeAt = (x: number, y: number) => {
      const R = radius();
      const c = centre();
      let best: GlobeNode | null = null;
      let bestD = Infinity;
      for (const n of propsRef.current.nodes) {
        if (n.tappable === false) continue;
        const p = project(toVec(n.lon, n.lat), view);
        if (p.z < 0) continue;
        const d = Math.hypot(c.x + p.x * R - x, c.y + p.y * R - y);
        if (d <= Math.max(14, dotRadius(n) + 8) && d < bestD) {
          best = n;
          bestD = d;
        }
      }
      return best;
    };

    const draw = (now: number) => {
      const { nodes: ns, arcs: as } = propsRef.current;

      const target = targetRef.current;
      if (target && !drag && !pinch) {
        const k = reduce ? 1 : 0.08;
        view.lon += lonDelta(view.lon, target.lon) * k;
        view.lat += (target.lat - view.lat) * k;
        if (Math.abs(lonDelta(view.lon, target.lon)) < 0.05 && Math.abs(target.lat - view.lat) < 0.05) {
          targetRef.current = null;
        }
      }

      const R = radius();
      const c = centre();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = paint("#101614");
      ctx.fillRect(0, 0, viewW, viewH);

      const sea = ctx.createRadialGradient(c.x - R * 0.3, c.y - R * 0.35, R * 0.1, c.x, c.y, R);
      sea.addColorStop(0, paint("#22302a"));
      sea.addColorStop(1, paint("#141c18"));
      ctx.fillStyle = sea;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = paintA("#c4bbb0", 0.08);
      for (const line of GRATICULE) strokePath(line, false);

      ctx.lineWidth = 0.9;
      ctx.strokeStyle = paintA("#c4bbb0", 0.42);
      for (const ring of land) strokePath(ring, true);

      ctx.lineWidth = 1;
      ctx.strokeStyle = paintA("#8fd4c0", 0.35);
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.stroke();

      for (const arc of as) {
        const pts = arcPoints(toVec(arc.from.lon, arc.from.lat), toVec(arc.to.lon, arc.to.lat));
        const w = Math.max(0, Math.min(1, arc.weight));
        ctx.lineWidth = 1 + w * 6;
        ctx.strokeStyle = arc.highlight ? paintA("#e7c27a", 0.92) : paintA("#8fd4c0", 0.2 + w * 0.65);
        strokePath(pts, false);

        if (!reduce) {
          const speed = 0.00018 + w * 0.00022;
          const t = (now * speed + arc.id.length * 0.13) % 1;
          const p = project(pts[Math.round(t * (pts.length - 1))]!, view);
          if (p.front) {
            ctx.fillStyle = paint(arc.highlight ? RING.amber : RING.teal);
            ctx.beginPath();
            ctx.arc(c.x + p.x * R, c.y + p.y * R, 1.5 + w * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.textAlign = "center";
      ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
      const labels: Array<{ text: string; x: number; y: number; w: number; rank: number }> = [];
      for (const n of ns) {
        const p = project(toVec(n.lon, n.lat), view);
        if (p.z < 0) continue;
        const x = c.x + p.x * R;
        const y = c.y + p.y * R;
        const r = dotRadius(n);
        const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2);
        glow.addColorStop(0, paintA("#8fd4c0", 0.3));
        glow.addColorStop(1, paintA("#8fd4c0", 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = paint(n.color);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (n.ring) {
          ctx.strokeStyle = paint(RING[n.ring]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        labels.push({
          text: n.label,
          x,
          y: y + r + 14,
          w: ctx.measureText(n.label).width,
          rank: n.ring || n.tappable === false ? 0 : 1,
        });
      }

      // Ringed and fixed nodes label first; any later label that would overlap one already drawn is skipped.
      labels.sort((p, q) => p.rank - q.rank);
      const placed: Array<{ l: number; r: number; t: number; b: number }> = [];
      ctx.fillStyle = paint("#f3ece1");
      for (const lab of labels) {
        const box = { l: lab.x - lab.w / 2 - 2, r: lab.x + lab.w / 2 + 2, t: lab.y - 11, b: lab.y + 3 };
        if (placed.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t)) continue;
        placed.push(box);
        ctx.fillText(lab.text, lab.x, lab.y);
      }

      ctx.textAlign = "right";
      ctx.font = "400 10px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = paintA("#c4bbb0", 0.6);
      ctx.fillText(tr("Bản đồ: Natural Earth", "Map: Natural Earth"), viewW - 10, viewH - 10);
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = localOf(e);
      pointers.set(e.pointerId, p);
      if (pointers.size >= 2) {
        drag = null;
        const pts = [...pointers.values()];
        pinch = { dist: Math.max(8, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)), zoom };
        return;
      }
      targetRef.current = null;
      drag = { ox: p.x, oy: p.y, lon: view.lon, lat: view.lat, moved: false };
    };

    const onMove = (e: PointerEvent) => {
      const p = localOf(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size >= 2) {
        const pts = [...pointers.values()];
        const dist = Math.max(8, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y));
        zoom = Math.min(3, Math.max(0.7, pinch.zoom * (dist / pinch.dist)));
        return;
      }
      if (!drag) return;
      const dx = p.x - drag.ox;
      const dy = p.y - drag.oy;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      if (!drag.moved) return;
      const degPerPx = 180 / (Math.PI * radius());
      view.lon = drag.lon - dx * degPerPx;
      view.lat = clampLat(drag.lat + dy * degPerPx);
    };

    const onUp = (e: PointerEvent) => {
      const p = localOf(e);
      pointers.delete(e.pointerId);
      if (pinch && pointers.size < 2) pinch = null;
      if (drag && !drag.moved) {
        const hit = nodeAt(p.x, p.y);
        if (hit) propsRef.current.onTap?.(hit.id);
      }
      drag = null;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.min(3, Math.max(0.7, zoom * Math.exp(-e.deltaY * 0.0015)));
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, []);

  return <canvas ref={canvasRef} className="h-full w-full touch-none" role="application" aria-label={label} />;
}
