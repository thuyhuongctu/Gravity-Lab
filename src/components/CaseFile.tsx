import { useMemo, useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { CITE_2008, CITE_2019 } from "@/sim/gravity-lab";
import { CASES, caseById, compare, computeCase, sizeHelps, type Bi, type Choice } from "@/sim/cases";

/**
 * Case files view (mockups 2e, 2g). Data and arithmetic live in src/sim/cases.ts (unit-tested).
 * Renders inside FdiStage (the dark .stage), so it uses stage tokens like CoefStage.
 */

const x = (v: number) => `${fmt(v, 2)}×`;

export function CaseFile({ initialCase, initialStep = 1, onChange }: { initialCase?: string; initialStep?: number; onChange?: (caseId: string, step: number) => void }) {
  const [caseId, setCaseId] = useState(caseById(initialCase).id);
  const c = caseById(caseId);
  const n = useMemo(() => computeCase(c), [c]);
  const cmp = compare(n);
  const helps = sizeHelps(n);
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 1), 5));
  const [wrong, setWrong] = useState<number | null>(null);
  const t = (b: Bi) => tr(b[0], b[1]);
  const km = (v: number) => `${fmtInt(v)} km`;
  const usd = (v: number) => tr(`${fmtInt(v)} triệu USD`, `USD ${fmtInt(v)} million`);

  const steps: { title: Bi; prompt: Bi; answer: string; choices?: Choice[] }[] = [
    {
      title: ["Đo khoảng cách", "Measure the distance"],
      prompt: [`Từ Hà Nội đến ${c.cityA[0]} và ${c.cityB[0]} (thủ đô, đường tròn lớn).`, `From Hà Nội to ${c.cityA[1]} and ${c.cityB[1]} (capitals, great circle).`],
      answer: `${t(c.nameA)} ${km(n.kmA)} · ${t(c.nameB)} ${km(n.kmB)}`,
    },
    {
      title: ["Dự đoán chỉ bằng khoảng cách", "Predict from distance alone"],
      prompt: [
        `Với β khoảng cách = ${fmt(n.geo, 2)} (Mô hình 8), vốn từ ${c.nameA[0]} bằng bao nhiêu lần ${c.nameB[0]}?`,
        `With distance β = ${fmt(n.geo, 2)} (Model 8), how many times ${c.nameB[1]}'s FDI should ${c.nameA[1]} send?`,
      ],
      answer: `(${fmtInt(n.kmA)} / ${fmtInt(n.kmB)})^${fmt(n.geo, 2)} ≈ ${x(n.distOnly)}`,
    },
    {
      title: ["So với số liệu", "Compare with the data"],
      prompt: [
        `Tổng FDI ${n.y0}–${n.y1} (Xuan & Xing, 2008): ${c.nameA[0]} ${usd(n.fdiA)}, ${c.nameB[0]} ${usd(n.fdiB)}. Thực tế so với dự đoán?`,
        `Total FDI ${n.y0}–${n.y1} (Xuan & Xing, 2008): ${c.nameA[1]} ${usd(n.fdiA)}, ${c.nameB[1]} ${usd(n.fdiB)}. Observed vs predicted?`,
      ],
      answer: cmp === "above"
        ? tr(`Thực tế ${x(n.observed)}, cao hơn dự đoán`, `Observed ${x(n.observed)}, above the prediction`)
        : cmp === "below"
          ? tr(`Thực tế ${x(n.observed)}, thấp hơn dự đoán`, `Observed ${x(n.observed)}, below the prediction`)
          : tr(`Thực tế ${x(n.observed)}, xấp xỉ dự đoán`, `Observed ${x(n.observed)}, about the same`),
      choices: [
        { label: ["Cao hơn", "Above"], correct: cmp === "above" },
        { label: ["Thấp hơn", "Below"], correct: cmp === "below" },
        { label: ["Xấp xỉ", "About the same"], correct: cmp === "same" },
      ],
    },
    {
      title: ["Giải thích chênh lệch", "Explain the gap"],
      prompt: c.why.prompt,
      answer: helps
        ? tr(`Thêm GDP (${fmt(n.gA, 1)} / ${fmt(n.gB, 1)}) → ${x(n.withSize)}, gần ${x(n.observed)} hơn`, `Adding GDP (${fmt(n.gA, 1)} / ${fmt(n.gB, 1)}) → ${x(n.withSize)}, closer to ${x(n.observed)}`)
        : tr(`Thêm GDP chỉ còn ${x(n.withSize)} so với ${x(n.observed)}: phần dư lớn, mô hình bỏ sót vai trò trung chuyển`, `With GDP it drops to ${x(n.withSize)} against ${x(n.observed)}: a large residual the model omits`),
      choices: c.why.choices,
    },
  ];

  const pick = (id: string) => {
    setCaseId(id);
    setStep(1);
    setWrong(null);
    onChange?.(id, 1);
  };
  const advance = () => {
    setWrong(null);
    setStep(step + 1);
    onChange?.(caseId, step + 1);
  };

  const bars = [
    { label: tr("Chỉ khoảng cách (bước 2)", "Distance only (step 2)"), v: n.distOnly, show: step > 2, cls: "border-2 border-dashed border-teal-2" },
    { label: tr("Thực tế (bước 3)", "Observed (step 3)"), v: n.observed, show: step > 3, cls: "bg-clay/80" },
    { label: tr("Thêm quy mô (bước 4)", "With size (step 4)"), v: n.withSize, show: step > 4, cls: "bg-teal-2/70" },
  ];
  const max = Math.max(...bars.map((b) => b.v));

  return (
    <section className="flex flex-col gap-4" aria-labelledby="case-q">
      <div role="tablist" aria-label={tr("Chọn hồ sơ", "Choose a case")} className="flex flex-wrap gap-2">
        {CASES.map((k) => (
          <button
            key={k.id}
            type="button"
            role="tab"
            aria-selected={k.id === caseId}
            onClick={() => pick(k.id)}
            className={`min-h-11 rounded-full px-4 text-[13px] font-semibold ${k.id === caseId ? "cosmic-btn" : "noir-raise text-paper"}`}
          >
            {t(k.nameA)} / {t(k.nameB)}
          </button>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-2.5">
          <p className="kicker text-amber-2">{t(c.level)}</p>
          <h2 id="case-q" className="font-serif text-[28px] leading-tight text-paper">{t(c.question)}</h2>
          <ol className="mt-2 flex flex-col gap-1">
            {steps.map((s, i) => {
              const cur = i + 1 === step;
              const done = i + 1 < step;
              const locked = i + 1 > step;
              return (
                <li key={i} aria-current={cur ? "step" : undefined} className={`flex gap-3.5 rounded-[22px] p-4 ${cur ? "noir-card" : ""}`}>
                  <span className={`grid size-[34px] shrink-0 place-items-center rounded-full text-[13px] font-bold ${done ? "bg-teal-2 text-void" : cur ? "cosmic-btn" : "noir-track"}`}>{done ? "✓" : i + 1}</span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className={`text-[15px] font-semibold ${locked ? "text-mist" : "text-paper"}`}>{t(s.title)}</span>
                    {!locked && <span className="text-[13px] text-mist">{t(s.prompt)}</span>}
                    {done && <span className="self-start rounded-full bg-teal-2/15 px-3 py-1.5 text-[13px] font-semibold text-teal-2">{s.answer}</span>}
                    {cur && s.choices && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {s.choices.map((ch, j) => (
                          <button key={j} type="button" onClick={() => (ch.correct ? advance() : setWrong(j))} className={`min-h-11 rounded-full px-4 text-[13px] font-semibold ${wrong === j ? "border border-clay/50 text-clay" : "noir-raise text-paper"}`}>
                            {t(ch.label)}
                          </button>
                        ))}
                      </div>
                    )}
                    {cur && !s.choices && (
                      <button type="button" onClick={advance} className="cosmic-btn mt-1 min-h-11 self-start rounded-full px-4 text-[13px] font-semibold">
                        {tr("Xem kết quả", "Reveal")}
                      </button>
                    )}
                    {cur && wrong !== null && <span className="text-[12px] text-clay" aria-live="polite">{tr("Chưa đúng, thử lại.", "Not quite — try again.")}</span>}
                  </div>
                </li>
              );
            })}
          </ol>
          {step > steps.length && (
            <button type="button" onClick={() => pick(CASES[(CASES.indexOf(c) + 1) % CASES.length]!.id)} className="cosmic-btn min-h-11 self-start rounded-full px-5 text-[13px] font-semibold">
              {tr("Hồ sơ tiếp theo →", "Next case →")}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="noir-card flex flex-1 flex-col gap-3 rounded-[26px] p-[22px]">
            <p className="kicker text-teal-2">{tr("Bảng bằng chứng", "Evidence board")} · {t(c.nameA)} / {t(c.nameB)}</p>
            <div className="flex min-h-56 flex-1 items-end gap-5 border-b border-paper/15 px-3 pt-2.5">
              {bars.map((b) => (
                <div key={b.label} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-[13px] font-semibold text-paper">{b.show ? x(b.v) : "?"}</span>
                  <div className={`w-full rounded-t-[14px] transition-[height] duration-700 ${b.show ? b.cls : "noir-track"}`} style={{ height: b.show ? `${Math.max(6, (b.v / max) * 200)}px` : 96 }} />
                </div>
              ))}
            </div>
            <div className="flex gap-5 px-3 text-center text-[12px] text-mist">
              {bars.map((b) => (
                <span key={b.label} className="flex-1">{b.label}</span>
              ))}
            </div>
          </div>
          <div className="noir-track flex items-center gap-3 rounded-[22px] px-[18px] py-4">
            <img src={`${import.meta.env.BASE_URL}cast/v2/huong-face.webp`} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-[#f1e8de] object-cover" />
            <p className="flex-1 text-[13px] leading-relaxed text-paper">
              {tr("Gợi ý từ Lumina: ", "Hint from Lumina: ")}
              {t(c.hint)}
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-mist">
            {tr("Nguồn: ", "Sources: ")}
            {CITE_2008} {CITE_2019} {tr("GDP: trade.ts, khoảng năm 2024, dùng minh họa.", "GDP: trade.ts, c. 2024, illustrative.")}
          </p>
        </div>
      </div>
    </section>
  );
}
