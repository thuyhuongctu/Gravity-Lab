import { useEffect, useState } from "react";
import { tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

const KEY = "gravity-lab:onboarded";

/** Three steps on the first visit (design handoff, GL Play Store 1a–1c). VI then EN. */
const STEPS: Array<{ k: [string, string]; h: [string, string]; p: [string, string]; img: string; pos: string }> = [
  {
    k: ["Từ một quả táo rơi", "From a falling apple"],
    h: ["Lực giữ Mặt Trăng cũng kéo dòng vốn (capital flows)", "The force that holds the Moon also pulls capital"],
    p: [
      "Học mô hình lực hấp dẫn (gravity model), từ định luật Newton đến đầu tư trực tiếp nước ngoài (FDI) vào Việt Nam, qua 9 cảnh 3D.",
      "Learn the gravity model, from Newton’s law to foreign direct investment (FDI) in Viet Nam, across nine 3D scenes.",
    ],
    img: "telescope-orbits",
    pos: "50% 40%",
  },
  {
    k: ["Thực hành (hands-on)", "Hands-on"],
    h: ["Thay đổi một tham số (parameter), quan sát quỹ đạo (orbit) thay đổi", "Change one parameter, watch the orbit respond"],
    p: [
      "Mô phỏng quỹ đạo (orbit simulator), hệ số FDI năm 2019 (coefficients) và bài hát chủ đề — miễn phí, dùng được ngoại tuyến (offline) sau lần mở đầu.",
      "Orbit simulator, 2019 FDI coefficients and the theme song — free, and available offline after the first visit.",
    ],
    img: "apple-compass",
    pos: "50% 50%",
  },
  {
    k: ["Lumina · Trợ giảng (teaching assistant)", "Lumina · Teaching assistant"],
    h: ["Hỏi bất cứ điều gì, kèm nguồn trích dẫn (sources)", "Ask anything, with sources"],
    p: [
      "Lumina trả lời từ chính các tài liệu trong app, ngay trên thiết bị của bạn; không câu hỏi nào được gửi đi. Trong câu chuyện, chạm vào ảnh Lumina để nghe giải thích từng cảnh.",
      "Lumina answers from the app’s own references, on your device; no question leaves it. In the story, tap Lumina’s portrait to hear each scene explained.",
    ],
    img: "lumina-minh-long",
    pos: "50% 30%",
  },
];

/** Shown once per browser; "Skip" and the last "Start learning" both remember it. */
export function Onboarding() {
  const { lang } = usePrefs();
  const L = lang === "vi" ? 0 : 1;
  const [open, setOpen] = useState(() => {
    try {
      return !localStorage.getItem(KEY);
    } catch {
      return false;
    }
  });
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") done();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });
  function done() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Not remembered: it shows again next time.
    }
    setOpen(false);
  }
  if (!open) return null;
  const s = STEPS[i]!;
  const last = i === STEPS.length - 1;
  return (
    <div className="surface fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(2,2,3,0.8)] p-4 text-ink backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboard-h"
        className="noir-card flex w-full max-w-[420px] flex-col overflow-hidden rounded-[30px]"
      >
        <div className="relative">
          <img
            src={`${import.meta.env.BASE_URL}scene/${s.img}.webp`}
            alt=""
            width={600}
            height={448}
            style={{ objectPosition: s.pos }}
            className="aspect-[4/3] w-full bg-[#0a0b0d] object-cover"
          />
          <button
            type="button"
            onClick={done}
            className="noir-raise absolute top-3 right-3 inline-flex min-h-10 items-center rounded-full px-3.5 text-xs font-semibold text-ink"
          >
            {tr("Bỏ qua", "Skip")}
          </button>
          <div className="absolute bottom-3 left-4 flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, k) => (
              <span key={k} className={"h-1.5 rounded-full transition-all " + (k === i ? "w-[22px] bg-[#4fd1c5]" : "w-1.5 bg-[#a8a297]/60")} />
            ))}
          </div>
        </div>
        <div className="p-5">
          <p className="kicker text-amber">
            {s.k[L]} · {i + 1}/{STEPS.length}
          </p>
          <h2 id="onboard-h" className="mt-2 font-serif text-2xl leading-tight tracking-[-0.02em]">
            {s.h[L]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.p[L]}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setI((v) => Math.max(0, v - 1))}
              disabled={i === 0}
              className="noir-raise min-h-11 rounded-full px-4 text-sm font-semibold text-ink disabled:opacity-40"
            >
              {tr("Quay lại", "Back")}
            </button>
            <button
              type="button"
              onClick={() => (last ? done() : setI((v) => v + 1))}
              className="cosmic-btn min-h-11 rounded-full px-5 text-sm font-semibold"
            >
              {last ? tr("Bắt đầu học", "Start learning") : tr("Tiếp tục", "Continue")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
