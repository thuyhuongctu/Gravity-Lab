import { useMemo, useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import {
  PPML_LN_D_MAX,
  PPML_LN_D_MIN,
  ppmlDraw,
  ppmlFit,
  ppmlSample,
  TRUE_GAMMA,
} from "@/sim/bridge-sim";
import { EstimateBar, Inset, Kicker, Slider, Swatch } from "@/components/bridge/ui";

const W = 640;
const H = 360;
const X0 = 56;
const X1 = 620;
const Y0 = 320;
const Y1 = 18;
const Y_MAX = 220;

const px = (lnD: number) =>
  X0 + ((lnD - PPML_LN_D_MIN) / (PPML_LN_D_MAX - PPML_LN_D_MIN)) * (X1 - X0);
const py = (T: number) => Y0 - (Math.min(T, Y_MAX) / Y_MAX) * (Y0 - Y1);
const curve = (f: (lnD: number) => number) =>
  Array.from({ length: 60 }, (_, i) => {
    const l = PPML_LN_D_MIN + ((PPML_LN_D_MAX - PPML_LN_D_MIN) * i) / 59;
    return `${px(l).toFixed(1)},${py(f(l)).toFixed(1)}`;
  }).join(" ");

/** Step 6 of the formula bridge: zeros and heteroskedasticity, OLS on logs against PPML. */
export function PpmlLab() {
  const [seed, setSeed] = useState(7);
  const [zero, setZero] = useState(20);
  const [het, setHet] = useState(60);
  const draw = useMemo(() => ppmlDraw(seed), [seed]);
  const sample = useMemo(() => ppmlSample(draw, zero / 100, het / 100), [draw, zero, het]);
  const fit = useMemo(() => ppmlFit(sample), [sample]);

  const dropped = sample.length - fit.nPositive;
  const eO = Math.abs(fit.gammaOls - TRUE_GAMMA);
  const eP = Math.abs(fit.gammaPpml - TRUE_GAMMA);
  const h = het / 100;
  const base = zero === 0 && h < 0.05;
  const hetLabel =
    h < 0.05
      ? tr("không", "none")
      : h < 0.4
        ? tr("nhẹ", "mild")
        : h < 0.75
          ? tr("vừa", "moderate")
          : tr("mạnh", "strong");
  const verdict = base
    ? tr(
        `Không có dòng chảy bằng 0 và sai số đồng đều: OLS ${fmt(fit.gammaOls, 2)}, PPML ${fmt(fit.gammaPpml, 2)}, cả hai sát γ thật. Chênh lệch nhỏ còn lại là nhiễu do lấy mẫu; bấm "Mẫu khác" để thấy nó đổi chiều.`,
        `No zeros and an even error spread: OLS ${fmt(fit.gammaOls, 2)}, PPML ${fmt(fit.gammaPpml, 2)}, both close to the true γ. The small gap is sampling noise; press "New sample" to watch it change sign.`,
      )
    : tr(
        `OLS lệch ${fmt(eO, 2)} so với γ thật, PPML lệch ${fmt(eP, 2)}. ${fit.gammaOls < TRUE_GAMMA ? "OLS đánh giá thấp tác động của khoảng cách: hiệu ứng bỏ dòng chảy 0 đang lấn át" : "OLS phóng đại tác động của khoảng cách: hiệu ứng phương sai đang lấn át"}${dropped ? `; OLS đã bỏ ${dropped} cặp có T = 0` : ""}.`,
        `OLS is off by ${fmt(eO, 2)} from the true γ, PPML by ${fmt(eP, 2)}. ${fit.gammaOls < TRUE_GAMMA ? "OLS understates distance: dropping the zeros dominates" : "OLS overstates distance: the growing error spread dominates"}${dropped ? `; OLS dropped ${dropped} pairs with T = 0` : ""}.`,
      );

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-3 @min-[620px]:grid-cols-2">
        <Inset tone="clay">
          <Kicker tone="clay">OLS · {tr("bước 4", "step 4")}</Kicker>
          <p className="mt-1 font-math text-lg italic">
            ln T<sub>ij</sub> = β₀ − γ ln D<sub>ij</sub> + ε<sub>ij</sub>
          </p>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "Chỉ dùng được T > 0. Ước lượng E[ln T], không phải ln E[T].",
              "Only T > 0 can be used. It estimates E[ln T], not ln E[T].",
            )}
          </p>
        </Inset>
        <Inset>
          <Kicker>PPML · {tr("bước 6", "step 6")}</Kicker>
          <p className="mt-1 font-math text-lg italic">
            T<sub>ij</sub> = exp(β₀ − γ ln D<sub>ij</sub>) · η<sub>ij</sub>
          </p>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "Ước lượng trên mức T, gồm cả T = 0. Nhất quán khi sai số thay đổi theo quy mô.",
              "Estimated on the level of T, zeros included. Consistent when the error spread changes with size.",
            )}
          </p>
        </Inset>
      </div>

      <div className="grid gap-4 @min-[760px]:grid-cols-[1.2fr_1fr]">
        <Inset className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Kicker>{tr("Mô phỏng · dữ liệu giả lập", "Simulation · synthetic data")}</Kicker>
              <p className="font-serif text-lg leading-snug">
                {tr("T theo D, thang thường", "T against D, linear scale")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="min-h-11 whitespace-nowrap rounded-full border border-line px-4 text-[13px] font-semibold"
            >
              ↻ {tr("Mẫu khác", "New sample")}
            </button>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={tr(
              `400 cặp nước, T theo D. OLS trên log cho γ = ${fmt(fit.gammaOls, 2)}, PPML cho ${fmt(fit.gammaPpml, 2)}, γ thật 0,90.`,
              `400 country pairs, T against D. OLS on logs gives γ = ${fmt(fit.gammaOls, 2)}, PPML gives ${fmt(fit.gammaPpml, 2)}, true γ 0.90.`,
            )}
          >
            <line x1={X0} y1={Y0} x2={X1 + 4} y2={Y0} className="stroke-line" />
            <line x1={X0} y1={16} x2={X0} y2={Y0} className="stroke-line" />
            {[50, 100, 150, 200].map((v) => (
              <g key={v}>
                <line
                  x1={X0}
                  y1={py(v)}
                  x2={X1 + 4}
                  y2={py(v)}
                  className="stroke-line"
                  strokeOpacity={0.5}
                />
                <text x={X0 - 8} y={py(v) + 4} textAnchor="end" className="fill-muted text-[12px]">
                  {v}
                </text>
              </g>
            ))}
            {[1000, 2000, 5000, 10000].map((v) => (
              <text
                key={v}
                x={px(Math.log(v))}
                y={Y0 + 18}
                textAnchor="middle"
                className="fill-muted text-[12px]"
              >
                {fmtInt(v)}
              </text>
            ))}
            {sample.map((d, i) =>
              d.T > 0 ? (
                <circle
                  key={i}
                  cx={px(d.lnD)}
                  cy={py(d.T)}
                  r={3.5}
                  className="fill-teal stroke-paper"
                  strokeWidth={1.5}
                  opacity={0.75}
                />
              ) : (
                <circle
                  key={i}
                  cx={px(d.lnD)}
                  cy={Y0}
                  r={5}
                  fill="none"
                  className="stroke-clay"
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              ),
            )}
            <polyline
              points={curve((l) => 100 * Math.exp(-TRUE_GAMMA * (l - Math.log(1000))))}
              fill="none"
              className="stroke-muted"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
            <polyline
              points={curve(fit.olsCurve)}
              fill="none"
              className="stroke-clay"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <polyline
              points={curve(fit.ppmlCurve)}
              fill="none"
              className="stroke-teal"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <text
              x={(X0 + X1) / 2}
              y={H - 4}
              textAnchor="middle"
              className="fill-ink text-[13px] font-semibold"
            >
              {tr("Khoảng cách D (km, thang log)", "Distance D (km, log scale)")}
            </text>
          </svg>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Swatch kind="dash" tone="muted">
              {tr("Thật (γ = 0,90)", "True (γ = 0.90)")}
            </Swatch>
            <Swatch kind="line" tone="clay">
              {tr("OLS trên log", "OLS on logs")}
            </Swatch>
            <Swatch kind="line" tone="teal">
              PPML
            </Swatch>
            <Swatch kind="ring" tone="clay">
              {tr("T = 0 (OLS bỏ)", "T = 0 (OLS drops)")}
            </Swatch>
          </div>
          <Slider
            label={tr("Tỷ lệ dòng chảy bằng 0", "Share of zero flows")}
            valueText={`${zero}%`}
            min={0}
            max={40}
            value={zero}
            onChange={setZero}
            tone="clay"
          />
          <Slider
            label={tr("Sai số tăng theo khoảng cách", "Error spread growing with distance")}
            valueText={hetLabel}
            min={0}
            max={100}
            value={het}
            onChange={setHet}
            tone="amber"
          />
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset className="flex flex-col gap-3">
            <Kicker tone="amber">{tr("Ước lượng γ", "Estimates of γ")}</Kicker>
            <EstimateBar
              name={tr("Thật", "True")}
              note={tr("400 cặp", "400 pairs")}
              value={TRUE_GAMMA}
              reference={TRUE_GAMMA}
              max={1.5}
              tone="muted"
            />
            <EstimateBar
              name={tr("OLS trên ln T", "OLS on ln T")}
              note={tr(
                `${fit.nPositive} cặp · bỏ ${dropped}`,
                `${fit.nPositive} pairs · ${dropped} dropped`,
              )}
              value={fit.gammaOls}
              reference={TRUE_GAMMA}
              max={1.5}
              tone="clay"
            />
            <EstimateBar
              name="PPML"
              note={tr("400 cặp", "400 pairs")}
              value={fit.gammaPpml}
              reference={TRUE_GAMMA}
              max={1.5}
              tone="teal"
            />
            <p className="text-[13px] text-muted">
              {tr(
                "Vạch xám: γ thật = 0,90. Thang 0 – 1,5.",
                "Grey mark: true γ = 0.90. Scale 0 – 1.5.",
              )}
            </p>
          </Inset>
          <Inset>
            <Kicker>{tr("Đọc kết quả", "Reading the result")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">{verdict}</p>
          </Inset>
          <Inset className="flex flex-col gap-2">
            <Kicker tone="amber">
              {tr(
                "Vì sao OLS lệch: hai cơ chế ngược chiều",
                "Why OLS is biased: two opposing mechanisms",
              )}
            </Kicker>
            <p className="text-[15px] leading-relaxed">
              <b className="text-clay">
                {tr("1. Bỏ dòng chảy 0 → γ bị kéo xuống.", "1. Dropping zeros pulls γ down.")}
              </b>{" "}
              {tr(
                "Cặp càng xa càng dễ có dòng chảy bằng 0. OLS bỏ các cặp này, nên những cặp xa còn lại trong mẫu là những cặp có dòng chảy lớn; đường hồi quy phẳng hơn và OLS đánh giá thấp γ.",
                "Distant pairs are the likeliest to have a zero flow. OLS drops them, so the distant pairs left in the sample are the ones with large flows; the line flattens and OLS understates γ.",
              )}
            </p>
            <p className="text-[15px] leading-relaxed">
              <b className="text-amber">
                {tr(
                  "2. Phương sai tăng theo D → γ bị đẩy lên.",
                  "2. Spread growing with D pushes γ up.",
                )}
              </b>{" "}
              {tr(
                "Theo bất đẳng thức Jensen, E[ln η] = −σ²/2. Khi σ² tăng theo khoảng cách, phần −σ²/2 dồn vào hệ số của ln D, nên OLS phóng đại tác động của khoảng cách.",
                "By Jensen's inequality, E[ln η] = −σ²/2. When σ² grows with distance, that −σ²/2 loads onto the coefficient of ln D, so OLS exaggerates the effect of distance.",
              )}
            </p>
            <p className="text-sm text-muted">
              {tr(
                "PPML dùng cả T = 0 và chỉ cần E[η | D] = 1, nên tránh được cả hai (Santos Silva & Tenreyro, 2006).",
                "PPML uses the zeros and only needs E[η | D] = 1, so it avoids both (Santos Silva & Tenreyro, 2006).",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
