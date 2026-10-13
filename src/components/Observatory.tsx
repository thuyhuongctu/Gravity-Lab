import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ArrowRight, LocateFixed, Moon, Move, Pause, Play, Sun, Trash2 } from "lucide-react";
import { OrbitCanvas, type OrbitSnap } from "@/components/OrbitCanvas";
import { TradeCanvas } from "@/components/TradeCanvas";
import { GlobeCanvas } from "@/components/GlobeCanvas";
import { FdiDock, FdiStage, useLabState, type LabPanel } from "@/components/FdiLab";
import { CastStage, Crew, HolderBar, shownPeople } from "@/components/CastStage";
import { StoryStage } from "@/components/StoryStage";
import { SoundPanel } from "@/components/SoundPanel";
import { Clocks } from "@/components/Clocks";
import { setAmbient } from "@/lib/sound";
import { useSound } from "@/lib/use-sound";
import { SONGS, getSong, pickSong, subscribeSong, toggleSong } from "@/lib/song";
import { TutorPanel } from "@/components/TutorPanel";
import { RoomCover } from "@/components/RoomCover";
import { ReferenceList } from "@/components/ReferenceList";
import { APP_DOI, APP_DOI_URL } from "@/components/CiteApp";
import { fmt, setLang, setTheme, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";
import { MASS_PRESETS, Simulation, type CollisionMode, type MassId } from "@/sim/engine";
import { SCENES, loadScene, type SceneId } from "@/sim/scenes";
import {
  TRADE_SCENES,
  formatGdp,
  formatKm,
  makeEconomies,
  pairKey,
  partnerRows,
  type Economy,
  type TradeSceneId,
} from "@/sim/trade";

const TIME_STEPS = [0.25, 0.5, 1, 2, 4, 8] as const;

function comma(n: number, digits = 0): string {
  return fmt(n, digits);
}

/** A chip: a white clay pill when on. Inside a track it sits flat when off; alone it is raised. */
function Chip({
  active,
  onClick,
  children,
  flat = false,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  flat?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "min-h-10 shrink-0 rounded-full px-3.5 text-sm font-medium " +
        (active ? "pill-on" : flat ? "text-muted" : "noir-raise text-ink")
      }
    >
      {children}
    </button>
  );
}

/** A pressed-in track holding a row of chips. */
function Track({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div role={label ? "group" : undefined} aria-label={label} className="noir-track flex gap-1 overflow-x-auto rounded-full p-1">
      {children}
    </div>
  );
}

/** "The same equation …" call to action with the amber arrow. */
function NextCard({ kicker, title, onClick, children }: { kicker: string; title: string; onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="noir-card noir-amber flex items-center gap-3 rounded-[22px] p-3.5 text-left">
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-muted">{kicker}</span>
        <span className="mt-0.5 block font-serif text-base leading-snug">{title}</span>
        {children}
      </span>
      <span aria-hidden="true" className="cosmic-btn inline-flex size-11 shrink-0 items-center justify-center rounded-full">
        <ArrowRight className="size-4" />
      </span>
    </button>
  );
}

const MASS_BALL: Record<string, { ball: string; size: number }> = {
  dust: { ball: "ball-moon", size: 8 },
  moon: { ball: "ball-moon", size: 12 },
  planet: { ball: "ball-teal", size: 18 },
  giant: { ball: "ball-violet", size: 24 },
  star: { ball: "ball-amber", size: 28 },
};

