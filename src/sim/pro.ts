/** The two Pro deliverables, both built on this device: the cleaned FDI panel with its codebook and
 * Stata script, and a publication-style results draft (table, interpretation in both languages,
 * APA 7 references) exported as Word or LaTeX.
 */

import { COUNTRIES, HANOI, MODELS, VARS, haversineKm, pValue, xuanXingSeries, type PanelEstimate } from "./gravity-lab.ts";
import { refText } from "./refs.ts";

export type Lang = "vi" | "en";

/* ------------------------------------------------------------------ dataset */

export type PanelRow = {
  iso3: string;
  partner: string;
  year: number;
  fdi_musd: number;
  fdi_zero: 0 | 1;
  dist_km: number;
  ln_dist: number;
};

/** Partner × year panel of realised FDI into Việt Nam, 1990–2004, zero years kept. */
export function datasetPanel(): PanelRow[] {
  const { years, series } = xuanXingSeries();
  const rows: PanelRow[] = [];
  for (const s of series) {
    const name = COUNTRIES.find((c) => c.id === s.id)?.en ?? s.id;
    const km = haversineKm(HANOI, s.cap);
    years.forEach((year, j) => {
      const v = s.v[j]!;
      rows.push({
        iso3: s.id,
        partner: name,
        year,
        fdi_musd: v,
        fdi_zero: v === 0 ? 1 : 0,
        dist_km: Math.round(km),
        ln_dist: Number(Math.log(km).toFixed(6)),
      });
    });
  }
  return rows;
}

export const DATASET_COLUMNS = ["iso3", "partner", "year", "fdi_musd", "fdi_zero", "dist_km", "ln_dist"] as const;

export function datasetCSV(): string {
  const head = DATASET_COLUMNS.join(",");
  const lines = datasetPanel().map((r) => DATASET_COLUMNS.map((c) => String(r[c])).join(","));
  return [head, ...lines].join("\n") + "\n";
}

/** A Stata script that imports the CSV, labels it, declares the panel and saves a .dta. */
export function datasetDo(): string {
  return `* Gravity Lab - fdi_vn_panel: realised FDI inflows into Viet Nam by partner and year, 1990-2004
* Source: Xuan & Xing (2008), Table 1; distances computed from capital coordinates (haversine).
* Zero years are kept so PPML can use the whole sample (Santos Silva & Tenreyro, 2006).
version 14
clear
import delimited "fdi_vn_panel.csv", varnames(1) encoding(utf8) clear
label variable iso3     "Partner economy (ISO 3166-1 alpha-3)"
label variable partner  "Partner economy, name"
label variable year     "Year"
label variable fdi_musd "Realised FDI inflows into Viet Nam, USD million"
label variable fdi_zero "1 if realised FDI is zero in that year"
label variable dist_km  "Great-circle distance Ha Noi - partner capital, km"
label variable ln_dist  "log of dist_km"
encode iso3, generate(partner_id)
xtset partner_id year
* OLS on logs drops zero years; PPML keeps them.
* reg ln_fdi ln_dist i.year, cluster(partner_id)   // after: gen ln_fdi = log(fdi_musd) if fdi_musd > 0
* ppmlhdfe fdi_musd ln_dist, absorb(year) cluster(partner_id)
save "fdi_vn_panel.dta", replace
`;
}

