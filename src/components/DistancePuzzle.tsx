import { fmt, tr } from "@/lib/prefs";

const YEARS = [1986, 1990, 1994, 1998, 2002, 2006];

/** Yotov et al. (2016), Table 2: distance coefficients by year, columns (1) and (3). */
const SERIES = [
  {
    id: "ols",
    vi: "OLS, chỉ thương mại quốc tế",
    en: "OLS, international trade only",
    values: [-1.168, -1.155, -1.211, -1.248, -1.241, -1.261],
    change: 7.95,
    color: "var(--color-amber)",
  },
  {
    id: "intra",
    vi: "PPML, thêm thương mại nội địa",
    en: "PPML, with intra-national trade",
    values: [-0.98, -0.94, -0.915, -0.887, -0.884, -0.872],
    change: -10.97,
    color: "var(--color-teal)",
  },
];

const W = 320;
const H = 170;
const PAD = { l: 40, r: 12, t: 12, b: 26 };
const LO = 0.8;
const HI = 1.3;

const x = (i: number) => PAD.l + (i / (YEARS.length - 1)) * (W - PAD.l - PAD.r);
const y = (v: number) => PAD.t + ((HI - Math.abs(v)) / (HI - LO)) * (H - PAD.t - PAD.b);

/** The "distance puzzle" and its resolution, drawn from the published table. */
export function DistancePuzzle() {
  return (
    <figure className="mt-3 max-w-md rounded-card border border-line p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={tr(
          "Độ lớn hệ số khoảng cách theo năm, 1986–2006: OLS tăng từ 1,17 lên 1,26; PPML có thương mại nội địa giảm từ 0,98 xuống 0,87.",
          "Size of the distance coefficient by year, 1986–2006: OLS rises from 1.17 to 1.26; PPML with intra-national trade falls from 0.98 to 0.87.",
        )}
      >
        {[0.8, 0.9, 1.0, 1.1, 1.2, 1.3].map((g) => (
          <g key={g}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(g)} y2={y(g)} stroke="currentColor" strokeOpacity={0.12} />
            <text x={PAD.l - 6} y={y(g) + 3} textAnchor="end" fontSize={9} fill="currentColor" fillOpacity={0.6}>
              {fmt(g, 1)}
            </text>
          </g>
        ))}
        {YEARS.map((yr, i) => (
          <text key={yr} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="currentColor" fillOpacity={0.6}>
            {yr}
          </text>
        ))}
        {SERIES.map((s) => (
          <g key={s.id}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth={2.5}
              strokeLinejoin="round"
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
            />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
        <p className="font-medium text-ink">{tr("|β̂| khoảng cách theo năm", "|β̂| on distance, by year")}</p>
        {SERIES.map((s) => (
          <p key={s.id} className="flex items-start gap-2">
            <span aria-hidden="true" className="mt-1 inline-block size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span>
              {tr(s.vi, s.en)}: {s.change > 0 ? "+" : "−"}
              {fmt(Math.abs(s.change), 2)}% {tr("từ 1986 đến 2006", "from 1986 to 2006")}
            </span>
          </p>
        ))}
        <p>
          {tr(
            "Nguồn: Yotov và cộng sự (2016), Bảng 2, cột (1) và (3); 69 nước, hàng chế tạo, khoảng cách 4 năm, hiệu ứng cố định nước xuất khẩu–năm và nước nhập khẩu–năm.",
            "Source: Yotov et al. (2016), Table 2, columns (1) and (3); 69 countries, manufacturing, 4-year intervals, exporter-year and importer-year fixed effects.",
          )}
        </p>
      </figcaption>
    </figure>
  );
}