export function Observatory() {
  const { lang, theme } = usePrefs();
  const simRef = useRef<Simulation | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"story" | "orbit" | "trade" | "lab" | "cast">("story");
  const [massId, setMassId] = useState<MassId>("planet");
  const [timeScale, setTimeScale] = useState(1);
  const [paused, setPaused] = useState(false);
  const [trails, setTrails] = useState(true);
  const [follow, setFollow] = useState(true);
  const [panMode, setPanMode] = useState(false);
  const [collision, setCollision] = useState<CollisionMode>("merge");
  const [scene, setScene] = useState<SceneId>("solar");
  const [hint, setHint] = useState(true);
  const [snap, setSnap] = useState<OrbitSnap>({ count: 0, banner: null, selected: null });

  const [tradeScene, setTradeScene] = useState<TradeSceneId>("lecture");
  const [tradeView, setTradeView] = useState<"map" | "plane" | "globe">("map");
  const [ecos, setEcos] = useState<Economy[]>(() => makeEconomies("lecture"));
  const [focusId, setFocusId] = useState("vn");
  const [pairId, setPairId] = useState<string | null>(null);
  const [gamma, setGamma] = useState(1.1);
  const [boosts, setBoosts] = useState<Record<string, number>>({});
  const lab = useLabState();
  const sound = useSound();
  const song = useSyncExternalStore(subscribeSong, getSong, getSong);
  // The header song follows the language: switching language restarts it in the other version.
  useEffect(() => {
    if (song.playing && song.id !== lang) {
      pickSong(lang);
      toggleSong();
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const [who, setWho] = useState<string | null>(null);

  function enterFromClass(room: "orbit" | "trade" | "lab", panel: LabPanel | null, id: string) {
    if (panel) lab.setPanel(panel);
    if (id === "thu-ha") {
      lab.setFta(true);
      lab.setEcon(0);
      lab.setInst(0);
      lab.setOpen(0);
    } else if (id === "bao-ngoc" || id === "lumina") {
      lab.setFta(false);
      lab.setEcon(0);
      lab.setInst(0);
      lab.setOpen(0);
    } else if (id === "tu") {
      lab.setModel(7);
    }
    setWho(id);
    setMode(room);
  }

  useEffect(() => {
    const sim = new Simulation();
    loadScene(sim, "solar");
    simRef.current = sim;
    setReady(true);
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (!sim) return;
    sim.paused = paused;
    sim.trails = trails;
    sim.timeScale = timeScale;
    sim.collision = collision;
  }, [ready, paused, trails, timeScale, collision]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === " " && mode === "orbit") {
        e.preventDefault();
        setPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  const mass = MASS_PRESETS.find((m) => m.id === massId)?.mass ?? 56;
  const sceneMeta = SCENES.find((s) => s.id === scene) ?? SCENES[0]!;
  const rows = partnerRows(ecos, focusId, gamma, pairId, boosts);
  const focus = ecos.find((e) => e.id === focusId) ?? null;
  const chosen = rows.find((r) => r.econ.id === pairId) ?? null;
  const boost = pairId && focus ? (boosts[pairKey(focus.id, pairId)] ?? 1) : 1;

  function applyScene(id: SceneId) {
    const sim = simRef.current;
    if (!sim) return;
    loadScene(sim, id);
    setScene(id);
    setFollow(id !== "sling");
    setPanMode(false);
  }

  function applyTrade(id: TradeSceneId) {
    setTradeScene(id);
    setEcos(makeEconomies(id));
    setFocusId("vn");
    setPairId(null);
  }

  return (
    <div className="stage flex h-dvh flex-col bg-void lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="nebula-head flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-paper/10 px-3 py-3 sm:gap-3 sm:px-5 xl:flex-nowrap">
          <div className="order-1 flex min-w-0 flex-1 basis-0 items-center gap-2.5 sm:gap-3">
            <img
              src={`${import.meta.env.BASE_URL}icons/icon-192.png?v=4`}
              alt=""
              width={44}
              height={44}
              className="size-9 shrink-0 rounded-xl shadow-[0_14px_24px_-12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(79,209,197,0.25)] sm:size-11"
            />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-lg leading-tight text-paper max-[409px]:sr-only sm:text-2xl sm:leading-none">
                {tr("Trọng lực", "Gravity Lab")}
              </h1>
              <p className={"mt-1 hidden truncate text-xs text-mist sm:block " + (mode === "story" || mode === "cast" ? "" : "xl:max-2xl:hidden")}>
                {mode === "story"
                  ? tr("Từ Newton đến dòng vốn", "From Newton to capital flows")
                  : mode === "cast"
                    ? tr("Cả lớp khám phá vũ trụ", "The class explores the universe")
                    : tr("Vũ trụ, thương mại, rồi FDI", "The universe, trade, then FDI")}
              </p>
            </div>
          </div>
          <div className="order-2 flex shrink-0 items-center gap-1.5 sm:gap-2 xl:order-3">
            <Clocks />
            <a
              href={APP_DOI_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-11 items-center rounded-full border border-paper/20 px-3 text-xs text-mist sm:inline-flex"
              title={tr(
                "Trích dẫn ứng dụng này qua DOI Zenodo",
                "Cite this app through its Zenodo DOI",
              )}
            >
              DOI {APP_DOI}
            </a>
            <button
              type="button"
              onClick={() => {
                if (!song.playing && song.id !== lang) pickSong(lang);
                toggleSong();
              }}
              aria-pressed={song.playing}
              aria-label={song.playing ? tr("Tạm dừng bài hát", "Pause the song") : tr("Phát bài hát", "Play the song")}
              title={SONGS[lang].title}
              className={
                "hidden min-h-10 max-w-11 items-center gap-1.5 overflow-hidden rounded-full px-3 text-xs font-semibold whitespace-nowrap 2xl:inline-flex 2xl:min-h-11 2xl:max-w-60 " +
                (song.playing ? "cosmic-btn" : "noir-raise text-paper")
              }
            >
              <span aria-hidden="true">{song.playing ? "❚❚" : "♫"}</span>
              <span className="hidden truncate 2xl:inline">{SONGS[lang].title}</span>
            </button>
            <button
              type="button"
              onClick={() => setAmbient(!sound.ambient)}
              aria-pressed={sound.ambient}
              title={tr("Âm vũ trụ: tần số các hành tinh", "Cosmic tones: planetary frequencies")}
              className={
                "hidden min-h-10 items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap 2xl:inline-flex 2xl:min-h-11 " +
                (sound.ambient ? "cosmic-btn" : "noir-raise text-paper")
              }
            >
              ◉ {tr("Âm vũ trụ", "Tones")}
            </button>
            <div
              className="noir-track flex rounded-full p-1"
              role="group"
              aria-label={tr("Ngôn ngữ", "Language")}
            >
              {(["vi", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  lang={l}
                  aria-pressed={lang === l}
                  onClick={() => setLang(l)}
                  className={
                    "min-h-9 min-w-9 rounded-full px-2 text-xs font-semibold uppercase sm:min-w-10 " +
                    (lang === l ? "cosmic-btn" : "text-mist")
                  }
                >
                  {l === "vi" ? "VI" : "EN"}
                </button>
              ))}
            </div>
            <TutorPanel
              onOpen={(room, panel) => {
                if (panel) lab.setPanel(panel);
                setWho(null);
                setMode(room);
              }}
            />
            <SoundPanel />
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={
                theme === "dark"
                  ? tr("Chuyển sang giao diện sáng", "Switch to light theme")
                  : tr("Chuyển sang giao diện tối", "Switch to dark theme")
              }
              className="noir-raise inline-flex min-h-10 min-w-10 items-center justify-center rounded-full text-paper sm:min-h-11 sm:min-w-11"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
          <div
            className="noir-track order-3 flex w-full overflow-x-auto rounded-full p-1.5 xl:order-2 xl:w-auto"
            role="tablist"
            aria-label={tr("Chế độ", "Mode")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "story"}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
                (mode === "story" ? "cosmic-btn" : "text-mist")
              }
              onClick={() => {
                setWho(null);
                setMode("story");
              }}
            >
              {tr("Câu chuyện", "Story")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "cast"}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
                (mode === "cast" ? "cosmic-btn" : "text-mist")
              }
              onClick={() => {
                setWho(null);
                setMode("cast");
              }}
            >
              {tr("Nhân vật", "Cast")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "orbit"}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
                (mode === "orbit" ? "cosmic-btn" : "text-mist")
              }
              onClick={() => {
                setWho(null);
                setMode("orbit");
              }}
            >
              {tr("Quỹ đạo", "Orbit")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "trade"}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
                (mode === "trade" ? "cosmic-btn" : "text-mist")
              }
              onClick={() => {
                setWho(null);
                setMode("trade");
              }}
            >
              {tr("Thương mại", "Trade")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "lab"}
              className={
                "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
                (mode === "lab" ? "cosmic-btn" : "text-mist")
              }
              onClick={() => {
                setWho(null);
                setMode("lab");
              }}
            >
              FDI
            </button>
          </div>
        </header>

        <main className="relative min-h-0 flex-1">
          {mode === "orbit" && ready && simRef.current ? (
            <OrbitCanvas
              sim={simRef.current}
              active
              mass={mass}
              panMode={panMode}
              follow={follow}
              onFollowChange={setFollow}
              onSnapshot={setSnap}
              onSpawn={() => setHint(false)}
            />
          ) : null}
          {mode === "trade" && tradeView !== "plane" ? (
            <GlobeCanvas
              key={tradeView}
              flat={tradeView === "map"}
              economies={ecos}
              focusId={focusId}
              pairId={pairId}
              gamma={gamma}
              boosts={boosts}
              onTap={(id) => {
                setFocusId(id);
                setPairId(null);
              }}
            />
          ) : null}
          {mode === "trade" && tradeView === "plane" ? (
            <TradeCanvas
              economies={ecos}
              focusId={focusId}
              pairId={pairId}
              gamma={gamma}
              boosts={boosts}
              onTap={(id) => {
                setFocusId(id);
                setPairId(null);
              }}
              onMove={(id, x, y) =>
                setEcos((prev) => prev.map((e) => (e.id === id ? { ...e, x, y } : e)))
              }
            />
          ) : null}
          {mode === "lab" ? (
            <FdiStage
              lab={lab}
              lead={
                <HolderBar
                  people={shownPeople("lab", lab.panel, who)}
                  onBack={() => setMode("cast")}
                />
              }
            />
          ) : null}
          {mode === "cast" ? <CastStage onOpen={enterFromClass} /> : null}
          {mode === "story" ? (
            <StoryStage
              onOpen={(room, panel) => {
                if (panel) lab.setPanel(panel);
                setWho(null);
                setMode(room);
              }}
              onCast={() => {
                setWho(null);
                setMode("cast");
              }}
            />
          ) : null}

          {mode === "orbit" || mode === "trade" ? (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_65%_at_45%_0%,rgba(255,197,107,0.16),transparent_70%),radial-gradient(ellipse_60%_40%_at_50%_100%,rgba(79,209,197,0.07),transparent_70%)]"
              />
              <div aria-hidden="true" className="noir-vignette pointer-events-none absolute inset-0" />
              <div aria-hidden="true" className="noir-grain pointer-events-none absolute inset-0" />
            </>
          ) : null}

          {mode === "orbit" || mode === "trade" ? (
            <div className="absolute inset-x-0 top-0 z-20 p-3">
              <HolderBar
                people={shownPeople(mode, lab.panel, who)}
                onBack={() => setMode("cast")}
                suited={mode === "orbit"}
              />
            </div>
          ) : null}

          {mode === "orbit" ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-3">
              {hint ? (
                <p className="max-w-[15rem] noir-hint rounded-[20px] px-3.5 py-2.5 text-xs sm:max-w-xs sm:text-sm">
                  {tr(
                    "Kéo để phóng. Vạch «vòng» là quỹ đạo tròn, vạch «thoát» là rời hệ. Đường chấm là vài giây tới.",
                    "Drag to launch. The “circular” tick is a circular orbit, the “escape” tick leaves the system. The dotted line is the next few seconds.",
                  )}
                </p>
              ) : null}
              {snap.banner ? (
                <p className="rounded-full bg-paper px-3 py-1.5 text-sm font-medium text-ink">
                  {snap.banner}
                </p>
              ) : null}
              {snap.selected ? (
                <div className="noir-hint rounded-[20px] px-3.5 py-2.5 text-sm tabular-nums">
                  <p>
                    {tr("Khối lượng", "Mass")} {comma(snap.selected.mass)} · {tr("tốc độ", "speed")}{" "}
                    {comma(snap.selected.speed)}
                  </p>
                  {snap.selected.vCirc != null && snap.selected.vEsc != null ? (
                    <p className="opacity-80">
                      {tr("Vòng", "Circular")} {comma(snap.selected.vCirc)} ·{" "}
                      {tr("thoát", "escape")} {comma(snap.selected.vEsc)} ·{" "}
                      {snap.selected.bound
                        ? tr("còn liên kết", "bound")
                        : tr("thoát ly", "escaping")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : mode === "trade" ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
              <p className="max-w-[16rem] noir-hint rounded-[20px] px-3.5 py-2.5 text-xs sm:max-w-sm sm:text-sm">
                {tradeView === "map"
                  ? tr(
                      "Kéo để di chuyển bản đồ, chụm hoặc cuộn để thu phóng. Chạm một nền kinh tế để lấy đó làm gốc dòng chảy.",
                      "Drag to pan the map; pinch or scroll to zoom. Tap an economy to make it the origin of the flows.",
                    )
                  : tradeView === "globe"
                  ? tr(
                      "Kéo để xoay địa cầu, chụm hoặc cuộn để thu phóng. Chạm một nền kinh tế để lấy đó làm gốc dòng chảy.",
                      "Drag to turn the globe; pinch or scroll to zoom. Tap an economy to make it the origin of the flows.",
                    )
                  : tr(
                      "Kéo một nền kinh tế để đổi khoảng cách. Chạm để lấy đó làm gốc dòng chảy.",
                      "Drag an economy to change distances. Tap one to make it the origin of the flows.",
                    )}
              </p>
            </div>
          ) : null}
        </main>
      </div>

      {mode === "cast" || mode === "story" ? null : (
        <aside className="surface noir-panel dock-scroll w-full shrink-0 overflow-y-auto border-t border-line text-ink lg:w-[23.75rem] lg:border-t-0">
          <div className="hidden px-4 pt-4 lg:block">
            <RoomCover room={mode} />
          </div>
          {mode === "orbit" ? (
            <div className="flex flex-col gap-4 p-4 pb-8">
              <p className="font-serif text-2xl leading-none">F = G m₁m₂ / r²</p>
              <p className="text-sm text-muted">{tr(sceneMeta.blurb, sceneMeta.blurbEn)}</p>
              <p className="text-sm leading-relaxed text-muted">
                {tr(
                  "Lực giữa hai khối điểm tỷ lệ với tích khối lượng và nghịch với bình phương khoảng cách (Newton, 1687/1999). Trong hệ SI, G = 6,67430 × 10⁻¹¹ m³ kg⁻¹ s⁻², độ không đảm bảo chuẩn 0,00015 × 10⁻¹¹ (Mohr et al., 2025). Cavendish (1798) đo mật độ Trái Đất, không công bố G. Màn hình này là mô hình tỷ lệ.",
                  "The force between two point masses is proportional to the product of the masses and inversely proportional to the square of the distance (Newton, 1687/1999). In SI units, G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻², standard uncertainty 0.00015 × 10⁻¹¹ (Mohr et al., 2025). Cavendish (1798) measured the density of the Earth and did not publish G. This screen is a scale model.",
                )}
              </p>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">
                  {tr("Khối lượng khi phóng", "Launch mass")}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {MASS_PRESETS.map((m) => {
                    const look = MASS_BALL[m.id] ?? { ball: "ball-moon", size: 14 };
                    const on = massId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setMassId(m.id)}
                        className={
                          "noir-raise flex min-h-[4.5rem] flex-col items-center justify-end gap-1.5 rounded-[18px] pt-2 pb-2 text-xs font-medium " +
                          (on ? "ring-2 ring-teal" : "")
                        }
                      >
                        <span
                          aria-hidden="true"
                          className={"clay-ball " + look.ball}
                          style={{ width: look.size, height: look.size }}
                        />
                        {tr(m.label, m.en)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">
                  {tr("Tỷ lệ thời gian", "Time scale")}
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    aria-label={paused ? tr("Tiếp tục", "Resume") : tr("Tạm dừng", "Pause")}
                    aria-pressed={paused}
                    onClick={() => setPaused((p) => !p)}
                    className="cosmic-btn inline-flex size-12 shrink-0 items-center justify-center rounded-full"
                  >
                    {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <Track>
                      {TIME_STEPS.map((t) => (
                        <Chip key={t} flat active={timeScale === t} onClick={() => setTimeScale(t)}>
                          {t === 0.25 ? "¼×" : t === 0.5 ? "½×" : `${t}×`}
                        </Chip>
                      ))}
                    </Track>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted">{tr("Bối cảnh", "Scene")}</p>
                <Track>
                  {SCENES.map((s) => (
                    <Chip key={s.id} flat active={scene === s.id} onClick={() => applyScene(s.id)}>
                      {tr(s.name, s.nameEn)}
                    </Chip>
                  ))}
                </Track>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip active={trails} onClick={() => setTrails((v) => !v)}>
                  {tr("Vệt", "Trails")}
                </Chip>
                <Chip active={follow} onClick={() => setFollow((v) => !v)}>
                  <span className="inline-flex items-center gap-1">
                    <LocateFixed className="size-4" />
                    {tr("Theo tâm", "Follow")}
                  </span>
                </Chip>
                <Chip active={panMode} onClick={() => setPanMode((v) => !v)}>
                  <span className="inline-flex items-center gap-1">
                    <Move className="size-4" />
                    {tr("Dịch khung", "Pan")}
                  </span>
                </Chip>
                <Chip active={collision === "merge"} onClick={() => setCollision("merge")}>
                  {tr("Hợp nhất", "Merge")}
                </Chip>
                <Chip active={collision === "bounce"} onClick={() => setCollision("bounce")}>
                  {tr("Nảy", "Bounce")}
                </Chip>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sim = simRef.current;
                    if (!sim) return;
                    if (sim.selectedId != null) sim.remove(sim.selectedId);
                  }}
                  className="inline-flex min-h-11 items-center gap-2 noir-raise rounded-full px-3 text-sm font-medium"
                >
                  <Trash2 className="size-4" />
                  {tr("Xóa vật", "Delete body")}
                </button>
                <button
                  type="button"
                  onClick={() => simRef.current?.clear()}
                  className="inline-flex min-h-11 items-center noir-raise rounded-full px-3 text-sm font-medium"
                >
                  {tr("Xóa hết", "Clear all")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sim = simRef.current;
                    if (!sim) return;
                    sim.requestFit = true;
                    setFollow(true);
                  }}
                  className="inline-flex min-h-11 items-center noir-raise rounded-full px-3 text-sm font-medium"
                >
                  {tr("Vừa khung", "Fit view")}
                </button>
              </div>
              <p className="text-sm tabular-nums text-muted">
                {snap.count} {tr("thiên thể", snap.count === 1 ? "body" : "bodies")}
              </p>
              <Crew />
              <ReferenceList />
              <NextCard
                kicker={tr("Cùng một phương trình", "The same equation")}
                title={tr("Mở mô hình thương mại", "Open the trade model")}
                onClick={() => setMode("trade")}
              >
                <span className="mt-1 block text-sm text-muted">
                  {tr(
                    "F = G m₁m₂ / r² trở thành Tᵢⱼ = G Yᵢ Yⱼ / Dᵢⱼᵞ. Khối lượng thành quy mô kinh tế, khoảng cách vẫn cản trở, lực thành dòng thương mại.",
                    "F = G m₁m₂ / r² becomes Tᵢⱼ = G Yᵢ Yⱼ / Dᵢⱼᵞ. Mass becomes economic size, distance still resists, and force becomes the trade flow.",
                  )}
                </span>
              </NextCard>
            </div>
          ) : mode === "trade" ? (
            <div className="flex flex-col gap-4 p-4 pb-8">
              <div>
                <p className="font-serif text-2xl leading-snug">Tᵢⱼ = G · Yᵢ Yⱼ / Dᵢⱼᵞ</p>
                <p className="mt-1 text-sm text-muted">
                  {tr(
                    "Tinbergen (1962). Y là GDP, D là khoảng cách, γ được ước lượng. Newton (1687/1999) khóa γ ở 2.",
                    "Tinbergen (1962). Y is GDP, D is distance, and γ is estimated. Newton (1687/1999) locks γ at 2.",
                  )}
                </p>
              </div>
              <Track label={tr("Cách xem", "View")}>
                <Chip
                  flat
                  active={tradeView === "map"}
                  onClick={() => {
                    setEcos((prev) => prev.map((e) => ({ ...e, x: e.homeX, y: e.homeY })));
                    setTradeView("map");
                  }}
                >
                  {tr("Bản đồ", "Map")}
                </Chip>
                <Chip flat active={tradeView === "plane"} onClick={() => setTradeView("plane")}>
                  {tr("Mặt phẳng", "Plane")}
                </Chip>
                <Chip
                  flat
                  active={tradeView === "globe"}
                  onClick={() => {
                    setEcos((prev) => prev.map((e) => ({ ...e, x: e.homeX, y: e.homeY })));
                    setTradeView("globe");
                  }}
                >
                  {tr("Địa cầu", "Globe")}
                </Chip>
              </Track>
              {tradeView === "map" ? (
                <p className="text-sm text-muted">
                  {tr(
                    "Trên bản đồ, mỗi nền kinh tế nằm ở tọa độ thật. D là khoảng cách đường tròn lớn, vẽ thành đường cong theo tuyến ngắn nhất trên mặt cầu. Độ dày là phần dòng chảy theo γ hiện tại.",
                    "On the map, each economy sits at its real coordinates. D is the great-circle distance, drawn as the shortest route over the sphere. Line width is the share of the flow at the current γ.",
                  )}
                </p>
              ) : null}
              {tradeView === "globe" ? (
                <p className="text-sm text-muted">
                  {tr(
                    "Trên địa cầu, D là khoảng cách đường tròn lớn giữa các trung tâm kinh tế, vẽ bằng cung nối. Độ dày cung là phần dòng chảy theo γ hiện tại.",
                    "On the globe, D is the great-circle distance between economic centres, drawn as arcs. Arc width is the share of the flow at the current γ.",
                  )}
                </p>
              ) : null}
              <div className="flex gap-2 overflow-x-auto">
                {TRADE_SCENES.map((s) => (
                  <Chip key={s.id} active={tradeScene === s.id} onClick={() => applyTrade(s.id)}>
                    {tr(s.name, s.nameEn)}
                  </Chip>
                ))}
                {tradeView === "plane" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEcos((prev) => prev.map((e) => ({ ...e, x: e.homeX, y: e.homeY })))
                    }
                    className="noir-raise min-h-10 shrink-0 rounded-full px-3 text-sm font-medium"
                  >
                    {tr("Đặt lại chỗ", "Reset positions")}
                  </button>
                ) : null}
              </div>
              <label className="noir-track block rounded-[22px] px-4 py-3.5">
                <span className="mb-1 flex items-baseline justify-between text-sm">
                  <span>{tr("Số mũ khoảng cách γ", "Distance exponent γ")}</span>
                  <span className="font-serif text-base tabular-nums text-teal">{comma(gamma, 2)}</span>
                </span>
                <input
                  type="range"
                  min={0.6}
                  max={2.4}
                  step={0.05}
                  value={gamma}
                  aria-label={tr("Số mũ khoảng cách gamma", "Distance exponent gamma")}
                  onChange={(e) => setGamma(Number(e.target.value))}
                />
                <span className="text-xs text-muted">
                  {tr(
                    "Newton nằm ở 2,00. Thương mại thực nghiệm thường gần 1.",
                    "Newton sits at 2.00. Empirical trade is usually near 1.",
                  )}
                </span>
              </label>
              {focus && chosen ? (
                <div className="noir-card rounded-[22px] px-4 py-3">
                  <p className="text-sm font-medium">
                    {tr(focus.name, focus.nameEn)} × {tr(chosen.econ.name, chosen.econ.nameEn)}
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    D = {formatKm(chosen.km)} · GDP {formatGdp(focus.gdp)} ×{" "}
                    {formatGdp(chosen.econ.gdp)} {tr("nghìn tỷ USD", "trillion USD")}
                  </p>
                  <p className="mt-2 text-sm">
                    {tr(
                      `Phần dòng chảy ${comma(chosen.share, 0)}%. Với số mũ 2, cùng G, cặp này còn khoảng ${comma(Math.max(chosen.newtonPct, 0.1), chosen.newtonPct < 10 ? 1 : 0)}% so với γ hiện tại.`,
                      `Flow share ${comma(chosen.share, 0)}%. With exponent 2 and the same G, this pair keeps about ${comma(Math.max(chosen.newtonPct, 0.1), chosen.newtonPct < 10 ? 1 : 0)}% of its flow at the current γ.`,
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {tr(
                    "Chọn một dòng bên dưới để xem một cặp.",
                    "Choose a row below to look at one pair.",
                  )}
                </p>
              )}
              {pairId && focus ? (
                <label className="block">
                  <span className="mb-1 flex items-baseline justify-between text-sm">
                    <span>
                      {tr("Ưu đãi cặp (FTA, ngôn ngữ)", "Pair preference (FTA, language)")}
                    </span>
                    <span className="tabular-nums font-medium">{comma(boost, 1)}×</span>
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={boost}
                    aria-label={tr("Ưu đãi cho cặp đang chọn", "Preference for the selected pair")}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setBoosts((prev) => ({ ...prev, [pairKey(focus.id, pairId)]: v }));
                    }}
                  />
                </label>
              ) : null}
              <div>
                <div className="mb-2 flex items-center justify-between text-xs text-muted">
                  <span>
                    {tr("Từ", "From")} {focus ? tr(focus.name, focus.nameEn) : "—"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-teal" /> γ
                    <span className="inline-block size-2 rounded-full bg-amber" />{" "}
                    {tr("mũ 2", "exp. 2")}
                  </span>
                </div>
                <ul className="flex flex-col">
                  {rows.map((row) => (
                    <li key={row.econ.id}>
                      <button
                        type="button"
                        onClick={() => setPairId(row.econ.id)}
                        aria-pressed={pairId === row.econ.id}
                        className={
                          "flex min-h-11 w-full items-center gap-3 rounded-lg px-1 text-left " +
                          (pairId === row.econ.id ? "bg-paper-2" : "")
                        }
                      >
                        <span className="w-8 shrink-0 text-sm font-medium">
                          {tr(row.econ.short, row.econ.shortEn)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="noir-track block h-2.5 overflow-hidden rounded-full">
                            <span
                              className="block h-full rounded-full bg-[linear-gradient(180deg,#9ff5e6,#14a394)] shadow-[inset_0_-2px_0_rgba(0,0,0,0.25)]"
                              style={{ width: `${Math.min(100, row.share)}%` }}
                            />
                          </span>
                          <span className="noir-track block h-1.5 overflow-hidden rounded-full">
                            <span
                              className="block h-full rounded-full bg-[linear-gradient(180deg,#ffe0a6,#d68a2c)]"
                              style={{ width: `${Math.min(100, row.newtonShare)}%` }}
                            />
                          </span>
                        </span>
                        <span className="w-12 shrink-0 text-right text-sm tabular-nums">
                          {comma(row.share, 0)}%
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <details className="noir-card rounded-[22px] px-4 py-2">
                <summary className="min-h-11 text-sm font-medium">
                  {tr("Vì sao không phải r²?", "Why not r²?")}
                </summary>
                <p className="pb-2 text-sm text-muted">
                  {tr(
                    "Định luật Newton khóa số mũ ở 2. Trong thương mại, γ được ước lượng và thường nhỏ hơn, vì chi phí vận tải không phình như lực hấp dẫn. Anderson và van Wincoop (2003) chỉ ra G trong thương mại không phải hằng số vũ trụ: biên giới, ngôn ngữ và sức cản đa phương nằm trong đó. GDP danh nghĩa xấp xỉ 2024, làm tròn để giảng — mô hình tối giản này không thay một hồi quy đầy đủ.",
                    "Newton's law locks the exponent at 2. In trade, γ is estimated and is usually smaller, because transport costs do not grow the way gravity weakens. Anderson and van Wincoop (2003) show that G in trade is not a universal constant: borders, language and multilateral resistance sit inside it. Nominal GDP is circa 2024, rounded for teaching — this minimal model does not replace a full regression.",
                  )}
                </p>
              </details>
              <button
                type="button"
                onClick={() => {
                  setMode("orbit");
                }}
                className="noir-raise min-h-11 self-start rounded-full px-4 text-sm font-medium"
              >
                {tr("Xem lại quỹ đạo", "Back to orbits")}
              </button>
              <NextCard
                kicker={tr("Cùng phương trình, với FDI", "The same equation, for FDI")}
                title={tr("Mở phòng FDI", "Open the FDI lab")}
                onClick={() => setMode("lab")}
              >
                <span className="mt-1 block text-sm text-muted">
                  {tr(
                    "Phan và Do (2019) ước lượng khoảng cách địa lý, thể chế, văn hóa và kinh tế của dòng vốn vào Việt Nam. Mũ không còn là 2.",
                    "Phan and Do (2019) estimate the geographic, institutional, cultural and economic distances of capital flowing into Vietnam. The exponent is no longer 2.",
                  )}
                </span>
              </NextCard>
              <ReferenceList />
            </div>
          ) : (
            <FdiDock lab={lab} />
          )}
        </aside>
      )}
    </div>
  );
}
