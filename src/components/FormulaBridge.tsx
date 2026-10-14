import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { LabPanel } from "@/components/FdiLab";
import { fmt, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";
import { LogTransformLab } from "@/components/bridge/LogTransformLab";
import { MrtLab } from "@/components/bridge/MrtLab";
import { PpmlLab } from "@/components/bridge/PpmlLab";
import { FdiStep7Lab } from "@/components/bridge/FdiStep7Lab";

type Room = "orbit" | "trade" | "lab";

/** One piece of a formula. `k` is its role, kept across steps so only what changes animates. */
type Tok = { k: string; t: string; sup?: boolean; sub?: string };

type Step = {
  cite: string;
  vi: { title: string; text: string };
  en: { title: string; text: string };
  tokens: Tok[];
  /** What the picture shows. */
  view: "planets" | "countries" | "log" | "resistance" | "zeros" | "fdi";
  /** Exponent on distance in the picture: fixed at 2 for Newton, free afterwards. */
  free: boolean;
  open?: { room: Room; panel: LabPanel | null; vi: string; en: string };
};

const STEPS: Step[] = [
  {
    cite: "Newton (1687/1999)",
    vi: {
      title: "Định luật vạn vật hấp dẫn",
      text: "Hai vật hút nhau với lực tỷ lệ với tích hai khối lượng và nghịch với bình phương khoảng cách. Số mũ 2 là một quy luật tự nhiên, không phải ước lượng.",
    },
    en: {
      title: "Universal gravitation",
      text: "Two bodies attract with a force proportional to the product of their masses and inversely to the square of the distance. The exponent 2 is a law of nature, not an estimate.",
    },
    tokens: [
      { k: "lhs", t: "F" },
      { k: "eq", t: "=" },
      { k: "G", t: "G" },
      { k: "dot1", t: "·" },
      { k: "m1", t: "m", sub: "1" },
      { k: "dot2", t: "·" },
      { k: "m2", t: "m", sub: "2" },
      { k: "div", t: "/" },
      { k: "r", t: "r" },
      { k: "exp", t: "2", sup: true },
    ],
    view: "planets",
    free: false,
    open: {
      room: "orbit",
      panel: null,
      vi: "Thử trong phòng Quỹ đạo",
      en: "Try it in the Orbit room",
    },
  },
  {
    cite: "Tinbergen (1962)",
    vi: {
      title: "Đổi tên các đại lượng",
      text: "Lực thành kim ngạch thương mại Tᵢⱼ giữa nước i và nước j; khối lượng thành quy mô kinh tế (GDP) Yᵢ, Yⱼ; khoảng cách giữa hai vật thành khoảng cách giữa hai nền kinh tế Dᵢⱼ. Dạng phương trình giữ nguyên.",
    },
    en: {
      title: "Rename the quantities",
      text: "Force becomes the trade flow Tᵢⱼ between countries i and j; mass becomes economic size (GDP) Yᵢ, Yⱼ; the distance between bodies becomes the distance between economies Dᵢⱼ. The form of the equation stays.",
    },
    tokens: [
      { k: "lhs", t: "T", sub: "ij" },
      { k: "eq", t: "=" },
      { k: "G", t: "G" },
      { k: "dot1", t: "·" },
      { k: "m1", t: "Y", sub: "i" },
      { k: "dot2", t: "·" },
      { k: "m2", t: "Y", sub: "j" },
      { k: "div", t: "/" },
      { k: "r", t: "D", sub: "ij" },
      { k: "exp", t: "2", sup: true },
    ],
    view: "countries",
    free: false,
  },
  {
    cite: "Tinbergen (1962); Disdier & Head (2008)",
    vi: {
      title: "Để dữ liệu quyết định số mũ",
      text: "Kinh tế không có định luật nào buộc số mũ bằng 2. Các số mũ β₁, β₂ và γ trở thành tham số cần ước lượng. Tổng hợp hơn một nghìn ước lượng, Disdier và Head (2008) thấy hệ số khoảng cách trung bình gần 0,9: khoảng cách gấp đôi làm thương mại giảm gần một nửa.",
    },
    en: {
      title: "Let the data choose the exponents",
      text: "No law of economics fixes the exponent at 2. The exponents β₁, β₂ and γ become parameters to estimate. Pooling over a thousand estimates, Disdier and Head (2008) find a mean distance elasticity near 0.9: doubling distance roughly halves trade.",
    },
    tokens: [
      { k: "lhs", t: "T", sub: "ij" },
      { k: "eq", t: "=" },
      { k: "G", t: "G" },
      { k: "dot1", t: "·" },
      { k: "m1", t: "Y", sub: "i" },
      { k: "b1", t: "β₁", sup: true },
      { k: "dot2", t: "·" },
      { k: "m2", t: "Y", sub: "j" },
      { k: "b2", t: "β₂", sup: true },
      { k: "div", t: "/" },
      { k: "r", t: "D", sub: "ij" },
      { k: "exp", t: "γ", sup: true },
    ],
    view: "countries",
    free: true,
    open: {
      room: "trade",
      panel: null,
      vi: "Thử trong phòng Thương mại",
      en: "Try it in the Trade room",
    },
  },
  {
    cite: "Tinbergen (1962)",
    vi: {
      title: "Lấy logarit: thành một hồi quy tuyến tính",
      text: "Logarit biến tích thành tổng và lũy thừa thành hệ số. Phương trình trở thành một hồi quy OLS: hệ số của ln Dᵢⱼ chính là −γ, độ dốc của đường thẳng trên đồ thị log–log.",
    },
    en: {
      title: "Take logs: a linear regression",
      text: "Logs turn products into sums and powers into coefficients. The equation becomes an OLS regression: the coefficient on ln Dᵢⱼ is −γ, the slope of the line on the log–log plot.",
    },
    tokens: [
      { k: "lhs", t: "ln T", sub: "ij" },
      { k: "eq", t: "=" },
      { k: "G", t: "β₀" },
      { k: "dot1", t: "+" },
      { k: "m1", t: "β₁ ln Y", sub: "i" },
      { k: "dot2", t: "+" },
      { k: "m2", t: "β₂ ln Y", sub: "j" },
      { k: "div", t: "−" },
      { k: "r", t: "γ ln D", sub: "ij" },
      { k: "eps", t: "+ ε", sub: "ij" },
    ],
    view: "log",
    free: true,
  },
  {
    cite: "Anderson & van Wincoop (2003)",
    vi: {
      title: "Sức cản đa phương",
      text: "Thương mại giữa i và j còn phụ thuộc i và j xa cách phần còn lại của thế giới đến đâu. Các chỉ số sức cản Πᵢ và Pⱼ đưa ‘G’ ra khỏi vai trò hằng số và cho mô hình nền tảng lý thuyết.",
    },
    en: {
      title: "Multilateral resistance",
      text: "Trade between i and j also depends on how remote each is from the rest of the world. The resistance terms Πᵢ and Pⱼ take ‘G’ out of the role of a constant and give the model a theoretical footing.",
    },
    tokens: [
      { k: "lhs", t: "T", sub: "ij" },
      { k: "eq", t: "=" },
      { k: "G", t: "(Y", sub: "i" },
      { k: "m1", t: "Y", sub: "j" },
      { k: "dot2", t: "/ Y", sub: "W" },
      { k: "div", t: ") ·" },
      { k: "r", t: "(t", sub: "ij" },
      { k: "mr", t: "/ Π", sub: "i" },
      { k: "mr2", t: "P", sub: "j" },
      { k: "exp", t: ")¹⁻σ" },
    ],
    view: "resistance",
    free: true,
  },
  {
    cite: "Santos Silva & Tenreyro (2006)",
    vi: {
      title: "PPML: ước lượng trên mức, giữ cả số 0",
      text: "Không lấy được logarit của 0, nên OLS bỏ các cặp nước không buôn bán; và khi sai số thay đổi theo quy mô, hệ số log bị lệch. PPML ước lượng trực tiếp dạng mũ, giữ cả mẫu.",
    },
    en: {
      title: "PPML: estimate on levels, keep the zeros",
      text: "The log of zero does not exist, so OLS drops pairs that do not trade; and when the error variance grows with size, the log coefficients are biased. PPML estimates the exponential form directly and keeps the whole sample.",
    },
    tokens: [
      { k: "lhs", t: "T", sub: "ij" },
      { k: "eq", t: "=" },
      { k: "G", t: "exp(β₀" },
      { k: "dot1", t: "+" },
      { k: "m1", t: "β₁ ln Y", sub: "i" },
      { k: "dot2", t: "+" },
      { k: "m2", t: "β₂ ln Y", sub: "j" },
      { k: "div", t: "−" },
      { k: "r", t: "γ ln D", sub: "ij" },
      { k: "eps", t: ") · η", sub: "ij" },
    ],
    view: "zeros",
    free: true,
    open: { room: "lab", panel: "ppml", vi: "Mở Vì sao PPML", en: "Open Why PPML" },
  },
  {
    cite: "Xuan & Xing (2008); Phan & Do (2019)",
    vi: {
      title: "Từ hàng hóa sang dòng vốn: FDI vào Việt Nam (FDI inflows)",
      text: "Thay dòng thương mại bằng dòng vốn FDI từ nước nguồn i vào Việt Nam, theo năm t, và thêm các khoảng cách thể chế, văn hóa, kinh tế. Với mười sáu đối tác 2006–2015, Phan và Do (2019) ước lượng hệ số khoảng cách địa lý quanh −0,38.",
    },
    en: {
      title: "From goods to capital: FDI inflows into Vietnam",
      text: "Replace the trade flow with FDI from source country i into Vietnam in year t, and add institutional, cultural and economic distance. With sixteen partners over 2006–2015, Phan and Do (2019) estimate a geographic distance coefficient near −0.38.",
    },
    tokens: [
      { k: "lhs", t: "ln FDI", sub: "it" },
      { k: "eq", t: "=" },
      { k: "G", t: "β₀" },
      { k: "dot1", t: "+" },
      { k: "m1", t: "β₁ ln Y", sub: "it" },
      { k: "dot2", t: "+" },
      { k: "m2", t: "β₂ ln Y", sub: "VN,t" },
      { k: "div", t: "−" },
      { k: "r", t: "γ ln D", sub: "i,VN" },
      { k: "eps", t: "+ δ′X", sub: "it" },
      { k: "re", t: "+ u", sub: "i" },
      { k: "e2", t: "+ ε", sub: "it" },
    ],
    view: "fdi",
    free: true,
    open: { room: "lab", panel: "coef", vi: "Mở Hệ số 2019", en: "Open 2019 coefficients" },
  },
];

const DEFAULT_GAMMA = [2, 2, 0.9, 0.9, 0.9, 0.9, 0.38];

/** Interactive labs that replace the simple picture from step 4 on. */
const LABS: Partial<Record<Step["view"], () => React.JSX.Element>> = {
  log: LogTransformLab,
  resistance: MrtLab,
  zeros: PpmlLab,
  fdi: FdiStep7Lab,
};

function Formula({ step, prev }: { step: Step; prev: Step | null }) {
  const before = new Map(prev?.tokens.map((t) => [t.k, `${t.t}|${t.sub ?? ""}`]) ?? []);
  return (
    <p
      className="flex min-h-16 flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 font-math text-2xl leading-tight sm:text-3xl"
      aria-live="polite"
    >
      {step.tokens.map((tok) => {
        const sig = `${tok.t}|${tok.sub ?? ""}`;
        const changed = prev !== null && before.get(tok.k) !== sig;
        const body = (
          <>
            {tok.t}
            {tok.sub ? <sub className="text-[0.55em]">{tok.sub}</sub> : null}
          </>
        );
        return (
          <span
            key={`${tok.k}:${sig}`}
            className={
              (changed ? "morph-in text-amber " : "") +
              (tok.sup ? "-ms-1 self-start text-[0.6em]" : "")
            }
          >
            {body}
          </span>
        );
      })}
    </p>
  );
}

/** Deterministic scatter for the log–log views. */
function points(gamma: number) {
  const out: Array<{ x: number; y: number; zero: boolean }> = [];
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 26; i++) {
    const x = 0.08 + 0.84 * rand();
    const noise = (rand() + rand() + rand() - 1.5) * 0.22;
    const y = 0.86 - gamma * 0.45 * x + noise;
    out.push({ x, y, zero: y < 0.18 });
  }
  return out;
}

