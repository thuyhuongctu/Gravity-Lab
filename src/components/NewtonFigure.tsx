import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Image as ImageIcon } from "lucide-react";
import { tr } from "@/lib/prefs";

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Newton in 3D, built in code; three.js loads only when this is shown. */
function Newton3D({ onFail }: { onFail: () => void }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (!webgl()) {
      onFail();
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
    import("@/lib/newton3d")
      .then(({ mountNewton }) => {
        if (gone) return;
        handle = mountNewton(el, { still });
        sync();
      })
      .catch(onFail);
    return () => {
      gone = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      handle?.dispose();
    };
  }, [onFail]);
  return (
    <div
      ref={host}
      role="img"
      aria-label={tr(
        "Mô hình 3D Isaac Newton bằng đất sét: tóc giả xoăn, áo choàng nâu, cravat trắng, tay cầm quả táo. Kéo ngang để xoay.",
        "3D clay model of Isaac Newton: curled wig, brown coat, white cravat, holding an apple. Drag sideways to turn.",
      )}
      className="clay-card aspect-[3/4] w-full cursor-grab rounded-card bg-[#f1e8de] active:cursor-grabbing"
    />
  );
}

/** The clay portrait, with a switch to a 3D model of the same figure. */
export function NewtonFigure({ src }: { src: string }) {
  const [three, setThree] = useState(false);
  const [failed, setFailed] = useState(false);
  const fail = useCallback(() => setFailed(true), []);
  const show3d = three && !failed;
  return (
    <div>
      {show3d ? (
        <Newton3D onFail={fail} />
      ) : (
        <img
          src={src}
          alt={tr(
            "Isaac Newton cầm quả táo, tạo hình đất sét theo chân dung của Godfrey Kneller (1689)",
            "Isaac Newton holding an apple, a clay figure after Godfrey Kneller's 1689 portrait",
          )}
          width={448}
          height={600}
          className="clay-card aspect-[3/4] w-full rounded-card bg-[#f1e8de] object-contain"
        />
      )}
      {failed ? null : (
        <button
          type="button"
          onClick={() => setThree((v) => !v)}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium"
        >
          {three ? <ImageIcon className="size-4" aria-hidden="true" /> : <Box className="size-4" aria-hidden="true" />}
          {three ? tr("Xem ảnh", "Show photo") : tr("Xem 3D", "View in 3D")}
        </button>
      )}
    </div>
  );
}
