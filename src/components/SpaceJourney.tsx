import { useEffect, useRef, useState, type ReactNode } from "react";
import { Volume2, X } from "lucide-react";
import type { JourneyHandle, JourneyVals } from "@/lib/journey3d";
import { fmt, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

type Scene = {
  k: [string, string];
  h: [string, string];
  p: [string, string];
  f?: [string, string];
  c?: string;
  slider?: { id: keyof JourneyVals; min: number; max: number; step: number; label: [string, string] };
  cta?: "lab" | "cast";
};

/**
 * The nine scenes (design handoff, narration.js), VI then EN. The Vietnamese keeps the
 * English technical terms in brackets, as the handoff asks.
 */
const SCENES: Scene[] = [
  {
    k: ["Gravity Lab · Đại học Cần Thơ", "Gravity Lab · Can Tho University"],
    h: ["Từ một quả táo rơi", "From a falling apple"],
    p: [
      "Cuộn để bay cùng lớp học — từ khu vườn của Newton đến dòng vốn đầu tư trực tiếp nước ngoài (FDI) chảy về Việt Nam.",
      "Scroll to fly with the class — from Newton’s orchard to foreign direct investment (FDI) flowing into Viet Nam.",
    ],
  },
  {
    k: ["Woolsthorpe · 1666", "Woolsthorpe · 1666"],
    h: ["Lực kéo quả táo cũng giữ Mặt Trăng", "The pull on the apple also holds the Moon"],
    f: ["F = G·m₁m₂ / r²", "F = G·m₁m₂ / r²"],
    p: [
      "Hai khối lượng (masses) hút nhau; lực yếu dần theo bình phương khoảng cách (inverse-square law).",
      "Two masses attract each other; the force weakens with the square of the distance between them.",
    ],
    c: "Isaac Newton (1643–1727) · Newton (1687/1999)",
  },
  {
    k: ["Số mũ (exponent) = 2", "Exponent = 2"],
    h: ["Xa gấp đôi, lực còn một phần tư", "Twice the distance, a quarter of the force"],
    p: [
      "Trong vật lý, số mũ cố định — nền tảng để tính quỹ đạo (orbit) của hành tinh và tàu vũ trụ. Kéo thanh trượt (slider): n khác 2 làm quỹ đạo tiến động (precession) thành hình hoa hồng.",
      "In physics the exponent is fixed — the basis for computing planetary and spacecraft orbits. Drag the slider: any n other than 2 makes the orbit precess into a rosette.",
    ],
    c: "Newton (1687/1999)",
    slider: { id: "n", min: 1.5, max: 2.8, step: 0.01, label: ["Số mũ n", "Exponent n"] },
  },
  {
    k: ["Tinbergen · 1962", "Tinbergen · 1962"],
    h: ["Khối lượng thành quy mô kinh tế (economic size)", "Mass becomes economic size"],
    f: ["Tᵢⱼ = G·YᵢYⱼ / Dᵢⱼᵞ", "Tᵢⱼ = G·YᵢYⱼ / Dᵢⱼᵞ"],
    p: [
      "Nền kinh tế lớn giao thương nhiều hơn; khoảng cách vẫn cản trở. Số mũ γ giờ được ước lượng (estimated) từ dữ liệu.",
      "Larger economies trade more; distance still impedes trade. The exponent γ is now estimated from data.",
    ],
    c: "Jan Tinbergen (1903–1994) · Tinbergen (1962)",
  },
  {
    k: ["FDI vào Việt Nam · 2006–2015", "FDI into Viet Nam · 2006–2015"],
    h: ["Xa thêm 1%, FDI giảm 0,38%", "1% farther, 0.38% less FDI"],
    p: [
      "Khoảng cách địa lý (geographic distance) có tác động âm, có ý nghĩa thống kê (statistically significant), đến dòng vốn vào Việt Nam. Kéo β để xem dòng vốn quanh Trái Đất thay đổi.",
      "Geographic distance has a statistically significant negative effect on capital flows into Viet Nam. Drag β to see the capital around the Earth change.",
    ],
    c: "Phan & Do (2019)",
    slider: { id: "b", min: -1, max: 0, step: 0.01, label: ["Hệ số β", "Coefficient β"] },
  },
  {
    k: ["Hiệp định thương mại tự do (FTA)", "Free-trade agreements"],
    h: ["Một FTA kéo vốn lại gần", "An FTA pulls capital closer"],
    f: ["β = 1,01 → +174,6%", "β = 1.01 → +174.6%"],
    p: [
      "Khi có FTA, dòng FDI cao hơn khoảng 174,6% trong năm đầu; về dài hạn, chia cho 1 − 0,45, khoảng 527%.",
      "With an FTA in force, FDI is about 174.6% higher in the first year; in the long run, divided by 1 − 0.45, about 527%.",
    ],
    c: "Phan & Do (2019)",
  },
  {
    k: ["PPML", "PPML"],
    h: ["Những năm bằng 0 vẫn được giữ lại (zero flows)", "Zero-flow years are retained"],
    f: ["FDI = 0 → PPML", "FDI = 0 → PPML"],
    p: [
      "Ước lượng trên mức (levels) thay vì log giúp dùng toàn bộ mẫu (full sample).",
      "Estimating in levels rather than logs uses the full sample.",
    ],
    c: "Santos Silva & Tenreyro (2006)",
  },
  {
    k: ["Phi hành đoàn (crew)", "The crew"],
    h: ["Chín người, một câu hỏi", "Nine people, one question"],
    p: [
      "Lumina, Minh Long, Lan Chi, Bảo Ngọc, Thu Hà, Gia Hân, thầy Tú — cùng Newton (1643–1727) và Tinbergen (1903–1994). Bấm một gương mặt để quay lại cảnh người đó dẫn.",
      "Lumina, Minh Long, Lan Chi, Bảo Ngọc, Thu Hà, Gia Hân and lecturer Tú — with Newton (1643–1727) and Tinbergen (1903–1994). Tap a face to go back to that person’s scene.",
    ],
    cta: "cast",
  },
  {
    k: ["Bên dòng sông Hậu", "By the Hậu River"],
    h: ["Câu hỏi tiếp theo bắt đầu từ bạn", "The next question starts with you"],
    p: [
      "Mở phòng thí nghiệm (laboratory) và ước lượng mô hình với dữ liệu của chính bạn.",
      "Open the laboratory and estimate the model with your own data.",
    ],
    cta: "lab",
  },
];

/** Lumina's script for each scene, VI then EN (narration.js). Read aloud by the browser. */
const NARRATION: Array<[string, string]> = [
  [
    "Chào mừng đến Gravity Lab. Cuộn để bay qua 9 cảnh, từ khu vườn của Newton đến đầu tư trực tiếp nước ngoài (FDI) vào Việt Nam. Chạm vào tôi ở bất kỳ cảnh nào để nghe giải thích ngắn.",
    "Welcome to Gravity Lab. Scroll to fly through nine scenes, from Newton’s orchard to foreign direct investment in Viet Nam. Tap me in any scene for a short explanation.",
  ],
  [
    "Định luật vạn vật hấp dẫn (law of universal gravitation) của Newton: lực giữa hai vật tăng theo tích khối lượng (masses) và giảm theo bình phương khoảng cách (distance).",
    "Newton’s law of universal gravitation: the force between two masses rises with their product and falls with the square of the distance between them.",
  ],
  [
    "Trong vật lý, số mũ (exponent) của khoảng cách cố định bằng 2. Khoảng cách tăng gấp đôi thì lực còn một phần tư. Chính điều này giữ cho quỹ đạo (orbit) khép kín.",
    "In physics the exponent on distance is fixed at two. Double the distance and the force falls to one quarter. This is what keeps planetary orbits closed.",
  ],
  [
    "Tinbergen áp dụng cùng dạng này cho thương mại (trade). Quy mô kinh tế (economic size) thay cho khối lượng, và số mũ khoảng cách gamma (γ) được ước lượng (estimated) từ dữ liệu thay vì cố định.",
    "Tinbergen applied the same form to trade. Economic size replaces mass, and the distance exponent gamma is estimated from data rather than fixed.",
  ],
  [
    "Với FDI vào Việt Nam, độ co giãn theo khoảng cách (distance elasticity) là −0,38: khoảng cách tăng 1% gắn với FDI giảm khoảng 0,38%.",
    "For FDI into Viet Nam, the distance elasticity is minus zero point three eight: a one percent increase in distance is associated with about zero point three eight percent less FDI.",
  ],
  [
    "Hệ số hiệp định thương mại tự do (FTA coefficient) là 1,01. Vì mô hình ở dạng log, tác động là e mũ 1,01 trừ 1, tức FDI cao hơn khoảng 174,6%.",
    "The free-trade agreement coefficient is one point zero one. Because the model is in logs, the effect is e to the one point zero one minus one, about one hundred seventy-five percent higher FDI.",
  ],
  [
    "Lấy log làm mất mọi quan sát bằng 0 (zero flows). Ước lượng Poisson giả hợp lý cực đại (PPML) ước lượng trên mức (levels), giữ lại các giá trị 0 và vẫn nhất quán (consistent) khi phương sai thay đổi (heteroskedasticity).",
    "Taking logs drops every zero flow. Poisson pseudo-maximum likelihood, or PPML, estimates the model in levels, keeps the zeros and remains consistent under heteroskedasticity.",
  ],
  [
    "Đây là phi hành đoàn (crew): bảy thành viên của lớp, cùng Newton và Tinbergen. Mỗi người mang một bước của lập luận.",
    "This is the crew: seven members of the class, with Newton and Tinbergen. Each one carries one step of the argument.",
  ],
  [
    "Giờ đến lượt bạn. Mở phòng thí nghiệm (laboratory) và ước lượng mô hình với dữ liệu của chính bạn.",
    "Now it is your turn. Open the laboratory and estimate the model with your own data.",
  ],
];

/** One host per scene, in scene order: each one leads the class through a step of the story. */
const HOSTS: Array<{ id: string; name: [string, string]; role: [string, string] }> = [
  { id: "lan-chi", name: ["Lan Chi", "Lan Chi"], role: ["Gọi cả lớp lên tàu", "Calls the class aboard"] },
  { id: "newton", name: ["Isaac Newton", "Isaac Newton"], role: ["1643–1727 · Principia, 1687", "1643–1727 · Principia, 1687"] },
  { id: "minh-long", name: ["Minh Long", "Minh Long"], role: ["Giữ số mũ (exponent) = 2", "Keeps the exponent at 2"] },
  { id: "tinbergen", name: ["Jan Tinbergen", "Jan Tinbergen"], role: ["1903–1994 · Mô hình hấp dẫn thương mại, 1962", "1903–1994 · Gravity model of trade, 1962"] },
  { id: "bao-ngoc", name: ["Bảo Ngọc", "Bảo Ngọc"], role: ["Khoảng cách (distance), β = −0,38", "Distance, β = −0.38"] },
  { id: "thu-ha", name: ["Thu Hà", "Thu Hà"], role: ["Vốn năm trước và FTA", "Last year’s capital and FTAs"] },
  { id: "gia-han", name: ["Gia Hân", "Gia Hân"], role: ["Những năm FDI = 0 (zero flows)", "Years with FDI = 0"] },
  { id: "tu", name: ["Thầy Tú Phan", "Lecturer Tú Phan"], role: ["Phan & Do (2019)", "Phan & Do (2019)"] },
  { id: "huong", name: ["Lumina", "Lumina"], role: ["Trợ giảng (teaching assistant) · câu hỏi của bạn", "Teaching assistant · your question"] },
];

const face = (id: string) => `${import.meta.env.BASE_URL}cast/v2/${id}-face.webp`;

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const INTRO_KEY = "gravity-lab:intro";
const LUMINA_KEY = "gravity-lab:lumina";

/** The hero apple's entrance for this visit: random, never the same twice in a row. */
function pickIntro(): number {
  let mode = Math.floor(Math.random() * 5);
  try {
    const last = Number(localStorage.getItem(INTRO_KEY) ?? -1);
    if (mode === last) mode = (mode + 1) % 5;
    localStorage.setItem(INTRO_KEY, String(mode));
  } catch {
    // Not remembered.
  }
  return mode;
}

// The splash shows once per page load, not on every return to the story tab.
let enteredAt: number | null = null;

const CARD =
  "journey-card w-full max-w-[440px] rounded-[30px] px-6 py-6 backdrop-blur-md transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:px-[26px]";

/** Journey colours per theme: graphite void, or warm bone sky in the light theme. */
const TONE = {
  dark: {
    sky: "bg-[#0a0b0d]",
    vignette: "bg-[radial-gradient(ellipse_70%_65%_at_50%_45%,transparent_35%,rgba(2,2,3,0.95)_100%)]",
    card: "bg-[linear-gradient(160deg,rgba(38,40,45,0.88),rgba(20,21,25,0.92))] text-[#f1ece2] shadow-[inset_0_-9px_0_rgba(0,0,0,0.3),inset_0_3px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(79,209,197,0.3),0_30px_60px_-20px_rgba(0,0,0,0.95)]",
    panel: "bg-[linear-gradient(160deg,rgba(38,40,45,0.96),rgba(20,21,25,0.98))] text-[#f1ece2] shadow-[inset_0_-8px_0_rgba(0,0,0,0.3),inset_-1px_-1px_0_rgba(79,209,197,0.3),0_30px_50px_-20px_rgba(0,0,0,0.95)]",
    splash: "bg-[radial-gradient(ellipse_60%_50%_at_50%_55%,rgba(10,11,13,0.2),rgba(2,2,3,0.92)_75%)] text-[#f1ece2]",
    kicker: "text-[#ffc56b]",
    teal: "text-[#4fd1c5]",
    body: "text-[#ddd6c8]",
    mist: "text-[#a8a297]",
    accent: "accent-[#4fd1c5]",
    dot: "bg-[#2a2c31] shadow-[inset_0_2px_3px_rgba(0,0,0,0.8)]",
    ring: "bg-[#f4ede1] ring-2 ring-[#4fd1c5]/60",
    well: "bg-[#0c0d10] text-[#ddd6c8] shadow-[inset_0_4px_10px_rgba(0,0,0,0.7)]",
  },
  light: {
    sky: "bg-[#ece5d8]",
    vignette: "bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(120,104,82,0.22)_100%)]",
    card: "bg-[linear-gradient(160deg,rgba(255,253,248,0.92),rgba(242,236,223,0.94))] text-[#1d1e22] shadow-[inset_0_-8px_0_rgba(40,34,26,0.08),inset_0_4px_0_rgba(255,255,255,0.9),inset_-1px_-1px_0_rgba(10,101,119,0.25),0_30px_50px_-24px_rgba(40,34,26,0.45)]",
    panel: "bg-[linear-gradient(160deg,rgba(255,253,248,0.97),rgba(242,236,223,0.98))] text-[#1d1e22] shadow-[inset_0_-8px_0_rgba(40,34,26,0.08),inset_-1px_-1px_0_rgba(10,101,119,0.25),0_30px_50px_-24px_rgba(40,34,26,0.45)]",
    splash: "bg-[radial-gradient(ellipse_60%_50%_at_50%_55%,rgba(236,229,216,0.3),rgba(236,229,216,0.95)_75%)] text-[#1d1e22]",
    kicker: "text-[#9a4a0c]",
    teal: "text-[#0a6577]",
    body: "text-[#3a3732]",
    mist: "text-[#55504a]",
    accent: "accent-[#0a6577]",
    dot: "bg-[#d8cfbe] shadow-[inset_0_2px_3px_rgba(40,34,26,0.35)]",
    ring: "bg-[#f4ede1] ring-2 ring-[#0a6577]/50",
    well: "bg-[#ebe4d6] text-[#3a3732] shadow-[inset_0_3px_7px_rgba(40,34,26,0.18)]",
  },
};

/**
 * The scroll journey: a pinned clay-3D space scene behind nine cards, then `children`
 * (the rest of the story) scrolling over it. three.js loads only here.
 */
export function SpaceJourney({
  onLab,
  onCast,
  children,
}: {
  onLab: () => void;
  onCast: () => void;
  children: ReactNode;
}) {
  const { lang, theme } = usePrefs();
  const light = theme === "light";
  const T = TONE[light ? "light" : "dark"];
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const sections = useRef<HTMLElement[]>([]);
  const vals = useRef<JourneyVals>({ n: 2, b: -0.38 });
  const handle = useRef<JourneyHandle | null>(null);
  const intro = useRef(pickIntro()).current;
  const [n, setN] = useState(2);
  const [b, setB] = useState(-0.38);
  const [scene, setScene] = useState(0);
  const [seen, setSeen] = useState<boolean[]>(() => SCENES.map((_, i) => i === 0));
  const [inJourney, setInJourney] = useState(true);
  const [hint, setHint] = useState(true);
  const [failed, setFailed] = useState(false);
  const [entered, setEntered] = useState(enteredAt !== null);
  const [splashGone, setSplashGone] = useState(enteredAt !== null);
  // Each scene is 1.3 viewports tall, measured on the scroller (the story pane, not the window).
  const [paneH, setPaneH] = useState(0);
  const calm = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  ).current;

  useEffect(() => {
    const el = host.current;
    const sc = scroller.current;
    if (!el || !sc) return;
    if (!webgl()) {
      setFailed(true);
      return;
    }
    let gone = false;
    import("@/lib/journey3d")
      .then(({ mountJourney }) => {
        if (gone) return;
        handle.current = mountJourney(el, {
          scroller: sc,
          sections: () => sections.current.filter(Boolean),
          vals: vals.current,
          faces: HOSTS.map((h) => face(h.id)),
          calm,
          light,
          intro,
          enteredAt: () => enteredAt,
          onScene: setScene,
        });
      })
      .catch(() => setFailed(true));
    // Cards fade in as they enter; the 3D scene sleeps once the story text covers it.
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          const i = Number((e.target as HTMLElement).dataset.i);
          if (e.isIntersecting) setSeen((s) => (s[i] ? s : s.map((v, j) => (j === i ? true : v))));
        }),
      { root: sc, threshold: 0.3 },
    );
    sections.current.forEach((s) => s && io.observe(s));
    const onScroll = () => {
      setHint(sc.scrollTop < 40);
      const last = sections.current[sections.current.length - 1];
      const on = !last || sc.scrollTop < last.offsetTop + last.offsetHeight;
      setInJourney(on);
      handle.current?.setActive(on && !document.hidden);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => setPaneH(sc.clientHeight));
    ro.observe(sc);
    const onVis = () => handle.current?.setActive(!document.hidden && inJourneyRef());
    const inJourneyRef = () => {
      const last = sections.current[sections.current.length - 1];
      return !last || sc.scrollTop < last.offsetTop + last.offsetHeight;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      gone = true;
      io.disconnect();
      ro.disconnect();
      sc.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      handle.current?.dispose();
      handle.current = null;
    };
  }, [calm, light, intro]);

  // The splash: Enter, Space or the button lets the visitor in; the 3D camera then glides in.
  useEffect(() => {
    if (entered) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        enter();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  function enter() {
    if (enteredAt !== null) return;
    enteredAt = performance.now();
    setEntered(true);
    handle.current?.poke();
    window.setTimeout(() => setSplashGone(true), 1600);
  }

  const setVal = (k: keyof JourneyVals, v: number) => {
    vals.current[k] = v;
    if (k === "n") setN(v);
    else setB(v);
    handle.current?.poke();
  };

  const go = (i: number) => {
    const sc = scroller.current;
    const s = sections.current[i];
    if (sc && s) sc.scrollTo({ top: s.offsetTop + sc.clientHeight * 0.15, behavior: calm ? "auto" : "smooth" });
  };

  const L = lang === "vi" ? 0 : 1;
  const num = (v: number) => fmt(v, 2);
  // UI fades in 1.2 s after entering, as the camera settles.
  const ui = "transition-opacity duration-[2000ms] delay-[1200ms] " + (entered ? "opacity-100" : "opacity-0");
  const [luOpen, setLuOpen] = useState(false);

  return (
    <div className={"absolute inset-0 " + T.sky + (luOpen ? " lu-open" : "")}>
      <div ref={host} aria-hidden="true" className="absolute inset-0" />
      <div
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 " + T.vignette}
      />
      <div aria-hidden="true" className="noir-grain pointer-events-none absolute inset-0" />
      <div ref={scroller} className="absolute inset-0 overflow-y-auto">
        <div className={"relative z-[2] " + ui}>
          {SCENES.map((s, i) => {
            const right = i % 2 === 1;
            const formula =
              s.slider?.id === "n"
                ? `F ∝ 1 / r^${num(n)}`
                : s.slider?.id === "b"
                  ? tr(`Xa thêm 1% → FDI ${b < 0 ? "−" : ""}${fmt(Math.abs(b), 2)}%`, `1% farther → FDI ${b < 0 ? "−" : ""}${fmt(Math.abs(b), 2)}%`)
                  : s.f?.[L];
            const Heading = i === 0 ? "h2" : "h3";
            return (
              <section
                key={i}
                ref={(el) => {
                  if (el) sections.current[i] = el;
                }}
                data-i={i}
                style={{ minHeight: paneH ? paneH * 1.3 : undefined }}
                aria-label={tr(`Cảnh ${i + 1}`, `Scene ${i + 1}`)}
                className={
                  "flex min-h-[130vh] items-end justify-center ps-4 pe-10 pb-[12vh] min-[700px]:items-center min-[700px]:px-[clamp(16px,6vw,96px)] min-[700px]:pe-[clamp(40px,6vw,96px)] min-[700px]:pb-0 " +
                  (right ? "min-[700px]:justify-end" : "min-[700px]:justify-start")
                }
              >
                <div className={CARD + " " + T.card + (seen[i] || failed ? " opacity-100" : " translate-y-10 scale-[0.96] opacity-0")}>
                  <div className="mb-4 flex items-center gap-3">
                    <img
                      src={face(HOSTS[i]!.id)}
                      alt=""
                      width={48}
                      height={48}
                      loading={i < 2 ? "eager" : "lazy"}
                      className={"size-12 shrink-0 rounded-full object-cover " + T.ring}
                    />
                    <p className="min-w-0 leading-tight">
                      <span className="block text-[15px] font-semibold">{HOSTS[i]!.name[L]}</span>
                      <span className={"block text-xs " + T.mist}>{HOSTS[i]!.role[L]}</span>
                    </p>
                  </div>
                  <p className={"text-xs font-semibold tracking-[0.14em] uppercase " + T.kicker}>{s.k[L]}</p>
                  <Heading
                    className={
                      "mt-2.5 font-serif leading-[1.04] tracking-[-0.03em] text-balance " +
                      (i === 0 ? "text-[clamp(40px,6vw,76px)]" : "text-[clamp(30px,4vw,48px)]")
                    }
                  >
                    {s.h[L]}
                  </Heading>
                  {formula ? (
                    <p className={"mt-3 font-math text-[22px] whitespace-nowrap " + T.teal} aria-live={s.slider ? "polite" : undefined}>
                      {formula}
                    </p>
                  ) : null}
                  <p className={"mt-3 text-base leading-[1.65] text-pretty " + T.body}>{s.p[L]}</p>
                  {s.slider ? (
                    <label className="mt-3.5 grid grid-cols-[auto_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                      <span className="whitespace-nowrap">{s.slider.label[L]}</span>
                      <input
                        type="range"
                        min={s.slider.min}
                        max={s.slider.max}
                        step={s.slider.step}
                        value={s.slider.id === "n" ? n : b}
                        onChange={(e) => setVal(s.slider!.id, Number(e.target.value))}
                        className={"h-7 w-full " + T.accent}
                      />
                      <output className={"text-right tabular-nums " + T.teal}>{num(s.slider.id === "n" ? n : b)}</output>
                    </label>
                  ) : null}
                  {s.c ? <p className={"mt-2.5 text-xs " + T.mist}>{s.c}</p> : null}
                  {s.cta === "cast" ? (
                    <ul className="mt-4 grid grid-cols-9 gap-1" aria-label={tr("Cả lớp", "The class")}>
                      {HOSTS.map((h, j) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => go(j)}
                            title={h.name[L]}
                            aria-label={tr(`${h.name[0]}, cảnh ${j + 1}`, `${h.name[1]}, scene ${j + 1}`)}
                            className="block w-full rounded-full"
                          >
                            <img src={face(h.id)} alt="" loading="lazy" className={"aspect-square w-full rounded-full object-cover " + T.ring} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {s.cta ? (
                    <button
                      type="button"
                      onClick={s.cta === "lab" ? onLab : onCast}
                      className="cosmic-btn mt-[18px] inline-flex min-h-[52px] items-center rounded-full px-[22px] font-semibold"
                    >
                      {s.cta === "lab" ? tr("Vào phòng thí nghiệm →", "Enter the lab →") : tr("Gặp cả lớp →", "Meet the class →")}
                    </button>
                  ) : null}
                </div>
              </section>
            );
          })}
        </div>
        <div className="relative z-[2]">{children}</div>
      </div>
      {inJourney ? (
        <nav
          aria-label={tr("Các cảnh", "Scenes")}
          className={"absolute top-1/2 right-[clamp(8px,2vw,28px)] z-[3] flex -translate-y-1/2 flex-col gap-1 " + ui}
        >
          {SCENES.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={tr(`Cảnh ${i + 1}: ${s.h[0]}`, `Scene ${i + 1}: ${s.h[1]}`)}
              aria-current={scene === i ? "step" : undefined}
              className="flex min-h-6 min-w-6 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={
                  "block w-3 transition-all duration-300 " +
                  (scene === i
                    ? "h-[34px] rounded-[9px] bg-[radial-gradient(circle_at_36%_25%,#d3f6f1,#4fd1c5_48%,#1fa294)] shadow-[inset_0_-3px_0_rgba(0,0,0,0.28)]"
                    : "h-3 rounded-full " + T.dot)
                }
              />
            </button>
          ))}
        </nav>
      ) : null}
      {inJourney ? <Lumina scene={scene} open={luOpen} setOpen={setLuOpen} T={T} entered={entered} /> : null}
      <p
        aria-hidden="true"
        className={
          "pointer-events-none absolute bottom-5 left-1/2 z-[3] -translate-x-1/2 text-[13px] whitespace-nowrap transition-opacity duration-500 max-[699px]:hidden " +
          T.mist +
          " " +
          (hint && entered ? "opacity-100" : "opacity-0")
        }
      >
        {tr("Cuộn để bay ↓", "Scroll to fly ↓")}
      </p>
      {splashGone ? null : (
        <div
          className={
            "absolute inset-0 z-[5] flex items-center justify-center p-6 text-center backdrop-blur-[2px] transition-[opacity,backdrop-filter] duration-[1600ms] " +
            T.splash +
            (entered ? " pointer-events-none opacity-0 backdrop-blur-0" : "")
          }
        >
          <div className="flex max-w-[640px] flex-col items-center gap-[18px] motion-safe:animate-[splash-in_2.4s_cubic-bezier(0.2,0.8,0.2,1)_both]">
            <p className={"text-xs font-semibold tracking-[0.2em] uppercase " + T.kicker}>
              {tr("Gravity Lab · Đại học Cần Thơ", "Gravity Lab · Can Tho University")}
            </p>
            <h2 className="font-serif text-[clamp(34px,5.4vw,64px)] leading-[1.06] tracking-[-0.03em] text-balance">
              {tr("Đâu đó trong bóng tối, một quả táo bắt đầu rơi.", "Somewhere in the dark, an apple begins to fall.")}
            </h2>
            <button
              type="button"
              onClick={enter}
              className="cosmic-btn inline-flex min-h-14 items-center rounded-full px-[30px] text-base font-semibold shadow-[0_0_60px_-10px_rgba(79,209,197,0.7)]"
            >
              {tr("Bước vào vũ trụ", "Enter the cosmos")}
            </button>
            <p className={"text-[13px] " + T.mist}>
              {tr("Nên dùng tai nghe · âm vũ trụ từ tần số các hành tinh", "Headphones recommended · cosmic tones from planetary frequencies")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** "Lumina explains": her script for the current scene, read aloud on request, placed opposite the card. */
function Lumina({
  scene,
  open,
  setOpen,
  T,
  entered,
}: {
  scene: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  T: (typeof TONE)["dark"];
  entered: boolean;
}) {
  const { lang } = usePrefs();
  const [speaking, setSpeaking] = useState(false);
  const [pulse, setPulse] = useState(() => {
    try {
      return !localStorage.getItem(LUMINA_KEY);
    } catch {
      return false;
    }
  });
  const L = lang === "vi" ? 0 : 1;
  const text = NARRATION[Math.max(0, Math.min(8, scene))]![L];
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;
  // Cards sit left on even scenes, so Lumina sits right there, and the other way round.
  const right = scene % 2 === 0;

  const stop = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  const speak = () => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "vi" ? "vi-VN" : "en-US";
    u.rate = 0.95;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };
  // A new scene or language while she is talking: she moves on to that text.
  useEffect(() => {
    if (speaking) speak();
  }, [scene, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (open) {
      stop();
      setOpen(false);
      return;
    }
    if (pulse) {
      setPulse(false);
      try {
        localStorage.setItem(LUMINA_KEY, "1");
      } catch {
        // Not remembered.
      }
    }
    setOpen(true);
  };

  const sideClass = right ? "max-[699px]:right-3 min-[700px]:right-[clamp(48px,5vw,72px)]" : "max-[699px]:right-3 min-[700px]:left-[clamp(12px,2vw,28px)]";
  const ui = "transition-[opacity,left,right] duration-500 " + (entered ? "opacity-100" : "opacity-0");
  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls="lumina-panel"
        className={
          "absolute z-[4] flex min-h-14 items-center gap-2.5 rounded-full py-1.5 pr-[18px] pl-1.5 text-sm font-semibold whitespace-nowrap max-[699px]:top-3 max-[699px]:pr-1.5 min-[700px]:bottom-[22px] " +
          T.panel +
          " " +
          sideClass +
          " " +
          ui +
          (pulse ? " lu-pulse" : "")
        }
      >
        <img src={face("huong")} alt="" width={44} height={44} className={"size-11 rounded-full object-cover " + T.ring} />
        <span className="max-[699px]:sr-only">{tr("Lumina giải thích", "Lumina explains")}</span>
      </button>
      {open ? (
        <div
          id="lumina-panel"
          role="dialog"
          aria-label="Lumina"
          className={
            "absolute z-[4] w-[min(380px,calc(100vw-24px))] rounded-[24px] px-5 py-[18px] max-[699px]:inset-x-3 max-[699px]:top-[76px] max-[699px]:w-auto min-[700px]:bottom-[90px] " +
            T.panel +
            " " +
            sideClass +
            " " +
            ui
          }
        >
          <div className="flex items-center gap-2">
            <b className={"flex-1 text-xs font-semibold tracking-[0.12em] uppercase " + T.kicker}>
              {tr("Cảnh", "Scene")} {scene + 1} / 9
            </b>
            <button
              type="button"
              onClick={toggle}
              aria-label={tr("Đóng", "Close")}
              className={"inline-flex min-h-11 min-w-11 items-center justify-center rounded-full " + T.well}
            >
              <X className="size-4" />
            </button>
          </div>
          <p className={"mt-2.5 text-[15px] leading-[1.6] text-pretty " + T.body} aria-live="polite">
            {text}
          </p>
          {canSpeak ? (
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={speaking ? stop : speak}
                aria-pressed={speaking}
                className="cosmic-btn inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold"
              >
                <Volume2 className="size-4" />
                {speaking ? tr("Dừng", "Stop") : tr("Nghe", "Listen")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
