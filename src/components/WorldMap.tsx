import { useEffect, useRef } from "react";
import type { GlobeArc, GlobeNode } from "@/components/Globe";
import { LON0, fitView, greatCircle, landLonLat, wrapLon, type LonLat, type MapView } from "@/sim/worldmap";
import { paint, paintA } from "@/lib/paint";
import { tr } from "@/lib/prefs";

type Props = {
  nodes: GlobeNode[];
  arcs: GlobeArc[];
  onTap?: (id: string) => void;
  label: string;
};

const RING = { teal: "#8fd4c0", amber: "#e7c27a" } as const;
const LAT_MIN = -58;
const LAT_MAX = 82;

/** A flat world map (Pacific-centred equirectangular) with economies at their real coordinates. */
export function WorldMap({ nodes, arcs, onTap, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ nodes, arcs, onTap });
  propsRef.current = { nodes, arcs, onTap };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let viewW = 1;
    let viewH = 1;
    let dpr = 1;
    let raf = 0;
    let view: MapView | null = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const land = landLonLat();
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { ox: number; oy: number; lon: number; lat: number; moved: boolean } | null = null;
    let pinch: { dist: number; scale: number } | null = null;

    const minScale = () => viewW / 360;

    const clampView = (v: MapView) => {
      v.scale = Math.min(40, Math.max(minScale(), v.scale));
      const halfLat = viewH / 2 / v.scale;
      v.lat = Math.min(LAT_MAX - halfLat, Math.max(LAT_MIN + halfLat, v.lat));
      if (LAT_MAX - LAT_MIN < 2 * halfLat) v.lat = (LAT_MAX + LAT_MIN) / 2;
    };

    const fit = () => {
      const pts: LonLat[] = propsRef.current.nodes.map((n) => [wrapLon(n.lon), n.lat]);
      view = fitView(pts, viewW, viewH, Math.min(64, viewW * 0.12));
      clampView(view);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      viewW = rect.width;
      viewH = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      fit();
    };

    const X = (lon: number) => viewW / 2 + (lon - view!.lon) * view!.scale;
    const Y = (lat: number) => viewH / 2 - (lat - view!.lat) * view!.scale;

    /** Copies of the world that reach the screen, so panning past the seam wraps round. */
    const offsets = () => {
      const v = view!;
      const half = viewW / 2 / v.scale;
      const out: number[] = [];
      for (let k = -2; k <= 2; k++) {
        const lo = LON0 - 200 + k * 360;
        const hi = LON0 + 200 + k * 360;
        if (hi > v.lon - half && lo < v.lon + half) out.push(k * 360);
      }
      return out;
    };

    // The graticule and land change only when the view, size or theme changes: draw them once into a cache.
    const base = document.createElement("canvas");
    const bctx = base.getContext("2d")!;
    let baseKey = "";
    const drawBase = () => {
      const v = view!;
      const key = [v.lon.toFixed(3), v.lat.toFixed(3), v.scale.toFixed(4), viewW, viewH, dpr, paint("#141c18")].join("|");
      if (key === baseKey) return;
      baseKey = key;
      base.width = Math.floor(viewW * dpr);
      base.height = Math.floor(viewH * dpr);
      bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bctx.fillStyle = paint("#141c18");
      bctx.fillRect(0, 0, viewW, viewH);
      const offs = offsets();
      bctx.lineWidth = 0.6;
      bctx.strokeStyle = paintA("#c4bbb0", 0.08);
      bctx.beginPath();
      for (const off of offs) {
        for (let lon = LON0 - 180; lon <= LON0 + 180; lon += 30) {
          const x = X(lon + off);
          if (x < -2 || x > viewW + 2) continue;
          bctx.moveTo(x, Y(LAT_MAX));
          bctx.lineTo(x, Y(LAT_MIN));
        }
      }
      for (let lat = -30; lat <= 60; lat += 30) {
        bctx.moveTo(0, Y(lat));
        bctx.lineTo(viewW, Y(lat));
      }
      bctx.stroke();
      bctx.fillStyle = paint("#22302a");
      bctx.strokeStyle = paintA("#c4bbb0", 0.38);
      bctx.lineWidth = 0.7;
      for (const off of offs) {
        bctx.beginPath();
        for (const ring of land) {
          for (let i = 0; i < ring.length; i++) {
            const x = X(ring[i]![0] + off);
            const y = Y(ring[i]![1]);
            if (i) bctx.lineTo(x, y);
            else bctx.moveTo(x, y);
          }
          bctx.closePath();
        }
        bctx.fill("evenodd");
        bctx.stroke();
      }
    };

    const localOf = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const dotRadius = (n: GlobeNode) => Math.max(5, n.r * Math.min(1.6, Math.max(0.7, view!.scale / 4)));

    const nodeAt = (x: number, y: number) => {
      let best: GlobeNode | null = null;
      let bestD = Infinity;
      for (const n of propsRef.current.nodes) {
        if (n.tappable === false) continue;
        for (const off of offsets()) {
          const d = Math.hypot(X(wrapLon(n.lon) + off) - x, Y(n.lat) - y);
          if (d <= Math.max(16, dotRadius(n) + 8) && d < bestD) {
            best = n;
            bestD = d;
          }
        }
      }
      return best;
    };

    let idKey = "";
    const draw = (now: number) => {
      if (!view) return;
      const { nodes: ns, arcs: as } = propsRef.current;
      // A different set of economies (another scene) gets a fresh frame.
      const ids = ns.map((n) => n.id).join(",");
      if (ids !== idKey) {
        if (idKey) fit();
        idKey = ids;
      }
      drawBase();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const offs = offsets();

      // Flows along great circles.
      for (const arc of as) {
        const pts = greatCircle(arc.from, arc.to);
        const w = Math.max(0, Math.min(1, arc.weight));
        ctx.lineWidth = 1 + w * 6;
        ctx.lineCap = "round";
        ctx.strokeStyle = arc.highlight ? paintA("#e7c27a", 0.92) : paintA("#8fd4c0", 0.2 + w * 0.65);
        for (const off of offs) {
          ctx.beginPath();
          pts.forEach(([lon, lat], i) => (i ? ctx.lineTo(X(lon + off), Y(lat)) : ctx.moveTo(X(lon + off), Y(lat))));
          ctx.stroke();
          if (!reduce) {
            const speed = 0.00018 + w * 0.00022;
            const t = (now * speed + arc.id.length * 0.13) % 1;
            const [lon, lat] = pts[Math.round(t * (pts.length - 1))]!;
            ctx.fillStyle = paint(arc.highlight ? RING.amber : RING.teal);
            ctx.beginPath();
            ctx.arc(X(lon + off), Y(lat), 1.5 + w * 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Economies.
      ctx.textAlign = "center";
      ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
      const labels: Array<{ text: string; x: number; y: number; w: number; rank: number }> = [];
      for (const n of ns) {
        for (const off of offs) {
          const x = X(wrapLon(n.lon) + off);
          const y = Y(n.lat);
          if (x < -40 || x > viewW + 40) continue;
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
          labels.push({ text: n.label, x, y: y + r + 14, w: ctx.measureText(n.label).width, rank: n.ring ? 0 : 1 });
        }
      }
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

    const zoomAt = (x: number, y: number, factor: number) => {
      if (!view) return;
      const lon = view.lon + (x - viewW / 2) / view.scale;
      const lat = view.lat - (y - viewH / 2) / view.scale;
      view.scale *= factor;
      clampView(view);
      view.lon = lon - (x - viewW / 2) / view.scale;
      view.lat = lat + (y - viewH / 2) / view.scale;
      clampView(view);
    };

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = localOf(e);
      pointers.set(e.pointerId, p);
      if (pointers.size >= 2 && view) {
        drag = null;
        const pts = [...pointers.values()];
        pinch = { dist: Math.max(8, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y)), scale: view.scale };
        return;
      }
      if (view) drag = { ox: p.x, oy: p.y, lon: view.lon, lat: view.lat, moved: false };
    };

    const onMove = (e: PointerEvent) => {
      const p = localOf(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size >= 2 && view) {
        const pts = [...pointers.values()];
        const dist = Math.max(8, Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y));
        const mid = { x: (pts[0]!.x + pts[1]!.x) / 2, y: (pts[0]!.y + pts[1]!.y) / 2 };
        zoomAt(mid.x, mid.y, (pinch.scale * (dist / pinch.dist)) / view.scale);
        return;
      }
      if (!drag || !view) return;
      const dx = p.x - drag.ox;
      const dy = p.y - drag.oy;
      if (Math.hypot(dx, dy) > 6) drag.moved = true;
      if (!drag.moved) return;
      view.lon = drag.lon - dx / view.scale;
      view.lat = drag.lat + dy / view.scale;
      clampView(view);
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
      const p = { x: e.offsetX, y: e.offsetY };
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
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
