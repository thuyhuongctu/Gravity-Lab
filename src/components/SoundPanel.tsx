import { useEffect, useRef, useState } from "react";
import { Music, Play, X } from "lucide-react";
import {
  PLANETS,
  planetTone,
  playPlanets,
  setAmbient,
  setOrbitSound,
  setVolume,
} from "@/lib/sound";
import { useSound } from "@/lib/use-sound";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

function Toggle({
  on,
  onChange,
  label,
  hint,
}: {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-start gap-3 py-2">
      <input
        type="checkbox"
        className="mt-1 size-5 shrink-0 accent-[var(--color-teal)]"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs leading-relaxed text-muted">{hint}</span>
      </span>
    </label>
  );
}

/** Header button and panel: space ambience, orbit sonification, planetary frequencies. */
export function SoundPanel() {
  usePrefs();
  const sound = useSound();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const playing = sound.ambient || sound.orbit || sound.chord;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={tr("Âm thanh và âm nhạc", "Sound and music")}
        className={
          "inline-flex min-h-11 min-w-11 items-center justify-center rounded-full " +
          (playing ? "bg-teal-2 text-void" : "bg-void-2 text-paper")
        }
      >
        <Music className="size-4" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={tr("Âm thanh", "Sound")}
          className="surface fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-card border border-line bg-paper p-4 text-ink shadow-2xl sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between">
            <p className="font-serif text-lg">{tr("Âm thanh vũ trụ", "Sounds of space")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr("Đóng", "Close")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>

          <Toggle
            on={sound.ambient}
            onChange={setAmbient}
            label={tr("Nhạc nền không gian", "Space ambience")}
            hint={tr(
              "Hợp âm quãng năm trầm, tiếng gió Mặt Trời và những nốt sao lấp lánh, tổng hợp ngay trong trình duyệt.",
              "A low open fifth, a solar wind and the odd twinkling star, synthesised in the browser.",
            )}
          />
          <Toggle
            on={sound.orbit}
            onChange={setOrbitSound}
            label={tr("Âm thanh quỹ đạo", "Orbit sonification")}
            hint={tr(
              "Trong phòng Quỹ đạo, mỗi thiên thể hát một nốt theo tốc độ góc quanh vật nặng nhất: quỹ đạo càng gần càng cao (định luật Kepler thứ ba). Cao độ làm tròn về thang ngũ cung; thêm vật là tiếng chuông, va chạm là tiếng trầm.",
              "In the Orbit room, each body sings a note set by its angular speed around the heaviest body: closer orbits sing higher (Kepler's third law). Pitches are rounded to a pentatonic scale; a new body rings, a merger thuds.",
            )}
          />
          <label className="mt-1 block text-sm font-medium">
            {tr("Âm lượng", "Volume")} · {fmtInt(sound.volume * 100)}%
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={sound.volume}
              onChange={(e) => setVolume(Number(e.target.value))}
            />
          </label>

          <div className="mt-3 border-t border-line pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {tr("Tần số các hành tinh", "Planetary frequencies")}
              </p>
              <button
                type="button"
                disabled={sound.chord}
                onClick={() => playPlanets(setNote)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium disabled:opacity-50"
              >
                <Play className="size-4" />
                {tr("Nghe", "Listen")}
              </button>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {tr(
                "Mỗi hành tinh quay một vòng trong một chu kỳ, tức một tần số rất thấp. Nhân đôi tần số nhiều lần (nâng nhiều quãng tám) cho tới khi tai nghe được; nhân đôi giữ nguyên tên nốt, nên tỷ lệ giữa các hành tinh vẫn còn. Ý tưởng “hòa âm của các thiên cầu” có từ Kepler (1619/1997).",
                "Each planet goes round once per period: a very low frequency. Doubling it again and again (raising it by octaves) brings it into hearing; doubling keeps the note name, so the ratios between planets survive. The idea of a harmony of the spheres goes back to Kepler (1619/1997).",
              )}
            </p>
            <table className="mt-2 w-full text-left text-xs tabular-nums">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 font-medium">{tr("Hành tinh", "Planet")}</th>
                  <th className="py-1 text-right font-medium">
                    {tr("Chu kỳ (ngày)", "Period (days)")}
                  </th>
                  <th className="py-1 text-right font-medium">{tr("Quãng tám", "Octaves")}</th>
                  <th className="py-1 text-right font-medium">Hz</th>
                </tr>
              </thead>
              <tbody>
                {PLANETS.map((p, i) => {
                  const t = planetTone(p.days);
                  const lit = note === i || note === -1;
                  return (
                    <tr
                      key={p.id}
                      className={
                        "border-t border-line transition-colors " + (lit ? "bg-teal/15" : "")
                      }
                    >
                      <td className="py-1">{tr(p.vi, p.en)}</td>
                      <td className="py-1 text-right">{fmt(p.days, p.days < 1000 ? 1 : 0)}</td>
                      <td className="py-1 text-right">+{t.octaves}</td>
                      <td className="py-1 text-right">{fmt(t.hz, 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-muted">
              {tr(
                "Chu kỳ quỹ đạo: NASA Planetary Fact Sheet (Williams, n.d.).",
                "Orbital periods: NASA Planetary Fact Sheet (Williams, n.d.).",
              )}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
