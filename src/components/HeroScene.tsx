import { useEffect, useRef, useState } from "react";
import { tr } from "@/lib/prefs";

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Live 3D hero: loads three.js on demand, pauses off screen, falls back to the clay map. */
export function HeroScene() {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!webgl()) {
      setFailed(true);
      return;
    }
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let handle: { dispose: () => void; setActive: (on: boolean) => void } | null = null;
    let gone = false;
    let seen = true;
    const sync = () => handle?.setActive(seen && !document.hidden);
    const io = new IntersectionObserver(([e]) => {
      seen = !!e?.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    import("@/lib/hero3d")
      .then(({ mountHero }) => {
        if (gone) return;
        handle = mountHero(el, { still });
        sync();
      })
      .catch(() => setFailed(true));
    return () => {
      gone = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      handle?.dispose();
    };
  }, []);

  if (failed)
    return (
      <img
        src={`${import.meta.env.BASE_URL}noir/vietnam.webp`}
        alt=""
        className="size-full object-cover opacity-70"
      />
    );
  return (
    <div
      ref={host}
      role="img"
      aria-label={tr(
        "Mô hình 3D: Trái Đất bằng đất sét với Việt Nam phát sáng, Mặt Trăng và quả táo của Newton bay trên quỹ đạo, các dòng vốn FDI từ Hàn Quốc, Nhật Bản, Singapore, Đài Loan, Hồng Kông, Trung Quốc, Úc, Hoa Kỳ, Pháp và Đức chảy về Việt Nam. Kéo để xoay.",
        "3D model: a clay Earth with Vietnam lit, the Moon and Newton's apple on orbits, and FDI flows from Korea, Japan, Singapore, Taiwan, Hong Kong, China, Australia, the United States, France and Germany into Vietnam. Drag to turn.",
      )}
      className="size-full cursor-grab active:cursor-grabbing"
    />
  );
}
