import { useState } from "react";
import { fmt, tr } from "@/lib/prefs";
import { Inset, Kicker, Swatch } from "@/components/bridge/ui";

const YEARS = [1986, 1990, 1994, 1998, 2002, 2006];

/** Yotov et al. (2016), Table 2: distance coefficients by year, columns (1) and (3). */
const SERIES = [
  {
    id: "ols",
    vi: "OLS, chỉ thương mại quốc tế",
    en: "OLS, international trade only",
    values: [-1.168, -1.155, -1.211, -1.248, -1.241, -1.261],
    /** Published change from 1986 to 2006, in percent. */
    change: 7.95,
    tone: "clay" as const,
  },
  {
    id: "intra",
    vi: "PPML, thêm thương mại nội địa",
    en: "PPML, with intra-national trade",
    values: [-0.98, -0.94, -0.915, -0.887, -0.884, -0.872],
    change: -10.97,
    tone: "teal" as const,
  },
];

const RECS: Array<[string, string]> = [
  ["Dùng dữ liệu bảng", "Use panel data"],
  [
    "Lấy khoảng cách vài năm, không dùng năm liên tiếp",
    "Use intervals of a few years, not consecutive years",
  ],
  ["Đưa thương mại nội địa vào mẫu", "Include intra-national trade"],
  [
    "Hiệu ứng cố định nước xuất khẩu–năm và nhập khẩu–năm",
    "Exporter-year and importer-year fixed effects",
  ],
  ["Thêm hiệu ứng cố định theo cặp nước", "Add pair fixed effects"],
  ["Ước lượng bằng PPML", "Estimate with PPML"],
];

const W = 640;
const H = 340;
const PAD = { l: 40, r: 12, t: 16, b: 40 };
const LO = 0.8;
const HI = 1.3;

const x = (i: number) => PAD.l + ((2 * i + 1) / 12) * (W - PAD.l - PAD.r);
const y = (v: number) => PAD.t + ((HI - Math.abs(v)) / (HI - LO)) * (H - PAD.t - PAD.b);

