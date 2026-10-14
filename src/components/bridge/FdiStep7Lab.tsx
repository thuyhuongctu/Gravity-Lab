import { useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { countryName, kmFromHanoi, longRun, MODELS, pctChange } from "@/sim/gravity-lab";
import { Inset, Kicker, Segmented, Slider } from "@/components/bridge/ui";

const PARTNERS = ["SGP", "CHN", "KOR", "JPN", "RUS", "DEU", "USA"];

type Part = { name: string; math: string; pct: number; tone: "clay" | "amber" | "teal" };

/** Step 7 of the formula bridge: reading Phan & Do (2019), Model 8, as numbers. */
export function FdiStep7Lab() {
  const [a, setA] = useState("JPN");
  const [b, setB] = useState("DEU");
  const [ed, setEd] = useState(0);
  const [fta, setFta] = useState(false);
  const [horizon, setHorizon] = useState<"short" | "long">("short");

  const c = MODELS[7]!.c;
  const rho = c.lagfdi![0];
  const long = horizon === "long";
  const m = long ? 1 / (1 - rho) : 1;
  const bG = c.geo![0] * m;
  const bE = c.econ![0] * m;
  const bF = c.fta![0] * m;
  const kmA = kmFromHanoi(a);
  const kmB = kmFromHanoi(b);
  const lnRatio = Math.log(kmB / kmA);
  const dD = pctChange(bG, lnRatio);
  const dE = pctChange(bE, Math.log(1 + ed / 100));
  const dF = fta ? pctChange(bF, 1) : 0;
  const total = ((1 + dD / 100) * (1 + dE / 100) * (1 + dF / 100) - 1) * 100;
  const pct = (v: number) => `${v >= 0 ? "+" : "−"}${fmt(Math.abs(v), 1)}%`;
  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v)}%`;

  const parts: Part[] = [
    {
      name: tr(
        `Khoảng cách ${fmtInt(kmA)} → ${fmtInt(kmB)} km`,
        `Distance ${fmtInt(kmA)} → ${fmtInt(kmB)} km`,
      ),
      math: `(${fmt(kmB / kmA, 2)})^${fmt(bG, 2)} − 1`,
      pct: dD,
      tone: "clay",
    },
    {
      name: tr(`Khoảng cách kinh tế ${signed(ed)}`, `Economic distance ${signed(ed)}`),
      math: `(${fmt(1 + ed / 100, 2)})^${fmt(bE, 2)} − 1`,
      pct: dE,
      tone: "amber",
    },
    {
      name: fta ? tr("Có FTA", "With an FTA") : tr("Không FTA", "No FTA"),
      math: fta ? `e^${fmt(bF, 2)} − 1` : "—",
      pct: dF,
      tone: "teal",
    },
  ];
  const scale = (v: number) =>
    Math.max(
      -50,
      Math.min(50, ((Math.sign(v) * Math.log1p(Math.abs(v) / 100)) / Math.log1p(5)) * 50),
    );

  const idle = a === b && !ed && !fta;
  const verdict = idle
    ? tr(
        "Chọn hai đối tác khác nhau, hoặc thay đổi khoảng cách kinh tế, FTA để xem tác động.",
        "Choose two different partners, or change economic distance or the FTA, to see the effect.",
      )
    : tr(
        `${long ? "Về dài hạn" : "Trong năm đầu"}, FDI từ ${countryName(b)} ${fta || ed ? "trong kịch bản này " : ""}dự kiến ${total >= 0 ? "cao hơn" : "thấp hơn"} ${countryName(a)} khoảng ${fmt(Math.abs(total), 0)}%. ${fta ? `FTA đóng góp nhiều nhất: ${pct(dF)}, vì đây là biến giả nên phải dùng e^β − 1. ` : ""}${long ? `Hệ số dài hạn = hệ số ngắn hạn × ${fmt(1 / (1 - rho), 2)}.` : "Chuyển sang Dài hạn để thấy tác động tích luỹ qua FDI năm trước."}`,
        `${long ? "In the long run" : "In the first year"}, FDI from ${countryName(b)} ${fta || ed ? "under this scenario " : ""}is expected to be about ${fmt(Math.abs(total), 0)}% ${total >= 0 ? "higher" : "lower"} than from ${countryName(a)}. ${fta ? `The FTA contributes most: ${pct(dF)}; as a dummy it needs e^β − 1. ` : ""}${long ? `Long-run coefficient = short-run × ${fmt(1 / (1 - rho), 2)}.` : "Switch to Long run to see the effect accumulate through last year's FDI."}`,
      );

  const select = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="flex flex-col gap-1.5 text-[13px] text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 rounded-xl border border-line bg-paper-2/60 px-3 text-sm font-semibold text-ink"
      >
        {PARTNERS.map((id) => (
          <option key={id} value={id}>
            {countryName(id)} · {fmtInt(kmFromHanoi(id))} km
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="@container flex flex-col gap-4">
      <Inset>
        <Kicker>
          {tr(
            "Mô hình 8 · biến phụ thuộc: ln FDI thực hiện",
            "Model 8 · dependent variable: ln realised FDI",
          )}
        </Kicker>
        <p className="mt-1 font-math text-lg italic leading-relaxed">
          ln FDI<sub>jt</sub> = <b className="text-amber">{fmt(rho, 2)}</b> ln FDI<sub>j,t−1</sub>{" "}
          <b className="text-clay">{fmt(c.geo![0], 2)}</b> ln D<sub>j</sub> +{" "}
          <b className="text-amber">{fmt(c.econ![0], 2)}</b> ln ED<sub>jt</sub> +{" "}
          <b className="text-teal">{fmt(c.fta![0], 2)}</b> FTA<sub>jt</sub> + … + u<sub>j</sub> + ε
          <sub>jt</sub>
        </p>
        <p className="mt-1 text-sm text-muted">
          {tr(
            "D: khoảng cách địa lý. ED: khoảng cách kinh tế. Các biến khác giữ nguyên.",
            "D: geographic distance. ED: economic distance. Other variables held fixed.",
          )}
        </p>
      </Inset>

      <div className="grid gap-4 @min-[720px]:grid-cols-2">
        <Inset className="flex flex-col gap-4">
          <Kicker tone="amber">{tr("Kịch bản", "Scenario")}</Kicker>
          <div className="grid items-end gap-2.5 @min-[440px]:grid-cols-[1fr_auto_1fr]">
            {select(a, setA, tr("Đối tác gốc", "Base partner"))}
            <span className="hidden pb-3 text-muted @min-[440px]:inline">→</span>
            {select(b, setB, tr("So với", "Compared with"))}
          </div>
          <div>
            <Slider
              label={tr("Khoảng cách kinh tế thay đổi", "Change in economic distance")}
              valueText={signed(ed)}
              min={-50}
              max={50}
              step={5}
              value={ed}
              onChange={setEd}
              tone="amber"
            />
            <p className="text-[13px] text-muted">
              {tr(
                "Chênh lệch GDP bình quân đầu người với đối tác.",
                "Gap in GDP per head with the partner.",
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFta((v) => !v)}
            aria-pressed={fta}
            className={
              "flex min-h-14 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left " +
              (fta ? "border-teal bg-teal/10" : "border-line")
            }
          >
            <span
              className={
                "grid size-6 shrink-0 place-items-center rounded-md text-sm font-bold " +
                (fta ? "bg-teal text-paper" : "border-2 border-line")
              }
              aria-hidden="true"
            >
              {fta ? "✓" : ""}
            </span>
            <span className="flex flex-col gap-0.5">
              <b className="text-sm">
                {tr("Ký FTA với đối tác này", "Sign an FTA with this partner")}
              </b>
              <span className="text-[13px] text-muted">
                {tr(
                  "Biến giả: tác động = e^β − 1, không phải β × 100",
                  "Dummy: effect = e^β − 1, not β × 100",
                )}
              </span>
            </span>
          </button>
          <Segmented
            value={horizon}
            onChange={setHorizon}
            label={tr("Thời gian", "Horizon")}
            options={[
              { id: "short", label: tr("Ngắn hạn", "Short run") },
              { id: "long", label: tr("Dài hạn", "Long run") },
            ]}
          />
        </Inset>

        <div className="flex flex-col gap-4">
          <Inset className="flex flex-col gap-3">
            <Kicker>
              {long
                ? tr(
                    `Tác động dài hạn · β / (1 − ${fmt(rho, 2)})`,
                    `Long-run effect · β / (1 − ${fmt(rho, 2)})`,
                  )
                : tr("Tác động ngắn hạn · năm đầu", "Short-run effect · first year")}
            </Kicker>
            {parts.map((p) => {
              const w = Math.abs(scale(p.pct));
              const bar =
                p.tone === "clay" ? "bg-clay" : p.tone === "amber" ? "bg-amber" : "bg-teal";
              const text =
                p.tone === "clay" ? "text-clay" : p.tone === "amber" ? "text-amber" : "text-teal";
              return (
                <div
                  key={p.name}
                  className="grid grid-cols-[minmax(0,1fr)_5.25rem] items-center gap-3"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-2 text-sm">
                      <span>{p.name}</span>
                      <span className="font-math text-[13px] italic text-muted">{p.math}</span>
                    </div>
                    <div className="relative h-2.5 rounded-full border border-line bg-paper-2/60">
                      <div
                        className="absolute -top-1 -bottom-1 left-1/2 w-0.5 bg-line"
                        aria-hidden="true"
                      />
                      <div
                        className={"absolute inset-y-0 rounded-full " + bar}
                        style={
                          p.pct >= 0
                            ? { left: "50%", width: `${w}%` }
                            : { left: `${50 - w}%`, width: `${w}%` }
                        }
                      />
                    </div>
                  </div>
                  <b className={"text-right text-lg tabular-nums " + text}>{pct(p.pct)}</b>
                </div>
              );
            })}
            <div className="flex items-baseline justify-between gap-3 border-t border-line pt-3">
              <span className="text-sm font-semibold">
                {tr(
                  `FDI dự kiến so với ${countryName(a)}`,
                  `Expected FDI relative to ${countryName(a)}`,
                )}
              </span>
              <span
                className={
                  "font-serif text-3xl tabular-nums " + (total >= 0 ? "text-teal" : "text-clay")
                }
              >
                {pct(total)}
              </span>
            </div>
          </Inset>
          <Inset>
            <Kicker>{tr("Đọc kết quả", "Reading the result")}</Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">{verdict}</p>
          </Inset>
          <Inset>
            <Kicker tone="amber">
              {tr("Vì sao dài hạn lớn hơn", "Why the long run is larger")}
            </Kicker>
            <p className="mt-1 text-[15px] leading-relaxed">
              {tr(
                `FDI năm trước có hệ số ${fmt(rho, 2)}: vốn đã vào kéo thêm vốn. Một cú sốc lặp lại mỗi năm tích luỹ dần, nên tác động dài hạn là β / (1 − ${fmt(rho, 2)}) = ${fmt(1 / (1 - rho), 2)} × β. Với khoảng cách: ${fmt(c.geo![0], 2)} → ${fmt(longRun(c.geo![0], rho), 2)}.`,
                `Last year's FDI has a coefficient of ${fmt(rho, 2)}: capital already in attracts more. A shock repeated every year accumulates, so the long-run effect is β / (1 − ${fmt(rho, 2)}) = ${fmt(1 / (1 - rho), 2)} × β. For distance: ${fmt(c.geo![0], 2)} → ${fmt(longRun(c.geo![0], rho), 2)}.`,
              )}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">
              {tr(
                "Đây là liên hệ trung bình trong mẫu 16 đối tác 2006–2015, không phải dự báo cho một cặp nước cụ thể. Khoảng cách Hà Nội – thủ đô đối tác theo đường tròn lớn.",
                "This is the average relationship in the sample of 16 partners over 2006–2015, not a forecast for one pair. Distances are great-circle, Hà Nội to the partner's capital.",
              )}
            </p>
          </Inset>
        </div>
      </div>
    </div>
  );
}