function Picture({ step, d, gamma }: { step: Step; d: number; gamma: number }) {
  const w = 340;
  const h = 170;
  const exp = step.free ? gamma : 2;
  const value = 1 / Math.pow(d, exp);

  if (step.view === "log" || step.view === "zeros") {
    const pts = points(gamma);
    const X = (x: number) => 30 + x * (w - 50);
    const Y = (y: number) => h - 26 - y * (h - 44);
    const zerosOnly = step.view === "zeros";
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label={tr(
          "Đồ thị log khoảng cách với log thương mại",
          "Log distance against log trade",
        )}
      >
        <line x1={30} y1={h - 26} x2={w - 14} y2={h - 26} className="stroke-line" />
        <line x1={30} y1={14} x2={30} y2={h - 26} className="stroke-line" />
        <text x={w - 14} y={h - 8} textAnchor="end" className="fill-muted text-xs">
          ln D
        </text>
        <text x={34} y={20} className="fill-muted text-xs">
          {zerosOnly ? "T" : "ln T"}
        </text>
        {pts.map((p, i) =>
          zerosOnly && p.zero ? (
            <circle key={i} cx={X(p.x)} cy={h - 26} r={4} className="fill-clay" />
          ) : (
            <circle
              key={i}
              cx={X(p.x)}
              cy={Y(Math.max(p.y, 0.02))}
              r={3.5}
              className={p.zero && !zerosOnly ? "fill-muted/40" : "fill-teal"}
            />
          ),
        )}
        <line
          x1={X(0)}
          y1={Y(0.86)}
          x2={X(1)}
          y2={Y(0.86 - gamma * 0.45)}
          className="stroke-amber"
          strokeWidth={2.5}
        />
        <text x={X(0.62)} y={Y(0.86 - gamma * 0.45 * 0.62) - 8} className="fill-amber text-[12px]">
          {tr("độ dốc", "slope")} −γ = −{fmt(gamma, 2)}
        </text>
        {zerosOnly ? (
          <text x={X(0.02)} y={h - 32} className="fill-clay text-xs">
            {tr("T = 0: OLS bỏ, PPML giữ", "T = 0: OLS drops, PPML keeps")}
          </text>
        ) : null}
      </svg>
    );
  }

  const cx = w / 2;
  const half = 22 + (d - 1) * 34;
  const ax = cx - half;
  const bx = cx + half;
  const cy = 86;
  const planets = step.view === "planets";
  const fdi = step.view === "fdi";
  const dots = Math.max(2, Math.round(2 + 10 * value));
  const dur = 1.2 + d * 0.5;
  const labelA = planets ? "m₁" : fdi ? tr("Nước nguồn i", "Source i") : tr("Nước i", "Country i");
  const labelB = planets ? "m₂" : fdi ? tr("Việt Nam", "Vietnam") : tr("Nước j", "Country j");
  const aR = planets ? 20 : 24;
  const bR = planets ? 14 : fdi ? 18 : 20;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-auto w-full"
      role="img"
      aria-label={tr(
        "Hai vật hoặc hai nền kinh tế và dòng chảy giữa chúng",
        "Two bodies or economies and the flow between them",
      )}
    >
      {step.view === "resistance"
        ? [
            [40, 28],
            [300, 32],
            [52, 150],
            [292, 146],
            [170, 18],
          ].map(([x, y], i) => (
            <g key={i}>
              <line
                x1={x}
                y1={y}
                x2={i % 2 ? bx : ax}
                y2={cy}
                className="stroke-line"
                strokeDasharray="3 4"
              />
              <circle cx={x} cy={y} r={8} className="fill-muted/40" />
            </g>
          ))
        : null}
      <line
        x1={ax}
        y1={cy}
        x2={bx}
        y2={cy}
        className="stroke-line"
        strokeWidth={1.5}
        strokeDasharray={planets ? "0" : "4 4"}
      />
      {planets ? (
        <>
          <path
            d={`M ${ax + aR + 4} ${cy} l ${10 + 18 * value} 0`}
            className="stroke-amber"
            strokeWidth={3}
            markerEnd="url(#fb-arrow)"
          />
          <path
            d={`M ${bx - bR - 4} ${cy} l ${-(10 + 18 * value)} 0`}
            className="stroke-amber"
            strokeWidth={3}
            markerEnd="url(#fb-arrow)"
          />
        </>
      ) : (
        Array.from({ length: dots }, (_, i) => (
          <circle key={`${dots}-${i}`} r={3} className={fdi ? "fill-amber" : "fill-teal"}>
            <animateMotion
              dur={`${dur}s`}
              begin={`${(i * dur) / dots}s`}
              repeatCount="indefinite"
              path={
                fdi || i % 2
                  ? `M ${ax + aR} ${cy - 6} Q ${cx} ${cy - 30 - half * 0.15} ${bx - bR} ${cy - 6}`
                  : `M ${bx - bR} ${cy + 6} Q ${cx} ${cy + 30 + half * 0.15} ${ax + aR} ${cy + 6}`
              }
            />
          </circle>
        ))
      )}
      <defs>
        <marker
          id="fb-arrow"
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" className="fill-amber" />
        </marker>
      </defs>
      <circle cx={ax} cy={cy} r={aR} className={planets ? "fill-clay" : "fill-teal/80"} />
      <circle
        cx={bx}
        cy={cy}
        r={bR}
        className={planets ? "fill-[#7ec8b8]" : fdi ? "fill-[#da251d]" : "fill-amber/80"}
      />
      {fdi ? (
        <text x={bx} y={cy + 5} textAnchor="middle" className="fill-[#ffde00] text-[14px]">
          ★
        </text>
      ) : null}
      <text x={ax} y={cy + aR + 18} textAnchor="middle" className="fill-ink text-[12px]">
        {labelA}
      </text>
      <text x={bx} y={cy + bR + 18} textAnchor="middle" className="fill-ink text-[12px]">
        {labelB}
      </text>
      <text x={cx} y={h - 6} textAnchor="middle" className="fill-muted text-xs">
        {planets ? "r" : "D"} = {fmt(d, 1)} → {planets ? "F" : fdi ? "FDI" : "T"} × {fmt(value, 2)}
      </text>
    </svg>
  );
}

