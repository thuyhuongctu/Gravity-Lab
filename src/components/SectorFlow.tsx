import { useEffect, useRef, useState } from "react";
import { paint } from "@/lib/paint";
import { fmt, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

export type FdiMode = "disb" | "reg";

type Sector = { en: string; vi: string; v: number; color: string; kind: 0 | 1 | 2 | 3 };

/**
 * FDI into Việt Nam by sector, 2025, US$ billions (GSO). Disbursed: money actually spent on
 * projects. Registered: new, adjusted and share-purchase capital combined.
 */
export const FDI_2025: Record<FdiMode, { total: number; note: [string, string]; s: Sector[] }> = {
  disb: {
    total: 27.62,
    note: [
      "Vốn FDI thực hiện (disbursed) năm 2025: vốn thực sự giải ngân vào dự án.",
      "Disbursed (implemented) FDI, 2025: money actually spent on projects.",
    ],
    s: [
      { en: "Manufacturing", vi: "Công nghiệp chế biến, chế tạo (manufacturing)", v: 22.88, color: "#7ec8b8", kind: 0 },
      { en: "Real estate", vi: "Kinh doanh bất động sản (real estate)", v: 1.93, color: "#e7c27a", kind: 1 },
      { en: "Electricity & gas", vi: "Sản xuất, phân phối điện, khí đốt (utilities)", v: 0.915, color: "#e0a090", kind: 2 },
      { en: "Other sectors", vi: "Các ngành còn lại (other sectors)", v: 1.895, color: "#f0dcc0", kind: 3 },
    ],
  },
  reg: {
    total: 38.42,
    note: [
      "Vốn FDI đăng ký (registered) năm 2025: gồm cấp mới, điều chỉnh và góp vốn, mua cổ phần.",
      "Registered FDI, 2025: new, adjusted and share-purchase capital combined.",
    ],
    s: [
      { en: "Manufacturing", vi: "Công nghiệp chế biến, chế tạo (manufacturing)", v: 21.01, color: "#7ec8b8", kind: 0 },
      { en: "Real estate", vi: "Kinh doanh bất động sản (real estate)", v: 7.11, color: "#e7c27a", kind: 1 },
      { en: "Other sectors", vi: "Các ngành còn lại (other sectors)", v: 10.3, color: "#f0dcc0", kind: 3 },
    ],
  },
};

export const GLYPH = ["⚙", "▦", "ϟ", "◆"];

/** A small sector icon: gear, building, bolt, bag. */
function icon(g: CanvasRenderingContext2D, kind: number, x: number, y: number, r: number, c: string) {
  g.save();
  g.translate(x, y);
  g.fillStyle = c;
  g.strokeStyle = c;
  g.lineWidth = r * 0.22;
  g.lineJoin = "round";
  if (kind === 0) {
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const rr = i % 2 ? r * 0.72 : r;
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    g.closePath();
    g.fill();
    g.globalCompositeOperation = "destination-out";
    g.beginPath();
    g.arc(0, 0, r * 0.32, 0, 7);
    g.fill();
  } else if (kind === 1) {
    g.fillRect(-r * 0.7, -r, r * 1.4, r * 2);
    g.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.fillRect(-r * 0.45 + j * r * 0.55, -r * 0.75 + i * r * 0.55, r * 0.32, r * 0.32);
  } else if (kind === 2) {
    g.beginPath();
    g.moveTo(r * 0.25, -r);
    g.lineTo(-r * 0.55, r * 0.15);
    g.lineTo(-r * 0.02, r * 0.15);
    g.lineTo(-r * 0.25, r);
    g.lineTo(r * 0.6, -r * 0.2);
    g.lineTo(r * 0.05, -r * 0.2);
    g.closePath();
    g.fill();
  } else {
    g.beginPath();
    g.moveTo(-r * 0.8, -r * 0.3);
    g.lineTo(r * 0.8, -r * 0.3);
    g.lineTo(r * 0.6, r * 0.9);
    g.lineTo(-r * 0.6, r * 0.9);
    g.closePath();
    g.fill();
    g.beginPath();
    g.arc(0, -r * 0.3, r * 0.45, Math.PI, 0);
    g.stroke();
  }
  g.restore();
}

type Particle = { t: number; k: number; ty: number; sy: number; sp: number };

/** Capital flows from the world into Việt Nam's sectors: one icon per billion a year, roughly. */
export function SectorFlow({ mode }: { mode: FdiMode }) {
  const { lang, theme } = usePrefs();
  const ref = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const [calm] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const P: Particle[] = [];
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const world = tr("Thế giới", "World");
    const vn = tr("Việt Nam", "Viet Nam");
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      if (!W || !H) return;
      if (cv.width !== W * dpr || cv.height !== H * dpr) {
        cv.width = W * dpr;
        cv.height = H * dpr;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      const d = FDI_2025[modeRef.current];
      const sum = d.s.reduce((a, x) => a + x.v, 0);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const x0 = 70;
      const x1 = W - 120;
      const top = 70;
      const bot = H - 26;
      let y = top;
      const bins = d.s.map((x) => {
        const h = ((bot - top - 8 * (d.s.length - 1)) * x.v) / sum;
        const b = { y, h, c: paint(x.color), kind: x.kind };
        y += h + 8;
        return b;
      });
      const src = { x: x0, y: (top + bot) / 2 };
      // The world: a bone clay ball.
      g.beginPath();
      g.arc(src.x, src.y, 26, 0, 7);
      const sg = g.createRadialGradient(src.x - 8, src.y - 9, 2, src.x, src.y, 28);
      sg.addColorStop(0, "#fff6e4");
      sg.addColorStop(0.5, "#e8d9b8");
      sg.addColorStop(1, "#5a4d36");
      g.fillStyle = sg;
      g.fill();
      bins.forEach((b) => {
        g.fillStyle = paint("#141c18");
        g.beginPath();
        g.roundRect(x1, b.y, 92, Math.max(4, b.h), 12);
        g.fill();
        g.fillStyle = b.c;
        g.globalAlpha = 0.9;
        g.beginPath();
        g.roundRect(x1 + 6, b.y + 4, 80, Math.max(2, b.h - 8), 9);
        g.fill();
        g.globalAlpha = 1;
        if (b.h > 26) icon(g, b.kind, x1 + 46, b.y + b.h / 2, Math.min(16, b.h * 0.3), paint("#101614"));
      });
      if (!calm) {
        acc += dt * d.total * 0.9;
        while (acc > 1) {
          acc--;
          let r = Math.random() * sum;
          let k = 0;
          while (k < d.s.length - 1 && r > d.s[k]!.v) {
            r -= d.s[k]!.v;
            k++;
          }
          const b = bins[k]!;
          P.push({ t: 0, k, ty: b.y + 6 + Math.random() * Math.max(1, b.h - 12), sy: src.y + (Math.random() - 0.5) * 26, sp: 0.35 + Math.random() * 0.25 });
        }
      }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]!;
        p.t += dt * p.sp;
        const b = bins[p.k];
        if (p.t >= 1 || !b) {
          P.splice(i, 1);
          continue;
        }
        const u = p.t;
        const e = u * u * (3 - 2 * u);
        const cx = (x0 + x1) / 2;
        const xx = (1 - u) * (1 - u) * (x0 + 20) + 2 * (1 - u) * u * cx + u * u * (x1 + 4);
        const yy = (1 - e) * p.sy + e * p.ty + Math.sin(u * Math.PI) * (p.ty - p.sy) * -0.15;
        g.globalAlpha = 0.3 + 0.7 * Math.sin(u * Math.PI);
        icon(g, b.kind, xx, yy, 5.5, b.c);
      }
      g.globalAlpha = 1;
      g.font = "600 12px 'Be Vietnam Pro', sans-serif";
      g.fillStyle = paint("#c4bbb0");
      g.textAlign = "center";
      g.fillText(world, src.x, src.y + 44);
      g.fillText(vn, x1 + 46, top - 10);
      if (calm) cancelAnimationFrame(raf);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [calm, lang, theme]);

  const d = FDI_2025[mode];
  return (
    <div className="noir-track relative min-h-[380px] overflow-hidden rounded-[32px]">
      <canvas
        ref={ref}
        className="absolute inset-0 block h-full w-full"
        role="img"
        aria-label={tr(
          `Dòng vốn FDI vào Việt Nam năm 2025 theo ngành, tổng ${fmt(d.total, 2)} tỷ USD`,
          `FDI into Viet Nam in 2025 by sector, US$${fmt(d.total, 2)} bn in total`,
        )}
      />
      <div className="absolute top-4 left-[18px] flex flex-col gap-0.5">
        <span className="text-xs text-mist">{mode === "disb" ? tr("Vốn thực hiện 2025", "Disbursed 2025") : tr("Vốn đăng ký 2025", "Registered 2025")}</span>
        <span className="font-serif text-[26px] font-extrabold text-paper tabular-nums">US${fmt(d.total, 2)} bn</span>
      </div>
    </div>
  );
}

