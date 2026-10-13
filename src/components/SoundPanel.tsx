import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Music, Pause, Play, X } from "lucide-react";
import {
  PLANETS,
  planetTone,
  playPlanet,
  playPlanets,
  setAmbient,
  setOrbitSound,
  setVolume,
} from "@/lib/sound";
import { useSound } from "@/lib/use-sound";
import { SONGS, clock, getSong, pickSong, seekSong, subscribeSong, toggleSong, type SongId } from "@/lib/song";
import { fmt, fmtInt, getLang, tr } from "@/lib/prefs";
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

/** Clay colour and size of each planet key, Mercury to Neptune. */
const PLANET_BALL = ["ball-moon", "ball-amber", "ball-teal", "ball-pink", "ball-jupiter", "ball-violet", "ball-teal", "ball-violet"];
const PLANET_SIZE = [14, 20, 22, 16, 32, 28, 22, 22];

/** Header button and panel: space ambience, orbit sonification, planetary frequencies. */
export function SoundPanel() {
  usePrefs();
  const sound = useSound();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<number | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const song = useSyncExternalStore(subscribeSong, getSong, getSong);
  const playing = sound.ambient || sound.orbit || sound.chord || song.playing;

  useEffect(() => {
    if (!open) return;
    const now = getSong();
    if (!now.playing && now.time === 0) pickSong(getLang());
  }, [open]);

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
          "inline-flex min-h-10 min-w-10 items-center justify-center rounded-full sm:min-h-11 sm:min-w-11 " +
          (playing ? "bg-teal-2 text-void" : "noir-raise text-paper")
        }
      >
        <Music className="size-4" />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={tr("Âm thanh", "Sound")}
          className="surface noir-card fixed inset-x-3 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-[26px] p-4 text-ink sm:absolute sm:inset-x-auto sm:top-12 sm:right-0 sm:w-96"
        >
          <div className="flex items-center justify-between">
            <p className="font-serif text-2xl">{tr("Âm thanh vũ trụ", "Sounds of space")}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={tr("Đóng", "Close")}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="noir-card noir-amber mt-2 rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-teal">
                {tr("Bài hát Gravity Lab", "The Gravity Lab song")}
              </p>
              <div role="group" aria-label={tr("Phiên bản", "Version")} className="noir-track flex rounded-full p-1">
                {(["vi", "en"] as SongId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={song.id === id}
                    onClick={() => pickSong(id)}
                    className={
                      "min-h-9 min-w-11 rounded-full px-2 text-xs font-medium " +
                      (song.id === id ? "cosmic-btn" : "text-muted")
                    }
                  >
                    {id === "vi" ? "Tiếng Việt" : "English"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSong}
                aria-label={song.playing ? tr("Tạm dừng bài hát", "Pause the song") : tr("Phát bài hát", "Play the song")}
                className="clay-ball ball-amber inline-flex size-16 shrink-0 items-center justify-center text-[#3a1a05] shadow-[inset_-6px_-8px_12px_rgba(60,20,0,0.5),inset_3px_4px_6px_rgba(255,255,255,0.4),0_0_40px_rgba(255,197,107,0.35)]"
              >
                {song.playing ? <Pause className="size-6" fill="currentColor" /> : <Play className="size-6" fill="currentColor" />}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base leading-tight">{SONGS[song.id].title}</p>
                <p className="text-xs text-muted">
                  {song.id === "vi" ? tr("Bản tiếng Việt", "Vietnamese version") : tr("Bản tiếng Anh", "English version")} · {clock(song.time)}
                  {song.duration ? ` / ${clock(song.duration)}` : ""}
                </p>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={song.duration || 1}
              step={1}
              value={song.time}
              disabled={!song.duration}
              onChange={(e) => seekSong(Number(e.target.value))}
              aria-label={tr("Vị trí trong bài hát", "Position in the song")}
              className="mt-2 w-full"
            />
            <details className="mt-1">
              <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">
                {tr("Lời bài hát", "Lyrics")}
              </summary>
              <div className="max-h-64 overflow-y-auto pr-1 text-sm leading-relaxed">
                {SONGS[song.id].lyrics.map((st, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-xs font-medium text-muted">{tr(st.vi, st.en)}</p>
                    {st.lines.map((line, j) =>
                      line ? <p key={j}>{line}</p> : <div key={j} className="h-2" />,
                    )}
                  </div>
                ))}
              </div>
            </details>
            <p className="text-xs leading-relaxed text-muted">
              {tr(
                "Lời: nhóm tác giả Gravity Lab. Nhạc tạo bằng công cụ AI từ lời và mô tả phong cách của tác giả. Khi bài hát phát, âm vũ trụ lắng xuống bên dưới.",
                "Lyrics by the Gravity Lab authors. Music generated with an AI tool from the authors' lyrics and style description. While the song plays, the cosmic tones duck underneath it.",
              )}
            </p>
          </div>

          <Toggle
            on={sound.ambient}
            onChange={setAmbient}
            label={tr("Âm vũ trụ", "Cosmic tones")}
            hint={tr(
              "Tiếng ngân từ tần số các hành tinh theo cách tính quãng tám của Cousto: năm Trái Đất (136,10 Hz), ngày Trái Đất, Mặt Trăng, Sao Kim, Sao Thủy, tổng hợp ngay trong trình duyệt. Nên dùng tai nghe.",
              "A drone from planetary frequencies by Cousto's octave method: the Earth year (136.10 Hz), the Earth day, the Moon, Venus and Mercury, synthesised in the browser. Headphones recommended.",
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

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">
                {tr("Tần số các hành tinh", "Planetary frequencies")}
              </p>
              <button
                type="button"
                disabled={sound.chord}
                onClick={() => playPlanets(setNote)}
                className="noir-raise inline-flex min-h-11 items-center gap-2 rounded-full px-3.5 text-sm font-medium disabled:opacity-50"
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
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {PLANETS.map((p, i) => {
                const t = planetTone(p.days);
                const lit = note === i || note === -1;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => playPlanet(i)}
                      aria-label={tr(
                        `${p.vi}: chu kỳ ${fmt(p.days, p.days < 1000 ? 1 : 0)} ngày, nâng ${t.octaves} quãng tám, ${fmt(t.hz, 1)} Hz`,
                        `${p.en}: period ${fmt(p.days, p.days < 1000 ? 1 : 0)} days, raised ${t.octaves} octaves, ${fmt(t.hz, 1)} Hz`,
                      )}
                      className={
                        "flex w-full flex-col items-center gap-1.5 rounded-[18px] px-1 pt-3 pb-2.5 transition-colors " +
                        (lit ? "noir-card ring-2 ring-teal" : "noir-card")
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={"clay-ball " + PLANET_BALL[i]}
                        style={{ width: PLANET_SIZE[i], height: PLANET_SIZE[i] }}
                      />
                      <span className="text-xs font-semibold leading-tight">{tr(p.vi, p.en)}</span>
                      <span className="text-[11px] tabular-nums text-muted">{fmt(t.hz, 1)} Hz</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">
              {tr("Chạm để nghe từng hành tinh; số là tần số sau khi nâng quãng tám.", "Tap to hear a planet; the number is the frequency after raising by octaves.")}
            </p>
            <details className="mt-1">
              <summary className="min-h-11 py-2 text-sm font-medium">
                {tr("Bảng chu kỳ và quãng tám", "Periods and octaves")}
              </summary>
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
            </details>
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