/** Step-by-step animation of Newton's law turning into the gravity models of trade and FDI. */
export function FormulaBridge({
  onOpen,
}: {
  onOpen: (room: Room, panel: LabPanel | null) => void;
}) {
  usePrefs();
  const [i, setI] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const [prev, setPrev] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [d, setD] = useState(2);
  const [gamma, setGamma] = useState(DEFAULT_GAMMA[0]!);
  const step = STEPS[i]!;

  const go = (next: number) => {
    const n = (next + STEPS.length) % STEPS.length;
    setPrev(i);
    setI(n);
    setGamma(DEFAULT_GAMMA[n]!);
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setTimeout(() => {
      if (i === STEPS.length - 1) {
        setPlaying(false);
        return;
      }
      setPrev(i);
      setI(i + 1);
      setGamma(DEFAULT_GAMMA[i + 1]!);
    }, 6500);
    return () => window.clearTimeout(id);
  }, [playing, i]);

  const exp = step.free ? gamma : 2;
  const Lab = LABS[step.view];

  // Presentation keys, scoped to the bridge: ← / → change step, F toggles full screen.
  const onKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPlaying(false);
      go(i + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPlaying(false);
      go(i - 1);
    } else if (e.key === "f" || e.key === "F") {
      e.preventDefault();
      const el = sectionRef.current;
      if (!el) return;
      if (document.fullscreenElement) void document.exitFullscreen?.();
      else void el.requestFullscreen?.();
    }
  };

  return (
    <section
      ref={sectionRef}
      tabIndex={0}
      onKeyDown={onKey}
      className="clay-card rounded-card bg-paper p-4 outline-none focus-visible:ring-2 focus-visible:ring-teal"
      aria-roledescription={tr("trình chiếu", "carousel")}
      aria-keyshortcuts="ArrowLeft ArrowRight F"
    >
      <p className="text-xs font-medium text-teal">
        {tr("Mô phỏng chuyển hóa công thức", "How the formula travels")}
      </p>
      <h3 className="mt-1 font-serif text-xl leading-snug">
        {tr(
          "Từ lực hấp dẫn đến thương mại quốc tế và FDI",
          "From gravitation to international trade and FDI",
        )}
      </h3>

      <div
        className="mt-3 flex items-center justify-center gap-1.5"
        role="tablist"
        aria-label={tr("Các bước", "Steps")}
      >
        {STEPS.map((s, n) => (
          <button
            key={n}
            type="button"
            role="tab"
            aria-selected={n === i}
            aria-label={`${tr("Bước", "Step")} ${n + 1}: ${tr(s.vi.title, s.en.title)}`}
            onClick={() => go(n)}
            className="flex min-h-11 min-w-8 items-center justify-center"
          >
            <span
              className={
                "block h-2 rounded-full transition-all " + (n === i ? "w-6 bg-teal" : "w-2 bg-line")
              }
            />
          </button>
        ))}
      </div>

      <div className="mt-2">
        <Formula key={i} step={step} prev={prev === null ? null : STEPS[prev]!} />
      </div>
      <p className="mt-1 text-center text-xs text-muted">{step.cite}</p>

      {Lab ? (
        <div className="mt-3">
          <Lab />
        </div>
      ) : (
        <>
          <div className="mx-auto mt-2 max-w-md">
            <Picture step={step} d={d} gamma={exp} />
          </div>

          <div className="mt-2 grid gap-x-4 sm:grid-cols-2">
            <label className="block text-sm">
              {step.view === "planets"
                ? tr("Khoảng cách r", "Distance r")
                : tr("Khoảng cách D", "Distance D")}{" "}
              · {fmt(d, 1)}
              <input
                type="range"
                min={1}
                max={4}
                step={0.1}
                value={d}
                aria-valuetext={fmt(d, 1)}
                onChange={(e) => setD(Number(e.target.value))}
              />
            </label>
            <label className={"block text-sm " + (step.free ? "" : "opacity-50")}>
              {tr("Số mũ khoảng cách", "Distance exponent")} {step.free ? "γ" : ""} · {fmt(exp, 2)}
              <input
                type="range"
                min={0.2}
                max={2.5}
                step={0.01}
                value={exp}
                aria-valuetext={`γ = ${fmt(exp, 2)}`}
                disabled={!step.free}
                onChange={(e) => setGamma(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="text-xs text-muted">
            {tr("Khoảng cách gấp đôi → nhân với", "Doubling the distance → multiply by")} 1/2
            <sup>{fmt(exp, 2)}</sup> = {fmt(1 / Math.pow(2, exp), 2)}
            {step.free ? null : tr(" (Newton: luôn là 1/4)", " (Newton: always 1/4)")}
          </p>
        </>
      )}

      <h4 className="mt-3 font-serif text-lg leading-snug">
        {i + 1}. {tr(step.vi.title, step.en.title)}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-muted">{tr(step.vi.text, step.en.text)}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => go(i - 1)}
          aria-label={tr("Bước trước", "Previous step")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!playing && i === STEPS.length - 1) go(0);
            setPlaying((p) => !p);
          }}
          className="cosmic-btn inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? tr("Dừng", "Pause") : tr("Tự chạy", "Play")}
        </button>
        <button
          type="button"
          onClick={() => go(i + 1)}
          aria-label={tr("Bước sau", "Next step")}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-line"
        >
          <ChevronRight className="size-4" />
        </button>
        {step.open ? (
          <button
            type="button"
            onClick={() => onOpen(step.open!.room, step.open!.panel)}
            className="min-h-11 rounded-full border border-line px-3 text-sm font-medium"
          >
            {tr(step.open.vi, step.open.en)} →
          </button>
        ) : null}
      </div>
    </section>
  );
}