/** The sector bars beside the flow, with the paper's share of the total and the mode toggle. */
export function SectorBars({ mode, setMode }: { mode: FdiMode; setMode: (m: FdiMode) => void }) {
  const { lang } = usePrefs();
  const L = lang === "vi" ? 0 : 1;
  const d = FDI_2025[mode];
  const sum = d.s.reduce((a, x) => a + x.v, 0);
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label={tr("Loại vốn", "Capital type")} className="noir-track flex rounded-full p-1">
        {(["disb", "reg"] as FdiMode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={"min-h-10 flex-1 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap " + (mode === m ? "cosmic-btn" : "text-muted")}
          >
            {m === "disb" ? tr("Thực hiện (disbursed)", "Disbursed") : tr("Đăng ký (registered)", "Registered")}
          </button>
        ))}
      </div>
      <p className="text-[13px] leading-relaxed text-muted">{d.note[L]}</p>
      <ul className="flex flex-col gap-2.5">
        {d.s.map((s) => (
          <li key={s.en} className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2">
              <span
                aria-hidden="true"
                className="flex size-[22px] shrink-0 items-center justify-center rounded-full text-[13px] leading-none text-[#0c0d10]"
                style={{ background: paint(s.color) }}
              >
                {GLYPH[s.kind]}
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold">{L ? s.en : s.vi}</span>
              <span className="text-sm whitespace-nowrap tabular-nums">
                {s.v >= 1 ? `${fmt(s.v, 2)} bn` : `${fmt(s.v * 1000, 0)} m`} · {fmt((100 * s.v) / d.total, 1)}%
              </span>
            </div>
            <div className="noir-track h-2 rounded-full">
              <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${(100 * s.v) / sum}%`, background: paint(s.color) }} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
