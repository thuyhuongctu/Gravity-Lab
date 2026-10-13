import { useEffect, useRef, useState, type ReactNode } from "react";
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

/** The nine scenes (design handoff, content.js), with sources. */
const SCENES: Scene[] = [
  {
    k: ["Gravity Lab · Đại học Cần Thơ", "Gravity Lab · Can Tho University"],
    h: ["Từ một quả táo rơi", "From a falling apple"],
    p: [
      "Cuộn để bay cùng lớp học, từ khu vườn của Newton đến dòng vốn FDI chảy về Việt Nam.",
      "Scroll to fly with the class, from Newton's orchard to the FDI flowing into Việt Nam.",
    ],
  },
  {
    k: ["Woolsthorpe · 1666", "Woolsthorpe · 1666"],
    h: ["Lực kéo quả táo cũng giữ Mặt Trăng", "The pull on the apple also holds the Moon"],
    f: ["F = G·m₁m₂ / r²", "F = G·m₁m₂ / r²"],
    p: [
      "Hai khối lượng hút nhau; lực yếu dần theo bình phương khoảng cách.",
      "Two masses attract; the pull fades with the square of the distance.",
    ],
    c: "Newton (1687/1999)",
  },
  {
    k: ["Số mũ = 2", "Exponent = 2"],
    h: ["Thử đổi số mũ", "Try changing the exponent"],
    p: [
      "Với n = 2, quỹ đạo khép kín. Kéo thanh trượt: n khác 2 làm quỹ đạo xoay thành hình hoa hồng.",
      "At n = 2 the orbit closes. Drag the slider: any other n makes the orbit precess into a rosette.",
    ],
    c: "Newton (1687/1999)",
    slider: { id: "n", min: 1.5, max: 2.8, step: 0.01, label: ["Số mũ n", "Exponent n"] },
  },
  {
    k: ["Tinbergen · 1962", "Tinbergen · 1962"],
    h: ["Khối lượng thành quy mô kinh tế", "Mass becomes economic size"],
    f: ["Tᵢⱼ = G·YᵢYⱼ / Dᵢⱼᵞ", "Tᵢⱼ = G·YᵢYⱼ / Dᵢⱼᵞ"],
    p: [
      "Nền kinh tế lớn giao thương nhiều hơn; khoảng cách vẫn cản trở. Số mũ γ giờ được ước lượng từ dữ liệu.",
      "Bigger economies trade more; distance still resists. The exponent γ is now estimated from data.",
    ],
    c: "Tinbergen (1962)",
  },
  {
    k: ["FDI vào Việt Nam · 2006–2015", "FDI into Việt Nam · 2006–2015"],
    h: ["Khoảng cách và dòng vốn", "Distance and capital"],
    p: [
      "Kéo β để xem dòng vốn quanh Việt Nam thay đổi. Ước lượng của bài: xa thêm 1%, FDI giảm 0,38%.",
      "Drag β to see capital around Việt Nam change. The paper's estimate: 1% farther, 0.38% less FDI.",
    ],
    c: "Phan & Do (2019)",
    slider: { id: "b", min: -1, max: 0, step: 0.01, label: ["Hệ số β", "Coefficient β"] },
  },
  {
    k: ["Hiệp định thương mại tự do", "Free-trade agreements"],
    h: ["Một FTA kéo vốn lại gần", "An FTA pulls capital closer"],
    f: ["β = 1,01 → +174,6%", "β = 1.01 → +174.6%"],
    p: [
      "Có FTA, dòng FDI cao hơn khoảng 174,6% trong năm đầu; về dài hạn, chia cho 1 − 0,45, khoảng 527%.",
      "With an FTA, FDI is about 174.6% higher in the first year; in the long run, divided by 1 − 0.45, about 527%.",
    ],
    c: "Phan & Do (2019)",
  },
  {
    k: ["PPML", "PPML"],
    h: ["Những năm bằng 0 vẫn được giữ lại", "Years with zero still count"],
    f: ["FDI = 0 → PPML", "FDI = 0 → PPML"],
    p: [
      "Ước lượng trên mức thay vì log giúp dùng toàn bộ mẫu.",
      "Estimating on levels instead of logs keeps the whole sample.",
    ],
    c: "Santos Silva & Tenreyro (2006)",
  },
  {
    k: ["Phi hành đoàn", "The crew"],
    h: ["Chín người, một câu hỏi", "Nine people, one question"],
    p: [
      "Lumina, Minh Long, Lan Chi, Bảo Ngọc, Thu Hà, Gia Hân, thầy Tú, cùng Newton và Tinbergen.",
      "Lumina, Minh Long, Lan Chi, Bảo Ngọc, Thu Hà, Gia Hân and lecturer Tú, with Newton and Tinbergen.",
    ],
    cta: "cast",
  },
  {
    k: ["Bên dòng sông Hậu", "By the Hậu River"],
    h: ["Câu hỏi tiếp theo bắt đầu từ bạn", "The next question starts with you"],
    p: ["Mở phòng thí nghiệm và ước lượng với dữ liệu của chính bạn.", "Open the lab and estimate with your own data."],
    cta: "lab",
  },
];

