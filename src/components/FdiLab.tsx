import { useMemo, useState, type ReactNode } from "react";
import {
  CITE_2008,
  CITE_2019,
  COUNTRIES,
  CSV_TEMPLATE,
  HANOI,
  MODELS,
  coefRows,
  distanceLesson,
  estimatePanel,
  impactOf,
  kmFromHanoi,
  parseCSV,
  pctChange,
  pValue,
  varLabel,
  xuanXingGrid,
  xuanXingTable,
  type CsvTable,
  type PanelEstimate,
} from "@/sim/gravity-lab";
import { ReferenceList } from "@/components/ReferenceList";
import { Globe, type GlobeArc, type GlobeNode } from "@/components/Globe";

export type LabPanel = "coef" | "sim" | "ppml" | "data";

function num(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(digits).replace(".", ",");
}

function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${num(n, 1)}%`;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "min-h-11 shrink-0 rounded-full border px-3 text-sm font-medium " +
        (active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink")
      }
    >
      {children}
    </button>
  );
}

export function useLabState() {
  const [panel, setPanel] = useState<LabPanel>("sim");
  const [model, setModel] = useState(7);
  const [a, setA] = useState("JPN");
  const [b, setB] = useState("DEU");
  const [econ, setEcon] = useState(0);
  const [inst, setInst] = useState(0);
  const [open, setOpen] = useState(0);
  const [fta, setFta] = useState(false);
  const [check, setCheck] = useState(false);
  const [table, setTable] = useState<CsvTable | null>(null);
  const [yCol, setYCol] = useState("fdi");
  const [unitCol, setUnitCol] = useState("country");
  const [yearCol, setYearCol] = useState("year");
  const [xCols, setXCols] = useState<string[]>([]);
  const [yLevel, setYLevel] = useState(true);
  const [yearFE, setYearFE] = useState(true);
  const [clusterOn, setClusterOn] = useState(true);
  const [estMsg, setEstMsg] = useState("Nạp tệp CSV để bắt đầu.");
  const [est, setEst] = useState<PanelEstimate | null>(null);
  const impact = useMemo(() => impactOf({ a, b, econPct: econ, inst, open, fta }), [a, b, econ, inst, open, fta]);
  const rows = useMemo(() => coefRows(model), [model]);
  const lesson = useMemo(() => distanceLesson(), []);
  const name = (id: string) => COUNTRIES.find((c) => c.id === id)?.name ?? id;
  const numCols = useMemo(() => {
    if (!table) return [];
    return table.columns.filter((c) => table.rows.some((r) => typeof r[c] === "number" && Number.isFinite(r[c] as number)));
  }, [table]);

  function loadTable(parsed: CsvTable, presetX: string[] = []) {
    setTable(parsed);
    setEst(null);
    const cols = parsed.columns;
    const numeric = cols.filter((c) => parsed.rows.some((r) => typeof r[c] === "number" && Number.isFinite(r[c] as number)));
    const find = (re: RegExp) => cols.find((x) => re.test(x)) ?? "";
    const y = numeric.find((x) => /^fdi$/i.test(x)) ?? numeric.find((x) => /fdi/i.test(x)) ?? numeric[0] ?? "";
    setYCol(y);
    setUnitCol(find(/country|nuoc|quocgia|^id$/i) || cols[0] || "");
    setYearCol(find(/year|^nam$/i) || "");
    setXCols(presetX.filter((x) => numeric.includes(x) && x !== y));
    setYLevel(true);
    setYearFE(true);
    setClusterOn(true);
    setEstMsg(parsed.rows.length ? `${parsed.rows.length} dòng đã nạp.` : "Tệp chỉ có tiêu đề cột.");
  }

  function runEstimate() {
    if (!table) {
      setEst(null);
      setEstMsg("Nạp tệp CSV để bắt đầu.");
      return;
    }
    try {
      const result = estimatePanel({
        rows: table.rows,
        y: yCol,
        xs: xCols,
        unit: unitCol,
        year: yearCol,
        yearFE,
        cluster: clusterOn,
        yLevel,
      });
      setEst(result);
      setEstMsg(result.note || `${result.fits[0]?.fit.n ?? 0} quan sát.`);
    } catch (err) {
      setEst(null);
      setEstMsg(`Không ước lượng được: ${err instanceof Error ? err.message : "lỗi không rõ"}`);
    }
  }

  function note(msg: string) {
    setTable(null);
    setEst(null);
    setXCols([]);
    setEstMsg(msg);
  }

  return {
    panel, setPanel, model, setModel, a, setA, b, setB, econ, setEcon, inst, setInst, open, setOpen, fta, setFta, check, setCheck,
    impact, rows, lesson, name,
    table, yCol, setYCol, unitCol, setUnitCol, yearCol, setYearCol, xCols, setXCols, yLevel, setYLevel, yearFE, setYearFE, clusterOn, setClusterOn,
    estMsg, est, numCols, loadTable, runEstimate, note,
  };
}

export type LabState = ReturnType<typeof useLabState>;

export function FdiStage({ lab, lead }: { lab: LabState; lead?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {lead}
      <div>
        <p className="text-xs font-medium text-teal-2">Gravity Lab · FDI vào Việt Nam</p>
        <h2 className="mt-2 max-w-xl font-serif text-2xl leading-snug text-paper">
          Khoảng cách còn quan trọng với dòng vốn không?
        </h2>
        <p className="mt-2 max-w-xl text-sm text-mist">
          Cùng dạng Newton: quy mô ở tử số, khoảng cách ở mẫu số. Lực ở đây là FDI, mũ không khóa ở 2.
        </p>
      </div>

      {lab.panel === "sim" ? <SimStage lab={lab} /> : null}
      {lab.panel === "coef" ? <CoefStage lab={lab} /> : null}
      {lab.panel === "ppml" ? <PpmlStage lab={lab} /> : null}
      {lab.panel === "data" ? <DataStage lab={lab} /> : null}
    </div>
  );
}

/** Source countries on the globe, each arc weighted by the distance-only gravity term D^β (Model 8). */
function FdiGlobe({ lab }: { lab: LabState }) {
  const beta = MODELS[7]!.c.geo![0];
  const hanoi = { lon: HANOI[1], lat: HANOI[0] };
  const terms = COUNTRIES.map((c) => ({ c, term: Math.pow(kmFromHanoi(c.id), beta) }));
  const maxTerm = Math.max(...terms.map((t) => t.term));
  const nodes: GlobeNode[] = [
    { id: "VNM", lon: hanoi.lon, lat: hanoi.lat, label: "Hà Nội", r: 7, color: "#8fd4c0", tappable: false },
    ...COUNTRIES.map(
      (c): GlobeNode => ({
        id: c.id,
        lon: c.cap[1],
        lat: c.cap[0],
        label: c.id,
        r: 5,
        color: c.id === lab.b ? "#e7c27a" : "#f3ece1",
        ring: c.id === lab.a ? "teal" : c.id === lab.b ? "amber" : undefined,
      }),
    ),
  ];
  const arcs: GlobeArc[] = terms.map(({ c, term }) => ({
    id: c.id,
    from: { lon: c.cap[1], lat: c.cap[0] },
    to: hanoi,
    weight: term / maxTerm,
    highlight: c.id === lab.b,
  }));
  const chosen = COUNTRIES.find((c) => c.id === lab.b);
  return (
    <div className="flex max-w-xl flex-col gap-2">
      <div className="h-80 overflow-hidden rounded-card sm:h-96">
        <Globe
          nodes={nodes}
          arcs={arcs}
          focus={chosen ? [hanoi, { lon: chosen.cap[1], lat: chosen.cap[0] }] : [hanoi]}
          onTap={(id) => {
            if (id !== lab.a) lab.setB(id);
          }}
          label={`Địa cầu các nước nguồn FDI vào Việt Nam. Chạm một nước để so với ${lab.name(lab.a)}.`}
        />
      </div>
      <p className="text-xs text-mist">
        Chạm một nước để so với {lab.name(lab.a)} (vòng xanh). Độ dày cung là phần do khoảng cách: D^β với β ={" "}
        {num(beta)} (mô hình 8), so với nước gần Hà Nội nhất. D đo giữa hai thủ đô theo đường tròn lớn.
      </p>
    </div>
  );
}

function SimStage({ lab }: { lab: LabState }) {
  const { impact, name, a, b } = lab;
  const geoTen = pctChange(MODELS[7]!.c.geo![0], Math.log(1.1));
  const idle = impact.parts.length === 0;
  const scale = Math.max(20, ...impact.parts.map((p) => Math.abs(p.pct)), 1);
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-xl text-sm text-paper">
        Chỉ xét khoảng cách địa lý, FDI từ {name(b)} so với {name(a)} sẽ {pct(impact.geoPct)} (β = {num(impact.betaGeo)}).{" "}
        {name(a)} cách Hà Nội {Math.round(impact.kmA).toLocaleString("vi-VN")} km, {name(b)} cách{" "}
        {Math.round(impact.kmB).toLocaleString("vi-VN")} km.
      </p>
      <FdiGlobe lab={lab} />
      {idle ? (
        <div className="max-w-xl rounded-card bg-void-2 px-3 py-3">
          <p className="text-xs text-mist">Xa hơn 10%, mô hình 8</p>
          <p className="mt-1 font-serif text-3xl text-clay">{pct(geoTen)}</p>
          <p className="mt-1 text-sm text-mist">Độ co của khoảng cách. Chưa phải kết quả của một cặp nước.</p>
        </div>
      ) : (
        <div className="grid max-w-xl grid-cols-2 gap-3">
          <div className="rounded-card bg-void-2 px-3 py-3">
            <p className="text-xs text-mist">Ngắn hạn, năm đầu</p>
            <p className={"mt-1 font-serif text-3xl " + (impact.shortRun >= 0 ? "text-teal-2" : "text-clay")}>
              {pct(impact.shortRun)}
            </p>
          </div>
          <div className="rounded-card bg-void-2 px-3 py-3">
            <p className="text-xs text-mist">Dài hạn, chia cho 1 − 0,45</p>
            <p className={"mt-1 font-serif text-3xl " + (impact.longRun >= 0 ? "text-teal-2" : "text-clay")}>
              {pct(impact.longRun)}
            </p>
          </div>
        </div>
      )}
      {impact.parts.length ? (
        <ul className="flex max-w-xl flex-col gap-2">
          {impact.parts.map((p) => (
            <li key={p.id} className="grid grid-cols-[9rem_1fr_4.5rem] items-center gap-2 text-sm text-paper">
              <span className={p.sig ? "" : "text-mist"}>{varLabel(p.id)}</span>
              <span className="relative h-2 rounded-full bg-paper/10">
                <span className="absolute inset-y-0 left-1/2 w-px bg-mist/50" />
                <span
                  className={"absolute inset-y-0 rounded-full " + (p.pct >= 0 ? "bg-teal-2" : "bg-clay")}
                  style={{
                    opacity: p.sig ? 1 : 0.4,
                    left: `${50 + (Math.min(0, p.pct) / scale) * 50}%`,
                    width: `${(Math.abs(p.pct) / scale) * 50}%`,
                  }}
                />
              </span>
              <span className="text-right tabular-nums">{pct(p.pct)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-mist">Muốn xem FTA hoặc một khoảng cách khác, dùng bảng bên.</p>
      )}
      <p className="max-w-xl text-xs text-mist">
        Minh họa bằng hệ số mô hình 8 đã công bố, không phải dự báo. Thanh mờ là hệ số chưa có ý nghĩa ở mức 5% khi tính
        lại. Bài không công bố hiệp phương sai nên không có khoảng tin cậy cho tổng.
      </p>
    </div>
  );
}

function CoefStage({ lab }: { lab: LabState }) {
  const rows = lab.rows.filter((r) => r.id !== "cons");
  const shown = rows.length ? rows : lab.rows;
  const lo = Math.min(...shown.map((r) => r.b - 1.96 * r.se));
  const hi = Math.max(...shown.map((r) => r.b + 1.96 * r.se));
  const span = hi - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;
  const meta = MODELS[lab.model]!;
  const cons = lab.rows.find((r) => r.id === "cons");
  const notes = reading(lab.model);
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-xs text-mist">
        Mô hình {lab.model + 1} · n = {meta.n} · R² = {num(meta.r2, 4)} · REM, sai số chuẩn vững
        {cons ? ` · hằng số ${num(cons.b)} (${num(cons.se)})` : ""}
      </p>
      <ul className="flex flex-col gap-2">
        {shown.map((r) => (
          <li key={r.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm text-paper">
              <span>{r.label}</span>
              <span className="tabular-nums">
                {num(r.b)}
                <span className="text-mist">{r.published ? ` ${r.published}` : ""}</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-paper/10">
              <span className="absolute inset-y-0 w-px bg-mist/70" style={{ left: `${x(0)}%` }} />
              <span
                className="absolute inset-y-0 rounded-full bg-amber-2"
                style={{ left: `${x(r.b - 1.96 * r.se)}%`, width: `${x(r.b + 1.96 * r.se) - x(r.b - 1.96 * r.se)}%` }}
              />
              <span className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-paper" style={{ left: `calc(${x(r.b)}% - 4px)` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-mist">Chấm là hệ số. Thanh là khoảng tin cậy 95%. Cắt qua vạch 0 là chưa đủ bằng chứng ở mức 5%. Hằng số không vẽ trên trục này.</p>
      {notes.length ? (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-paper">
          {notes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function reading(model: number): string[] {
  const c = MODELS[model]!.c;
  const out: string[] = [];
  if (c.lagfdi) out.push(`FDI năm trước tăng 1% thì FDI năm nay tăng khoảng ${num(c.lagfdi[0])}%, các yếu tố khác giữ nguyên.`);
  if (c.geo) out.push(`Khoảng cách địa lý xa hơn 10% đi kèm FDI thay đổi ${pct(pctChange(c.geo[0], Math.log(1.1)))}.`);
  if (c.econ) out.push(`Khoảng cách kinh tế lớn hơn 10% đi kèm FDI thay đổi ${pct(pctChange(c.econ[0], Math.log(1.1)))}.`);
  if (c.fta) out.push(`Có FTA đi kèm FDI cao hơn khoảng ${pct(pctChange(c.fta[0], 1))}. Đó là exp(β) − 1, không phải β × 100.`);
  if (c.cult) {
    const [b, se] = c.cult;
    out.push(
      pValue(b, se) < 0.05
        ? `Khoảng cách văn hóa có hệ số ${num(b)}.`
        : `Khoảng cách văn hóa là ${num(b)}, chưa có ý nghĩa ở mức 5%.`,
    );
  }
  return out;
}

function PpmlStage({ lab }: { lab: LabState }) {
  const lesson = lab.lesson;
  const lo = Math.min(...lesson.rows.map((r) => r.b - 1.96 * r.se), -0.2);
  const hi = Math.max(...lesson.rows.map((r) => r.b + 1.96 * r.se), 0.2);
  const span = hi - lo || 1;
  const x = (v: number) => ((v - lo) / span) * 100;
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-sm text-paper">
        {lesson.n} quan sát FDI thực hiện, trong đó {lesson.zeros} năm bằng 0. OLS trên log phải bỏ những năm đó. Cộng 1
        rồi lấy log là cách vá. PPML giữ cả mẫu (Santos Silva & Tenreyro, 2006). Số dưới đây tính trên dữ liệu Xuan và
        Xing (2008), không lấy từ bài 2006.
      </p>
      <ul className="flex flex-col gap-3">
        {lesson.rows.map((r) => (
          <li key={r.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm text-paper">
              <span>{r.label}</span>
              <span className="tabular-nums">
                {num(r.b, 3)}
                {r.stars} <span className="text-mist">n = {r.n}</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-paper/10">
              <span className="absolute inset-y-0 w-px bg-mist/70" style={{ left: `${x(0)}%` }} />
              <span
                className="absolute inset-y-0 rounded-full bg-teal-2/80"
                style={{ left: `${x(r.b - 1.96 * r.se)}%`, width: `${Math.max(0.8, x(r.b + 1.96 * r.se) - x(r.b - 1.96 * r.se))}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-mist">
        Một biến giải thích, hiệu ứng cố định năm, sai số chuẩn theo cụm quốc gia. Mô hình đầy đủ còn cần quy mô kinh tế,
        FTA và các chiều khoảng cách khác. {CITE_2008}
      </p>
      <details className="max-w-xl">
        <summary className="min-h-11 text-sm text-paper">Xem dữ liệu gốc</summary>
        <XuanTable />
      </details>
    </div>
  );
}