/** Variable dictionary, sources and how to extend the panel, in both languages. */
export function datasetCodebook(): string {
  return `# fdi_vn_panel · Từ điển biến · Codebook

Gravity Lab · Đại học Cần Thơ. Bộ dữ liệu dùng cho giảng dạy mô hình lực hấp dẫn (gravity model).
Gravity Lab · Can Tho University. A teaching dataset for the gravity model.

## Cấu trúc · Structure

- Đơn vị quan sát (unit): đối tác × năm (partner × year). 10 đối tác, 15 năm (1990–2004), 150 dòng.
- Quan sát bằng 0 (zero flows) được giữ lại, không bị loại, để ước lượng PPML.
- Unit: partner × year. 10 partners, 15 years (1990–2004), 150 rows. Zero flows are kept for PPML.

| Biến · Variable | Kiểu · Type | Mô tả · Description |
| --- | --- | --- |
| iso3 | string | Mã đối tác ISO 3166-1 alpha-3 · Partner economy code |
| partner | string | Tên đối tác (tiếng Anh) · Partner name (English) |
| year | integer | Năm · Year |
| fdi_musd | number | dòng vốn FDI thực hiện vào Việt Nam (realised FDI inflows), triệu USD · Realised FDI inflows into Viet Nam, USD million |
| fdi_zero | 0/1 | 1 nếu FDI thực hiện bằng 0 trong năm đó · 1 if realised FDI is zero that year |
| dist_km | number | Khoảng cách vòng lớn Hà Nội – thủ đô đối tác, km · Great-circle distance Hà Nội – partner capital, km |
| ln_dist | number | log(dist_km) |

## Nguồn · Sources

- FDI: Xuan, N. T., & Xing, Y. (2008). Foreign direct investment and exports: The experiences of Vietnam. *Economics of Transition, 16*(2), 183–197, Bảng 1 · Table 1. Số liệu được chép lại để giảng dạy; khi công bố, hãy trích dẫn bài gốc. · Figures transcribed for teaching; cite the original article when publishing.
- Khoảng cách · Distance: tính theo công thức haversine từ toạ độ thủ đô (bán kính Trái Đất 6 371 km) · haversine from capital coordinates (Earth radius 6,371 km).

## Mở rộng · Extending the panel

Mô hình đầy đủ (Phan & Do, 2019, Mô hình 8) cần thêm · The full model (Phan & Do, 2019, Model 8) also needs:

- GDP đối tác và GDP Việt Nam · partner and Viet Nam GDP: World Bank WDI, chỉ số · indicator NY.GDP.MKTP.CD (USD hiện hành · current USD).
- Khoảng cách theo CEPII · CEPII distances: GeoDist, biến · variable distcap (giữa thủ đô · capital to capital), để thay cho dist_km nếu cần · as an alternative to dist_km.
- FTA: Trung tâm WTO và Hội nhập (VCCI), danh sách hiệp định và năm có hiệu lực · WTO Center (VCCI), agreements and entry-into-force years; đặt fta = 1 từ năm có hiệu lực · set fta = 1 from the year in force.
- PCI (cấp tỉnh · provincial): pcivietnam.vn, dùng khi mở rộng sang tỉnh × đối tác × năm · for a province × partner × year extension.
- Khoảng cách thể chế và văn hoá · institutional and cultural distance: Worldwide Governance Indicators; Hofstede/Kogut–Singh.

Ghép theo khoá iso3 × year · Merge on iso3 × year. Giữ các năm FDI = 0 · Keep the FDI = 0 years.

## Giấy phép · Licence

Bộ dữ liệu này đi kèm Gravity Lab để học tập và nghiên cứu. Số liệu FDI thuộc bài báo gốc; số liệu khoảng cách do Gravity Lab tính.
This dataset ships with Gravity Lab for study and research. The FDI figures belong to the original article; the distances are computed by Gravity Lab.
`;
}

/* ------------------------------------------------------------- results draft */

export type DraftCell = { b: number; se: number; stars: string } | null;

export type Draft = {
  title: { vi: string; en: string };
  method: { vi: string; en: string };
  heads: string[];
  rows: Array<{ label: { vi: string; en: string }; cells: DraftCell[] }>;
  stats: Array<{ label: { vi: string; en: string }; values: string[] }>;
  notes: { vi: string; en: string };
  paragraphs: { vi: string[]; en: string[] };
  refs: string[];
};

const CORE_REFS = ["tinbergen-1962", "anderson-2003", "silva-2006", "yotov-2016"];

function f(n: number, d = 3): string {
  return n.toFixed(d);
}

function fl(n: number, lang: Lang, d = 2): string {
  const s = n.toFixed(d);
  return lang === "vi" ? s.replace(".", ",") : s;
}

/** How a variable enters the model, from its name: log (elasticity), dummy, or a plain unit. */
export type VarKind = "log" | "dummy" | "unit";

export function kindOf(name: string): VarKind {
  if (/^(ln|log)[_a-z]|_(ln|log)[_a-z]|(_ln|_log)$|^l_/i.test(name)) return "log";
  if (/fta|rta|dummy|border|contig|lang|colon|wto|asean|crisis|covid/i.test(name)) return "dummy";
  return "unit";
}

