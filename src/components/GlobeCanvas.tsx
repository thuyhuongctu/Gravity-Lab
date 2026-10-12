import { useEffect, useRef } from "react";
import { partnerRows, radiusForGdp, type Economy } from "@/sim/trade";
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

type Props = {
  economies: Economy[];
  focusId: string;
  pairId: string | null;
  gamma: number;
  boosts: Record<string, number>;
  onTap: (id: string) => void;
};

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

export function GlobeCanvas({ economies, focusId, pairId, gamma, boosts, onTap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ economies, focusId, pairId, gamma, boosts, onTap });
  propsRef.current = { economies, focusId, pairId, gamma, boosts, onTap };
  const targetRef = useRef<View | null>(null);

  // Turn the globe toward the focus economy (and the chosen partner, if any).
  useEffect(() => {
    const focus = economies.find((e) => e.id === focusId);
    if (!focus) return;
    const pair = pairId ? economies.find((e) => e.id === pairId) : null;
    if (pair) {
      const a = toVec(focus.lon, focus.lat);
      const b = toVec(pair.lon, pair.lat);
      const m: Vec3 = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
      const n = Math.hypot(m[0], m[1], m[2]);
      if (n > 0.2) {
        const lat = Math.asin(m[1] / n) / (Math.PI / 180);
        const lon = Math.atan2(m[0], m[2]) / (Math.PI / 180);
        targetRef.current = { lon, lat: clampLat(lat) };
        return;
      }
    }
    targetRef.current = { lon: focus.lon, lat: clampLat(focus.lat) };
  }, [economies, focusId, pairId]);

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

    const nodeAt = (x: number, y: number) => {
      const R = radius();
      const c = centre();
      let best: Economy | null = null;
      let bestD = Infinity;
      for (const e of propsRef.current.economies) {
        const p = project(toVec(e.lon, e.lat), view);
        if (p.z < 0) continue;
        const r = Math.max(10, radiusForGdp(e.gdp) * 0.5 * zoom) + 8;
        const d = Math.hypot(c.x + p.x * R - x, c.y + p.y * R - y);
        if (d <= r && d < bestD) {
          best = e;
          bestD = d;
        }
      }
      return best;
    };

    const draw = (now: number) => {
      const { economies: ecos, focusId: focus, pairId: pair, gamma: g, boosts: bst } = propsRef.current;

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
      ctx.fillStyle = "#101614";
      ctx.fillRect(0, 0, viewW, viewH);

      const sea = ctx.createRadialGradient(c.x - R * 0.3, c.y - R * 0.35, R * 0.1, c.x, c.y, R);
      sea.addColorStop(0, "#22302a");
      sea.addColorStop(1, "#141c18");
      ctx.fillStyle = sea;
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 0.6;
      ctx.strokeStyle = "rgba(196,187,176,0.08)";
      for (const line of GRATICULE) strokePath(line, false);

      ctx.lineWidth = 0.9;
      ctx.strokeStyle = "rgba(196,187,176,0.42)";
      for (const ring of land) strokePath(ring, true);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(143,212,192,0.35)";
      ctx.beginPath();
      ctx.arc(c.x, c.y, R, 0, Math.PI * 2);
      ctx.stroke();

      const rows = partnerRows(ecos, focus, g, pair, bst);
      const home = ecos.find((e) => e.id === focus);
      if (home) {
        const a = toVec(home.lon, home.lat);
        const maxShare = rows[0]?.share ?? 1;
        for (const row of rows) {
          const pts = arcPoints(a, toVec(row.econ.lon, row.econ.lat));
          const weight = row.share / Math.max(maxShare, 1);
          const selected = pair === row.econ.id;
          ctx.lineWidth = 1 + weight * 6;
          ctx.strokeStyle = selected ? "rgba(231,194,122,0.92)" : `rgba(143,212,192,${0.2 + weight * 0.65})`;
          strokePath(pts, false);

          if (!reduce) {
            const speed = 0.00018 + weight * 0.00022;
            const t = (now * speed + row.econ.id.length * 0.13) % 1;
            const p = project(pts[Math.round(t * (pts.length - 1))]!, view);
            if (p.front) {
              ctx.fillStyle = selected ? "#e7c27a" : "#8fd4c0";
              ctx.beginPath();
              ctx.arc(c.x + p.x * R, c.y + p.y * R, 1.5 + weight * 2.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      ctx.textAlign = "center";
      ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
      for (const e of ecos) {
        const p = project(toVec(e.lon, e.lat), view);
        if (p.z < 0) continue;
        const x = c.x + p.x * R;
        const y = c.y + p.y * R;
        const r = Math.max(5, radiusForGdp(e.gdp) * 0.5 * zoom);
        const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 2.2);
        glow.addColorStop(0, "rgba(143,212,192,0.3)");
        glow.addColorStop(1, "rgba(143,212,192,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        if (e.id === focus || e.id === pair) {
          ctx.strokeStyle = e.id === focus ? "#8fd4c0" : "#e7c27a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, r + 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "#f3ece1";
        ctx.fillText(e.short, x, y + r + 14);
      }

      ctx.textAlign = "right";
      ctx.font = "400 10px 'Be Vietnam Pro', sans-serif";
      ctx.fillStyle = "rgba(196,187,176,0.6)";
      ctx.fillText("Bản đồ: Natural Earth", viewW - 10, viewH - 10);
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
        if (hit) propsRef.current.onTap(hit.id);
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

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      role="application"
      aria-label="Địa cầu mô hình trọng lực thương mại. Kéo để xoay, chụm hoặc cuộn để thu phóng. Chạm một nền kinh tế để chọn gốc dòng chảy."
    />
  );
}
