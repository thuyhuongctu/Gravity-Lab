/**
 * Six checks on a loaded panel and the chosen specification, before the results table is
 * exported. Rules follow Bacchetta et al. (2012) and Yotov et al. (2016). They read column
 * names and the specification only; they do not replace reading the data.
 */
import { tr } from "../lib/prefs.ts";

export type Status = "ok" | "warn" | "fail";

export type DiagnosticInput = {
  columns: string[];
  rows: Array<Record<string, number | string>>;
  /** Dependent variable column. */
  y: string;
  /** Regressors chosen. */
  xs: string[];
  unit: string;
  year: string;
  /** PPML on levels (true) or OLS on logs (false). */
  yLevel: boolean;
  yearFE: boolean;
};

export type Diagnostic = {
  id: "mrt" | "directions" | "deflation" | "zeros" | "interval" | "domestic";
  status: Status;
  title: string;
  tag: string;
  message: string;
  /** Shown when the status is not ok. */
  fix: string;
};

export type DiagnosticReport = {
  checks: Diagnostic[];
  ok: number;
  warn: number;
  fail: number;
  summary: string;
};

export function diagnose(input: DiagnosticInput): DiagnosticReport {
  const checks = [
    mrt(input),
    directions(input),
    deflation(input),
    zeros(input),
    interval(input),
    domestic(input),
  ];
  const count = (s: Status) => checks.filter((c) => c.status === s).length;
  const fail = count("fail");
  return {
    checks,
    ok: count("ok"),
    warn: count("warn"),
    fail,
    summary: fail
      ? tr(
          `${fail} lỗi có thể làm hệ số chệch. Sửa trước khi đưa bảng vào luận văn.`,
          `${fail} issue${fail > 1 ? "s" : ""} could bias the coefficients. Fix before the table goes into a thesis.`,
        )
      : tr(
          "Đặc tả đạt các khuyến nghị chính. Có thể xuất bảng kết quả.",
          "The specification meets the main recommendations. The results table can be exported.",
        ),
  };
}

/* ------------------------------------------------------------------ checks */

const GDP = /gdp|ln_?y|size|quy_?mo/i;
const FDI = /fdi|vốn|von/i;
const PAIR = /^(exp|exporter|origin|source|imp|importer|dest|destination|partner|from|to)$/i;
const AVG = /avg|average|mean|trung_?binh|_tb$/i;
const REAL = /real|deflat|cpi|constant|gia_?co_?dinh|_r$/i;

function mrt(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "mrt" as const,
    title: tr("Sức cản đa phương", "Multilateral resistance"),
    tag: tr("Huy chương vàng", "Gold medal"),
    fix: "absorb(exp_year imp_year)   // egen exp_year = group(exporter year)",
  };
  const hasGdp = d.xs.some((x) => GDP.test(x));
  if (d.yearFE) {
    return {
      ...base,
      status: "ok",
      message: tr(
        "Có hiệu ứng cố định năm. Với dòng vốn một chiều vào Việt Nam, phần sức cản phía Việt Nam thay đổi theo năm được hấp thụ; phần theo đối tác nằm trong sai số cụm.",
        "Year fixed effects are in. For one-way inflows into Viet Nam, the Vietnamese side of resistance that varies by year is absorbed; the partner side sits in the clustered error.",
      ),
    };
  }
  if (hasGdp) {
    return {
      ...base,
      status: "fail",
      message: tr(
        "Dùng GDP mà không có hiệu ứng cố định. Sức cản đa phương bị bỏ sót và tương quan với khoảng cách, nên γ bị chệch.",
        "GDP is used without fixed effects. Multilateral resistance is omitted and correlated with distance, so γ is biased.",
      ),
    };
  }
  return {
    ...base,
    status: "warn",
    message: tr(
      "Chưa có hiệu ứng cố định năm. Với dữ liệu bảng nhiều nước, nên dùng nước xuất khẩu × năm và nhập khẩu × năm; với FDI vào Việt Nam, ít nhất là hiệu ứng năm.",
      "No year fixed effects yet. With a multi-country panel use exporter × year and importer × year; for FDI into Viet Nam, at least year effects.",
    ),
  };
}

function directions(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "directions" as const,
    title: tr("Giữ hai chiều thương mại riêng", "Keep both directions of trade"),
    tag: tr("Huy chương bạc", "Silver medal"),
    fix: tr(
      "Dùng dữ liệu theo chiều: exporter, importer, year, trade",
      "Use directed data: exporter, importer, year, trade",
    ),
  };
  if (AVG.test(d.y)) {
    return {
      ...base,
      status: "fail",
      message: tr(
        `Cột ${d.y} là trung bình hai chiều. Lấy log của trung bình khác trung bình của log, và mất thông tin chiều.`,
        `Column ${d.y} is a two-way average. The log of an average is not the average of logs, and the direction is lost.`,
      ),
    };
  }
  const pairCols = d.columns.filter((c) => PAIR.test(c));
  if (FDI.test(d.y) || pairCols.length >= 2 || d.unit) {
    return {
      ...base,
      status: "ok",
      message: FDI.test(d.y)
        ? tr(
            "FDI vào Việt Nam là một chiều: mỗi dòng là một đối tác × năm.",
            "FDI into Viet Nam is one-way: each row is a partner × year.",
          )
        : tr("Mỗi chiều i → j là một quan sát.", "Each direction i → j is one observation."),
    };
  }
  return {
    ...base,
    status: "warn",
    message: tr(
      "Không xác định được chiều từ tên cột. Kiểm tra lại cột exporter / importer.",
      "The direction cannot be read from the column names. Check the exporter / importer columns.",
    ),
  };
}

