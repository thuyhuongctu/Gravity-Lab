import { tr } from "@/lib/prefs";
import { diagnose, type DiagnosticInput, type Status } from "@/sim/diagnostics";

const ICON: Record<Status, string> = { ok: "✓", warn: "!", fail: "✕" };
const BADGE: Record<Status, string> = {
  ok: "bg-teal-2 text-void",
  warn: "bg-amber-2 text-void",
  fail: "bg-clay text-void",
};
const BORDER: Record<Status, string> = {
  ok: "border-paper/15",
  warn: "border-amber-2/50",
  fail: "border-clay/60",
};

/** Six checks on the loaded panel and the chosen specification, shown before the export card. */
export function ProDiagnostics({ input, spec }: { input: DiagnosticInput; spec: string }) {
  const r = diagnose(input);
  return (
    <section className="flex flex-col gap-3" aria-labelledby="pro-diag">
      <div>
        <p className="kicker text-amber-2">
          {tr("Kiểm tra mô hình · trước khi xuất bảng", "Model check · before export")}
        </p>
        <h3 id="pro-diag" className="mt-1 font-serif text-xl leading-snug text-paper">
          {tr("Sáu lỗi hay gặp trong mô hình trọng lực", "Six common gravity-model mistakes")}
        </h3>
        <p className="mt-1 text-sm text-mist">
          {tr(
            "App đọc cấu trúc file CSV của bạn và đặc tả bạn chọn, rồi đối chiếu với Bacchetta và cộng sự (2012) và Yotov và cộng sự (2016). File được xử lý trên thiết bị.",
            "The app reads your CSV's structure and the specification you chose, then checks them against Bacchetta et al. (2012) and Yotov et al. (2016). The file stays on this device.",
          )}
        </p>
        <p className="mt-1 font-mono text-xs text-paper/80">{spec}</p>
      </div>

      <div
        className={
          "flex flex-wrap items-center gap-4 rounded-2xl border px-4 py-3 " +
          (r.fail ? "border-clay/60" : "border-paper/15")
        }
      >
        <div className="flex gap-4">
          {(
            [
              ["ok", r.ok, tr("đạt", "pass")],
              ["warn", r.warn, tr("nên xem", "review")],
              ["fail", r.fail, tr("cần sửa", "fix")],
            ] as const
          ).map(([s, n, label]) => (
            <span key={s} className="flex items-baseline gap-1.5">
              <b
                className={
                  "font-serif text-2xl tabular-nums " +
                  (s === "ok" ? "text-teal-2" : s === "warn" ? "text-amber-2" : "text-clay")
                }
              >
                {n}
              </b>
              <span className="whitespace-nowrap text-[13px] text-mist">{label}</span>
            </span>
          ))}
        </div>
        <span className="min-w-48 flex-1 text-sm leading-snug text-paper">{r.summary}</span>
      </div>

      <ol className="flex flex-col gap-2.5">
        {r.checks.map((c) => (
          <li key={c.id} className={"flex gap-3 rounded-2xl border p-3.5 " + BORDER[c.status]}>
            <span
              className={
                "grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold " +
                BADGE[c.status]
              }
              aria-label={
                c.status === "ok"
                  ? tr("Đạt", "Pass")
                  : c.status === "warn"
                    ? tr("Nên xem", "Review")
                    : tr("Cần sửa", "Fix")
              }
            >
              {ICON[c.status]}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                <b className="text-[15px] text-paper">{c.title}</b>
                <span className="text-xs font-semibold uppercase tracking-[0.06em] text-mist">
                  {c.tag}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-paper/90">{c.message}</p>
              {c.status !== "ok" ? (
                <div className="mt-1 rounded-xl border border-paper/10 bg-void/40 px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-2">
                    {tr("Cách sửa", "How to fix")}
                  </p>
                  <code className="block font-mono text-[13px] leading-relaxed text-paper">
                    {c.fix}
                  </code>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs leading-relaxed text-mist">
        {tr(
          "Kiểm tra dựa trên tên cột và đặc tả, không thay cho việc đọc kỹ dữ liệu. Nguồn: Bacchetta và cộng sự (2012), A Practical Guide to Trade Policy Analysis; Yotov và cộng sự (2016), An Advanced Guide to Trade Policy Analysis.",
          "The checks read column names and the specification; they do not replace reading the data. Sources: Bacchetta et al. (2012), A Practical Guide to Trade Policy Analysis; Yotov et al. (2016), An Advanced Guide to Trade Policy Analysis.",
        )}
      </p>
    </section>
  );
}
