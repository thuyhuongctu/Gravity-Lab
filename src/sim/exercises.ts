/**
 * Six self-marked exercises, one per room or bridge step. Answers are computed from the
 * same formulas and coefficients the app uses, so they always match what the rooms show.
 */
import { impactOf, longRun, MODELS, pctChange } from "./gravity-lab.ts";
import { tr } from "../lib/prefs.ts";

export type Exercise = {
  id: string;
  room: string;
  /** Where "open the simulation" goes. */
  open: {
    room: "orbit" | "trade" | "lab" | "story";
    panel?: "coef" | "ppml" | "case";
    step?: number;
  };
  text: string;
  unit: string;
  answer: number;
  tolerance: number;
  hint: string;
  key: string;
};

const GAMMA = 0.9;

export function exercises(): Exercise[] {
  const c = MODELS[7]!.c;
  const geo = c.geo![0];
  const fta = c.fta![0];
  const rho = c.lagfdi![0];
  const q4 = impactOf({ a: "JPN", b: "RUS", econPct: 0, inst: 0, open: 0, fta: false });
  const q5 = pctChange(fta, 1);
  const q6 = longRun(geo, rho);
  const f = (v: number, d = 1) =>
    tr("vi", "en") === "en" ? v.toFixed(d) : v.toFixed(d).replace(".", ",");
  return [
    {
      id: "newton",
      room: tr("Quỹ đạo", "Orbit"),
      open: { room: "orbit" },
      text: tr(
        "Theo định luật Newton, nếu khoảng cách giữa hai vật tăng gấp đôi, lực hấp dẫn còn bao nhiêu phần trăm so với ban đầu?",
        "By Newton's law, if the distance between two bodies doubles, what percentage of the original force remains?",
      ),
      unit: "%",
      answer: 25,
      tolerance: 0.5,
      hint: tr(
        "F tỷ lệ với 1/r². Gấp đôi r thì F nhân với 1/2².",
        "F is proportional to 1/r². Doubling r multiplies F by 1/2².",
      ),
      key: "(1/2)² = 25%",
    },
    {
      id: "trade",
      room: tr("Thương mại", "Trade"),
      open: { room: "trade" },
      text: tr(
        `Với γ = ${f(GAMMA, 2)}, một đối tác xa gấp đôi (cùng quy mô) có dòng thương mại bằng bao nhiêu phần trăm đối tác gần?`,
        `With γ = ${f(GAMMA, 2)}, a partner twice as far away (same size) trades what percentage of the nearer one?`,
      ),
      unit: "%",
      answer: Math.pow(2, -GAMMA) * 100,
      tolerance: 1,
      hint: tr("T ∝ D^−γ, nên tỷ lệ là 2^−0,9.", "T ∝ D^−γ, so the ratio is 2^−0.9."),
      key: `2^−${f(GAMMA, 2)} ≈ ${f(Math.pow(2, -GAMMA) * 100)}%`,
    },
    {
      id: "log",
      room: tr("Bước 4 · Log", "Step 4 · Logs"),
      open: { room: "story", step: 3 },
      text: tr(
        `Trên thang log–log, đường T = G·D^−${f(GAMMA, 2)} có độ dốc bằng bao nhiêu?`,
        `On log–log axes, what is the slope of the line T = G·D^−${f(GAMMA, 2)}?`,
      ),
      unit: "",
      answer: -GAMMA,
      tolerance: 0.01,
      hint: tr(
        "Lấy ln hai vế: ln T = ln G − γ ln D.",
        "Take logs of both sides: ln T = ln G − γ ln D.",
      ),
      key: `−γ = −${f(GAMMA, 2)}`,
    },
    {
      id: "distance",
      room: tr("Bước 7 · FDI", "Step 7 · FDI"),
      open: { room: "lab", panel: "coef" },
      text: tr(
        `Hệ số khoảng cách β = ${f(geo, 2)}. FDI từ Nga (${Math.round(q4.kmB).toLocaleString("vi-VN")} km) so với Nhật Bản (${Math.round(q4.kmA).toLocaleString("vi-VN")} km) thay đổi bao nhiêu phần trăm, chỉ do khoảng cách?`,
        `The distance coefficient is β = ${f(geo, 2)}. By what percentage does FDI from Russia (${Math.round(q4.kmB).toLocaleString("en-US")} km) differ from Japan (${Math.round(q4.kmA).toLocaleString("en-US")} km), from distance alone?`,
      ),
      unit: "%",
      answer: q4.geoPct,
      tolerance: 1.5,
      hint: tr(
        "Dùng dạng chính xác (D_B / D_A)^β − 1, không dùng β × % thay đổi khi chênh lệch lớn.",
        "Use the exact form (D_B / D_A)^β − 1, not β × % change, when the gap is large.",
      ),
      key: `(${Math.round(q4.kmB)}/${Math.round(q4.kmA)})^${f(geo, 2)} − 1 ≈ ${f(q4.geoPct)}%`,
    },
    {
      id: "fta",
      room: tr("Bước 7 · FDI", "Step 7 · FDI"),
      open: { room: "lab", panel: "coef" },
      text: tr(
        `Hệ số FTA trong Mô hình 8 là ${f(fta, 2)}. FDI cao hơn bao nhiêu phần trăm khi có FTA (ngắn hạn)?`,
        `The FTA coefficient in Model 8 is ${f(fta, 2)}. By what percentage is FDI higher with an FTA (short run)?`,
      ),
      unit: "%",
      answer: q5,
      tolerance: 3,
      hint: tr(
        `FTA là biến giả: tác động = e^β − 1, không phải β × 100 = ${f(fta * 100, 0)}%.`,
        `FTA is a dummy: the effect is e^β − 1, not β × 100 = ${f(fta * 100, 0)}%.`,
      ),
      key: `e^${f(fta, 2)} − 1 ≈ ${f(q5)}%`,
    },
    {
      id: "longrun",
      room: tr("Bước 7 · FDI", "Step 7 · FDI"),
      open: { room: "lab", panel: "coef" },
      text: tr(
        `FDI năm trước có hệ số ${f(rho, 2)}. Hệ số khoảng cách dài hạn bằng bao nhiêu?`,
        `Last year's FDI has a coefficient of ${f(rho, 2)}. What is the long-run distance coefficient?`,
      ),
      unit: "",
      answer: q6,
      tolerance: 0.02,
      hint: tr(
        "Dài hạn = β / (1 − ρ), với ρ là hệ số của biến trễ.",
        "Long run = β / (1 − ρ), where ρ is the coefficient on the lag.",
      ),
      key: `${f(geo, 2)} / ${f(1 - rho, 2)} ≈ ${f(q6, 2)}`,
    },
  ];
}

/** Parse a typed answer: accepts a comma or a point, a true minus, spaces and a trailing %. */
export function parseAnswer(raw: string): number {
  return parseFloat(
    String(raw ?? "")
      .replace(/\s|%/g, "")
      .replace("−", "-")
      .replace(",", "."),
  );
}

export function mark(ex: Exercise, raw: string): "ok" | "no" | "empty" {
  const v = parseAnswer(raw);
  if (Number.isNaN(v)) return "empty";
  return Math.abs(v - ex.answer) <= ex.tolerance ? "ok" : "no";
}