function deflation(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "deflation" as const,
    title: tr("Không giảm phát theo chỉ số giá Mỹ", "No deflation by the US price index"),
    tag: tr("Huy chương đồng", "Bronze medal"),
    fix: tr(
      "Dùng giá trị danh nghĩa (USD hiện hành) + absorb(... year)",
      "Use nominal values (current USD) + absorb(... year)",
    ),
  };
  const real = [d.y, ...d.xs].filter((c) => REAL.test(c));
  if (real.length) {
    return {
      ...base,
      status: "fail",
      message: tr(
        `Biến ${real.join(", ")} có vẻ đã chia cho chỉ số giá. Điều này đưa vào sai lệch giả; dùng giá trị danh nghĩa với hiệu ứng cố định theo năm.`,
        `${real.join(", ")} look deflated by a price index. That introduces spurious variation; use nominal values with year fixed effects.`,
      ),
    };
  }
  if (d.yearFE) {
    return {
      ...base,
      status: "ok",
      message: tr(
        "Giá trị danh nghĩa, xu hướng giá được hiệu ứng cố định theo năm hấp thụ.",
        "Nominal values; the price trend is absorbed by the year fixed effects.",
      ),
    };
  }
  return {
    ...base,
    status: "warn",
    message: tr(
      "Không rõ đơn vị giá. Ghi rõ danh nghĩa hay thực trong ghi chú bảng.",
      "The price basis is unclear. State nominal or real in the table note.",
    ),
  };
}

function zeros(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "zeros" as const,
    title: tr("Dòng chảy bằng 0", "Zero flows"),
    tag: "Santos Silva & Tenreyro (2006)",
    fix: "ppmlhdfe fdi ln_dist ..., absorb(year) cluster(partner)",
  };
  const n = d.rows.filter((r) => r[d.y] === 0).length;
  if (n === 0) {
    return {
      ...base,
      status: "ok",
      message: tr(
        "Không có quan sát bằng 0 trong mẫu này.",
        "No zero observations in this sample.",
      ),
    };
  }
  if (d.yLevel) {
    return {
      ...base,
      status: "ok",
      message: tr(
        `PPML trên mức giữ cả ${n} quan sát bằng 0.`,
        `PPML on levels keeps all ${n} zero observations.`,
      ),
    };
  }
  return {
    ...base,
    status: "fail",
    message: tr(
      `OLS trên ln ${d.y} đã bỏ ${n} quan sát bằng 0. Kết quả chệch nếu số 0 không ngẫu nhiên.`,
      `OLS on ln ${d.y} dropped ${n} zero observations. The result is biased if the zeros are not random.`,
    ),
  };
}

function interval(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "interval" as const,
    title: tr("Khoảng thời gian giữa các năm", "Interval between years"),
    tag: tr("Yotov và cộng sự (2016)", "Yotov et al. (2016)"),
    fix: "keep if mod(year, 4) == 2   // 1986, 1990, …",
  };
  const years = [
    ...new Set(d.rows.map((r) => Number(r[d.year])).filter((v) => Number.isFinite(v))),
  ].sort((a, b) => a - b);
  if (years.length < 2) {
    return {
      ...base,
      status: "warn",
      message: tr(
        "Chỉ có một năm, hoặc không đọc được cột năm.",
        "Only one year, or the year column could not be read.",
      ),
    };
  }
  const gaps = years.slice(1).map((y, i) => y - years[i]!);
  const minGap = Math.min(...gaps);
  if (minGap >= 3) {
    return {
      ...base,
      status: "ok",
      message: tr(`Dùng khoảng ${minGap} năm.`, `Intervals of ${minGap} years.`),
    };
  }
  return {
    ...base,
    status: "warn",
    message: tr(
      `Năm liên tiếp (${years[0]}–${years[years.length - 1]}). Biến chính sách (FTA) cần thời gian để tác động; cân nhắc khoảng 4 năm như Yotov và cộng sự.`,
      `Consecutive years (${years[0]}–${years[years.length - 1]}). Policy variables (FTA) take time to act; consider 4-year intervals as in Yotov et al.`,
    ),
  };
}

function domestic(d: DiagnosticInput): Diagnostic {
  const base = {
    id: "domestic" as const,
    title: tr("Thương mại nội địa", "Intra-national trade"),
    tag: tr("Câu đố khoảng cách", "Distance puzzle"),
    fix: tr(
      "Thêm các dòng exporter = importer (sản lượng − xuất khẩu)",
      "Add rows with exporter = importer (output − exports)",
    ),
  };
  if (FDI.test(d.y)) {
    return {
      ...base,
      status: "ok",
      message: tr(
        "Không áp dụng với FDI một chiều vào Việt Nam.",
        "Not applicable to one-way FDI into Viet Nam.",
      ),
    };
  }
  const pairCols = d.columns.filter((c) => PAIR.test(c));
  if (pairCols.length >= 2) {
    const [a, b] = pairCols;
    const hasDomestic = d.rows.some((r) => r[a!] === r[b!]);
    if (hasDomestic)
      return {
        ...base,
        status: "ok",
        message: tr("Có dòng i = j trong mẫu.", "Rows with i = j are in the sample."),
      };
  }
  return {
    ...base,
    status: "warn",
    message: tr(
      "Không có dòng i = j. Muốn ước lượng tác động FTA hoặc xu hướng khoảng cách, nên thêm thương mại nội địa.",
      "No rows with i = j. To estimate FTA effects or the distance trend, add intra-national trade.",
    ),
  };
}
