import { useState } from "react";
import type { LabPanel } from "@/components/FdiLab";
import { fmt, tr } from "@/lib/prefs";
import { shareUrl } from "@/lib/shareState";
import { exercises, mark, type Exercise } from "@/sim/exercises";

type Result = "ok" | "no" | "empty";

/** Where an exercise's "open the simulation" link goes. */
export type ExerciseTarget = Exercise["open"];

/**
 * Six self-marked questions, one per room or bridge step. Answers never leave the device.
 * `compact` drops the outer card so it can sit inside the formula bridge.
 */
export function Exercises({
  onOpen,
  compact = false,
}: {
  onOpen?: (target: ExerciseTarget) => void;
  compact?: boolean;
}) {
  const qs = exercises();
  const [vals, setVals] = useState<Record<string, string>>({});
  const [res, setRes] = useState<Record<string, Result | undefined>>({});
  const [teacher, setTeacher] = useState(false);
  const [copied, setCopied] = useState(false);

  const score = qs.filter((q) => res[q.id] === "ok").length;
  const copyLink = () => {
    const url = shareUrl({ room: "me" }) + "&ex=1";
    void navigator.clipboard?.writeText(url).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className={
          "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 " +
          (compact ? "" : "bg-paper-2/40")
        }
      >
        <div className="flex items-baseline gap-2">
          <b className="font-serif text-2xl tabular-nums text-teal">
            {score} / {qs.length}
          </b>
          <span className="text-sm text-muted">{tr("câu đúng", "correct")}</span>
        </div>
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full border border-line bg-paper-2/60">
          <div
            className="h-full rounded-full bg-teal transition-[width]"
            style={{ width: `${(score / qs.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="min-h-11 whitespace-nowrap rounded-full border border-line px-4 text-[13px] font-semibold"
          >
            {copied
              ? tr("✓ Đã chép link", "✓ Link copied")
              : tr("Chép link cho lớp", "Copy link for the class")}
          </button>
          <button
            type="button"
            onClick={() => setTeacher((v) => !v)}
            aria-pressed={teacher}
            className={
              "min-h-11 whitespace-nowrap rounded-full px-4 text-[13px] font-semibold " +
              (teacher ? "bg-amber text-paper" : "border border-line")
            }
          >
            {tr("Giảng viên", "Teacher")}
          </button>
        </div>
      </div>

      {qs.map((q, i) => {
        const r = res[q.id];
        return (
          <div
            key={q.id}
            className={
              "flex flex-col gap-3 rounded-2xl border p-4 " +
              (r === "ok" ? "border-teal/60 " : r === "no" ? "border-clay/60 " : "border-line ") +
              (compact ? "" : "bg-paper-2/40")
            }
          >
            <div className="flex flex-wrap justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
                {tr("Câu", "Question")} {i + 1} · {q.room}
              </span>
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(q.open)}
                  className="text-[13px] font-semibold text-teal underline-offset-2 hover:underline"
                >
                  {tr("Mở mô phỏng →", "Open the simulation →")}
                </button>
              ) : null}
            </div>
            <p className="text-[15px] leading-relaxed">{q.text}</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-line bg-paper-2/60 px-3.5">
                <span className="sr-only">
                  {tr(`Đáp án câu ${i + 1}`, `Answer to question ${i + 1}`)}
                </span>
                <input
                  inputMode="decimal"
                  value={vals[q.id] ?? ""}
                  placeholder={
                    q.unit === "%" ? tr("ví dụ 12,5", "e.g. 12.5") : tr("ví dụ −0,5", "e.g. −0.5")
                  }
                  onChange={(e) => {
                    setVals((s) => ({ ...s, [q.id]: e.target.value }));
                    setRes((s) => ({ ...s, [q.id]: undefined }));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter")
                      setRes((s) => ({ ...s, [q.id]: mark(q, vals[q.id] ?? "") }));
                  }}
                  className="w-28 bg-transparent text-base font-semibold outline-none"
                />
                <span className="text-sm text-muted">{q.unit}</span>
              </label>
              <button
                type="button"
                onClick={() => setRes((s) => ({ ...s, [q.id]: mark(q, vals[q.id] ?? "") }))}
                className="cosmic-btn min-h-11 rounded-full px-4.5 text-sm font-semibold"
              >
                {tr("Kiểm tra", "Check")}
              </button>
              <span
                className={"text-sm font-semibold " + (r === "ok" ? "text-teal" : "text-clay")}
                aria-live="polite"
              >
                {r === "ok"
                  ? tr("✓ Đúng", "✓ Correct")
                  : r === "no"
                    ? tr("Chưa đúng", "Not yet")
                    : r === "empty"
                      ? tr("Nhập một số", "Enter a number")
                      : ""}
              </span>
            </div>
            {r === "no" ? <p className="text-sm leading-relaxed text-muted">{q.hint}</p> : null}
            {teacher ? (
              <p className="font-math text-sm italic text-amber">
                {tr("Đáp án", "Answer")}: {q.key}
                {q.unit === "%" ? ` (${fmt(q.answer, 1)}%)` : ""}
              </p>
            ) : null}
          </div>
        );
      })}
      <p className="text-[13px] text-muted">
        {tr(
          "Không cần tài khoản, kết quả không gửi đi đâu. Nhập số rồi bấm Kiểm tra; sai thì xem gợi ý.",
          "No account needed and nothing is sent anywhere. Type a number and press Check; a wrong answer shows a hint.",
        )}
      </p>
    </div>
  );
}

export type { LabPanel };
