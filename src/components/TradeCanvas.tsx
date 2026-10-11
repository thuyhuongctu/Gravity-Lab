import { useEffect, useRef } from "react";
import {
  partnerRows,
  radiusForGdp,
  type Economy,
} from "@/sim/trade";

type Props = {
  economies: Economy[];
  focusId: string;
  pairId: string | null;
  gamma: number;
  boosts: Record<string, number>;
  onMove: (id: string, x: number, y: number) => void;
  onTap: (id: string) => void;
};

type Cam = { x: number; y: number; k: number };

export function TradeCanvas({ economies, focusId, pairId, gamma, boosts, onMove, onTap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ economies, focusId, pairId, gamma, boosts, onMove, onTap });
  propsRef.current = { economies, focusId, pairId, gamma, boosts, onMove, onTap };
  const fitToken = economies.map((e) => e.id).join(",");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cam: Cam = { x: 0, y: 0, k: 1 };
    let viewW = 1;
    let viewH = 1;
    let dpr = 1;
    let raf = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointers = new Map<number, { x: number; y: number }>();
    let drag: { id: string; ox: number; oy: number; ex: number; ey: number; moved: boolean } | null = null;
    let pan: { ox: number; oy: number; camX: number; camY: number } | null = null;
    let pinch: { dist: number; midX: number; midY: number; camK: number; camX: number; camY: number } | null =
      null;

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
      const ecos = propsRef.current.economies;
      if (!ecos.length || viewW < 2) return;
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const e of ecos) {
        const r = radiusForGdp(e.gdp) + 46;
        minX = Math.min(minX, e.x - r);
        maxX = Math.max(maxX, e.x + r);
        minY = Math.min(minY, e.y - r);
        maxY = Math.max(maxY, e.y + r);
      }
      cam.x = (minX + maxX) / 2;
      cam.y = (minY + maxY) / 2;
      const bw = Math.max(160, maxX - minX);
      const bh = Math.max(160, maxY - minY);
      cam.k = Math.min(2.4, Math.max(0.2, Math.min(viewW / (bw + 48), viewH / (bh + 48))));
    };

    const hit = (x: number, y: number) => {
      const world = toWorld(x, y);
      let best: Economy | null = null;
      let bestD = Infinity;
      for (const e of propsRef.current.economies) {
        const r = radiusForGdp(e.gdp) + 8 / cam.k;
        const d = Math.hypot(e.x - world.x, e.y - world.y);
        if (d <= r && d < bestD) {
          best = e;
          bestD = d;
        }
      }
      return best;
    };

    const draw = (now: number) => {
      const { economies: ecos, focusId: focus, pairId: pair, gamma: g, boosts: bst } = propsRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#101614";
      ctx.fillRect(0, 0, viewW, viewH);

      const rows = partnerRows(ecos, focus, g, pair, bst);
      const home = ecos.find((e) => e.id === focus);
      if (home) {
        const maxShare = rows[0]?.share ?? 1;
        for (const row of rows) {
          const a = toScreen(home.x, home.y);
          const b = toScreen(row.econ.x, row.econ.y);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2 - Math.min(48, Math.hypot(b.x - a.x, b.y - a.y) * 0.12);
          const weight = row.share / Math.max(maxShare, 1);
          const selected = pair === row.econ.id;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(mx, my, b.x, b.y);
          ctx.strokeStyle = selected ? "rgba(231,194,122,0.9)" : `rgba(143,212,192,${0.18 + weight * 0.65})`;
          ctx.lineWidth = 1 + weight * 7;
          ctx.setLineDash(reduce ? [] : [5, 9]);
          ctx.lineDashOffset = reduce ? 0 : -((now / 28) % 28);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      ctx.textAlign = "center";
      ctx.font = "600 12px 'Be Vietnam Pro', sans-serif";
      for (const e of ecos) {
        const p = toScreen(e.x, e.y);
        const r = Math.max(8, radiusForGdp(e.gdp) * cam.k);
        const glow = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 2.2);
        glow.addColorStop(0, "rgba(143,212,192,0.28)");
        glow.addColorStop(1, "rgba(143,212,192,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
        if (e.id === focus || e.id === pair) {
          ctx.strokeStyle = e.id === focus ? "#8fd4c0" : "#e7c27a";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + 5, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "#f3ece1";
        ctx.fillText(e.short, p.x, p.y + r + 14);
      }
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
        pan = null;
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        pinch = {
          dist: Math.max(8, Math.hypot(a.x - b.x, a.y - b.y)),
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
          camK: cam.k,
          camX: cam.x,
          camY: cam.y,
        };
        return;
      }
      const target = hit(p.x, p.y);
      if (target) {
        drag = { id: target.id, ox: p.x, oy: p.y, ex: target.x, ey: target.y, moved: false };
      } else {
        pan = { ox: p.x, oy: p.y, camX: cam.x, camY: cam.y };
      }
    };

    const onMove = (e: PointerEvent) => {
      const p = localOf(e);
      if (pointers.has(e.pointerId)) pointers.set(e.pointerId, p);
      if (pinch && pointers.size >= 2) {
        const pts = [...pointers.values()];
        const a = pts[0]!;
        const b = pts[1]!;
        const dist = Math.max(8, Math.hypot(a.x - b.x, a.y - b.y));
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        cam.k = Math.min(3, Math.max(0.2, pinch.camK * (dist / pinch.dist)));
        const worldMidX = (pinch.midX - viewW / 2) / pinch.camK + pinch.camX;
        const worldMidY = (pinch.midY - viewH / 2) / pinch.camK + pinch.camY;
        cam.x = worldMidX - (midX - viewW / 2) / cam.k;
        cam.y = worldMidY - (midY - viewH / 2) / cam.k;
        return;
      }
      if (drag) {
        const dx = p.x - drag.ox;
        const dy = p.y - drag.oy;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (drag.moved) propsRef.current.onMove(drag.id, drag.ex + dx / cam.k, drag.ey + dy / cam.k);
      } else if (pan) {
        cam.x = pan.camX - (p.x - pan.ox) / cam.k;
        cam.y = pan.camY - (p.y - pan.oy) / cam.k;
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pinch && pointers.size < 2) pinch = null;
      if (drag) {
        if (!drag.moved) propsRef.current.onTap(drag.id);
        drag = null;
      }
      pan = null;
    };

    resize();
    fit();
    const ro = new ResizeObserver(() => {
      resize();
      fit();
    });
    ro.observe(canvas);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
    // Refit when the cast of economies changes, not on every drag.
  }, [fitToken]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      role="application"
      aria-label="Sơ đồ mô hình trọng lực thương mại. Kéo một nền kinh tế để đổi khoảng cách. Chạm để chọn gốc dòng chảy."
    />
  );
}