const CREW = ["huong", "minh-long", "lan-chi", "bao-ngoc", "tu", "thu-ha", "gia-han", "newton", "tinbergen"].map(
  (id) => `${import.meta.env.BASE_URL}cast/v2/${id}.webp`,
);

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const CARD =
  "w-full max-w-[440px] rounded-[30px] px-6 py-6 backdrop-blur-md transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] sm:px-[26px]";

/** Journey colours per theme: graphite void, or warm bone sky in the light theme. */
const TONE = {
  dark: {
    sky: "bg-[#0a0b0d]",
    vignette: "bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(4,4,5,0.9)_100%)]",
    card: "bg-[linear-gradient(160deg,rgba(38,40,45,0.88),rgba(20,21,25,0.92))] text-[#f1ece2] shadow-[inset_0_-9px_0_rgba(0,0,0,0.3),inset_0_3px_0_rgba(255,255,255,0.07),inset_-1px_-1px_0_rgba(79,209,197,0.3),0_30px_60px_-20px_rgba(0,0,0,0.95)]",
    kicker: "text-[#ffc56b]",
    teal: "text-[#4fd1c5]",
    body: "text-[#ddd6c8]",
    mist: "text-[#a8a297]",
    accent: "accent-[#4fd1c5]",
    dot: "bg-[#2a2c31] shadow-[inset_0_2px_3px_rgba(0,0,0,0.8)]",
  },
  light: {
    sky: "bg-[#ece5d8]",
    vignette: "bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(120,104,82,0.22)_100%)]",
    card: "bg-[linear-gradient(160deg,rgba(255,253,248,0.92),rgba(242,236,223,0.94))] text-[#1d1e22] shadow-[inset_0_-8px_0_rgba(40,34,26,0.08),inset_0_4px_0_rgba(255,255,255,0.9),inset_-1px_-1px_0_rgba(10,101,119,0.25),0_30px_50px_-24px_rgba(40,34,26,0.45)]",
    kicker: "text-[#9a4a0c]",
    teal: "text-[#0a6577]",
    body: "text-[#3a3732]",
    mist: "text-[#55504a]",
    accent: "accent-[#0a6577]",
    dot: "bg-[#d8cfbe] shadow-[inset_0_2px_3px_rgba(40,34,26,0.35)]",
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
  const [n, setN] = useState(2);
  const [b, setB] = useState(-0.38);
  const [scene, setScene] = useState(0);
  const [seen, setSeen] = useState<boolean[]>(() => SCENES.map((_, i) => i === 0));
  const [inJourney, setInJourney] = useState(true);
  const [hint, setHint] = useState(true);
  const [failed, setFailed] = useState(false);
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
          calm,
          light,
          crew: CREW,
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
  }, [calm, light]);

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

  return (
    <div className={"absolute inset-0 " + T.sky}>
      <div ref={host} aria-hidden="true" className="absolute inset-0" />
      <div
        aria-hidden="true"
        className={"pointer-events-none absolute inset-0 " + T.vignette}
      />
      <div ref={scroller} className="absolute inset-0 overflow-y-auto">
        <div className="relative z-[2]">
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
          className="absolute top-1/2 right-[clamp(8px,2vw,28px)] z-[3] flex -translate-y-1/2 flex-col gap-1"
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
      <p
        aria-hidden="true"
        className={
          "pointer-events-none absolute bottom-5 left-1/2 z-[3] -translate-x-1/2 text-[13px] whitespace-nowrap transition-opacity duration-500 " +
          T.mist +
          " " +
          (hint ? "opacity-100" : "opacity-0")
        }
      >
        {tr("Cuộn để bay ↓", "Scroll to fly ↓")}
      </p>
    </div>
  );
}