function sigPhrase(p: number, lang: Lang): string {
  if (lang === "vi") return p < 0.01 ? "có ý nghĩa thống kê ở mức 1%" : p < 0.05 ? "có ý nghĩa thống kê ở mức 5%" : p < 0.1 ? "có ý nghĩa thống kê ở mức 10%" : "chưa có ý nghĩa thống kê ở mức 10%";
  return p < 0.01 ? "statistically significant at the 1% level" : p < 0.05 ? "statistically significant at the 5% level" : p < 0.1 ? "statistically significant at the 10% level" : "not statistically significant at the 10% level";
}

/** One interpretation sentence for a coefficient; the outcome is assumed to be FDI in logs or PPML on levels. */
export function interpret(label: string, kind: VarKind, b: number, se: number, lang: Lang): string {
  const p = pValue(b, se);
  const sig = sigPhrase(p, lang);
  const up = b >= 0;
  const pctLog = Math.abs(b);
  const pctDummy = Math.abs(Math.exp(b) - 1) * 100;
  if (lang === "vi") {
    const dir = up ? "tăng" : "giảm";
    if (kind === "log")
      return `Hệ số của ${label} là ${fl(b, lang)} (${sig}): khi biến này tăng 1%, FDI ${dir} khoảng ${fl(pctLog, lang)}%, các yếu tố khác giữ nguyên.`;
    if (kind === "dummy")
      return `Hệ số của ${label} là ${fl(b, lang)} (${sig}): khi biến này bằng 1, FDI ${up ? "cao hơn" : "thấp hơn"} khoảng ${fl(pctDummy, lang, 1)}%, tức exp(β) − 1, không phải β × 100.`;
    return `Hệ số của ${label} là ${fl(b, lang)} (${sig}): tăng một đơn vị đi kèm FDI ${dir} khoảng ${fl(pctDummy, lang, 1)}%.`;
  }
  const dir = up ? "rises" : "falls";
  if (kind === "log")
    return `The coefficient on ${label} is ${fl(b, lang)} (${sig}): a 1% increase in this variable goes with FDI that ${dir} by about ${fl(pctLog, lang)}%, other things equal.`;
  if (kind === "dummy")
    return `The coefficient on ${label} is ${fl(b, lang)} (${sig}): when the variable equals 1, FDI is about ${fl(pctDummy, lang, 1)}% ${up ? "higher" : "lower"}, that is exp(β) − 1, not β × 100.`;
  return `The coefficient on ${label} is ${fl(b, lang)} (${sig}): a one-unit increase goes with FDI that ${dir} by about ${fl(pctDummy, lang, 1)}%.`;
}

const KIND_BY_ID: Record<string, VarKind> = {
  lagfdi: "log",
  geo: "log",
  econ: "log",
  gdpvn: "log",
  gdppt: "log",
  inst: "unit",
  cult: "unit",
  open: "unit",
  exp: "unit",
  corr: "unit",
  fta: "dummy",
};

/** The published model from Phan & Do (2019), Table 6, as a draft. */
export function draftFromModel(modelIndex: number): Draft {
  const m = MODELS[modelIndex]!;
  const k = modelIndex + 1;
  const vars = VARS.filter((v) => m.c[v.id] && v.id !== "cons");
  const cons = m.c.cons;
  const rows: Draft["rows"] = vars.map((v) => {
    const [b, se, stars] = m.c[v.id]!;
    return { label: { vi: v.label, en: v.en }, cells: [{ b, se, stars }] };
  });
  if (cons) rows.push({ label: { vi: "Hằng số", en: "Constant" }, cells: [{ b: cons[0], se: cons[1], stars: cons[2] }] });
  const para = (lang: Lang) =>
    vars.map((v) => {
      const [b, se] = m.c[v.id]!;
      return interpret(lang === "vi" ? v.label.toLowerCase() : v.en.toLowerCase(), KIND_BY_ID[v.id] ?? "unit", b, se, lang);
    });
  return {
    title: {
      vi: `Bảng 1. Kết quả ước lượng mô hình lực hấp dẫn cho dòng vốn FDI vào Việt Nam (FDI inflows), 2006–2015 (Mô hình ${k})`,
      en: `Table 1. Gravity-model estimates for FDI inflows into Viet Nam, 2006–2015 (Model ${k})`,
    },
    method: {
      vi: "Mô hình tác động ngẫu nhiên (REM) với sai số chuẩn vững, dữ liệu bảng đối tác × năm. Hệ số lấy từ Phan và Do (2019), Bảng 6.",
      en: "Random-effects model (REM) with robust standard errors on a partner × year panel. Coefficients from Phan and Do (2019), Table 6.",
    },
    heads: [`REM · ${lang2("Mô hình", "Model")} ${k}`],
    rows,
    stats: [
      { label: { vi: "Số quan sát", en: "Observations" }, values: [String(m.n)] },
      { label: { vi: "R²", en: "R²" }, values: [f(m.r2, 4)] },
    ],
    notes: {
      vi: "Sai số chuẩn trong ngoặc. *** p < 0,01; ** p < 0,05; * p < 0,10. Biến phụ thuộc: log FDI thực hiện.",
      en: "Standard errors in parentheses. *** p < 0.01; ** p < 0.05; * p < 0.10. Dependent variable: log of realised FDI.",
    },
    paragraphs: { vi: para("vi"), en: para("en") },
    refs: ["phan-2019", ...CORE_REFS].map(refText).filter(Boolean),
  };
}

