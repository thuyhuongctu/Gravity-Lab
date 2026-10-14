import { tr } from "@/lib/prefs";
import { MODELS } from "@/sim/gravity-lab";

/**
 * Pro block for MeStage (mockups 3a / 3b). Replaces the feature list + price cards.
 * Leads with the output (a results table), one primary action, honest pricing.
 * `onRoom` is MeStage's existing prop: onRoom("lab", "data") opens PPML on your data.
 */

const SHOW = ["lagfdi", "geo", "econ", "open", "exp", "fta"] as const;
const LABEL: Record<(typeof SHOW)[number], [string, string]> = {
  lagfdi: ["FDI năm trước (log)", "Lagged FDI (log)"],
  geo: ["Khoảng cách địa lý", "Geographic distance"],
  econ: ["Khoảng cách kinh tế", "Economic distance"],
  open: ["Độ mở thương mại", "Trade openness"],
  exp: ["Kinh nghiệm quốc tế", "International experience"],
  fta: ["FTA", "FTA"],
};
const stars = (b: number, se: number) => {
  const z = Math.abs(b / se);
  return z > 2.576 ? "***" : z > 1.96 ? "**" : z > 1.645 ? "*" : "";
};
const num = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

function SampleTable() {
  const m = MODELS[7]!; // Model 8, Phan & Do (2019) Table 6
  return (
    <figure className="rounded-xl bg-[#fffdf9] p-5 font-serif text-[#1b1f24] shadow-[0_30px_50px_-24px_rgb(0_0_0/0.6)]" aria-label={tr("Bảng kết quả mẫu", "Sample results table")}>
      <p className="text-xs font-bold">{tr("Bảng 6", "Table 6")}</p>
      <p className="text-xs italic">{tr("Các yếu tố tác động đến FDI vào Việt Nam (tác động ngẫu nhiên, N = 159)", "Determinants of FDI inflows into Viet Nam (random effects, N = 159)")}</p>
      <table className="mt-2 w-full border-y border-[#1b1f24] text-xs tabular-nums">
        <thead>
          <tr className="border-b border-[#1b1f24]">
            <th className="py-1 text-left font-bold">{tr("Biến", "Variable")}</th>
            <th className="py-1 text-right font-bold">β</th>
            <th className="py-1 text-right font-bold">SE</th>
          </tr>
        </thead>
        <tbody>
          {SHOW.map((k) => {
            const c = m.c[k];
            if (!c) return null;
            return (
              <tr key={k} className="border-b border-[#e3ddd0] last:border-0">
                <td className="py-1">{tr(LABEL[k][0], LABEL[k][1])}</td>
                <td className="py-1 text-right">{num(c[0])}{stars(c[0], c[1])}</td>
                <td className="py-1 text-right text-[#57534c]">({c[1].toFixed(2)})</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <figcaption className="mt-2 text-xs leading-relaxed text-[#57534c]">
        {tr(
          "Ghi chú. ** p < 0,05; *** p < 0,01. Khoảng cách địa lý tăng 10% đi kèm FDI giảm khoảng 3,6%. Phỏng theo Phan & Do (2019).",
          "Note. ** p < .05, *** p < .01. A 10% increase in geographic distance is associated with ≈ −3.6% FDI. Adapted from Phan & Do (2019).",
        )}
      </figcaption>
    </figure>
  );
}

export function ProSection({ onRoom }: { onRoom: (room: "lab", panel: "data") => void }) {
  const steps: Array<[string, string, string, string]> = [
    ["Nạp dữ liệu", "Load the data", "CSV/Excel của bạn, hoặc bảng fdi_vn_panel: đối tác × năm 1990–2004, có khoảng cách, giữ các dòng bằng 0.", "Your CSV/Excel, or fdi_vn_panel: partner × year 1990–2004, distances, zero flows kept."],
    ["Ước lượng PPML", "Estimate PPML", "Santos Silva & Tenreyro (2006), có OLS bên cạnh để bạn giải thích vì sao ước lượng khác nhau.", "Santos Silva & Tenreyro (2006), with OLS alongside so you can explain why the estimates differ."],
    ["Xuất bản nháp", "Export the draft", "Bảng hệ số có dấu sao, đoạn diễn giải từng β bằng tiếng Việt và tiếng Anh, tài liệu tham khảo APA 7.", "Coefficient table with stars, a paragraph reading each β in VI and EN, references in APA 7."],
  ];
  const rows: Array<[string, string, boolean]> = [
    ["9 cảnh câu chuyện, phòng Quỹ đạo, Thương mại và FDI", "Nine story scenes, Orbit, Trade and FDI rooms", false],
    ["Lumina trả lời kèm nguồn", "Lumina, answers with sources", false],
    ["Hệ số công bố 2019 và mô phỏng", "Published 2019 coefficients and simulator", false],
    ["Bộ dữ liệu FDI đã làm sạch + codebook + Stata .do", "Cleaned FDI panel + codebook + Stata .do", true],
    ["PPML trên dữ liệu của bạn", "PPML on your own data", true],
    ["Bản nháp kết quả Word và LaTeX", "Results draft in Word and LaTeX", true],
  ];
  const sample = `${import.meta.env.BASE_URL}samples/gravity-lab-sample-draft.docx`;

  return (
    <section className="flex flex-col gap-7" aria-labelledby="pro-h">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_440px]">
        <div className="flex flex-col gap-4">
          <span className="self-start rounded-full bg-teal/15 px-3 py-1.5 text-sm font-semibold text-teal">✓ {tr("Miễn phí trên web · giai đoạn 1", "Free on the web during phase 1")}</span>
          <p className="kicker text-amber">{tr("Gravity Lab Pro · cho luận văn và bài báo", "Gravity Lab Pro · for theses and papers")}</p>
          <h2 id="pro-h" className="font-serif text-3xl leading-tight text-balance sm:text-5xl">
            {tr("Từ dữ liệu thô đến chương kết quả luận văn trong một buổi chiều", "From raw data to your results chapter in one afternoon")}
          </h2>
          <p className="max-w-xl text-base leading-relaxed text-muted">
            {tr(
              "Nạp CSV của bạn hoặc bảng FDI Việt Nam đã làm sạch, ước lượng PPML ngay trên máy, rồi xuất bảng có diễn giải VI/EN và trích dẫn APA 7.",
              "Load your CSV or the cleaned Viet Nam FDI panel, estimate PPML on your own device, and export a formatted table with VI/EN interpretation and APA 7 references.",
            )}
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={() => onRoom("lab", "data")} className="cosmic-btn min-h-12 rounded-full px-6 text-[15px] font-bold">
              {tr("Dùng Pro miễn phí", "Start with Pro, free")}
            </button>
            <a href={sample} download className="noir-raise inline-flex min-h-12 items-center rounded-full px-5 text-[15px] font-semibold">
              {tr("Tải bản nháp mẫu (.docx)", "Download a sample draft (.docx)")}
            </a>
          </div>
          <p className="text-xs text-muted">{tr("Không cần tài khoản. Dữ liệu không rời khỏi thiết bị.", "No account. Your data never leaves this device.")}</p>
        </div>
        <SampleTable />
      </div>

      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map(([vi, en, dvi, den], i) => (
          <li key={en} className="noir-card flex flex-col gap-2 rounded-3xl p-5">
            <span className="pill-on grid size-9 place-items-center rounded-full font-bold">{i + 1}</span>
            <b className="text-base">{tr(vi, en)}</b>
            <span className="text-sm leading-relaxed text-muted">{tr(dvi, den)}</span>
          </li>
        ))}
      </ol>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="noir-card rounded-3xl p-5">
          <table className="w-full text-sm">
            <caption className="kicker pb-2 text-left text-amber">{tr("Pro thêm gì", "What changes with Pro")}</caption>
            <thead>
              <tr className="text-xs">
                <th className="sr-only">{tr("Tính năng", "Feature")}</th>
                <th className="w-16 pb-2 text-center font-semibold text-muted">{tr("Học", "Learn")}</th>
                <th className="w-16 pb-2 text-center font-semibold text-teal">Pro</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([vi, en, proOnly]) => (
                <tr key={en} className="border-t border-line">
                  <td className="py-2.5">{tr(vi, en)}</td>
                  <td className="text-center" aria-label={proOnly ? tr("Không", "No") : tr("Có", "Yes")}>{proOnly ? "—" : "✓"}</td>
                  <td className="text-center text-teal" aria-label={tr("Có", "Yes")}>✓</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="noir-card flex flex-col gap-3 rounded-3xl p-5">
          <p className="kicker text-amber">{tr("Khi có bản Android", "When the Android app launches")}</p>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="noir-track rounded-2xl p-3"><p className="text-xs text-muted">{tr("Theo tháng", "Monthly")}</p><p className="font-serif text-xl">49.000đ</p></div>
            <div className="noir-track rounded-2xl p-3 ring-2 ring-teal"><p className="text-xs text-muted">{tr("Theo năm · ≈ 33.000đ/tháng", "Annual · ≈ 33.000đ/mo")}</p><p className="font-serif text-xl">399.000đ</p></div>
          </div>
          <p className="text-sm leading-relaxed">
            {tr("Mọi thứ ở trên vẫn miễn phí trên web. Sinh viên dùng email .edu.vn được giảm giá trên Android.", "Everything above stays free on the web. Students with a .edu.vn email get a discount on Android.")}
          </p>
          <ul className="mt-auto flex flex-wrap gap-1.5 text-xs">
            {[["Chỉ trên thiết bị", "On-device only"], ["Phát triển tại Đại học Cần Thơ", "Built at Can Tho University"], ["Trích dẫn được · DOI Zenodo", "Citable · Zenodo DOI"]].map(([vi, en]) => (
              <li key={en} className="noir-track rounded-full px-2.5 py-1">{tr(vi, en)}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
