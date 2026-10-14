import { useState } from "react";
import { tr } from "@/lib/prefs";
import { Inset, Kicker } from "@/components/bridge/ui";

type Pair = { id: string; phys: string; econ: string; vi: string; en: string };

const PAIRS: Pair[] = [
  {
    id: "F",
    phys: "F",
    econ: "Tᵢⱼ",
    vi: "Lực hút thành kim ngạch thương mại giữa nước i và nước j.",
    en: "The attractive force becomes the trade flow between countries i and j.",
  },
  {
    id: "m1",
    phys: "m₁",
    econ: "Yᵢ",
    vi: "Khối lượng vật thứ nhất thành quy mô kinh tế (GDP) của nước xuất khẩu.",
    en: "The first mass becomes the economic size (GDP) of the exporter.",
  },
  {
    id: "m2",
    phys: "m₂",
    econ: "Yⱼ",
    vi: "Khối lượng vật thứ hai thành GDP của nước nhập khẩu.",
    en: "The second mass becomes the importer's GDP.",
  },
  {
    id: "r",
    phys: "r",
    econ: "Dᵢⱼ",
    vi: "Khoảng cách giữa hai vật thành khoảng cách giữa hai nền kinh tế (km, thủ đô tới thủ đô).",
    en: "The distance between bodies becomes the distance between economies (km, capital to capital).",
  },
  {
    id: "G",
    phys: "G",
    econ: "G",
    vi: "Hằng số hấp dẫn giữ nguyên tên, nhưng giờ là một hằng số cần ước lượng, không phải đo như Cavendish.",
    en: "The gravitational constant keeps its name, but is now a constant to estimate rather than measure like Cavendish.",
  },
];

/** Shuffled once per mount so the right-hand column is not in the same order as the left. */
const ORDER = ["r", "G", "m2", "F", "m1"];

/** Step 2 of the formula bridge: match each physical quantity with its economic twin. */
export function RenameLab() {
  const [picked, setPicked] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const done = PAIRS.every((p) => matched[p.id]);

  const choose = (econId: string) => {
    if (!picked) return;
    if (picked === econId) {
      setMatched((m) => ({ ...m, [econId]: true }));
      setPicked(null);
      setWrong(null);
    } else {
      setWrong(econId);
      window.setTimeout(() => setWrong(null), 700);
    }
  };

  const chip = (active: boolean, ok: boolean, bad: boolean) =>
    "flex min-h-11 items-center justify-center rounded-full border px-4 font-math text-lg " +
    (ok
      ? "border-teal bg-teal/15 text-teal"
      : bad
        ? "border-clay bg-clay/15 text-clay"
        : active
          ? "border-amber bg-amber/15"
          : "border-line");

  return (
    <div className="@container flex flex-col gap-4">
      <Inset>
        <Kicker>
          {tr(
            "Ghép cặp · bấm một đại lượng vật lý rồi bấm đại lượng kinh tế tương ứng",
            "Match · tap a physical quantity, then its economic twin",
          )}
        </Kicker>
        <div className="mt-3 grid grid-cols-2 items-start gap-3">
          <div className="flex flex-col gap-2">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Newton (1687)
            </p>
            {PAIRS.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={!!matched[p.id]}
                aria-pressed={picked === p.id}
                onClick={() => setPicked(picked === p.id ? null : p.id)}
                className={chip(picked === p.id, !!matched[p.id], false)}
              >
                {p.phys}
                {matched[p.id] ? <span className="ml-2 text-sm">✓</span> : null}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.08em] text-muted">
              Tinbergen (1962)
            </p>
            {ORDER.map((id) => {
              const p = PAIRS.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!!matched[id] || !picked}
                  onClick={() => choose(id)}
                  className={chip(false, !!matched[id], wrong === id)}
                >
                  {p.econ}
                </button>
              );
            })}
          </div>
        </div>
        <p className="mt-3 text-[13px] text-muted" aria-live="polite">
          {done
            ? tr(
                "Đủ năm cặp. Dạng phương trình giữ nguyên: chỉ đổi tên, chưa đổi số mũ.",
                "All five pairs. The form of the equation is unchanged: only the names change, not yet the exponents.",
              )
            : picked
              ? tr(
                  "Chọn đại lượng kinh tế tương ứng ở cột phải.",
                  "Pick the matching economic quantity on the right.",
                )
              : tr(
                  `${Object.keys(matched).length} / 5 cặp đã ghép.`,
                  `${Object.keys(matched).length} / 5 pairs matched.`,
                )}
        </p>
      </Inset>

      <div className="grid gap-3 @min-[620px]:grid-cols-2">
        {PAIRS.filter((p) => matched[p.id]).map((p) => (
          <Inset key={p.id}>
            <p className="font-math text-lg">
              {p.phys} → <b className="text-teal">{p.econ}</b>
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{tr(p.vi, p.en)}</p>
          </Inset>
        ))}
      </div>
      {done ? (
        <Inset tone="clay">
          <Kicker tone="clay">{tr("Điều chưa đổi", "What has not changed yet")}</Kicker>
          <p className="mt-1 text-[15px] leading-relaxed">
            {tr(
              "Tinbergen giữ số mũ 2 của Newton ở bước này, và trong vật lý khối lượng cộng được còn GDP thì không. Bước 3 sẽ để dữ liệu chọn số mũ; các bước sau xử lý phần ‘G’ không còn là hằng số.",
              "Tinbergen keeps Newton's exponent 2 at this step, and masses add up where GDPs do not. Step 3 lets the data choose the exponents; later steps deal with a ‘G’ that is no longer constant.",
            )}
          </p>
        </Inset>
      ) : null}
    </div>
  );
}
