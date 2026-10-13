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
import { VN_OUTLINE } from "@/lib/vn-outline";

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

/** Clay globe (Clay Noir): sand land, a lit ocean, Vietnam in flare pink. */
const CLAY = {
  oceanLit: "#3c6f86",
  oceanDeep: "#070b1c",
  land: "#c9b48d",
  landEdge: "#6d5a3a",
  vn: "#ff5e8a",
  islands: "#ffc56b",
};

const VN_RING: Vec3[] = VN_OUTLINE.map(([lon, lat]) => toVec(lon, lat));

/** Hoàng Sa and Trường Sa: the main islands, drawn and labelled on every globe. */
const ISLANDS: Array<{ vi: string; en: string; at: [number, number]; dots: Array<[number, number]> }> = [
  { vi: "QĐ. Hoàng Sa", en: "Hoàng Sa (VN)", at: [112.0, 16.6], dots: [[111.6, 16.5], [112.3, 16.8], [111.2, 15.8]] },
  { vi: "QĐ. Trường Sa", en: "Trường Sa (VN)", at: [114.3, 10.2], dots: [[114.3, 10.4], [112.9, 9.9], [115.8, 10.7], [114.4, 11.4]] },
];
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

    // A filled ring on the visible hemisphere: points behind the globe are pushed out
    // to the limb along their own bearing, so a country cut by the horizon is filled
    // up to the edge. Each ring is filled on its own, so winding does not matter.
    const fillRing = (pts: Vec3[]) => {
      const R = radius();
      const c = centre();
      let seen = false;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const p = project(pts[i]!, view);
        let x = p.x;
        let y = p.y;
        if (!p.front) {
          const d = Math.hypot(x, y) || 1;
          x /= d;
          y /= d;
        } else seen = true;
        if (i === 0) ctx.moveTo(c.x + x * R, c.y + y * R);
        else ctx.lineTo(c.x + x * R, c.y + y * R);
      }
      ctx.closePath();
      return seen;
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

      // Atmosphere: a teal rim light just outside the limb.
      const halo = ctx.createRadialGradient(c.x, c.y, R * 0.96, c.x, c.y, R * 1.12);
      halo.addColorStop(0, "rgba(79,209,197,0.28)");
      halo.addColorStop(1, "rgba(79,209,197,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R * 1.12, 0, Math.PI * 2);
      ctx.fill();

      // Ocean, lit from the upper left by the amber key light.
      const sea = ctx.createRadialGradient(c.x - R * 0.35, c.y - R * 0.4, R * 0.05, c.x, c.y, R);
      sea.addColorStop(0, CLAY.oceanLit);
      sea.addColorStop(1, CLAY.oceanDeep);
      ctx.fillStyle = sea;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.clip();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(214,255,248,0.07)";
      for (const line of GRATICULE) strokePath(line, false);

      // Land as raised clay: a soft shadow below, the sand fill, a dark edge.
      ctx.save();
      ctx.translate(1.5, 2.5);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      for (const ring of land) if (fillRing(ring)) ctx.fill();
      ctx.restore();
      ctx.fillStyle = CLAY.land;
      ctx.strokeStyle = CLAY.landEdge;
      ctx.lineWidth = 0.6;
      for (const ring of land) {
        if (!fillRing(ring)) continue;
        ctx.fill();
        ctx.stroke();
      }
      if (fillRing(VN_RING)) {
        ctx.fillStyle = CLAY.vn;
        ctx.fill();
        ctx.strokeStyle = "rgba(125,26,58,0.8)";
        ctx.stroke();
      }

      // Clay shading: a highlight where the light falls, darkening towards the limb.
      const shine = ctx.createRadialGradient(c.x - R * 0.4, c.y - R * 0.45, 0, c.x - R * 0.4, c.y - R * 0.45, R * 0.9);
      shine.addColorStop(0, "rgba(255,241,207,0.22)");
      shine.addColorStop(1, "rgba(255,241,207,0)");
      ctx.fillStyle = shine;
      ctx.fillRect(c.x - R, c.y - R, R * 2, R * 2);
      const limb = ctx.createRadialGradient(c.x, c.y, R * 0.55, c.x, c.y, R);
      limb.addColorStop(0, "rgba(7,6,26,0)");
      limb.addColorStop(1, "rgba(7,6,26,0.55)");
      ctx.fillStyle = limb;
      ctx.fillRect(c.x - R, c.y - R, R * 2, R * 2);
      ctx.restore();

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(79,209,197,0.35)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.stroke();

      for (const arc of as) {
        const pts = arcPoints(toVec(arc.from.lon, arc.from.lat), toVec(arc.to.lon, arc.to.lat));
        const w = Math.max(0, Math.min(1, arc.weight));
        const hue = arc.highlight ? "255,197,107" : "79,209,197";
        ctx.lineCap = "round";
        ctx.lineWidth = 4 + w * 10;
        ctx.strokeStyle = `rgba(${hue},${0.08 + w * 0.12})`;
        strokePath(pts, false);
        ctx.lineWidth = 1 + w * 4;
        ctx.strokeStyle = arc.highlight ? "rgba(255,214,140,0.95)" : `rgba(159,245,230,${0.35 + w * 0.6})`;
        strokePath(pts, false);

        if (!reduce) {
          const speed = 0.00018 + w * 0.00022;
          const t = (now * speed + arc.id.length * 0.13) % 1;
          const p = project(pts[Math.round(t * (pts.length - 1))]!, view);
          if (p.front) {
            ctx.fillStyle = arc.highlight ? "#fff1cf" : "#d6fff8";
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
        glow.addColorStop(0, "rgba(79,209,197,0.3)");
        glow.addColorStop(1, "rgba(79,209,197,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // A clay ball: the economy's colour, lit from the upper left.
        ctx.fillStyle = "rgba(0,0,0,0.45)";
        ctx.beginPath();
        ctx.arc(x + 1, y + 2, r, 0, Math.PI * 2);
        ctx.fill();
        const ball = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        ball.addColorStop(0, "#ffffff");
        ball.addColorStop(0.45, paint(n.color));
        ball.addColorStop(1, paintA(n.color, 0.75));
        ctx.fillStyle = ball;
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

      // Hoàng Sa and Trường Sa: amber dots and their labels, placed before any other label.
      ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
      for (const isl of ISLANDS) {
        let any = false;
        for (const [lon, lat] of isl.dots) {
          const p = project(toVec(lon, lat), view);
          if (!p.front) continue;
          any = true;
          ctx.fillStyle = CLAY.islands;
          ctx.beginPath();
          ctx.arc(c.x + p.x * R, c.y + p.y * R, Math.max(1.6, 1.8 * zoom), 0, Math.PI * 2);
          ctx.fill();
        }
        const at = project(toVec(isl.at[0], isl.at[1]), view);
        if (any && at.front) {
          const text = tr(isl.vi, isl.en);
          labels.push({ text, x: c.x + at.x * R + ctx.measureText(text).width / 2 + 8, y: c.y + at.y * R + 4, w: ctx.measureText(text).width, rank: -1 });
        }
      }

      // Ringed and fixed nodes label first; any later label that would overlap one already drawn is skipped.
      labels.sort((p, q) => p.rank - q.rank);
      const placed: Array<{ l: number; r: number; t: number; b: number }> = [];
      ctx.lineJoin = "round";
      for (const lab of labels) {
        const box = { l: lab.x - lab.w / 2 - 2, r: lab.x + lab.w / 2 + 2, t: lab.y - 11, b: lab.y + 3 };
        if (placed.some((o) => box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t)) continue;
        placed.push(box);
        // Labels sit on sand or sea: white text with a dark halo reads on both.
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(7,6,26,0.85)";
        ctx.strokeText(lab.text, lab.x, lab.y);
        ctx.fillStyle = "#fbfaff";
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
