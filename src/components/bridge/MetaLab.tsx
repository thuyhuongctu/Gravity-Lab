import { useMemo, useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { Inset, Kicker, Slider } from "@/components/bridge/ui";

/** Disdier & Head (2008): 1,467 estimates from 103 papers; mean 0.9, 90% between 0.28 and 1.55. */
const N_EST = 1467;
const N_PAPERS = 103;
const MEAN = 0.9;
const P05 = 0.28;
const P95 = 1.55;
const FDI_BETA = 0.38;

/**
 * Illustrative distribution that reproduces the published mean and the 5th–95th range.
 * The paper reports summary statistics, not the raw histogram, so the shape is a stand-in.
 */
function quantile(u: number): number {
  // Piecewise-linear quantile function through (0, 0.02), (0.05, P05), (0.5, 0.86), (0.95, P95), (1, 2.6).
  const K: Array<[number, number]> = [
    [0, 0.02],
    [0.05, P05],
    [0.5, 0.86],
    [0.95, P95],
    [1, 2.6],
  ];
  for (let i = 1; i < K.length; i++) {
    const [u0, q0] = K[i - 1]!;
    const [u1, q1] = K[i]!;
    if (u <= u1) return q0 + ((u - u0) / (u1 - u0)) * (q1 - q0);
  }
  return 2.6;
}

const BIN = 0.1;
const MAX = 2.6;
const W = 640;
const H = 300;
const X0 = 50;
const X1 = 620;
const Y0 = 262;
const Y1 = 20;

/** Step 3 of the formula bridge: what a thousand published estimates say about γ. */
export function MetaLab() {
  const [gamma, setGamma] = useState(0.9);
  const sample = useMemo(
    () => Array.from({ length: N_EST }, (_, i) => quantile((i + 0.5) / N_EST)),
    [],
  );
  const bins = useMemo(() => {
    const nb = Math.round(MAX / BIN);
    const c = new Array<number>(nb).fill(0);
    sample.forEach((v) => {
      c[Math.min(nb - 1, Math.floor(v / BIN))]! += 1;
    });
    return c;
  }, [sample]);
  const peak = Math.max(...bins);
  const below = sample.filter((v) => v < gamma).length / N_EST;
  const px = (g: number) => X0 + (g / MAX) * (X1 - X0);
  const py = (c: number) => Y0 - (c / peak) * (Y0 - Y1);
  const halving = 100 / Math.pow(2, gamma);

  return (
    <div className="@container flex flex-col gap-4">
      <div className="grid gap-4 @min-[760px]:grid-cols-[1.2fr_1fr]">
        <Inset className="flex flex-col gap-3">
          <div>
            <Kicker>
              {tr(
                "Phân tích tổng hợp · Disdier & Head (2008)",
                "Meta-analysis · Disdier & Head (2008)",
              )}
            </Kicker>
            <p className="font-serif text-lg leading-snug">
              {tr(
                `${fmtInt(N_EST)} ước lượng |γ| từ ${N_PAPERS} bài`,
                `${fmtInt(N_EST)} estimates of |γ| from ${N_PAPERS} papers`,
              )}
            </p>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={tr(
              `Biểu đồ tần suất của ${fmtInt(N_EST)} ước lượng hệ số khoảng cách, trung bình 0,9, 90% từ 0,28 đến 1,55; vạch đánh dấu γ = ${fmt(gamma, 2)}`,
              `Histogram of ${fmtInt(N_EST)} distance-coefficient estimates, mean 0.9, 90% between 0.28 and 1.55; the mark shows γ = ${fmt(gamma, 2)}`,
            )}
          >
            <line x1={X0} y1={Y0} x2={X1} y2={Y0} className="stroke-line" />
            {bins.map((c, i) => {
              const g0 = i * BIN;
              const inside = g0 + BIN / 2 >= P05 && g0 + BIN / 2 <= P95;
              return (
                <rect
                  key={i}
                  x={px(g0) + 1}
                  y={py(c)}
                  width={px(g0 + BIN) - px(g0) - 2}
                  height={Y0 - py(c)}
                  className={inside ? "fill-teal" : "fill-mist"}
                  opacity={g0 + BIN / 2 < gamma ? 0.95 : 0.45}
                />
              );
            })}
            <line
              x1={px(MEAN)}
              y1={Y1}
              x2={px(MEAN)}
              y2={Y0}
              className="stroke-amber"
              strokeDasharray="4 4"
            />
            <text x={px(MEAN) + 6} y={Y1 + 12} className="fill-amber text-[12px] font-semibold">
              {tr("trung bình", "mean")} {fmt(MEAN, 1)}
            </text>
            <line
              x1={px(gamma)}
              y1={Y1}
              x2={px(gamma)}
              y2={Y0 + 6}
              className="stroke-clay"
              strokeWidth={2.5}
            />
            <line
              x1={px(FDI_BETA)}
              y1={Y0 - 60}
              x2={px(FDI_BETA)}
              y2={Y0 + 6}
              className="stroke-ink"
              strokeWidth={1.5}
            />
            <text x={px(FDI_BETA)} y={Y0 - 66} textAnchor="middle" className="fill-ink text-[12px]">
              FDI {fmt(FDI_BETA, 2)}
            </text>
            {[0, 0.5, 1, 1.5, 2, 2.5].map((g) => (
              <text
                key={g}
                x={px(g)}
                y={Y0 + 18}
                textAnchor="middle"
                className="fill-muted text-[12px]"
              >
                {fmt(g, 1)}
              </text>
            ))}
            <text
              x={(X0 + X1) / 2}
              y={H - 4}
              textAnchor="middle"
              className="fill-ink text-[13px] font-semibold"
            >
              {tr(
                "|γ|, độ co giãn của thương mại theo khoảng cách",
                "|γ|, the distance elasticity of trade",
              )}
            </text>
          </svg>
          <Slider
            label={tr("Chọn γ của bạn", "Pick your γ")}
            valueText={fmt(gamma, 2)}
            min={0.1}
            max={2.5}
            step={0.01}
            value={gamma}
            onChange={setGamma}
            tone="clay"
          />
          <p className="text-[13px] text-muted">
            {tr(
              "Màu xanh: khoảng 5%–95% của các ước lượng (0,28 – 1,55). Hình dạng phân phối là minh hoạ khớp với các thống kê công bố; bài báo không in dữ liệu thô.",
              "Teal: the 5th–95th range of estimates (0.28 – 1.55). The shape is a stand-in that matches the published statistics; the paper does not print the raw data.",
            )}
          </p>
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset>
            <Kicker tone="clay">
              {tr(`Với γ = ${fmt(gamma, 2)}`, `With γ = ${fmt(gamma, 2)}`)}
            </Kicker>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[13px] text-muted">
                  {tr("Ước lượng nhỏ hơn", "Estimates below")}
                </p>
                <b className="font-serif text-3xl tabular-nums text-clay">{fmt(below * 100, 0)}%</b>
              </div>
              <div>
                <p className="text-[13px] text-muted">
                  {tr("Xa gấp đôi → còn", "Twice as far → left")}
                </p>
                <b className="font-serif text-3xl tabular-nums text-teal">{fmt(halving, 0)}%</b>
              </div>
            </div>
            <p className="mt-2 text-[15px] leading-relaxed">
              {gamma <= 0.45
                ? tr(
                    "Nhỏ hơn hầu hết ước lượng cho thương mại hàng hoá. Với FDI, giá trị thấp như vậy lại bình thường: Phan và Do (2019) tìm được 0,38.",
                    "Below almost every estimate for goods trade. For FDI such a low value is normal: Phan and Do (2019) find 0.38.",
                  )
                : gamma > P95
                  ? tr(
                      "Lớn hơn 95% ước lượng đã công bố: nên xem lại đặc tả (sức cản đa phương, số 0, hiệu ứng cố định).",
                      "Above 95% of published estimates: revisit the specification (multilateral resistance, zeros, fixed effects).",
                    )
                  : tr(
                      "Nằm trong khoảng thông thường của thương mại hàng hoá. Giá trị chuẩn trong sách giáo khoa là 1; trung bình tổng hợp gần 0,9.",
                      "Within the usual range for goods trade. The textbook benchmark is 1; the pooled mean is near 0.9.",
                    )}
            </p>
          </Inset>
          <Inset>
            <Kicker>{tr("Vì sao không còn là 2", "Why it is no longer 2")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                "Không có định luật nào buộc thương mại giảm theo bình phương khoảng cách. Số mũ trở thành tham số: chi phí vận tải, thông tin, văn hoá và thời gian giao hàng gộp vào một con số, và con số ấy thay đổi theo ngành, thời kỳ và cách ước lượng. Vì thế mỗi nghiên cứu cho một γ khác nhau.",
                "No law forces trade to fall with the square of distance. The exponent becomes a parameter: transport, information, cultural and delivery-time costs collapse into one number, and that number varies by sector, period and estimation method. That is why every study gives a different γ.",
              )}
            </p>
          </Inset>
          <Inset tone="clay">
            <Kicker tone="clay">{tr("Câu đố còn lại", "The puzzle that remains")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                "Disdier và Head thấy |γ| không giảm theo thời gian dù chi phí vận tải giảm mạnh. Cảnh 7 của câu chuyện giải thích vì sao: thiếu thương mại nội địa trong mẫu (Yotov và cộng sự, 2016).",
                "Disdier and Head find that |γ| does not fall over time even as transport costs collapse. Scene 7 of the story explains why: intra-national trade is missing from the sample (Yotov et al., 2016).",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
