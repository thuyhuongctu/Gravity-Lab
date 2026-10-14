import { kmFromHanoi, MODELS, xuanXingSeries } from "./gravity-lab.ts";
import { makeEconomies } from "./trade.ts";

/**
 * Case files for the FDI room (mockups 2e, 2g). Pure data + arithmetic so it can be unit-tested
 * with `npm test`; the React view is src/components/CaseFile.tsx.
 * Sources: kmFromHanoi() (capitals, haversine); Xuan & Xing (2008) series 1990–2004 summed;
 * Phan & Do (2019) Model 8 geo = −0.38; trade.ts GDP (USD trillions, c. 2024, teaching proxy).
 */

export type Bi = [string, string]; // vi, en
export type Choice = { label: Bi; correct?: boolean };

export interface CaseNums {
  kmA: number;
  kmB: number;
  fdiA: number;
  fdiB: number;
  observed: number; // fdiA / fdiB
  distOnly: number; // (kmA / kmB)^geo
  withSize: number; // distOnly × gA / gB
  geo: number;
  gA: number;
  gB: number;
  y0: number;
  y1: number;
}

export interface CaseDef {
  id: string;
  a: string; // gravity-lab.ts source id
  b: string;
  gdpA: string; // trade.ts economy id
  gdpB: string;
  nameA: Bi;
  nameB: Bi;
  cityA: Bi;
  cityB: Bi;
  level: Bi;
  question: Bi;
  why: { prompt: Bi; choices: Choice[] };
  hint: Bi;
}

export const CASES: CaseDef[] = [
  {
    id: "jp-kr",
    a: "JPN", b: "KOR", gdpA: "jp", gdpB: "kr",
    nameA: ["Nhật Bản", "Japan"], nameB: ["Hàn Quốc", "Korea"],
    cityA: ["Tokyo", "Tokyo"], cityB: ["Seoul", "Seoul"],
    level: ["Hồ sơ 01 · Trung bình · ~10 phút", "Case 01 · Medium · ~10 min"],
    question: ["Nhật Bản xa hơn Hàn Quốc, vì sao vẫn đầu tư vào Việt Nam nhiều hơn?", "Japan is farther than Korea, so why did it invest more in Viet Nam?"],
    why: {
      prompt: ["Số hạng nào của phương trình trọng lực bị bỏ qua ở bước 2?", "Which term of the gravity equation did step 2 leave out?"],
      choices: [
        { label: ["Quy mô kinh tế Yᵢ", "Economic size Yᵢ"], correct: true },
        { label: ["Khoảng cách văn hóa", "Cultural distance"] },
        { label: ["Hằng số G", "The constant G"] },
      ],
    },
    hint: [
      "Bước 2 chỉ dùng mẫu số Dᵢⱼ. Phương trình trọng lực còn có tử số — quy mô kinh tế của hai nước.",
      "Step 2 only used the denominator Dᵢⱼ. The gravity equation also has a numerator — the size of both economies.",
    ],
  },
  {
    id: "sg-kr",
    a: "SGP", b: "KOR", gdpA: "sg", gdpB: "kr",
    nameA: ["Xin-ga-po", "Singapore"], nameB: ["Hàn Quốc", "Korea"],
    cityA: ["Xin-ga-po", "Singapore"], cityB: ["Seoul", "Seoul"],
    level: ["Hồ sơ 02 · Khó · ~12 phút", "Case 02 · Hard · ~12 min"],
    question: ["Kinh tế Xin-ga-po nhỏ hơn Hàn Quốc ba lần, vì sao vốn vào Việt Nam lại nhiều hơn?", "Singapore's economy is a third of Korea's, so why did it send more FDI?"],
    why: {
      prompt: [
        "Thêm GDP làm dự đoán xa thực tế hơn. Mô hình trọng lực đang thiếu điều gì?",
        "Adding GDP moves the prediction further from the data. What is the gravity model missing?",
      ],
      choices: [
        { label: ["Vai trò trung chuyển vốn và AFTA", "Hub role for regional capital and AFTA"], correct: true },
        { label: ["Khoảng cách tính sai", "The distance is wrong"] },
        { label: ["Số mũ khoảng cách quá lớn", "The distance exponent is too large"] },
      ],
    },
    hint: [
      "Khi mô hình sai rõ rệt, hãy hỏi vốn thật sự đến từ đâu. Nhiều tập đoàn đặt công ty mẹ khu vực ở Xin-ga-po.",
      "When the model misses badly, ask where the capital really comes from. Many groups route regional investment through Singapore.",
    ],
  },
];

export function caseById(id: string | undefined): CaseDef {
  return CASES.find((c) => c.id === id) ?? CASES[0]!;
}

export function computeCase(c: CaseDef): CaseNums {
  const kmA = kmFromHanoi(c.a);
  const kmB = kmFromHanoi(c.b);
  const { series, years } = xuanXingSeries();
  const total = (id: string) => {
    const s = series.find((x) => x.id === id);
    if (!s) throw new Error(`no FDI series for ${id}`);
    return s.v.reduce((acc, v) => acc + v, 0);
  };
  const fdiA = total(c.a);
  const fdiB = total(c.b);
  const geo = MODELS[7]!.c.geo![0];
  const ecos = makeEconomies("partners");
  const gdp = (id: string) => {
    const e = ecos.find((x) => x.id === id);
    if (!e) throw new Error(`no GDP for ${id}`);
    return e.gdp;
  };
  const gA = gdp(c.gdpA);
  const gB = gdp(c.gdpB);
  const distOnly = Math.pow(kmA / kmB, geo);
  return { kmA, kmB, fdiA, fdiB, observed: fdiA / fdiB, distOnly, withSize: distOnly * (gA / gB), geo, gA, gB, y0: years[0]!, y1: years[years.length - 1]! };
}

/** Step-3 verdict: observed vs distance-only prediction, ±10% counts as "about the same". */
export function compare(n: CaseNums): "above" | "below" | "same" {
  const r = n.observed / n.distOnly;
  return r > 1.1 ? "above" : r < 0.9 ? "below" : "same";
}

/** Step-4 verdict: does adding source-country size move the prediction toward the data? */
export function sizeHelps(n: CaseNums): boolean {
  return Math.abs(Math.log(n.withSize / n.observed)) < Math.abs(Math.log(n.distOnly / n.observed));
}
