import { useMemo, useState } from "react";
import { fmt, tr } from "@/lib/prefs";
import { mrtDraw, mrtFit, TRUE_GAMMA } from "@/sim/bridge-sim";
import { EstimateBar, Inset, Kicker, Segmented, Slider, Swatch } from "@/components/bridge/ui";

const W = 640;
const H = 360;

/** Step 5 of the formula bridge: multilateral resistance and the "gold medal" mistake. */
export function MrtLab() {
  const [seed, setSeed] = useState(3);
  const [k, setK] = useState(120);
  const [view, setView] = useState<"raw" | "fe">("raw");
  const draw = useMemo(() => mrtDraw(seed), [seed]);
  const fit = useMemo(() => mrtFit(draw, k / 100), [draw, k]);

  const fe = view === "fe";
  const X = fe ? fit.xFe : fit.x;
  const Y = fe ? fit.yFe : fit.y;
  const xmin = Math.min(...X);
  const xmax = Math.max(...X);
  const ymin = Math.min(...Y);
  const ymax = Math.max(...Y);
  const px = (v: number) => 64 + ((v - xmin) / (xmax - xmin)) * 548;
  const py = (v: number) => 312 - ((v - ymin) / (ymax - ymin)) * 286;
  const gamma = fe ? fit.gammaFe : fit.gammaOls;
  const mx = X.reduce((s, v) => s + v, 0) / X.length;
  const my = Y.reduce((s, v) => s + v, 0) / Y.length;
  const clip = (v: number) => Math.max(ymin, Math.min(ymax, v));
  const line = {
    x1: px(xmin),
    y1: py(clip(my - gamma * (xmin - mx))),
    x2: px(xmax),
    y2: py(clip(my - gamma * (xmax - mx))),
  };
  const colour = (i: number, j: number) =>
    draw.remote[i] && draw.remote[j]
      ? "fill-clay"
      : draw.remote[i] || draw.remote[j]
        ? "fill-amber"
        : "fill-teal";

  const eO = Math.abs(fit.gammaOls - TRUE_GAMMA);
  const eF = Math.abs(fit.gammaFe - TRUE_GAMMA);
  const strength =
    k === 0
      ? tr("không có", "none")
      : k < 70
        ? tr("yếu", "weak")
        : k < 140
          ? tr("vừa", "moderate")
          : tr("mạnh", "strong");
  const verdict =
    k === 0
      ? tr(
          `Không có sức cản đa phương: hai cách gần như trùng nhau (${fmt(fit.gammaOls, 2)} và ${fmt(fit.gammaFe, 2)}). Kéo thanh trượt lên để thấy OLS thường lệch dần.`,
          `No multilateral resistance: the two estimates almost coincide (${fmt(fit.gammaOls, 2)} and ${fmt(fit.gammaFe, 2)}). Raise the slider to watch plain OLS drift.`,
        )
      : fit.gammaOls <= 0
        ? tr(
            `Sức cản đa phương mạnh đến mức OLS đổi dấu: γ = ${fmt(fit.gammaOls, 2)}, tức khoảng cách "làm tăng" thương mại. Hiệu ứng cố định vẫn cho ${fmt(fit.gammaFe, 2)}.`,
            `Multilateral resistance is strong enough to flip the sign: OLS gives γ = ${fmt(fit.gammaOls, 2)}, as if distance "raised" trade. Fixed effects still give ${fmt(fit.gammaFe, 2)}.`,
          )
        : tr(
            `OLS bỏ sót sức cản đa phương cho γ = ${fmt(fit.gammaOls, 2)}, lệch ${fmt(eO, 2)}; thêm hiệu ứng cố định cho ${fmt(fit.gammaFe, 2)}, lệch ${fmt(eF, 2)}. Các cặp nước xa (đỏ, vàng) nằm cao hơn mức khoảng cách gợi ý, kéo đường hồi quy phẳng ra. Chuyển sang "Sau hiệu ứng cố định" để thấy đám mây điểm thẳng lại.`,
            `OLS without multilateral resistance gives γ = ${fmt(fit.gammaOls, 2)}, off by ${fmt(eO, 2)}; adding fixed effects gives ${fmt(fit.gammaFe, 2)}, off by ${fmt(eF, 2)}. Remote pairs (red, amber) sit above what distance alone implies and flatten the regression line. Switch to "After fixed effects" to see the cloud straighten.`,
          );

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-3 @min-[620px]:grid-cols-2">
        <Inset tone="clay">
          <Kicker tone="clay">
            {tr('Bỏ sót · lỗi "huy chương vàng"', 'Omitted · the "gold medal" mistake')}
          </Kicker>
          <p className="mt-1 font-math text-lg italic">
            ln T<sub>ij</sub> = β₀ − γ ln D<sub>ij</sub> + ε<sub>ij</sub>
          </p>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "Sức cản đa phương nằm trong ε và tương quan với ln D, nên γ bị chệch (Bacchetta và cộng sự, 2012).",
              "Multilateral resistance sits in ε and is correlated with ln D, so γ is biased (Bacchetta et al., 2012).",
            )}
          </p>
        </Inset>
        <Inset>
          <Kicker>Anderson & van Wincoop (2003)</Kicker>
          <p className="mt-1 font-math text-lg italic">
            ln T<sub>ij</sub> ={" "}
            <b className="text-amber">
              α<sub>i</sub>
            </b>{" "}
            +{" "}
            <b className="text-amber">
              δ<sub>j</sub>
            </b>{" "}
            − γ ln D<sub>ij</sub> + ε<sub>ij</sub>
          </p>
          <p className="mt-1 text-sm text-muted">
            {tr(
              "Hiệu ứng cố định nước xuất khẩu αᵢ và nhập khẩu δⱼ hấp thụ Πᵢ và Pⱼ, cùng GDP.",
              "Exporter fixed effects αᵢ and importer fixed effects δⱼ absorb Πᵢ and Pⱼ, along with GDP.",
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
                {fe
                  ? tr("Sau khi trừ αᵢ và δⱼ", "After removing αᵢ and δⱼ")
                  : tr("ln T theo ln D, chưa xử lý", "ln T against ln D, untreated")}
              </p>
            </div>
            <Segmented
              value={view}
              onChange={setView}
              label={tr("Dữ liệu", "Data")}
              options={[
                { id: "raw", label: tr("Dữ liệu thô", "Raw data") },
                { id: "fe", label: tr("Sau hiệu ứng cố định", "After fixed effects") },
              ]}
            />
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={tr(
              `Biểu đồ phân tán 552 cặp nước, ln T theo ln D. ${fe ? "Sau hiệu ứng cố định" : "Dữ liệu thô"}, độ dốc ${fmt(-gamma, 2)}; γ thật ${fmt(TRUE_GAMMA, 2)}.`,
              `Scatter of 552 country pairs, ln T against ln D. ${fe ? "After fixed effects" : "Raw data"}, slope ${fmt(-gamma, 2)}; true γ ${fmt(TRUE_GAMMA, 2)}.`,
            )}
          >
            <line x1={56} y1={320} x2={624} y2={320} className="stroke-line" />
            <line x1={56} y1={16} x2={56} y2={320} className="stroke-line" />
            {draw.pairs.map((p, q) => (
              <circle
                key={q}
                cx={px(X[q]!)}
                cy={py(Y[q]!)}
                r={3}
                className={colour(p.i, p.j)}
                opacity={0.7}
              />
            ))}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={fe ? "stroke-teal" : "stroke-clay"}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <text
              x={620}
              y={30}
              textAnchor="end"
              className={(fe ? "fill-teal" : "fill-clay") + " text-[13px] font-semibold"}
            >
              {tr("độ dốc", "slope")} = {fmt(-gamma, 2)}
            </text>
            <text
              x={340}
              y={H - 4}
              textAnchor="middle"
              className="fill-ink text-[13px] font-semibold"
            >
              {fe
                ? tr("ln D (đã trừ trung bình theo nước)", "ln D (country means removed)")
                : tr("ln D (khoảng cách, km)", "ln D (distance, km)")}
            </text>
            <text
              x={14}
              y={168}
              textAnchor="middle"
              transform="rotate(-90 14 168)"
              className="fill-ink text-[13px] font-semibold"
            >
              {fe ? tr("ln T (đã trừ)", "ln T (demeaned)") : "ln T"}
            </text>
          </svg>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Swatch kind="dot" tone="teal">
              {tr("Hai nước trung tâm", "Both central")}
            </Swatch>
            <Swatch kind="dot" tone="amber">
              {tr("Một nước xa", "One remote")}
            </Swatch>
            <Swatch kind="dot" tone="clay">
              {tr("Hai nước xa", "Both remote")}
            </Swatch>
          </div>
          <Slider
            label={tr("Độ mạnh sức cản đa phương", "Strength of multilateral resistance")}
            valueText={strength}
            min={0}
            max={200}
            value={k}
            onChange={setK}
            tone="amber"
          />
          <div className="flex items-center justify-between gap-3 text-[13px] text-muted">
            <span>{tr("0: không có, OLS thường là đủ", "0: none, plain OLS is enough")}</span>
            <button
              type="button"
              onClick={() => setSeed((s) => s + 1)}
              className="min-h-11 whitespace-nowrap rounded-full border border-line px-4 text-[13px] font-semibold text-ink"
            >
              ↻ {tr("Mẫu khác", "New sample")}
            </button>
          </div>
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset className="flex flex-col gap-3">
            <Kicker tone="amber">{tr("Ước lượng γ", "Estimates of γ")}</Kicker>
            <EstimateBar
              name={tr("Thật", "True")}
              note={tr("552 cặp", "552 pairs")}
              value={TRUE_GAMMA}
              reference={TRUE_GAMMA}
              max={1.5}
              tone="muted"
            />
            <EstimateBar
              name={tr("OLS, không hiệu ứng cố định", "OLS, no fixed effects")}
              note={tr("lỗi huy chương vàng", "gold medal mistake")}
              value={fit.gammaOls}
              reference={TRUE_GAMMA}
              max={1.5}
              tone="clay"
            />
            <EstimateBar
              name={tr("OLS + hiệu ứng cố định αᵢ, δⱼ", "OLS + fixed effects αᵢ, δⱼ")}
              note={tr("48 hiệu ứng", "48 effects")}
              value={fit.gammaFe}
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
          <Inset>
            <Kicker tone="amber">{tr("Trong Stata", "In Stata")}</Kicker>
            <pre className="mt-1 overflow-x-auto font-mono text-[13px] leading-relaxed">
              {
                "reg ln_trade ln_dist\nreghdfe ln_trade ln_dist, absorb(exp_year imp_year)\nppmlhdfe trade ln_dist, absorb(exp_year imp_year)"
              }
            </pre>
            <p className="mt-1 text-sm text-muted">
              {tr(
                "Với dữ liệu bảng, dùng hiệu ứng cố định nước xuất khẩu × năm và nhập khẩu × năm (Yotov và cộng sự, 2016).",
                "With panel data, use exporter × year and importer × year fixed effects (Yotov et al., 2016).",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