function XuanTable() {
  const grid = xuanXingGrid();
  return (
    <div className="overflow-x-auto pb-2">
      <table className="text-xs text-paper">
        <thead>
          <tr className="text-mist">
            <th className="py-1 pr-3 text-left font-medium">Nước</th>
            {grid.years.map((y) => (
              <th key={y} className="px-1 py-1 text-right font-medium">{y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.series.map((s) => (
            <tr key={s.name} className="border-t border-paper/10">
              <td className="py-1 pr-3">{s.name}</td>
              {s.v.map((v, i) => (
                <td key={grid.years[i]} className={"px-1 py-1 text-right tabular-nums " + (v === 0 ? "text-mist" : "")}>
                  {num(v, 1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DataStage({ lab }: { lab: LabState }) {
  const est = lab.est;
  const names = est
    ? est.fits[0]!.fit.coef.map((c) => c.name).filter((n) => n === "_cons" || !n.includes("="))
    : [];
  return (
    <div className="flex max-w-xl flex-col gap-3">
      <p className="text-sm text-paper">
        Mỗi dòng là một cặp quốc gia–năm. Nếu FDI ở dạng mức, Lab chạy cả OLS trên log — phải bỏ năm bằng 0 — và PPML trên
        cả mẫu. Phép tính ở lại trên máy này.
      </p>
      {!est ? (
        <p className="text-sm text-mist">{lab.estMsg}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-72 text-sm text-paper">
            <thead>
              <tr className="text-xs text-mist">
                <th className="py-2 pr-3 text-left font-medium">Biến</th>
                {est.fits.map((f) => (
                  <th key={f.label} className="py-2 pr-3 text-right font-medium">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((n) => (
                <tr key={n} className="border-t border-paper/15">
                  <td className="py-2 pr-3">{n === "_cons" ? "Hằng số" : n}</td>
                  {est.fits.map((f) => {
                    const c = f.fit.coef.find((k) => k.name === n);
                    return (
                      <td key={f.label} className="py-2 pr-3 text-right">
                        {c ? (
                          <>
                            <span className="tabular-nums">{num(c.b, 3)}{c.stars}</span>
                            <span className="block text-xs text-mist tabular-nums">({num(c.se, 3)})</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t border-paper/15">
                <td className="py-2 pr-3">Số quan sát</td>
                {est.fits.map((f) => (
                  <td key={f.label} className="py-2 pr-3 text-right tabular-nums">{f.fit.n}</td>
                ))}
              </tr>
              <tr className="border-t border-paper/15">
                <td className="py-2 pr-3">R² / pseudo-R²</td>
                {est.fits.map((f) => (
                  <td key={f.label} className="py-2 pr-3 text-right tabular-nums">{num(f.fit.r2, 3)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      {est ? <p className="text-xs text-mist">Sao tính từ p hai phía. Sai số chuẩn trong ngoặc. {lab.estMsg}</p> : null}
    </div>
  );
}

export function FdiDock({ lab }: { lab: LabState }) {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <div className="flex flex-wrap gap-2">
        <Chip active={lab.panel === "coef"} onClick={() => lab.setPanel("coef")}>
          Hệ số 2019
        </Chip>
        <Chip active={lab.panel === "sim"} onClick={() => lab.setPanel("sim")}>
          Tác động
        </Chip>
        <Chip active={lab.panel === "ppml"} onClick={() => lab.setPanel("ppml")}>
          Vì sao PPML
        </Chip>
        <Chip active={lab.panel === "data"} onClick={() => lab.setPanel("data")}>
          Dữ liệu của bạn
        </Chip>
      </div>
      {lab.panel === "coef" ? <CoefDock lab={lab} /> : null}
      {lab.panel === "sim" ? <SimDock lab={lab} /> : null}
      {lab.panel === "data" ? <DataDock lab={lab} /> : null}
      {lab.panel === "ppml" ? (
        <p className="text-sm text-muted">
          Santos Silva và Tenreyro (2006): hồi quy log làm méo hệ số khoảng cách khi nhiều quan sát bằng không, và khi
          phương sai không tỉ lệ với bình phương kỳ vọng. PPML ước lượng trực tiếp trên mức FDI.
        </p>
      ) : null}
      <p className="text-xs text-muted">
        {lab.panel === "ppml"
          ? CITE_2008
          : lab.panel === "data"
            ? "Santos Silva và Tenreyro (2006). File chỉ được đọc trên máy này."
            : `${CITE_2019} Bảng 6 · 16 đối tác, 2006–2015.`}
      </p>
    </div>
  );
}

function CoefDock({ lab }: { lab: LabState }) {
  const flagged = lab.rows.filter((r) => r.mismatch);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 overflow-x-auto">
        {MODELS.map((_, i) => (
          <Chip key={i} active={lab.model === i} onClick={() => lab.setModel(i)}>
            {i + 1}
          </Chip>
        ))}
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={lab.check} onChange={(e) => lab.setCheck(e.target.checked)} />
        So sao trong bài với mức ý nghĩa tính lại
      </label>
      {lab.check && flagged.length ? (
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {flagged.map((r) => (
            <li key={r.id}>
              {r.label}: bài ghi {r.published || "không sao"}, tính lại p = {num(r.p, 3)} ({r.recomputed || "không sao"}).
            </li>
          ))}
        </ul>
      ) : null}
      <details className="rounded-card border border-line px-3 py-2">
        <summary className="min-h-11 text-sm font-medium">Câu hỏi thảo luận</summary>
        <ol className="list-decimal pb-2 pl-4 text-sm text-muted">
          <li>R² chỉ khoảng 0,006–0,024, trong khi FDI và FDI năm trước tương quan 0,62. R² nào đang được báo cáo?</li>
          <li>Đưa biến trễ của biến phụ thuộc vào mô hình hiệu ứng ngẫu nhiên gây ra vấn đề gì?</li>
          <li>GDP Việt Nam giống nhau cho mọi đối tác trong một năm. Thêm hiệu ứng cố định năm thì biến này ra sao?</li>
          <li>Khoảng cách văn hóa không đổi theo thời gian. Hiệu ứng cố định quốc gia còn ước lượng được nó không?</li>
        </ol>
      </details>
    </div>
  );
}

function SimDock({ lab }: { lab: LabState }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Đối tác đang xét</span>
        <select
          className="min-h-11 w-full rounded-lg border border-line bg-paper-2 px-2"
          value={lab.a}
          aria-label="Đối tác đang xét"
          onChange={(e) => lab.setA(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {Math.round(kmFromHanoi(c.id)).toLocaleString("vi-VN")} km
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">So khoảng cách với</span>
        <select
          className="min-h-11 w-full rounded-lg border border-line bg-paper-2 px-2"
          value={lab.b}
          aria-label="Quốc gia để so khoảng cách"
          onChange={(e) => lab.setB(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {Math.round(kmFromHanoi(c.id)).toLocaleString("vi-VN")} km
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={lab.fta} onChange={(e) => lab.setFta(e.target.checked)} />
        Việt Nam ký FTA với đối tác đang xét
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>Khoảng cách kinh tế</span>
          <span className="tabular-nums font-medium">{lab.econ >= 0 ? "+" : ""}{lab.econ}%</span>
        </span>
        <input type="range" min={-30} max={30} step={5} value={lab.econ} aria-label="Khoảng cách kinh tế thay đổi" onChange={(e) => lab.setEcon(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>Khoảng cách thể chế</span>
          <span className="tabular-nums font-medium">{lab.inst >= 0 ? "+" : ""}{num(lab.inst, 1)}</span>
        </span>
        <input type="range" min={-2} max={2} step={0.5} value={lab.inst} aria-label="Khoảng cách thể chế thay đổi" onChange={(e) => lab.setInst(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>Độ mở thương mại</span>
          <span className="tabular-nums font-medium">+{num(lab.open, 2)}</span>
        </span>
        <input type="range" min={0} max={0.3} step={0.05} value={lab.open} aria-label="Độ mở thương mại tăng" onChange={(e) => lab.setOpen(Number(e.target.value))} />
      </label>
    </div>
  );
}

function DataDock({ lab }: { lab: LabState }) {
  const selectClass = "min-h-11 w-full rounded-lg border border-line bg-paper-2 px-2";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        CSV dấu phẩy hoặc chấm phẩy, một dòng một cặp quốc gia–năm. Với bộ 2019, xuất từ Stata bằng export delimited.
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-ink bg-ink px-3 text-sm font-medium text-paper">
          Nạp CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Nạp tệp CSV"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              file.text().then((txt) => {
                try {
                  lab.loadTable(parseCSV(txt));
                } catch (err) {
                  lab.note(`Không ước lượng được: ${err instanceof Error ? err.message : "CSV"}`);
                }
              });
            }}
          />
        </label>
        <button
          type="button"
          className="min-h-11 rounded-full border border-line px-3 text-sm font-medium"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "gravity-lab-template.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Tải tệp mẫu
        </button>
        <button type="button" className="min-h-11 rounded-full border border-line px-3 text-sm font-medium" onClick={() => lab.loadTable(xuanXingTable(), ["lndist"])}>
          Nạp bảng Xuan & Xing
        </button>
      </div>
      {lab.table && lab.numCols.length ? (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Biến phụ thuộc</span>
            <select
              className={selectClass}
              value={lab.yCol}
              aria-label="Biến phụ thuộc"
              onChange={(e) => {
                const y = e.target.value;
                lab.setYCol(y);
                lab.setXCols(lab.xCols.filter((x) => x !== y));
              }}
            >
              {lab.numCols.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={lab.yLevel} onChange={(e) => lab.setYLevel(e.target.checked)} />
            Biến phụ thuộc ở dạng mức (không phải log)
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Cột quốc gia</span>
            <select className={selectClass} value={lab.unitCol} aria-label="Cột quốc gia" onChange={(e) => lab.setUnitCol(e.target.value)}>
              {lab.table.columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Cột năm</span>
            <select className={selectClass} value={lab.yearCol} aria-label="Cột năm" onChange={(e) => lab.setYearCol(e.target.value)}>
              <option value="">Không có</option>
              {lab.table.columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={lab.yearFE} onChange={(e) => lab.setYearFE(e.target.checked)} />
            Hiệu ứng cố định năm
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={lab.clusterOn} onChange={(e) => lab.setClusterOn(e.target.checked)} />
            Sai số chuẩn theo cụm quốc gia
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Biến giải thích</legend>
            <div className="flex flex-col">
              {lab.numCols
                .filter((c) => c !== lab.yCol)
                .map((c) => (
                  <label key={c} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={lab.xCols.includes(c)}
                      onChange={(e) => lab.setXCols(e.target.checked ? [...lab.xCols, c] : lab.xCols.filter((x) => x !== c))}
                    />
                    {c}
                  </label>
                ))}
            </div>
          </fieldset>
          <button type="button" className="min-h-11 rounded-full bg-ink px-3 text-sm font-medium text-paper" onClick={() => lab.runEstimate()}>
            Ước lượng
          </button>
        </>
      ) : null}
      <p className="text-sm text-muted">{lab.estMsg}</p>
      <ReferenceList />
    </div>
  );
}