// Headings are shared by both languages; this keeps them readable in either.
function lang2(vi: string, en: string): string {
  return `${en} / ${vi}`;
}

/** The reader's own estimation (OLS on logs and PPML, or OLS) as a draft. */
export function draftFromEstimate(est: PanelEstimate, opts: { y: string; yearFE: boolean; cluster: boolean; unit: string }): Draft {
  const fits = est.fits;
  const names = fits[0]!.fit.coef.map((c) => c.name).filter((n) => !n.includes("="));
  const ordered = [...names.filter((n) => n !== "_cons"), ...names.filter((n) => n === "_cons")];
  const rows: Draft["rows"] = ordered.map((n) => ({
    label: n === "_cons" ? { vi: "Hằng số", en: "Constant" } : { vi: n, en: n },
    cells: fits.map((fit) => {
      const c = fit.fit.coef.find((k) => k.name === n);
      return c ? { b: c.b, se: c.se, stars: c.stars } : null;
    }),
  }));
  const last = fits[fits.length - 1]!;
  const para = (lang: Lang) =>
    ordered
      .filter((n) => n !== "_cons")
      .map((n) => {
        const c = last.fit.coef.find((k) => k.name === n);
        return c ? interpret(n, kindOf(n), c.b, c.se, lang) : "";
      })
      .filter(Boolean);
  const ppml = fits.some((x) => x.label.startsWith("PPML"));
  const fe = opts.yearFE ? { vi: " với hiệu ứng cố định năm", en: " with year fixed effects" } : { vi: "", en: "" };
  const cl = { vi: opts.cluster ? `, sai số chuẩn theo cụm ${opts.unit || "đơn vị"}` : "" };
  const clEn = opts.cluster ? `, standard errors clustered by ${opts.unit || "unit"}` : "";
  return {
    title: {
      vi: `Bảng 1. Kết quả ước lượng mô hình lực hấp dẫn, biến phụ thuộc ${opts.y}`,
      en: `Table 1. Gravity-model estimates, dependent variable ${opts.y}`,
    },
    method: {
      vi: ppml
        ? `OLS trên log (bỏ các quan sát bằng 0) và PPML trên mức (giữ cả mẫu)${fe.vi}${cl.vi}. Cột PPML là ước lượng chính (Santos Silva và Tenreyro, 2006).`
        : `OLS${fe.vi}${cl.vi}.`,
      en: ppml
        ? `OLS on logs (zero observations dropped) and PPML on levels (whole sample)${fe.en}${clEn}. The PPML column is the preferred estimate (Santos Silva and Tenreyro, 2006).`
        : `OLS${fe.en}${clEn}.`,
    },
    heads: fits.map((x) => x.label),
    rows,
    stats: [
      { label: { vi: "Số quan sát", en: "Observations" }, values: fits.map((x) => String(x.fit.n)) },
      { label: { vi: "R² / pseudo-R²", en: "R² / pseudo-R²" }, values: fits.map((x) => f(x.fit.r2)) },
    ],
    notes: {
      vi: "Sai số chuẩn trong ngoặc. *** p < 0,01; ** p < 0,05; * p < 0,10. Hiệu ứng cố định năm không báo cáo.",
      en: "Standard errors in parentheses. *** p < 0.01; ** p < 0.05; * p < 0.10. Year fixed effects not reported.",
    },
    paragraphs: { vi: para("vi"), en: para("en") },
    refs: [...CORE_REFS, "phan-2019", "xuan-2008"].map(refText).filter(Boolean),
  };
}

