/**
 * Lumina's "explain my results": a plain-language reading of a panel estimate run in the
 * Data panel, built only from the numbers on screen and the six model checks. No model,
 * no network. Every sentence is a fixed template filled with the user's own estimates.
 */
import { diagnose, type DiagnosticInput } from "./diagnostics.ts";
import { pValue, type Fit, type PanelEstimate } from "./gravity-lab.ts";
import { interpret, kindOf, type Lang } from "./pro.ts";

export type Explanation = {
  /** Short headline. */
  title: { vi: string; en: string };
  /** Paragraphs in reading order. */
  paragraphs: { vi: string[]; en: string[] };
};

const DIST = /dist|khoang_?cach|^ln_?d$/i;

function fl(n: number, lang: Lang, d = 2): string {
  const s = n.toFixed(d);
  return lang === "vi" ? s.replace(".", ",") : s;
}

function coef(fit: Fit, name: string) {
  return fit.coef.find((c) => c.name === name);
}

function slopes(fit: Fit): string[] {
  return fit.coef.map((c) => c.name).filter((n) => n !== "_cons" && !n.includes("="));
}

/** Build the explanation for the current estimate and specification. */
export function explainEstimate(est: PanelEstimate, input: DiagnosticInput): Explanation {
  const fits = est.fits;
  const main = fits[fits.length - 1]!;
  const ppml = fits.length > 1;
  const names = slopes(main.fit);
  const dist = names.find((n) => DIST.test(n));
  const report = diagnose(input);
  const zeros = input.rows.filter((r) => r[input.y] === 0).length;

  const para = (lang: Lang): string[] => {
    const out: string[] = [];

    // 1. Which column to read, and why.
    if (ppml) {
      out.push(
        lang === "vi"
          ? `Bảng có hai cột. Cột OLS lấy log của ${input.y} nên chỉ dùng được ${fits[0]!.fit.n} quan sát dương; cột PPML ước lượng trên mức và giữ cả ${main.fit.n} quan sát${zeros ? `, trong đó ${zeros} dòng có ${input.y} = 0` : ""}. Khi viết luận văn, đọc cột PPML làm kết quả chính và dùng cột OLS để đối chiếu (Santos Silva và Tenreyro, 2006).`
          : `The table has two columns. The OLS column takes logs of ${input.y}, so it can only use the ${fits[0]!.fit.n} positive observations; the PPML column estimates on levels and keeps all ${main.fit.n}${zeros ? `, including the ${zeros} rows where ${input.y} = 0` : ""}. For a thesis, read the PPML column as the main result and use OLS as a comparison (Santos Silva and Tenreyro, 2006).`,
      );
    } else {
      out.push(
        lang === "vi"
          ? `Bảng có một cột OLS trên ${input.y} với ${main.fit.n} quan sát. Biến phụ thuộc đang ở dạng log hoặc dạng mức tùy bạn chọn; các câu dưới đây đọc hệ số như độ co giãn khi biến là log.`
          : `The table has one OLS column on ${input.y} with ${main.fit.n} observations. The sentences below read each coefficient as an elasticity where the variable is in logs.`,
      );
    }

    // 2. The distance coefficient, and the OLS/PPML gap.
    if (dist) {
      const c = coef(main.fit, dist);
      if (c) {
        const p = pValue(c.b, c.se);
        const o = ppml ? coef(fits[0]!.fit, dist) : undefined;
        const double = (Math.pow(2, c.b) - 1) * 100;
        let s =
          lang === "vi"
            ? `Hệ số khoảng cách (${dist}) là ${fl(c.b, lang)} với sai số chuẩn ${fl(c.se, lang)}${p < 0.05 ? ", có ý nghĩa thống kê" : ", chưa có ý nghĩa thống kê ở mức 5%"}. Đối tác xa gấp đôi, các yếu tố khác giữ nguyên, có ${input.y} ${double < 0 ? "thấp hơn" : "cao hơn"} khoảng ${fl(Math.abs(double), lang, 0)}%.`
            : `The distance coefficient (${dist}) is ${fl(c.b, lang)} with a standard error of ${fl(c.se, lang)}${p < 0.05 ? ", statistically significant" : ", not significant at the 5% level"}. A partner twice as far away, other things equal, has ${input.y} about ${fl(Math.abs(double), lang, 0)}% ${double < 0 ? "lower" : "higher"}.`;
        if (o) {
          const gap = c.b - o.b;
          const which = Math.abs(gap) < 0.05 ? "same" : gap > 0 ? "olsSteeper" : "olsFlatter";
          s +=
            " " +
            (lang === "vi"
              ? which === "same"
                ? `OLS cho ${fl(o.b, lang)}, gần như trùng với PPML: số 0 và phương sai không đổi kết quả nhiều ở mẫu này.`
                : which === "olsSteeper"
                  ? `OLS cho ${fl(o.b, lang)}, dốc hơn PPML: dấu hiệu phương sai của sai số tăng theo khoảng cách, nên OLS trên log phóng đại tác động (bước 6 của cầu công thức).`
                  : `OLS cho ${fl(o.b, lang)}, phẳng hơn PPML: dấu hiệu các cặp xa có nhiều số 0 bị OLS bỏ, nên OLS đánh giá thấp tác động của khoảng cách.`
              : which === "same"
                ? `OLS gives ${fl(o.b, lang)}, almost the same as PPML: zeros and heteroskedasticity change little in this sample.`
                : which === "olsSteeper"
                  ? `OLS gives ${fl(o.b, lang)}, steeper than PPML: a sign that the error spread grows with distance, so OLS on logs overstates the effect (bridge step 6).`
                  : `OLS gives ${fl(o.b, lang)}, flatter than PPML: a sign that distant pairs with zero flows were dropped by OLS, so it understates distance.`);
        }
        out.push(s);
      }
    }

    // 3. The other coefficients, significant ones first.
    const others = names.filter((n) => n !== dist);
    const sig = others.filter((n) => {
      const c = coef(main.fit, n);
      return c && pValue(c.b, c.se) < 0.1;
    });
    const insig = others.filter((n) => !sig.includes(n));
    for (const n of sig) {
      const c = coef(main.fit, n)!;
      out.push(interpret(n, kindOf(n), c.b, c.se, lang));
    }
    if (insig.length) {
      out.push(
        lang === "vi"
          ? `${insig.length === 1 ? "Biến" : "Các biến"} ${insig.join(", ")} chưa có ý nghĩa thống kê ở mức 10%: không kết luận về dấu, và nên ghi rõ điều này trong luận văn thay vì bỏ qua.`
          : `${insig.join(", ")} ${insig.length === 1 ? "is" : "are"} not significant at the 10% level: draw no conclusion about the sign, and say so in the thesis rather than leaving it out.`,
      );
    }

    // 4. Fit and sample.
    out.push(
      lang === "vi"
        ? `${ppml ? "Pseudo-R²" : "R²"} của cột chính là ${fl(main.fit.r2, lang, 3)} với ${main.fit.n} quan sát${input.yearFE ? ", đã có hiệu ứng cố định năm" : ", chưa có hiệu ứng cố định năm"}${input.unit ? `, sai số chuẩn theo cụm ${input.unit}` : ""}. Sao ở bảng tính từ p hai phía.`
        : `The main column's ${ppml ? "pseudo-R²" : "R²"} is ${fl(main.fit.r2, lang, 3)} on ${main.fit.n} observations${input.yearFE ? ", with year fixed effects" : ", without year fixed effects"}${input.unit ? `, standard errors clustered by ${input.unit}` : ""}. Stars in the table come from two-sided p-values.`,
    );

    // 5. The model checks.
    const bad = report.checks.filter((c) => c.status !== "ok");
    if (!bad.length) {
      out.push(
        lang === "vi"
          ? "Sáu kiểm tra mô hình đều đạt. Có thể xuất bảng."
          : "All six model checks pass. The table can be exported.",
      );
    } else {
      const fails = bad.filter((c) => c.status === "fail").map((c) => c.title);
      const warns = bad.filter((c) => c.status === "warn").map((c) => c.title);
      out.push(
        lang === "vi"
          ? `Kiểm tra mô hình: ${fails.length ? `cần sửa ${fails.join(", ")}` : ""}${fails.length && warns.length ? "; " : ""}${warns.length ? `nên xem ${warns.join(", ")}` : ""}. Xem phần Kiểm tra mô hình phía trên để biết cách sửa trong Stata.`
          : `Model checks: ${fails.length ? `fix ${fails.join(", ")}` : ""}${fails.length && warns.length ? "; " : ""}${warns.length ? `review ${warns.join(", ")}` : ""}. The Model check section above gives the Stata fix.`,
      );
    }

    // 6. What to write.
    out.push(
      lang === "vi"
        ? "Gợi ý khi viết: nêu phương pháp (PPML, hiệu ứng cố định, cụm), đọc hệ số khoảng cách trước, rồi các biến có ý nghĩa, rồi các biến không có ý nghĩa; mọi hệ số là liên hệ trung bình trong mẫu, không phải nhân quả cho một nước cụ thể."
        : "When writing: state the method (PPML, fixed effects, clustering), read the distance coefficient first, then the significant variables, then the insignificant ones; every coefficient is an average relationship in the sample, not a causal claim about one country.",
    );
    return out;
  };

  return {
    title: {
      vi: `Lumina đọc kết quả: ${main.label}`,
      en: `Lumina reads the results: ${main.label}`,
    },
    paragraphs: { vi: para("vi"), en: para("en") },
  };
}
