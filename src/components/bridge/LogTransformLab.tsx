import { useEffect, useRef, useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { countryName, kmFromHanoi } from "@/sim/gravity-lab";
import { Inset, Kicker, Segmented, Slider } from "@/components/bridge/ui";

const GAMMA = 0.9;
const FDI_BETA = 0.38;

type Tone = "n" | "h" | "b" | "a";
/** [text, tone, position]: `h` highlights the operation, `b` the coefficients, `a` the new terms. */
type Seg = [string, Tone, ("sub" | "sup")?];

const EQ: Seg[][] = [
  [
    ["T", "n"],
    ["ij", "n", "sub"],
    [" = G · ", "n"],
    ["Y", "n"],
    ["i", "n", "sub"],
    ["β₁", "b", "sup"],
    [" · ", "n"],
    ["Y", "n"],
    ["j", "n", "sub"],
    ["β₂", "b", "sup"],
    [" / ", "n"],
    ["D", "n"],
    ["ij", "n", "sub"],
    ["γ", "b", "sup"],
  ],
  [
    ["ln", "h"],
    [" T", "n"],
    ["ij", "n", "sub"],
    [" = ", "n"],
    ["ln", "h"],
    [" ( G · Y", "n"],
    ["i", "n", "sub"],
    ["β₁", "n", "sup"],
    [" · Y", "n"],
    ["j", "n", "sub"],
    ["β₂", "n", "sup"],
    [" / D", "n"],
    ["ij", "n", "sub"],
    ["γ", "n", "sup"],
    [" )", "n"],
  ],
  [
    ["ln T", "n"],
    ["ij", "n", "sub"],
    [" = ln G ", "n"],
    ["+", "h"],
    [" ln Y", "n"],
    ["i", "n", "sub"],
    ["β₁", "n", "sup"],
    [" +", "h"],
    [" ln Y", "n"],
    ["j", "n", "sub"],
    ["β₂", "n", "sup"],
    [" −", "h"],
    [" ln D", "n"],
    ["ij", "n", "sub"],
    ["γ", "n", "sup"],
  ],
  [
    ["ln T", "n"],
    ["ij", "n", "sub"],
    [" = ln G + ", "n"],
    ["β₁", "b"],
    [" ln Y", "n"],
    ["i", "n", "sub"],
    [" + ", "n"],
    ["β₂", "b"],
    [" ln Y", "n"],
    ["j", "n", "sub"],
    [" − ", "n"],
    ["γ", "b"],
    [" ln D", "n"],
    ["ij", "n", "sub"],
  ],
  [
    ["ln T", "n"],
    ["ij", "n", "sub"],
    [" = ", "n"],
    ["β₀", "a"],
    [" + β₁ ln Y", "n"],
    ["i", "n", "sub"],
    [" + β₂ ln Y", "n"],
    ["j", "n", "sub"],
    [" − γ ln D", "n"],
    ["ij", "n", "sub"],
    [" + ", "n"],
    ["ε", "a"],
    ["ij", "a", "sub"],
  ],
];

const RULES = [
  "aᵇ : b là số mũ của a",
  "ln a = ln b  ⇔  a = b  (a, b > 0)",
  "ln(a·b) = ln a + ln b ;  ln(a/b) = ln a − ln b",
  "ln(a^β) = β · ln a",
  "β₀ = ln G ;  thêm sai số ε",
];
const RULES_EN = [
  "aᵇ : b is the exponent of a",
  "ln a = ln b  ⇔  a = b  (a, b > 0)",
  "ln(a·b) = ln a + ln b ;  ln(a/b) = ln a − ln b",
  "ln(a^β) = β · ln a",
  "β₀ = ln G ;  add an error ε",
];

const NOTES: Array<[string, string]> = [
  [
    "Dạng gốc: các biến nhân với nhau và có số mũ. Hệ số β₁, β₂, γ nằm ở số mũ nên không ước lượng trực tiếp bằng OLS được.",
    "The original form: the variables multiply and carry exponents. β₁, β₂ and γ sit in the exponents, so OLS cannot estimate them directly.",
  ],
  [
    "Lấy ln hai vế. Chỉ làm được khi mọi T > 0: cặp nước có dòng chảy bằng 0 bị loại khỏi mẫu.",
    "Take logs of both sides. This only works when every T > 0: pairs with a zero flow drop out of the sample.",
  ],
  [
    "Tích thành tổng, thương thành hiệu. Dấu trừ trước khoảng cách xuất hiện ở đây.",
    "Products become sums and the quotient becomes a difference. The minus sign on distance appears here.",
  ],
  [
    "Số mũ rơi xuống thành hệ số đứng trước. Bây giờ β₁, β₂, γ là các độ dốc.",
    "The exponents come down as coefficients. β₁, β₂ and γ are now slopes.",
  ],
  [
    "Hằng số ln G đổi tên thành β₀, thêm sai số ε. Đây là một hồi quy tuyến tính, ước lượng bằng OLS. γ là độ co giãn: xa hơn 1% đi kèm giảm khoảng γ% dòng chảy.",
    "The constant ln G is renamed β₀ and an error ε is added. This is a linear regression, estimated by OLS. γ is an elasticity: 1% farther goes with roughly γ% less flow.",
  ],
];

const LABELS: Array<[string, string]> = [
  ["Dạng nhân", "Product form"],
  ["Lấy ln", "Take logs"],
  ["Tích → tổng", "Product → sum"],
  ["Mũ → hệ số", "Exponent → slope"],
  ["Hồi quy OLS", "OLS regression"],
];

/**
 * Illustrative normalised flows T/(Yi·Yj) around the fitted power curve.
 * Distances come from the app's capital-to-Hà Nội table where the country is in it.
 */
const DATA: Array<{
  id?: string;
  vi: string;
  en: string;
  km: number;
  e: number;
  dx?: number;
  dy?: number;
  hide?: boolean;
  hideLin?: boolean;
}> = [
  { id: "HKG", vi: "Hồng Kông", en: "Hong Kong", km: 860, e: 1.18 },
  { id: "THA", vi: "Thái Lan", en: "Thailand", km: 990, e: 0.82, hide: true },
  { id: "TWN", vi: "Đài Loan", en: "Taiwan", km: 1670, e: 1.25, hide: true },
  { id: "MYS", vi: "Malaysia", en: "Malaysia", km: 2060, e: 0.9, hide: true },
  { id: "SGP", vi: "Singapore", en: "Singapore", km: 2210, e: 1.3 },
  { id: "CHN", vi: "Trung Quốc", en: "China", km: 2330, e: 1.05, dx: -86, dy: 16 },
  { id: "KOR", vi: "Hàn Quốc", en: "South Korea", km: 2740, e: 1.35 },
  { vi: "Ấn Độ", en: "India", km: 2950, e: 0.62, dx: -4, dy: 34 },
  { id: "JPN", vi: "Nhật Bản", en: "Japan", km: 3670, e: 1.2 },
  { id: "RUS", vi: "Nga", en: "Russia", km: 6700, e: 0.7, dy: 24 },
  { id: "AUS", vi: "Úc", en: "Australia", km: 7900, e: 1.15, hideLin: true },
  { id: "DEU", vi: "Đức", en: "Germany", km: 8650, e: 0.95, dx: -6, dy: 42 },
  { id: "FRA", vi: "Pháp", en: "France", km: 9200, e: 1.1 },
  { id: "USA", vi: "Mỹ", en: "USA", km: 13100, e: 1.25 },
];
const ZEROS: Array<{ vi: string; en: string; km: number }> = [
  { vi: "Mông Cổ", en: "Mongolia", km: 2350 },
  { vi: "Nam Phi", en: "South Africa", km: 11200 },
  { vi: "Colombia", en: "Colombia", km: 16000 },
];

const W = 640;
const H = 380;
const X0 = 64;
const X1 = 610;
const Y0 = 322;
const Y1 = 30;
const KM_MAX = 16500;
const LN_A = Math.log(700);
const LN_B = Math.log(17000);
const Y_MAX = 150;
const LY_A = Math.log(4);
const LY_B = Math.log(220);

const fit = (km: number) => 100 * Math.pow(km / 1000, -GAMMA);

/** Step 4 of the formula bridge: taking logs, with the chart morphing from a curve to a line. */
export function LogTransformLab() {
  const [st, setSt] = useState(0);
  const [t, setT] = useState(0);
  const raf = useRef(0);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const animateTo = (to: number) => {
    cancelAnimationFrame(raf.current);
    if (reduced) {
      setT(to);
      return;
    }
    const from = t;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 1200);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      setT(from + (to - from) * e);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const L = (a: number, b: number) => a + (b - a) * t;
  const px = (km: number) =>
    L(X0 + (km / KM_MAX) * (X1 - X0), X0 + ((Math.log(km) - LN_A) / (LN_B - LN_A)) * (X1 - X0));
  const py = (v: number) =>
    L(Y0 - (v / Y_MAX) * (Y0 - Y1), Y0 - ((Math.log(v) - LY_A) / (LY_B - LY_A)) * (Y0 - Y1));
  const curve = Array.from({ length: 70 }, (_, i) => {
    const km = 800 * Math.pow(16000 / 800, i / 69);
    return `${px(km).toFixed(1)},${py(fit(km)).toFixed(1)}`;
  }).join(" ");
  const log = t >= 0.5;
  const slopeOpacity = Math.max(0, t * 2 - 1);

  const jp = kmFromHanoi("JPN");
  const ru = kmFromHanoi("RUS");
  const lnRatio = Math.log(ru / jp);
  const dLn = -GAMMA * lnRatio;
  const ratio = Math.exp(dLn);
  const fdiRatio = Math.exp(-FDI_BETA * lnRatio);

  const toneClass = (c: Tone) =>
    c === "h"
      ? "text-clay font-bold"
      : c === "b"
        ? "text-teal font-bold"
        : c === "a"
          ? "text-amber font-bold"
          : "";

  return (
    <div className="@container flex flex-col gap-4">
      <div
        className="flex flex-wrap gap-1.5"
        role="tablist"
        aria-label={tr("Các bước lấy log", "Log steps")}
      >
        {LABELS.map(([vi, en], i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === st}
            onClick={() => setSt(i)}
            className={
              "flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border py-0 pr-3.5 pl-1.5 text-sm font-semibold " +
              (i === st ? "border-teal bg-paper-2/60" : "border-line text-muted")
            }
          >
            <span
              className={
                "grid size-7 place-items-center rounded-full text-xs font-bold " +
                (i === st ? "bg-teal text-paper" : i < st ? "bg-teal/30" : "border border-line")
              }
            >
              {i + 1}
            </span>
            {tr(vi, en)}
          </button>
        ))}
      </div>

      <Inset>
        <p
          className="min-h-16 text-center font-math text-xl leading-relaxed italic sm:text-2xl"
          aria-live="polite"
        >
          {EQ[st]!.map(([text, tone, pos], k) => (
            <span
              key={k}
              className={
                toneClass(tone) +
                (pos === "sub"
                  ? " text-[0.6em] align-[-0.3em]"
                  : pos === "sup"
                    ? " text-[0.6em] align-[0.7em]"
                    : "")
              }
              style={{ whiteSpace: "pre" }}
            >
              {text}
            </span>
          ))}
        </p>
        <div className="mt-3 grid gap-3 @min-[560px]:grid-cols-2">
          <div>
            <Kicker>{tr("Quy tắc dùng ở bước này", "Rule used at this step")}</Kicker>
            <p className="mt-1 font-math text-lg">{tr(RULES[st]!, RULES_EN[st]!)}</p>
          </div>
          <div>
            <Kicker tone="amber">{tr("Điều gì thay đổi", "What changes")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">{tr(NOTES[st]![0], NOTES[st]![1])}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={() => setSt(Math.max(0, st - 1))}
            className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold"
          >
            ← {tr("Bước trước", "Previous")}
          </button>
          <button
            type="button"
            onClick={() => setSt(st === 4 ? 0 : st + 1)}
            className="cosmic-btn min-h-11 rounded-full px-5 text-sm font-semibold"
          >
            {st === 4 ? tr("Xem lại từ đầu", "Start over") : tr("Bước tiếp →", "Next →")}
          </button>
        </div>
      </Inset>

      <div className="grid gap-4 @min-[760px]:grid-cols-[1.2fr_1fr]">
        <Inset className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Kicker>{tr("Mô phỏng · đổi thang đo", "Simulation · change of scale")}</Kicker>
              <p className="font-serif text-lg leading-snug">
                {log
                  ? tr("ln T theo ln D: đường thẳng", "ln T against ln D: a straight line")
                  : tr("T theo D: đường cong lũy thừa", "T against D: a power curve")}
              </p>
            </div>
            <Segmented
              value={log ? "log" : "lin"}
              onChange={(v) => animateTo(v === "log" ? 1 : 0)}
              label={tr("Thang đo", "Scale")}
              options={[
                { id: "lin", label: tr("Thang thường", "Linear") },
                { id: "log", label: tr("Thang log", "Log") },
              ]}
            />
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={
              log
                ? tr(
                    "Trên thang log, các điểm nằm quanh một đường thẳng có độ dốc −0,90",
                    "On log axes the points sit around a straight line with slope −0.90",
                  )
                : tr(
                    "Trên thang thường, dòng chảy giảm nhanh theo khoảng cách rồi chậm dần",
                    "On linear axes the flow falls steeply with distance, then flattens",
                  )
            }
          >
            <line x1={X0} y1={Y0 + 8} x2={X1 + 10} y2={Y0 + 8} className="stroke-line" />
            <line x1={X0} y1={20} x2={X0} y2={Y0 + 8} className="stroke-line" />
            {[10, 25, 50, 100].map((v) => (
              <g key={v}>
                <line
                  x1={X0 - 6}
                  y1={py(v)}
                  x2={X1 + 10}
                  y2={py(v)}
                  className="stroke-line"
                  strokeOpacity={0.5}
                />
                <text x={X0 - 10} y={py(v) + 4} textAnchor="end" className="fill-muted text-[12px]">
                  {v}
                </text>
              </g>
            ))}
            {[1000, 2000, 5000, 10000, 15000].map((v) => (
              <g key={v} opacity={v === 2000 ? t : 1}>
                <line x1={px(v)} y1={Y0 + 8} x2={px(v)} y2={Y0 + 14} className="stroke-muted" />
                <text x={px(v)} y={Y0 + 30} textAnchor="middle" className="fill-muted text-[12px]">
                  {fmtInt(v)}
                </text>
              </g>
            ))}
            <polyline
              points={curve}
              fill="none"
              className="stroke-amber"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            {ZEROS.map((z) => (
              <g key={z.en} opacity={1 - t}>
                <circle
                  cx={px(z.km)}
                  cy={Y0}
                  r={7}
                  fill="none"
                  className="stroke-clay"
                  strokeWidth={2}
                />
                <text
                  x={z.km > 15000 ? px(z.km) - 12 : px(z.km) + 12}
                  y={Y0 + 4}
                  textAnchor={z.km > 15000 ? "end" : "start"}
                  className="fill-clay text-[12px] font-semibold"
                >
                  {tr(z.vi, z.en)}
                </text>
              </g>
            ))}
            {DATA.map((p) => {
              const km = p.id ? kmFromHanoi(p.id) : p.km;
              const x = px(km);
              const y = py(fit(km) * p.e);
              return (
                <g key={p.en}>
                  <circle
                    cx={x}
                    cy={y}
                    r={5.5}
                    className="fill-teal stroke-paper"
                    strokeWidth={1.5}
                  />
                  {p.hide || (p.hideLin && !log) ? null : (
                    <text
                      x={x + 9 + (p.dx ?? 0)}
                      y={y - 8 + (p.dy ?? 0)}
                      className="fill-ink text-[12px]"
                    >
                      {p.id ? countryName(p.id) : tr(p.vi, p.en)}
                    </text>
                  )}
                </g>
              );
            })}
            <text
              x={X1}
              y={32}
              textAnchor="end"
              className="fill-amber text-[13px] font-semibold"
              opacity={slopeOpacity}
            >
              {tr("độ dốc", "slope")} = −γ ≈ −{fmt(GAMMA, 2)}
            </text>
            <text
              x={(X0 + X1) / 2}
              y={H - 4}
              textAnchor="middle"
              className="fill-ink text-[13px] font-semibold"
            >
              {log
                ? tr("Khoảng cách D (km, thang log)", "Distance D (km, log scale)")
                : tr("Khoảng cách D (km)", "Distance D (km)")}
            </text>
            <text
              x={14}
              y={(Y0 + Y1) / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${(Y0 + Y1) / 2})`}
              className="fill-ink text-[13px] font-semibold"
            >
              {log
                ? tr("T / (Yᵢ·Yⱼ), thang log", "T / (Yᵢ·Yⱼ), log scale")
                : tr("T / (Yᵢ·Yⱼ), đã chuẩn hóa", "T / (Yᵢ·Yⱼ), normalised")}
            </text>
          </svg>
          <Slider
            label={tr("Mức chuyển sang thang log", "Blend towards the log scale")}
            valueText={`${Math.round(t * 100)}%`}
            min={0}
            max={100}
            value={Math.round(t * 100)}
            onChange={(v) => {
              cancelAnimationFrame(raf.current);
              setT(v / 100);
            }}
          />
          <div className="flex justify-between text-[13px] text-muted">
            <span>{tr("Thang thường: đường cong", "Linear: a curve")}</span>
            <span>{tr("Thang log: đường thẳng", "Log: a line")}</span>
          </div>
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset>
            <Kicker tone="amber">
              {tr("Vì sao đường cong thành đường thẳng", "Why the curve becomes a line")}
            </Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                "Trên thang thường, T giảm rất nhanh ở gần rồi chậm dần ở xa: quan hệ lũy thừa T ∝ D^−γ. Trên thang log, mỗi lần khoảng cách nhân đôi, ln T giảm đều một lượng γ·ln 2. Mức giảm đều nghĩa là đường thẳng, và độ dốc của nó chính là −γ.",
                "On linear axes T falls steeply nearby and slowly far away: a power law T ∝ D^−γ. On log axes every doubling of distance lowers ln T by the same amount, γ·ln 2. A constant drop is a straight line, and its slope is −γ.",
              )}
            </p>
          </Inset>
          <Inset>
            <Kicker>
              {tr("Tính thử", "Try the numbers")} · γ = {fmt(GAMMA, 2)}
            </Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                `${countryName("JPN")} cách Hà Nội ${fmtInt(jp)} km, ${countryName("RUS")} ${fmtInt(ru)} km. Giữ nguyên quy mô kinh tế:`,
                `${countryName("JPN")} is ${fmtInt(jp)} km from Hà Nội, ${countryName("RUS")} ${fmtInt(ru)} km. Holding economic size fixed:`,
              )}
            </p>
            <div className="mt-2 flex flex-col gap-1 rounded-xl border border-line bg-paper-2/60 p-3 font-math text-lg leading-snug">
              <span>
                ln({fmtInt(ru)} / {fmtInt(jp)}) = {fmt(lnRatio, 3)}
              </span>
              <span>
                Δ ln T = −{fmt(GAMMA, 2)} × {fmt(lnRatio, 3)} = {fmt(dLn, 3)}
              </span>
              <span>
                T<sub>{countryName("RUS")}</sub> / T<sub>{countryName("JPN")}</sub> = e
                <sup>{fmt(dLn, 3)}</sup> = {fmt(ratio, 2)}
              </span>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed">
              <b className="text-clay">
                {tr(
                  `Thấp hơn khoảng ${fmt((1 - ratio) * 100, 0)}%`,
                  `About ${fmt((1 - ratio) * 100, 0)}% lower`,
                )}
              </b>
              {tr(
                `, chỉ do khoảng cách. Với FDI, Phan và Do (2019) ước lượng γ ≈ ${fmt(FDI_BETA, 2)}, nên mức giảm chỉ khoảng ${fmt((1 - fdiRatio) * 100, 0)}%.`,
                `, from distance alone. For FDI, Phan and Do (2019) estimate γ ≈ ${fmt(FDI_BETA, 2)}, so the drop is only about ${fmt((1 - fdiRatio) * 100, 0)}%.`,
              )}
            </p>
          </Inset>
          <Inset tone="clay">
            <Kicker tone="clay">
              {tr("Cái giá của việc lấy log", "The price of taking logs")}
            </Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                "ln 0 không xác định, nên các cặp có dòng chảy bằng 0 (vòng đỏ) biến mất khi chuyển sang thang log. Mẫu bị lệch, và khi sai số thay đổi theo quy mô thì OLS trên log còn cho hệ số chệch. Đó là lý do ở bước 6 chuyển sang PPML (Santos Silva & Tenreyro, 2006).",
                "ln 0 is undefined, so pairs with a zero flow (the red rings) vanish on the log scale. The sample is truncated, and when the error spread changes with size, OLS on logs also gives biased coefficients. That is why step 6 switches to PPML (Santos Silva & Tenreyro, 2006).",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