/* --------------------------------------------------------------- LaTeX */

function texEsc(s: string): string {
  return s.replace(/\\/g, "\\textbackslash{}").replace(/([%&$#_{}])/g, "\\$1").replace(/~/g, "\\textasciitilde{}").replace(/\^/g, "\\textasciicircum{}");
}

export function draftToLatex(d: Draft): string {
  const cols = d.heads.length;
  const out: string[] = [];
  out.push("% Generated by Gravity Lab. Needs \\usepackage{booktabs} and a Unicode engine (XeLaTeX or LuaLaTeX) for Vietnamese.");
  out.push("\\begin{table}[htbp]\\centering");
  out.push(`\\caption{${texEsc(d.title.en)}}`);
  out.push(`\\begin{tabular}{l${"c".repeat(cols)}}\\toprule`);
  out.push(` & ${d.heads.map(texEsc).join(" & ")} \\\\ \\midrule`);
  for (const r of d.rows) {
    out.push(`${texEsc(r.label.en)} & ${r.cells.map((c) => (c ? `${f(c.b)}${c.stars ? `$^{${c.stars.replace(/\*/g, "*")}}$` : ""}` : "--")).join(" & ")} \\\\`);
    out.push(` & ${r.cells.map((c) => (c ? `(${f(c.se)})` : "")).join(" & ")} \\\\`);
  }
  out.push("\\midrule");
  for (const s of d.stats) out.push(`${texEsc(s.label.en)} & ${s.values.map(texEsc).join(" & ")} \\\\`);
  out.push("\\bottomrule\\end{tabular}");
  out.push(`\\begin{minipage}{0.9\\linewidth}\\footnotesize ${texEsc(d.method.en)} ${texEsc(d.notes.en)}\\end{minipage}`);
  out.push("\\end{table}");
  out.push("");
  out.push("\\paragraph{Interpretation}");
  for (const p of d.paragraphs.en) out.push(texEsc(p));
  out.push("");
  out.push("\\paragraph{Diễn giải}");
  for (const p of d.paragraphs.vi) out.push(texEsc(p));
  out.push("");
  out.push("\\paragraph{References}");
  out.push("\\begin{itemize}");
  for (const r of d.refs) out.push(`  \\item ${texEsc(r)}`);
  out.push("\\end{itemize}");
  return out.join("\n") + "\n";
}

/* ---------------------------------------------------------------- Word */

function xmlEsc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function para(text: string, o: { style?: string; bold?: boolean; italic?: boolean; size?: number; align?: string } = {}): string {
  const pPr = `<w:pPr>${o.style ? `<w:pStyle w:val="${o.style}"/>` : ""}${o.align ? `<w:jc w:val="${o.align}"/>` : ""}</w:pPr>`;
  const rPr = `<w:rPr>${o.bold ? "<w:b/>" : ""}${o.italic ? "<w:i/>" : ""}${o.size ? `<w:sz w:val="${o.size}"/>` : ""}</w:rPr>`;
  return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${xmlEsc(text)}</w:t></w:r></w:p>`;
}

function cell(text: string, o: { bold?: boolean; align?: string; top?: boolean; bottom?: boolean; width?: number } = {}): string {
  const borders = `<w:tcBorders>${o.top ? '<w:top w:val="single" w:sz="8" w:space="0" w:color="000000"/>' : ""}${o.bottom ? '<w:bottom w:val="single" w:sz="8" w:space="0" w:color="000000"/>' : ""}</w:tcBorders>`;
  const tcPr = `<w:tcPr>${o.width ? `<w:tcW w:w="${o.width}" w:type="dxa"/>` : ""}${borders}</w:tcPr>`;
  const lines = text.split("\n");
  const ps = lines
    .map((t) => `<w:p><w:pPr><w:spacing w:after="0"/>${o.align ? `<w:jc w:val="${o.align}"/>` : ""}</w:pPr><w:r><w:rPr>${o.bold ? "<w:b/>" : ""}<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${xmlEsc(t)}</w:t></w:r></w:p>`)
    .join("");
  return `<w:tc>${tcPr}${ps}</w:tc>`;
}

function documentXml(d: Draft): string {
  const cols = d.heads.length;
  const body: string[] = [];
  body.push(para(d.title.en, { bold: true, size: 24 }));
  body.push(para(d.title.vi, { italic: true, size: 22 }));
  const rows: string[] = [];
  rows.push(`<w:tr>${cell("", { top: true, bottom: true })}${d.heads.map((h) => cell(h, { bold: true, align: "center", top: true, bottom: true })).join("")}</w:tr>`);
  d.rows.forEach((r, i) => {
    const last = i === d.rows.length - 1;
    rows.push(
      `<w:tr>${cell(`${r.label.en}\n${r.label.vi === r.label.en ? "" : r.label.vi}`.trimEnd(), { bottom: last })}${r.cells
        .map((c) => cell(c ? `${f(c.b)}${c.stars}\n(${f(c.se)})` : "—", { align: "center", bottom: last }))
        .join("")}</w:tr>`,
    );
  });
  d.stats.forEach((s, i) => {
    const last = i === d.stats.length - 1;
    rows.push(`<w:tr>${cell(s.label.en === s.label.vi ? s.label.en : `${s.label.en} / ${s.label.vi}`, { bottom: last })}${s.values.map((v) => cell(v, { align: "center", bottom: last })).join("")}</w:tr>`);
  });
  body.push(
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/></w:tblPr><w:tblGrid>${"<w:gridCol/>".repeat(cols + 1)}</w:tblGrid>${rows.join("")}</w:tbl>`,
  );
  body.push(para(`${d.method.en} ${d.notes.en}`, { size: 18 }));
  body.push(para(`${d.method.vi} ${d.notes.vi}`, { size: 18, italic: true }));
  body.push(para("Interpretation", { bold: true, size: 22 }));
  for (const p of d.paragraphs.en) body.push(para(p));
  body.push(para("Diễn giải", { bold: true, size: 22 }));
  for (const p of d.paragraphs.vi) body.push(para(p));
  body.push(para("References / Tài liệu tham khảo (APA 7)", { bold: true, size: 22 }));
  for (const r of d.refs) body.push(`<w:p><w:pPr><w:ind w:left="720" w:hanging="720"/></w:pPr><w:r><w:t xml:space="preserve">${xmlEsc(r)}</w:t></w:r></w:p>`);
  body.push(para("Generated by Gravity Lab (https://thuyhuongctu.github.io/Gravity-Lab/). Check every number against your own output before submission.", { size: 16, italic: true }));
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`;

const DOC_RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:lang w:val="en-GB"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`;

/** The draft as a .docx (a store-only ZIP of WordprocessingML parts). */
export function draftToDocx(d: Draft): Uint8Array {
  const enc = new TextEncoder();
  return zipStore([
    { name: "[Content_Types].xml", data: enc.encode(CONTENT_TYPES) },
    { name: "_rels/.rels", data: enc.encode(RELS) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(DOC_RELS) },
    { name: "word/styles.xml", data: enc.encode(STYLES) },
    { name: "word/document.xml", data: enc.encode(documentXml(d)) },
  ]);
}

/* ----------------------------------------------------------------- ZIP */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A ZIP archive with no compression, enough for Office and any unzip tool. */
export function zipStore(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const u16 = (v: number) => [v & 0xff, (v >>> 8) & 0xff];
  const u32 = (v: number) => [v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff];
  // DOS date and time for 2026-01-01 00:00:00; the files carry no meaningful timestamp.
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const file of files) {
    const name = enc.encode(file.name);
    const crc = crc32(file.data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc),
      ...u32(file.data.length), ...u32(file.data.length), ...u16(name.length), ...u16(0),
    ]);
    parts.push(local, name, file.data);
    central.push(
      new Uint8Array([
        ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...u16(dosTime), ...u16(dosDate), ...u32(crc),
        ...u32(file.data.length), ...u32(file.data.length), ...u16(name.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset),
      ]),
      name,
    );
    offset += local.length + name.length + file.data.length;
  }
  const cdSize = central.reduce((s, p) => s + p.length, 0);
  const eocd = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(files.length), ...u16(files.length), ...u32(cdSize), ...u32(offset), ...u16(0)]);
  const total = offset + cdSize + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of [...parts, ...central, eocd]) {
    out.set(part, p);
    p += part.length;
  }
  return out;
}
