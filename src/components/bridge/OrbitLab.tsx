import { useEffect, useMemo, useRef, useState } from "react";
import { fmt, tr } from "@/lib/prefs";
import { Inset, Kicker, Slider } from "@/components/bridge/ui";

const W = 640;
const H = 360;
const CX = 320;
const CY = 180;
/** Gravitational parameter in screen units; chosen so the r = 100 px orbit closes in about 4 s. */
const MU = 2.5e5;

type Pt = { x: number; y: number };

/** Integrate one orbit with force ∝ 1/r^n (leapfrog, fixed step), returning the path. */
function integrate(n: number, r0: number, steps: number, dt: number): Pt[] {
  let x = r0;
  let y = 0;
  // Circular speed for exponent n: v² = μ / r^(n−1).
  let vx = 0;
  let vy = Math.sqrt(MU / Math.pow(r0, n - 1)) * 1.08; // a little above circular so n = 2 shows an ellipse
  const acc = (px: number, py: number) => {
    const r = Math.hypot(px, py);
    const a = -MU / Math.pow(r, n + 1);
    return { ax: a * px, ay: a * py };
  };
  let { ax, ay } = acc(x, y);
  const out: Pt[] = [{ x, y }];
  for (let i = 0; i < steps; i++) {
    vx += 0.5 * ax * dt;
    vy += 0.5 * ay * dt;
    x += vx * dt;
    y += vy * dt;
    ({ ax, ay } = acc(x, y));
    vx += 0.5 * ax * dt;
    vy += 0.5 * ay * dt;
    if (Math.hypot(x, y) > 900 || Math.hypot(x, y) < 6) break;
    out.push({ x, y });
  }
  return out;
}

/** Step 1 of the formula bridge: the inverse-square law and why orbits close only for n = 2. */
export function OrbitLab() {
  const [n, setN] = useState(2);
  const [d, setD] = useState(2);
  const [tick, setTick] = useState(0);
  const raf = useRef(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const path = useMemo(() => integrate(n, 110, 7000, 0.02), [n]);
  const head = path[Math.min(path.length - 1, tick % path.length)]!;

  useEffect(() => {
    if (reduced) return;
    let last = performance.now();
    const loop = (now: number) => {
      const dtMs = now - last;
      if (dtMs > 24) {
        last = now;
        setTick((t) => t + 10);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [reduced]);

  const closed = Math.abs(n - 2) < 0.011;
  const ratio = 1 / Math.pow(d, n);
  const verdict = closed
    ? tr(
        "Với n = 2 quỹ đạo là một ellipse khép kín: hành tinh quay lại đúng chỗ cũ sau mỗi vòng. Đây là định lý Bertrand: chỉ lực 1/r² (và lực lò xo) cho mọi quỹ đạo bị chặn đều khép kín.",
        "With n = 2 the orbit is a closed ellipse: the planet returns to the same point every lap. This is Bertrand's theorem: only the 1/r² force (and the spring force) closes every bound orbit.",
      )
    : tr(
        `Với n = ${fmt(n, 2)} quỹ đạo tiến động thành hình hoa hồng: điểm gần nhất xoay dần sau mỗi vòng. Sao Thuỷ tiến động 43″ mỗi thế kỷ vì thuyết tương đối rộng sửa nhẹ số mũ gần Mặt Trời.`,
        `With n = ${fmt(n, 2)} the orbit precesses into a rosette: the closest point drifts each lap. Mercury precesses 43″ per century because general relativity slightly corrects the exponent near the Sun.`,
      );

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-4 @min-[760px]:grid-cols-[1.2fr_1fr]">
        <Inset className="flex flex-col gap-3">
          <div>
            <Kicker>{tr("Mô phỏng · quỹ đạo", "Simulation · orbit")}</Kicker>
            <p className="font-serif text-lg leading-snug">
              {tr(`Lực ∝ 1 / rⁿ với n = ${fmt(n, 2)}`, `Force ∝ 1 / rⁿ with n = ${fmt(n, 2)}`)}
            </p>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={
              closed
                ? tr(
                    "Quỹ đạo ellipse khép kín quanh một ngôi sao",
                    "A closed elliptical orbit around a star",
                  )
                : tr("Quỹ đạo hình hoa hồng, không khép kín", "A rosette orbit that does not close")
            }
          >
            <circle cx={CX} cy={CY} r={14} className="fill-amber" />
            <polyline
              points={path
                .map((p) => `${(CX + p.x).toFixed(1)},${(CY + p.y).toFixed(1)}`)
                .join(" ")}
              fill="none"
              className="stroke-teal"
              strokeWidth={1.5}
              opacity={0.7}
            />
            <circle
              cx={CX + head.x}
              cy={CY + head.y}
              r={6}
              className="fill-teal stroke-paper"
              strokeWidth={1.5}
            />
            <text x={W - 10} y={H - 10} textAnchor="end" className="fill-muted text-[12px]">
              {closed ? tr("khép kín", "closed") : tr("tiến động", "precessing")}
            </text>
          </svg>
          <Slider
            label={tr("Số mũ của khoảng cách n", "Distance exponent n")}
            valueText={fmt(n, 2)}
            min={1.5}
            max={3}
            step={0.01}
            value={n}
            onChange={setN}
          />
          <div className="flex justify-between text-[13px] text-muted">
            <span>1,5</span>
            <button
              type="button"
              onClick={() => setN(2)}
              className="min-h-9 rounded-full border border-line px-3 text-[13px] font-semibold text-ink"
            >
              n = 2 (Newton)
            </button>
            <span>3</span>
          </div>
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset>
            <Kicker>{tr("Đọc kết quả", "Reading the result")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">{verdict}</p>
          </Inset>
          <Inset>
            <Kicker tone="amber">
              {tr("Tính thử · khoảng cách gấp d lần", "Try the numbers · distance × d")}
            </Kicker>
            <Slider
              label={tr("Khoảng cách r nhân với", "Distance r multiplied by")}
              valueText={`×${fmt(d, 1)}`}
              min={1}
              max={4}
              step={0.1}
              value={d}
              onChange={setD}
              tone="amber"
            />
            <div className="mt-2 flex flex-col gap-1 rounded-xl border border-line bg-paper-2/60 p-3 font-math text-lg leading-snug">
              <span>
                F(d·r) / F(r) = 1 / {fmt(d, 1)}
                <sup>{fmt(n, 2)}</sup> = {fmt(ratio, 3)}
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed">
              {closed
                ? tr(
                    `Gấp đôi khoảng cách thì lực còn một phần tư: 1/2² = 0,25. Số mũ 2 là quy luật tự nhiên, Cavendish (1798) đo được G để biến tỷ lệ thành con số.`,
                    `Doubling the distance leaves a quarter of the force: 1/2² = 0.25. The exponent 2 is a law of nature; Cavendish (1798) measured G to turn the proportion into a number.`,
                  )
                : tr(
                    `Với n = ${fmt(n, 2)}, gấp đôi khoảng cách để lại ${fmt(100 / Math.pow(2, n), 0)}% lực. Trong kinh tế, con số này sẽ do dữ liệu quyết định (bước 3).`,
                    `With n = ${fmt(n, 2)}, doubling the distance leaves ${fmt(100 / Math.pow(2, n), 0)}% of the force. In economics that number will be set by data (step 3).`,
                  )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