/** The "distance puzzle" and its resolution, drawn from the published table, with a year picker. */
export function DistancePuzzle() {
  const [i, setI] = useState(5);
  const change = (s: (typeof SERIES)[number]) => {
    if (i === 0) return tr("mốc gốc", "base year");
    const published = i === 5;
    const c = published ? s.change : (Math.abs(s.values[i]!) / Math.abs(s.values[0]!) - 1) * 100;
    return `${c >= 0 ? "+" : "−"}${fmt(Math.abs(c), 2)}% · ${published ? tr("số công bố", "published figure") : tr("tính từ hệ số làm tròn", "from the rounded coefficients")}`;
  };

  return (
    <div className="@container mt-3 flex flex-col gap-4">
      <div className="grid gap-4 @min-[760px]:grid-cols-[1.2fr_1fr]">
        <Inset className="flex flex-col gap-3">
          <div>
            <Kicker>
              {tr(
                "Số liệu công bố · Bảng 2, cột (1) và (3)",
                "Published figures · Table 2, columns (1) and (3)",
              )}
            </Kicker>
            <p className="font-serif text-lg leading-snug">{tr("|γ| theo năm", "|γ| by year")}</p>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full"
            role="img"
            aria-label={tr(
              "Độ lớn hệ số khoảng cách theo năm, 1986–2006: OLS tăng từ 1,17 lên 1,26; PPML có thương mại nội địa giảm từ 0,98 xuống 0,87.",
              "Size of the distance coefficient by year, 1986–2006: OLS rises from 1.17 to 1.26; PPML with intra-national trade falls from 0.98 to 0.87.",
            )}
          >
            {[0.8, 0.9, 1.0, 1.1, 1.2, 1.3].map((g) => (
              <g key={g}>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y(g)}
                  y2={y(g)}
                  className="stroke-line"
                  strokeOpacity={0.6}
                />
                <text
                  x={PAD.l - 8}
                  y={y(g) + 4}
                  textAnchor="end"
                  className="fill-muted text-[12px]"
                >
                  {fmt(g, 1)}
                </text>
              </g>
            ))}
            <line
              x1={x(i)}
              x2={x(i)}
              y1={PAD.t}
              y2={H - PAD.b}
              className="stroke-muted"
              strokeDasharray="4 4"
            />
            {YEARS.map((yr, k) => (
              <text
                key={yr}
                x={x(k)}
                y={H - 12}
                textAnchor="middle"
                className={"text-[12px] " + (k === i ? "fill-ink font-semibold" : "fill-muted")}
              >
                {yr}
              </text>
            ))}
            {SERIES.map((s) => (
              <g key={s.id}>
                <polyline
                  fill="none"
                  className={s.tone === "clay" ? "stroke-clay" : "stroke-teal"}
                  strokeWidth={3}
                  strokeLinejoin="round"
                  points={s.values.map((v, k) => `${x(k)},${y(v)}`).join(" ")}
                />
                {s.values.map((v, k) => (
                  <circle
                    key={k}
                    cx={x(k)}
                    cy={y(v)}
                    r={k === i ? 7 : 4}
                    className={(s.tone === "clay" ? "fill-clay" : "fill-teal") + " stroke-paper"}
                    strokeWidth={2}
                  />
                ))}
              </g>
            ))}
          </svg>
          <div
            className="grid grid-cols-6 gap-1 rounded-2xl border border-line bg-paper-2/60 p-1"
            role="group"
            aria-label={tr("Chọn năm", "Choose a year")}
          >
            {YEARS.map((yr, k) => (
              <button
                key={yr}
                type="button"
                aria-pressed={k === i}
                onClick={() => setI(k)}
                className={
                  "min-h-10 rounded-xl text-[13px] font-semibold " +
                  (k === i ? "bg-teal text-paper" : "text-muted")
                }
              >
                {yr}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SERIES.map((s) => (
              <Swatch key={s.id} kind="line" tone={s.tone}>
                {tr(s.vi, s.en)}
              </Swatch>
            ))}
          </div>
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset>
            <Kicker tone="amber">
              {tr(`Năm ${YEARS[i]} so với 1986`, `${YEARS[i]} against 1986`)}
            </Kicker>
            <div className="mt-2 grid grid-cols-2 gap-4">
              {SERIES.map((s) => (
                <div key={s.id} className="flex flex-col gap-1">
                  <span className="text-[13px] text-muted">
                    {s.id === "ols" ? "OLS" : tr("PPML + nội địa", "PPML + domestic")}
                  </span>
                  <b
                    className={
                      "font-serif text-3xl tabular-nums " +
                      (s.tone === "clay" ? "text-clay" : "text-teal")
                    }
                  >
                    {fmt(Math.abs(s.values[i]!), 3)}
                  </b>
                  <span className="text-sm">{change(s)}</span>
                </div>
              ))}
            </div>
          </Inset>
          <Inset>
            <Kicker>
              {tr(
                "Vì sao thương mại nội địa giải được câu đố",
                "Why intra-national trade solves the puzzle",
              )}
            </Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                "Toàn cầu hoá làm giảm chi phí buôn bán qua biên giới so với buôn bán trong nước. Nếu mẫu chỉ có thương mại quốc tế, mô hình không thấy được mốc so sánh này, và mọi thay đổi chung bị hiệu ứng cố định nước–năm hấp thụ. Thêm dòng chảy nội địa Tᵢᵢ, phần giảm của chi phí quốc tế hiện ra: |γ| giảm 10,97%.",
                "Globalisation lowers the cost of trading across borders relative to trading at home. With international trade only, the model never sees that benchmark, and every common change is absorbed by the country-year fixed effects. Add the domestic flows Tᵢᵢ and the fall in international costs appears: |γ| drops by 10.97%.",
              )}
            </p>
          </Inset>
          <Inset className="flex flex-col gap-2">
            <Kicker tone="amber">
              {tr("Sáu khuyến nghị của WTO/UNCTAD", "Six WTO/UNCTAD recommendations")}
            </Kicker>
            <ol className="flex flex-col gap-1.5">
              {RECS.map(([vi, en], k) => (
                <li key={k} className="flex gap-2.5 text-sm leading-relaxed">
                  <b className="w-4 shrink-0 text-amber">{k + 1}</b>
                  <span>{tr(vi, en)}</span>
                </li>
              ))}
            </ol>
            <p className="text-[13px] leading-relaxed text-muted">
              {tr(
                "Nguồn: Yotov, Piermartini, Monteiro & Larch (2016), Bảng 2; 69 nước, hàng chế tạo, khoảng cách 4 năm, hiệu ứng cố định nước xuất khẩu–năm và nhập khẩu–năm.",
                "Source: Yotov, Piermartini, Monteiro & Larch (2016), Table 2; 69 countries, manufacturing, 4-year intervals, exporter-year and importer-year fixed effects.",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
