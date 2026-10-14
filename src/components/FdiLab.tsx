import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CITE_2008,
  CITE_2019,
  COUNTRIES,
  CSV_TEMPLATE,
  countryName,
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
  xuanXingSeries,
  type CsvTable,
  type PanelEstimate,
} from "@/sim/gravity-lab";
import { Download, FileText, Pause, Play } from "lucide-react";
import { DATASET_COLUMNS, datasetCSV, datasetCodebook, datasetDo, datasetPanel, draftFromEstimate, draftFromModel, draftToDocx, draftToLatex, type Draft } from "@/sim/pro";
import { ReferenceList } from "@/components/ReferenceList";
import { Globe, type GlobeArc, type GlobeNode } from "@/components/Globe";
import { SectorBars, SectorFlow, type FdiMode } from "@/components/SectorFlow";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";
import { CaseFile } from "@/components/CaseFile";

export type LabPanel = "coef" | "sim" | "ppml" | "data" | "sector" | "case";

function num(n: number, digits = 2): string {
  return fmt(n, digits);
}

function pct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${num(n, 1)}%`;
}

/** A chip: a white clay pill when on; flat inside a track, raised on its own. */
function Chip({
  active,
  onClick,
  children,
  flat = false,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  flat?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "min-h-10 shrink-0 rounded-full px-3.5 text-sm font-medium " +
        (active ? "pill-on" : flat ? "text-muted" : "noir-raise text-ink")
      }
    >
      {children}
    </button>
  );
}

/** Hand the reader a file; nothing leaves the device. */
function saveFile(name: string, data: string | Uint8Array, type: string) {
  const blob = new Blob([data as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The cleaned panel as a table the lab can estimate on. */
function panelTable(): CsvTable {
  return { columns: [...DATASET_COLUMNS], rows: datasetPanel() };
}

/** Pro: the results draft with its interpretation in the current language, and Word / LaTeX exports. */
function DraftCard({ draft, file }: { draft: Draft; file: string }) {
  const { lang } = usePrefs();
  const L = lang === "vi" ? "vi" : "en";
  return (
    <div className="noir-card rounded-[26px] px-4 py-4 sm:px-5">
      <p className="kicker text-amber-2">
        {tr("Bản nháp kết quả (publication-ready)", "Results draft")} · <span className="normal-case">Pro</span>
      </p>
      <p className="mt-1 text-xs text-mist">{draft.method[L]}</p>
      <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-4 text-sm text-paper">
        {draft.paragraphs[L].map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="cosmic-btn inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold"
          onClick={() => saveFile(`${file}.docx`, draftToDocx(draft), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
        >
          <FileText className="size-4" />
          {tr("Tải Word (.docx)", "Download Word (.docx)")}
        </button>
        <button
          type="button"
          className="noir-raise inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-paper"
          onClick={() => saveFile(`${file}.tex`, draftToLatex(draft), "application/x-tex")}
        >
          <FileText className="size-4" />
          {tr("Tải LaTeX (.tex)", "Download LaTeX (.tex)")}
        </button>
      </div>
      <p className="mt-2 text-xs text-mist">
        {tr(
          "Bảng với sao mức ý nghĩa, diễn giải VI và EN, tài liệu tham khảo APA 7. Hãy đối chiếu từng con số với kết quả của bạn trước khi nộp.",
          "Table with significance stars, VI and EN interpretation, APA 7 references. Check every number against your own output before submission.",
        )}
      </p>
    </div>
  );
}

export function useLabState() {
  const { lang } = usePrefs();
  const [panel, setPanel] = useState<LabPanel>("sim");
  const [caseId, setCaseId] = useState<string | undefined>();
  const [caseStep, setCaseStep] = useState(1);
  const setCase = (id: string, step: number) => {
    setCaseId(id);
    setCaseStep(step);
  };
  const [fdiMode, setFdiMode] = useState<FdiMode>("disb");
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
  // Empty means "no message yet"; the default prompt is rendered in the current language.
  const [estMsg, setEstMsg] = useState("");
  const [est, setEst] = useState<PanelEstimate | null>(null);
  const impact = useMemo(() => impactOf({ a, b, econPct: econ, inst, open, fta }), [a, b, econ, inst, open, fta]);
  // lang is a dependency because the rows carry translated labels.
  const rows = useMemo(() => coefRows(model), [model, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const lesson = useMemo(() => distanceLesson(), [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const name = countryName;
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
    setEstMsg(
      parsed.rows.length
        ? tr(`${parsed.rows.length} dòng đã nạp.`, `${parsed.rows.length} rows loaded.`)
        : tr("Tệp chỉ có tiêu đề cột.", "The file has only column headers."),
    );
  }

  function runEstimate() {
    if (!table) {
      setEst(null);
      setEstMsg("");
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
      setEstMsg(
        result.note ||
          tr(
            `${result.fits[0]?.fit.n ?? 0} quan sát.`,
            `${result.fits[0]?.fit.n ?? 0} observations.`,
          ),
      );
      // On phones the table sits behind the panel: bring it into view.
      window.setTimeout(() => {
        const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById("fdi-results")?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      }, 60);
    } catch (err) {
      setEst(null);
      setEstMsg(tr("Không ước lượng được: ", "Could not estimate: ") + (err instanceof Error ? err.message : tr("lỗi không rõ", "unknown error")));
    }
  }

  function note(msg: string) {
    setTable(null);
    setEst(null);
    setXCols([]);
    setEstMsg(msg);
  }

  return {
    panel, setPanel, caseId, caseStep, setCase, fdiMode, setFdiMode, model, setModel, a, setA, b, setB, econ, setEcon, inst, setInst, open, setOpen, fta, setFta, check, setCheck,
    impact, rows, lesson, name,
    table, yCol, setYCol, unitCol, setUnitCol, yearCol, setYearCol, xCols, setXCols, yLevel, setYLevel, yearFE, setYearFE, clusterOn, setClusterOn,
    estMsg: estMsg || tr("Nạp tệp CSV để bắt đầu.", "Load a CSV file to start."), est, numCols, loadTable, runEstimate, note,
  };
}

export type LabState = ReturnType<typeof useLabState>;

export function FdiStage({ lab, lead }: { lab: LabState; lead?: ReactNode }) {
  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      {lead}
      <div>
        <p className="text-xs font-medium text-teal-2">{tr("Gravity Lab · Dòng vốn FDI vào Việt Nam (FDI inflows)", "Gravity Lab · FDI inflows into Vietnam")}</p>
        <h2 className="mt-2 max-w-xl font-serif text-2xl leading-snug text-paper">
          {tr("Khoảng cách còn quan trọng với dòng vốn không?", "Does distance still matter for capital flows?")}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-mist">
          {tr(
            "Cùng dạng Newton: quy mô ở tử số, khoảng cách ở mẫu số. Lực ở đây là FDI, mũ không khóa ở 2.",
            "Newton's form again: size in the numerator, distance in the denominator. The force here is FDI, and the exponent is not locked at 2.",
          )}
        </p>
      </div>

      {lab.panel === "sim" ? <SimStage lab={lab} /> : null}
      {lab.panel === "coef" ? <CoefStage lab={lab} /> : null}
      {lab.panel === "ppml" ? <PpmlStage lab={lab} /> : null}
      {lab.panel === "data" ? <DataStage lab={lab} /> : null}
      {lab.panel === "sector" ? <SectorStage lab={lab} /> : null}
      {lab.panel === "case" ? <CaseFile key={lab.caseId} initialCase={lab.caseId} initialStep={lab.caseStep} onChange={lab.setCase} /> : null}
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
    { id: "VNM", lon: hanoi.lon, lat: hanoi.lat, label: tr("Hà Nội", "Hanoi"), r: 7, color: "#8bbcc5", tappable: false },
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
          label={tr(
            `Địa cầu các nước nguồn dòng vốn FDI vào Việt Nam (FDI inflows). Chạm một nước để so với ${lab.name(lab.a)}.`,
            `Globe of the source countries of FDI inflows into Vietnam. Tap a country to compare it with ${lab.name(lab.a)}.`,
          )}
        />
      </div>
      <p className="text-xs text-mist">
        {tr(
          `Chạm một nước để so với ${lab.name(lab.a)} (vòng xanh). Độ dày cung là phần do khoảng cách: D^β với β = ${num(beta)} (mô hình 8), so với nước gần Hà Nội nhất. D đo giữa hai thủ đô theo đường tròn lớn.`,
          `Tap a country to compare it with ${lab.name(lab.a)} (teal ring). Arc width is the distance term D^β with β = ${num(beta)} (Model 8), relative to the country nearest Hanoi. D is the great-circle distance between the two capitals.`,
        )}
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
        {tr(
          `Chỉ xét khoảng cách địa lý, FDI từ ${name(b)} so với ${name(a)} sẽ ${pct(impact.geoPct)} (β = ${num(impact.betaGeo)}). ${name(a)} cách Hà Nội ${fmtInt(impact.kmA)} km, ${name(b)} cách ${fmtInt(impact.kmB)} km.`,
          `On geographic distance alone, FDI from ${name(b)} relative to ${name(a)} is ${pct(impact.geoPct)} (β = ${num(impact.betaGeo)}). ${name(a)} is ${fmtInt(impact.kmA)} km from Hanoi, ${name(b)} is ${fmtInt(impact.kmB)} km.`,
        )}
      </p>
      <FdiGlobe lab={lab} />
      {idle ? (
        <div className="max-w-xl noir-card rounded-[22px] px-4 py-3.5">
          <p className="text-xs text-mist">{tr("Xa hơn 10%, mô hình 8", "10% farther, Model 8")}</p>
          <p className="glow-clay mt-1 font-serif text-3xl text-clay">{pct(geoTen)}</p>
          <p className="mt-1 text-sm text-mist">{tr("Độ co của khoảng cách. Chưa phải kết quả của một cặp nước.", "The distance elasticity. Not yet a result for a pair of countries.")}</p>
        </div>
      ) : (
        <div className="grid max-w-xl grid-cols-2 gap-3">
          <div className="noir-card rounded-[22px] px-4 py-3.5">
            <p className="text-xs text-mist">{tr("Ngắn hạn, năm đầu", "Short run, first year")}</p>
            <p className={"mt-1 font-serif text-3xl " + (impact.shortRun >= 0 ? "glow-teal text-teal-2" : "glow-clay text-clay")}>
              {pct(impact.shortRun)}
            </p>
          </div>
          <div className="noir-card rounded-[22px] px-4 py-3.5">
            <p className="text-xs text-mist">{tr("Dài hạn, chia cho 1 − 0,45", "Long run, divided by 1 − 0.45")}</p>
            <p className={"mt-1 font-serif text-3xl " + (impact.longRun >= 0 ? "glow-teal text-teal-2" : "glow-clay text-clay")}>
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
              <span className="noir-track relative h-2.5 rounded-full">
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
        <p className="text-sm text-mist">{tr("Muốn xem FTA hoặc một khoảng cách khác, dùng bảng bên.", "To see an FTA or another distance, use the side panel.")}</p>
      )}
      <p className="max-w-xl text-xs text-mist">
        {tr(
          "Minh họa bằng hệ số mô hình 8 đã công bố, không phải dự báo. Thanh mờ là hệ số chưa có ý nghĩa ở mức 5% khi tính lại. Bài không công bố hiệp phương sai nên không có khoảng tin cậy cho tổng.",
          "An illustration with the published Model 8 coefficients, not a forecast. Faded bars are coefficients not significant at 5% when recomputed. The paper does not report the covariance matrix, so the total has no confidence interval.",
        )}
      </p>
    </div>
  );
}

function CoefStage({ lab }: { lab: LabState }) {
  const rows = lab.rows.filter((r) => r.id !== "cons");
  const shown = rows.length ? rows : lab.rows;
  // Bars grow from a centred zero line; the scale fits the widest 95% interval.
  const reach = Math.max(...shown.map((r) => Math.abs(r.b) + 1.96 * r.se), 0.5);
  const x = (v: number) => 50 + (v / reach) * 50;
  const meta = MODELS[lab.model]!;
  const cons = lab.rows.find((r) => r.id === "cons");
  const geo = lab.rows.find((r) => r.id === "geo");
  const notes = reading(lab.model);
  const stars = (r: (typeof shown)[number]) => (lab.check ? r.recomputed : r.published);
  return (
    <div className="flex max-w-xl flex-col gap-3">
      {geo ? (
        <div className="noir-card flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[26px] px-5 py-4">
          <div>
            <p className="kicker text-amber-2">
              {tr("Hệ số khoảng cách", "Distance coefficient")} <span className="normal-case">β</span>
            </p>
            <p className={"mt-1 font-serif text-5xl tabular-nums " + (geo.b < 0 ? "glow-clay text-clay" : "glow-teal text-teal-2")}>
              {num(geo.b)}
            </p>
          </div>
          <div className="min-w-0 flex-1 basis-48">
            <p className="text-sm text-paper">
              {tr(
                `Xa thêm 1%, FDI ${geo.b < 0 ? "giảm" : "tăng"} khoảng ${num(Math.abs(geo.b))}%`,
                `1% farther, FDI ${geo.b < 0 ? "falls" : "rises"} by about ${num(Math.abs(geo.b))}%`,
              )}{" "}
              ({geo.p < 0.05 ? tr("p < 0,05", "p < 0.05") : `p = ${num(geo.p, 3)}`}).
            </p>
            <button type="button" onClick={() => lab.setPanel("ppml")} className="cosmic-btn mt-3 min-h-11 rounded-full px-4 text-sm font-semibold">
              {tr("Ước lượng lại bằng PPML →", "Re-estimate with PPML →")}
            </button>
          </div>
        </div>
      ) : null}
      <div className="noir-card rounded-[26px] px-4 py-4 sm:px-5">
        <p className="kicker text-teal-2">
          {tr("Mô hình", "Model")} {lab.model + 1} · {tr("Bảng 6", "Table 6")}
        </p>
        <p className="mt-1 text-xs text-mist">
          {tr("REM, sai số chuẩn vững", "REM, robust standard errors")} · n = {meta.n} · R² = {num(meta.r2, 4)}
          {cons ? ` · ${tr("hằng số", "constant")} ${num(cons.b)} (${num(cons.se)})` : ""} · Phan &amp; Do (2019)
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {shown.map((r) => {
            const sig = stars(r) !== "";
            const tone = !sig ? "bg-mist/45" : r.b >= 0 ? "bg-teal-2" : "bg-amber-2";
            const lo = Math.min(x(0), x(r.b));
            return (
              <li key={r.id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 max-sm:grid-cols-[1fr_auto]">
                <span className="text-sm text-paper max-sm:col-span-2">{r.label}</span>
                <div className="noir-track relative h-4 rounded-full max-sm:order-1">
                  <span className="absolute inset-y-0 w-px bg-mist/70" style={{ left: "50%" }} />
                  <span
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-mist/70"
                    style={{ left: `${x(r.b - 1.96 * r.se)}%`, width: `${x(r.b + 1.96 * r.se) - x(r.b - 1.96 * r.se)}%` }}
                  />
                  <span
                    className={"absolute inset-y-[3px] rounded-full " + tone}
                    style={{ left: `${lo}%`, width: `${Math.max(Math.abs(x(r.b) - x(0)), 0.8)}%` }}
                  />
                </div>
                <span className={"w-20 text-right text-sm tabular-nums max-sm:order-2 " + (sig ? "text-paper" : "text-mist")}>
                  {r.b > 0 ? "+" : ""}
                  {num(r.b)}
                  <span className="text-amber-2">{stars(r)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="text-xs text-mist">
        {tr(
          "Thanh màu là hệ số, tính từ vạch 0 ở giữa. Đường mảnh là khoảng tin cậy 95%. Thanh xám là chưa có ý nghĩa ở mức 5%. Sao lấy từ bài; bật ô so sánh để tô theo mức ý nghĩa tính lại. Hằng số không vẽ trên trục này.",
          "Coloured bars are coefficients, drawn from the zero line in the middle. Thin lines are 95% confidence intervals. Grey bars are not significant at 5%. Stars are the paper's; tick the comparison box to colour by recomputed significance. The constant is not drawn on this axis.",
        )}
      </p>
      {notes.length ? (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-paper">
          {notes.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : null}
      <DraftCard draft={draftFromModel(lab.model)} file={`gravity-lab-model-${lab.model + 1}`} />
    </div>
  );
}

function reading(model: number): string[] {
  const c = MODELS[model]!.c;
  const out: string[] = [];
  if (c.lagfdi)
    out.push(
      tr(
        `FDI năm trước tăng 1% thì FDI năm nay tăng khoảng ${num(c.lagfdi[0])}%, các yếu tố khác giữ nguyên.`,
        `A 1% rise in last year's FDI goes with about ${num(c.lagfdi[0])}% more FDI this year, other things equal.`,
      ),
    );
  if (c.geo)
    out.push(
      tr(
        `Khoảng cách địa lý xa hơn 10% đi kèm FDI thay đổi ${pct(pctChange(c.geo[0], Math.log(1.1)))}.`,
        `10% more geographic distance goes with a ${pct(pctChange(c.geo[0], Math.log(1.1)))} change in FDI.`,
      ),
    );
  if (c.econ)
    out.push(
      tr(
        `Khoảng cách kinh tế lớn hơn 10% đi kèm FDI thay đổi ${pct(pctChange(c.econ[0], Math.log(1.1)))}.`,
        `10% more economic distance goes with a ${pct(pctChange(c.econ[0], Math.log(1.1)))} change in FDI.`,
      ),
    );
  if (c.fta)
    out.push(
      tr(
        `Có FTA đi kèm FDI cao hơn khoảng ${pct(pctChange(c.fta[0], 1))}. Đó là exp(β) − 1, không phải β × 100.`,
        `An FTA goes with about ${pct(pctChange(c.fta[0], 1))} more FDI. That is exp(β) − 1, not β × 100.`,
      ),
    );
  if (c.cult) {
    const [b, se] = c.cult;
    out.push(
      pValue(b, se) < 0.05
        ? tr(`Khoảng cách văn hóa có hệ số ${num(b)}.`, `Cultural distance has a coefficient of ${num(b)}.`)
        : tr(
            `Khoảng cách văn hóa là ${num(b)}, chưa có ý nghĩa ở mức 5%.`,
            `Cultural distance is ${num(b)}, not significant at 5%.`,
          ),
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
        {tr(
          `${lesson.n} quan sát FDI thực hiện, trong đó ${lesson.zeros} năm bằng 0. OLS trên log phải bỏ những năm đó. Cộng 1 rồi lấy log là cách vá. PPML giữ cả mẫu (Santos Silva & Tenreyro, 2006). Số dưới đây tính trên dữ liệu Xuan và Xing (2008), không lấy từ bài 2006.`,
          `${lesson.n} observations of realised FDI, ${lesson.zeros} of them zero years. OLS on logs has to drop those years; adding 1 before taking logs is a patch. PPML keeps the whole sample (Santos Silva & Tenreyro, 2006). The numbers below are computed on the Xuan and Xing (2008) data, not taken from the 2006 paper.`,
        )}
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
            <div className="noir-track relative h-2.5 rounded-full">
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
        {tr(
          "Một biến giải thích, hiệu ứng cố định năm, sai số chuẩn theo cụm quốc gia. Mô hình đầy đủ còn cần quy mô kinh tế, FTA và các chiều khoảng cách khác.",
          "One explanatory variable, year fixed effects, standard errors clustered by country. A full model also needs economic size, FTAs and the other distance dimensions.",
        )}{" "}
        {CITE_2008}
      </p>
      <XuanGlobe />
      <details className="max-w-xl">
        <summary className="min-h-11 text-sm text-paper">{tr("Xem dữ liệu gốc", "Show the source data")}</summary>
        <XuanTable />
      </details>
    </div>
  );
}

/** Year-by-year replay of Xuan & Xing (2008) on the globe; zero years stay on the map in clay. */
function XuanGlobe() {
  const data = useMemo(() => xuanXingSeries(), []);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = data.years.length - 1;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setIdx((i) => {
        if (i >= last) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => window.clearInterval(timer);
  }, [playing, last]);

  const hanoi = { lon: HANOI[1], lat: HANOI[0] };
  const peak = Math.max(...data.series.flatMap((s) => s.v));
  const year = data.years[idx]!;
  const positive = data.series.filter((s) => s.v[idx]! > 0);
  const zeros = data.series.filter((s) => s.v[idx]! <= 0);
  const top = positive.reduce<(typeof positive)[number] | null>((m, s) => (!m || s.v[idx]! > m.v[idx]! ? s : m), null);

  const nodes: GlobeNode[] = [
    { id: "VNM", lon: hanoi.lon, lat: hanoi.lat, label: tr("Hà Nội", "Hanoi"), r: 7, color: "#8bbcc5", tappable: false },
    ...data.series.map(
      (s): GlobeNode => ({
        id: s.id,
        lon: s.cap[1],
        lat: s.cap[0],
        label: s.id,
        r: 5,
        color: s.v[idx]! > 0 ? "#f3ece1" : "#c46a4a",
        tappable: false,
      }),
    ),
  ];
  // Width scales with the series peak so years compare; sqrt keeps small flows visible.
  const arcs: GlobeArc[] = positive.map((s) => ({
    id: s.id,
    from: { lon: s.cap[1], lat: s.cap[0] },
    to: hanoi,
    weight: Math.sqrt(s.v[idx]! / peak),
    highlight: s.id === top?.id,
  }));

  return (
    <div className="flex max-w-xl flex-col gap-2">
      <p className="text-sm text-paper">
        {tr(
          "Phát lại theo năm: cung là FDI thực hiện từ mỗi nước, chấm đỏ đất là năm bằng 0 — những quan sát OLS trên log phải bỏ.",
          "Year-by-year replay: each arc is realised FDI from one country; clay dots are zero years — the observations OLS on logs has to drop.",
        )}
      </p>
      <div className="h-80 overflow-hidden rounded-card sm:h-96">
        <Globe
          nodes={nodes}
          arcs={arcs}
          focus={[hanoi]}
          label={tr(
            `Địa cầu dòng vốn FDI thực hiện vào Việt Nam (realised FDI inflows) năm ${year}, theo Xuan và Xing (2008).`,
            `Globe of realised FDI inflows into Vietnam in ${year}, from Xuan and Xing (2008).`,
          )}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? tr("Tạm dừng", "Pause") : tr("Phát", "Play")}
          aria-pressed={playing}
          onClick={() => {
            if (!playing && idx >= last) setIdx(0);
            setPlaying((p) => !p);
          }}
          className="cosmic-btn inline-flex size-12 items-center justify-center rounded-full"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
        <label className="flex flex-1 flex-col gap-1">
          <span className="flex items-baseline justify-between text-sm text-paper">
            <span>{tr("Năm", "Year")}</span>
            <span className="tabular-nums font-medium">{year}</span>
          </span>
          <input
            type="range"
            min={0}
            max={last}
            step={1}
            value={idx}
            aria-label={tr("Năm", "Year")}
            aria-valuetext={String(year)}
            onChange={(e) => {
              setPlaying(false);
              setIdx(Number(e.target.value));
            }}
          />
        </label>
      </div>
      <p className="text-sm text-paper tabular-nums">
        {tr(
          `${year}: ${positive.length} nước có FDI dương, ${zeros.length} nước bằng 0`,
          `${year}: ${positive.length} countries with positive FDI, ${zeros.length} at zero`,
        )}
        {zeros.length ? ` (${zeros.map((s) => s.name).join(", ")})` : ""}.
        {top ? tr(` Lớn nhất: ${top.name}, ${num(top.v[idx]!, 1)} (cung vàng).`, ` Largest: ${top.name}, ${num(top.v[idx]!, 1)} (amber arc).`) : ""}
      </p>
      <p className="text-xs text-mist">
        {tr(
          "Độ dày cung theo căn bậc hai của giá trị, so với đỉnh của cả chuỗi.",
          "Arc width follows the square root of the value, relative to the peak of the whole series.",
        )}{" "}
        {CITE_2008}
      </p>
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
            <th className="py-1 pr-3 text-left font-medium">{tr("Nước", "Country")}</th>
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
        {tr(
          "Mỗi dòng là một cặp quốc gia–năm. Nếu FDI ở dạng mức, Lab chạy cả OLS trên log — phải bỏ năm bằng 0 — và PPML trên cả mẫu. Phép tính ở lại trên máy này.",
          "Each row is a country–year pair. If FDI is in levels, the Lab runs both OLS on logs — dropping zero years — and PPML on the whole sample. The computation stays on this device.",
        )}
      </p>
      {!est ? (
        <p className="text-sm text-mist">{lab.estMsg}</p>
      ) : (
        <div id="fdi-results" className="scroll-mt-4 overflow-x-auto">
          <table className="w-full min-w-72 text-sm text-paper">
            <thead>
              <tr className="text-xs text-mist">
                <th className="py-2 pr-3 text-left font-medium">{tr("Biến", "Variable")}</th>
                {est.fits.map((f) => (
                  <th key={f.label} className="py-2 pr-3 text-right font-medium">{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {names.map((n) => (
                <tr key={n} className="border-t border-paper/15">
                  <td className="py-2 pr-3">{n === "_cons" ? tr("Hằng số", "Constant") : n}</td>
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
                <td className="py-2 pr-3">{tr("Số quan sát", "Observations")}</td>
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
      {est ? (
        <p className="text-xs text-mist">
          {tr("Sao tính từ p hai phía. Sai số chuẩn trong ngoặc.", "Stars from two-sided p-values. Standard errors in parentheses.")}{" "}
          {lab.estMsg}
        </p>
      ) : null}
      {est ? (
        <DraftCard draft={draftFromEstimate(est, { y: lab.yCol, yearFE: lab.yearFE, cluster: lab.clusterOn, unit: lab.unitCol })} file="gravity-lab-results" />
      ) : null}
    </div>
  );
}

/** FDI by sector, 2025: capital flowing from the world into Việt Nam's sectors. */
function SectorStage({ lab }: { lab: LabState }) {
  return (
    <div className="flex max-w-3xl flex-col gap-3">
      <p className="kicker text-amber-2">{tr("FDI theo ngành · 2025", "FDI by sector · 2025")}</p>
      <SectorFlow mode={lab.fdiMode} />
      <p className="text-xs text-mist">
        {tr(
          "Mỗi biểu tượng bay qua là khoảng một tỷ USD trong một năm; ⚙ chế biến, chế tạo · ▦ bất động sản · ϟ điện, khí đốt · ◆ ngành khác. Số liệu Cục Thống kê (2026); vốn thực hiện là số ước tính.",
          "Each icon crossing is roughly one billion US dollars in a year: ⚙ manufacturing · ▦ real estate · ϟ electricity and gas · ◆ other sectors. Data: General Statistics Office (2026); disbursed capital is an estimate.",
        )}
      </p>
    </div>
  );
}

export function FdiDock({ lab }: { lab: LabState }) {
  return (
    <div className="flex flex-col gap-4 p-4 pb-8">
      <div role="group" aria-label={tr("Phần", "Section")} className="noir-track flex flex-wrap gap-1 rounded-[22px] p-1">
        <Chip flat active={lab.panel === "coef"} onClick={() => lab.setPanel("coef")}>
          {tr("Hệ số 2019", "2019 coefficients")}
        </Chip>
        <Chip flat active={lab.panel === "sim"} onClick={() => lab.setPanel("sim")}>
          {tr("Tác động", "Impact")}
        </Chip>
        <Chip flat active={lab.panel === "ppml"} onClick={() => lab.setPanel("ppml")}>
          {tr("Vì sao PPML", "Why PPML")}
        </Chip>
        <Chip flat active={lab.panel === "sector"} onClick={() => lab.setPanel("sector")}>
          {tr("Theo ngành 2025", "By sector 2025")}
        </Chip>
        <Chip flat active={lab.panel === "data"} onClick={() => lab.setPanel("data")}>
          {tr("Dữ liệu của bạn", "Your data")}
        </Chip>
        <Chip flat active={lab.panel === "case"} onClick={() => lab.setPanel("case")}>
          {tr("Hồ sơ điều tra", "Case file")}
        </Chip>
      </div>
      {lab.panel === "coef" ? <CoefDock lab={lab} /> : null}
      {lab.panel === "sim" ? <SimDock lab={lab} /> : null}
      {lab.panel === "data" ? <DataDock lab={lab} /> : null}
      {lab.panel === "sector" ? <SectorBars mode={lab.fdiMode} setMode={lab.setFdiMode} /> : null}
      {lab.panel === "ppml" ? (
        <p className="text-sm text-muted">
          {tr(
            "Santos Silva và Tenreyro (2006): hồi quy log làm méo hệ số khoảng cách khi nhiều quan sát bằng không, và khi phương sai không tỉ lệ với bình phương kỳ vọng. PPML ước lượng trực tiếp trên mức FDI.",
            "Santos Silva and Tenreyro (2006): log regressions distort the distance coefficient when many observations are zero and when the variance is not proportional to the squared mean. PPML estimates directly on FDI levels.",
          )}
        </p>
      ) : null}
      <p className="text-xs text-muted">
        {lab.panel === "ppml"
          ? CITE_2008
          : lab.panel === "case"
            ? `${CITE_2008} ${CITE_2019}`
          : lab.panel === "data"
            ? tr(
                "Santos Silva và Tenreyro (2006). File chỉ được đọc trên máy này.",
                "Santos Silva and Tenreyro (2006). Files are read only on this device.",
              )
            : `${CITE_2019} ${tr("Bảng 6 · 16 đối tác, 2006–2015.", "Table 6 · 16 partners, 2006–2015.")}`}
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
        {tr("So sao trong bài với mức ý nghĩa tính lại", "Compare the paper's stars with recomputed significance")}
      </label>
      {lab.check && flagged.length ? (
        <ul className="flex flex-col gap-1 text-sm text-muted">
          {flagged.map((r) => (
            <li key={r.id}>
              {r.label}: {tr("bài ghi", "paper reports")} {r.published || tr("không sao", "no stars")},{" "}
              {tr("tính lại", "recomputed")} p = {num(r.p, 3)} ({r.recomputed || tr("không sao", "no stars")}).
            </li>
          ))}
        </ul>
      ) : null}
      <details className="noir-card rounded-[22px] px-4 py-2">
        <summary className="min-h-11 text-sm font-medium">{tr("Câu hỏi thảo luận", "Discussion questions")}</summary>
        <ol className="list-decimal pb-2 pl-4 text-sm text-muted">
          <li>{tr(
            "R² chỉ khoảng 0,006–0,024, trong khi FDI và FDI năm trước tương quan 0,62. R² nào đang được báo cáo?",
            "R² is only about 0.006–0.024, while FDI and last year's FDI correlate at 0.62. Which R² is being reported?",
          )}</li>
          <li>{tr(
            "Đưa biến trễ của biến phụ thuộc vào mô hình hiệu ứng ngẫu nhiên gây ra vấn đề gì?",
            "What problem does putting the lagged dependent variable into a random-effects model cause?",
          )}</li>
          <li>{tr(
            "GDP Việt Nam giống nhau cho mọi đối tác trong một năm. Thêm hiệu ứng cố định năm thì biến này ra sao?",
            "Vietnam's GDP is the same for every partner in a given year. What happens to this variable once year fixed effects are added?",
          )}</li>
          <li>{tr(
            "Khoảng cách văn hóa không đổi theo thời gian. Hiệu ứng cố định quốc gia còn ước lượng được nó không?",
            "Cultural distance does not change over time. Can country fixed effects still estimate it?",
          )}</li>
        </ol>
      </details>
    </div>
  );
}

function SimDock({ lab }: { lab: LabState }) {
  return (
    <div className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{tr("Đối tác đang xét", "Partner")}</span>
        <select
          className="noir-track min-h-11 w-full rounded-full px-4 text-ink"
          value={lab.a}
          aria-label={tr("Đối tác đang xét", "Partner")}
          onChange={(e) => lab.setA(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {tr(c.name, c.en)} · {fmtInt(kmFromHanoi(c.id))} km
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">{tr("So khoảng cách với", "Compare distance with")}</span>
        <select
          className="noir-track min-h-11 w-full rounded-full px-4 text-ink"
          value={lab.b}
          aria-label={tr("Quốc gia để so khoảng cách", "Country to compare distance with")}
          onChange={(e) => lab.setB(e.target.value)}
        >
          {COUNTRIES.map((c) => (
            <option key={c.id} value={c.id}>
              {tr(c.name, c.en)} · {fmtInt(kmFromHanoi(c.id))} km
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-h-11 items-center gap-2 text-sm">
        <input type="checkbox" checked={lab.fta} onChange={(e) => lab.setFta(e.target.checked)} />
        {tr("Việt Nam ký FTA với đối tác đang xét", "Vietnam signs an FTA with this partner")}
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>{tr("Khoảng cách kinh tế", "Economic distance")}</span>
          <span className="tabular-nums font-medium">{lab.econ >= 0 ? "+" : ""}{lab.econ}%</span>
        </span>
        <input type="range" min={-30} max={30} step={5} value={lab.econ} aria-label={tr("Khoảng cách kinh tế thay đổi", "Change in economic distance")} aria-valuetext={`${lab.econ >= 0 ? "+" : ""}${lab.econ}%`} onChange={(e) => lab.setEcon(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>{tr("Khoảng cách thể chế", "Institutional distance")}</span>
          <span className="tabular-nums font-medium">{lab.inst >= 0 ? "+" : ""}{num(lab.inst, 1)}</span>
        </span>
        <input type="range" min={-2} max={2} step={0.5} value={lab.inst} aria-label={tr("Khoảng cách thể chế thay đổi", "Change in institutional distance")} aria-valuetext={`${lab.inst >= 0 ? "+" : ""}${num(lab.inst, 1)}`} onChange={(e) => lab.setInst(Number(e.target.value))} />
      </label>
      <label className="block">
        <span className="mb-1 flex justify-between text-sm">
          <span>{tr("Độ mở thương mại", "Trade openness")}</span>
          <span className="tabular-nums font-medium">+{num(lab.open, 2)}</span>
        </span>
        <input type="range" min={0} max={0.3} step={0.05} value={lab.open} aria-label={tr("Độ mở thương mại tăng", "Increase in trade openness")} aria-valuetext={`+${num(lab.open, 2)}`} onChange={(e) => lab.setOpen(Number(e.target.value))} />
      </label>
    </div>
  );
}

function DataDock({ lab }: { lab: LabState }) {
  const selectClass = "noir-track min-h-11 w-full rounded-full px-4 text-ink";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        {tr(
          "CSV dấu phẩy hoặc chấm phẩy, một dòng một cặp quốc gia–năm. Với bộ 2019, xuất từ Stata bằng export delimited.",
          "Comma- or semicolon-separated CSV, one row per country–year pair. For the 2019 dataset, export from Stata with export delimited.",
        )}
      </p>
      <div className="flex flex-wrap gap-2">
        <label className="cosmic-btn inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 text-sm font-medium">
          {tr("Nạp CSV", "Load CSV")}
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label={tr("Nạp tệp CSV", "Load a CSV file")}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              file.text().then((txt) => {
                try {
                  lab.loadTable(parseCSV(txt));
                } catch (err) {
                  lab.note(tr("Không ước lượng được: ", "Could not estimate: ") + (err instanceof Error ? err.message : "CSV"));
                }
              });
            }}
          />
        </label>
        <button
          type="button"
          className="noir-raise min-h-11 rounded-full px-4 text-sm font-medium"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = "gravity-lab-template.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          {tr("Tải tệp mẫu", "Download template")}
        </button>
        <button type="button" className="noir-raise min-h-11 rounded-full px-4 text-sm font-medium" onClick={() => lab.loadTable(panelTable(), ["ln_dist"])}>
          {tr("Nạp bộ dữ liệu FDI", "Load the FDI dataset")}
        </button>
      </div>
      <div className="noir-card rounded-[22px] px-4 py-3">
        <p className="kicker text-amber">
          {tr("Bộ dữ liệu FDI Việt Nam (cleaned dataset)", "Cleaned Viet Nam FDI dataset")} · <span className="normal-case">Pro</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          {tr(
            "fdi_vn_panel: đối tác × năm, 1990–2004, 150 dòng; FDI thực hiện (Xuan & Xing, 2008), khoảng cách tới Hà Nội; giữ các năm bằng 0. Từ điển biến hướng dẫn ghép GDP, FTA, PCI.",
            "fdi_vn_panel: partner × year, 1990–2004, 150 rows; realised FDI (Xuan & Xing, 2008), distance to Hà Nội; zero years kept. The codebook explains how to merge GDP, FTA and PCI.",
          )}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" className="noir-raise inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold" onClick={() => saveFile("fdi_vn_panel.csv", datasetCSV(), "text/csv")}>
            <Download className="size-3.5" /> CSV
          </button>
          <button type="button" className="noir-raise inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold" onClick={() => saveFile("fdi_vn_panel.do", datasetDo(), "text/plain")}>
            <Download className="size-3.5" /> Stata .do
          </button>
          <button type="button" className="noir-raise inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-xs font-semibold" onClick={() => saveFile("fdi_vn_panel_codebook.md", datasetCodebook(), "text/markdown")}>
            <Download className="size-3.5" /> {tr("Từ điển biến", "Codebook")}
          </button>
        </div>
      </div>
      {lab.table && lab.numCols.length ? (
        <>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{tr("Biến phụ thuộc", "Dependent variable")}</span>
            <select
              className={selectClass}
              value={lab.yCol}
              aria-label={tr("Biến phụ thuộc", "Dependent variable")}
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
            {tr("Biến phụ thuộc ở dạng mức (không phải log)", "Dependent variable in levels (not logs)")}
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{tr("Cột quốc gia", "Country column")}</span>
            <select className={selectClass} value={lab.unitCol} aria-label={tr("Cột quốc gia", "Country column")} onChange={(e) => lab.setUnitCol(e.target.value)}>
              {lab.table.columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">{tr("Cột năm", "Year column")}</span>
            <select className={selectClass} value={lab.yearCol} aria-label={tr("Cột năm", "Year column")} onChange={(e) => lab.setYearCol(e.target.value)}>
              <option value="">{tr("Không có", "None")}</option>
              {lab.table.columns.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={lab.yearFE} onChange={(e) => lab.setYearFE(e.target.checked)} />
            {tr("Hiệu ứng cố định năm", "Year fixed effects")}
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={lab.clusterOn} onChange={(e) => lab.setClusterOn(e.target.checked)} />
            {tr("Sai số chuẩn theo cụm quốc gia", "Standard errors clustered by country")}
          </label>
          <fieldset>
            <legend className="mb-1 text-sm font-medium">{tr("Biến giải thích", "Explanatory variables")}</legend>
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
            {tr("Ước lượng", "Estimate")}
          </button>
        </>
      ) : null}
      <p className="text-sm text-muted">
        {lab.estMsg}
        {lab.est ? tr(" Kết quả ở bảng phía trên.", " Results are in the table above.") : ""}
      </p>
      <ReferenceList />
    </div>
  );
}
