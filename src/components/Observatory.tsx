import { useEffect, useRef, useState, type ReactNode } from "react";
import { LocateFixed, Move, Pause, Play, Trash2 } from "lucide-react";
import { OrbitCanvas, type OrbitSnap } from "@/components/OrbitCanvas";
import { TradeCanvas } from "@/components/TradeCanvas";
import { FdiDock, FdiStage, useLabState, type LabPanel } from "@/components/FdiLab";
import { CastStage, HolderBar, shownPeople } from "@/components/CastStage";
import { ReferenceList } from "@/components/ReferenceList";
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
  return n.toFixed(digits).replace(".", ",");
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "min-h-11 shrink-0 rounded-full border px-3 text-sm font-medium " +
        (active ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink")
      }
    >
      {children}
    </button>
  );
}

export function Observatory() {
  const simRef = useRef<Simulation | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"orbit" | "trade" | "lab" | "cast">("cast");
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
  const [ecos, setEcos] = useState<Economy[]>(() => makeEconomies("lecture"));
  const [focusId, setFocusId] = useState("vn");
  const [pairId, setPairId] = useState<string | null>(null);
  const [gamma, setGamma] = useState(1.1);
  const [boosts, setBoosts] = useState<Record<string, number>>({});
  const lab = useLabState();
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
    <div className="flex h-dvh flex-col bg-void lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-paper/15 px-4 py-3">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl leading-none text-paper">Trọng lực</h1>
          <p className="mt-1 text-xs text-mist">
            {mode === "cast" ? "Cả lớp khám phá vũ trụ" : "Vũ trụ, thương mại, rồi FDI"}
          </p>
        </div>
        <div
          className="flex w-full overflow-x-auto rounded-full bg-void-2 p-1"
          role="tablist"
          aria-label="Chế độ"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "cast"}
            className={
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
              (mode === "cast" ? "bg-paper text-ink" : "text-mist")
            }
            onClick={() => {
              setWho(null);
              setMode("cast");
            }}
          >
            Nhân vật
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "orbit"}
            className={
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
              (mode === "orbit" ? "bg-paper text-ink" : "text-mist")
            }
            onClick={() => {
              setWho(null);
              setMode("orbit");
            }}
          >
            Quỹ đạo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "trade"}
            className={
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
              (mode === "trade" ? "bg-paper text-ink" : "text-mist")
            }
            onClick={() => {
              setWho(null);
              setMode("trade");
            }}
          >
            Thương mại
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "lab"}
            className={
              "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium " +
              (mode === "lab" ? "bg-paper text-ink" : "text-mist")
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
        {mode === "trade" ? (
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
            lead={<HolderBar people={shownPeople("lab", lab.panel, who)} onBack={() => setMode("cast")} />}
          />
        ) : null}
        {mode === "cast" ? <CastStage onOpen={enterFromClass} /> : null}

        {mode === "orbit" || mode === "trade" ? (
          <div className="absolute inset-x-0 top-0 z-20 p-3">
            <HolderBar people={shownPeople(mode, lab.panel, who)} onBack={() => setMode("cast")} />
          </div>
        ) : null}

        {mode === "orbit" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-2 p-3">
            {hint ? (
              <p className="max-w-xs rounded-card bg-void-2 px-3 py-2 text-sm text-paper">
                Kéo để phóng. Vạch «vòng» là quỹ đạo tròn, vạch «thoát» là rời hệ. Đường chấm là vài giây tới.
              </p>
            ) : null}
            {snap.banner ? (
              <p className="rounded-full bg-paper px-3 py-1.5 text-sm font-medium text-ink">{snap.banner}</p>
            ) : null}
            {snap.selected ? (
              <div className="rounded-card bg-void-2 px-3 py-2 text-sm text-paper tabular-nums">
                <p>
                  Khối lượng {comma(snap.selected.mass)} · tốc độ {comma(snap.selected.speed)}
                </p>
                {snap.selected.vCirc != null && snap.selected.vEsc != null ? (
                  <p className="text-mist">
                    Vòng {comma(snap.selected.vCirc)} · thoát {comma(snap.selected.vEsc)} ·{" "}
                    {snap.selected.bound ? "còn liên kết" : "thoát ly"}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : mode === "trade" ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3">
            <p className="max-w-sm rounded-card bg-void-2 px-3 py-2 text-sm text-paper">
              Kéo một nền kinh tế để đổi khoảng cách. Chạm để lấy đó làm gốc dòng chảy.
            </p>
          </div>
        ) : null}
      </main>
      </div>

      {mode === "cast" ? null : (
      <aside className="dock-scroll w-full shrink-0 overflow-y-auto border-t border-line bg-paper text-ink lg:w-96 lg:border-t-0 lg:border-l">
        {mode === "orbit" ? (
          <div className="flex flex-col gap-4 p-4 pb-8">
            <p className="font-serif text-xl leading-none">F = G m₁m₂ / r²</p>
            <p className="text-sm text-muted">{sceneMeta.blurb}</p>
            <p className="text-sm leading-relaxed text-muted">
              Lực giữa hai khối điểm tỷ lệ với tích khối lượng và nghịch với bình phương khoảng cách (Newton, 1687/1999).
              Trong hệ SI, G = 6,67430 × 10⁻¹¹ m³ kg⁻¹ s⁻², độ không đảm bảo chuẩn 0,00015 × 10⁻¹¹ (Mohr et al., 2025).
              Cavendish (1798) đo mật độ Trái Đất, không công bố G. Màn hình này là mô hình tỷ lệ.
            </p>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Khối lượng khi phóng</p>
              <div className="flex gap-2 overflow-x-auto">
                {MASS_PRESETS.map((m) => (
                  <Chip key={m.id} active={massId === m.id} onClick={() => setMassId(m.id)}>
                    {m.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Tỷ lệ thời gian</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-label={paused ? "Tiếp tục" : "Tạm dừng"}
                  aria-pressed={paused}
                  onClick={() => setPaused((p) => !p)}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-ink bg-ink text-paper"
                >
                  {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
                </button>
                {TIME_STEPS.map((t) => (
                  <Chip key={t} active={timeScale === t} onClick={() => setTimeScale(t)}>
                    {t === 0.25 ? "¼×" : t === 0.5 ? "½×" : `${t}×`}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Bối cảnh</p>
              <div className="flex gap-2 overflow-x-auto">
                {SCENES.map((s) => (
                  <Chip key={s.id} active={scene === s.id} onClick={() => applyScene(s.id)}>
                    {s.name}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={trails} onClick={() => setTrails((v) => !v)}>
                Vệt
              </Chip>
              <Chip active={follow} onClick={() => setFollow((v) => !v)}>
                <span className="inline-flex items-center gap-1">
                  <LocateFixed className="size-4" />
                  Theo tâm
                </span>
              </Chip>
              <Chip active={panMode} onClick={() => setPanMode((v) => !v)}>
                <span className="inline-flex items-center gap-1">
                  <Move className="size-4" />
                  Dịch khung
                </span>
              </Chip>
              <Chip active={collision === "merge"} onClick={() => setCollision("merge")}>
                Hợp nhất
              </Chip>
              <Chip active={collision === "bounce"} onClick={() => setCollision("bounce")}>
                Nảy
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
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-3 text-sm font-medium"
              >
                <Trash2 className="size-4" />
                Xóa vật
              </button>
              <button
                type="button"
                onClick={() => simRef.current?.clear()}
                className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm font-medium"
              >
                Xóa hết
              </button>
              <button
                type="button"
                onClick={() => {
                  const sim = simRef.current;
                  if (!sim) return;
                  sim.requestFit = true;
                  setFollow(true);
                }}
                className="inline-flex min-h-11 items-center rounded-full border border-line px-3 text-sm font-medium"
              >
                Vừa khung
              </button>
            </div>
            <p className="text-sm tabular-nums text-muted">{snap.count} thiên thể</p>
            <ReferenceList />
            <button
              type="button"
              onClick={() => {
                setMode("trade");
              }}
              className="rounded-card border border-teal bg-paper-2 px-3 py-3 text-left"
            >
              <p className="font-serif text-lg leading-snug text-ink">Cùng một phương trình</p>
              <p className="mt-1 text-sm text-muted">
                F = G m₁m₂ / r² trở thành Tᵢⱼ = G Yᵢ Yⱼ / Dᵢⱼᵞ. Khối lượng thành quy mô kinh tế, khoảng cách
                vẫn cản trở, lực thành dòng thương mại.
              </p>
              <p className="mt-2 text-sm font-medium text-ink">Mở mô hình thương mại</p>
            </button>
          </div>
        ) : mode === "trade" ? (
          <div className="flex flex-col gap-4 p-4 pb-8">
            <div>
              <p className="font-serif text-xl leading-snug">Tᵢⱼ = G · Yᵢ Yⱼ / Dᵢⱼᵞ</p>
              <p className="mt-1 text-sm text-muted">
                Tinbergen (1962). Y là GDP, D là khoảng cách, γ được ước lượng. Newton (1687/1999) khóa γ ở 2.
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {TRADE_SCENES.map((s) => (
                <Chip key={s.id} active={tradeScene === s.id} onClick={() => applyTrade(s.id)}>
                  {s.name}
                </Chip>
              ))}
              <button
                type="button"
                onClick={() => setEcos((prev) => prev.map((e) => ({ ...e, x: e.homeX, y: e.homeY })))}
                className="min-h-11 shrink-0 rounded-full border border-line px-3 text-sm font-medium"
              >
                Đặt lại chỗ
              </button>
            </div>
            <label className="block">
              <span className="mb-1 flex items-baseline justify-between text-sm">
                <span>Số mũ khoảng cách γ</span>
                <span className="tabular-nums font-medium">{comma(gamma, 2)}</span>
              </span>
              <input
                type="range"
                min={0.6}
                max={2.4}
                step={0.05}
                value={gamma}
                aria-label="Số mũ khoảng cách gamma"
                onChange={(e) => setGamma(Number(e.target.value))}
              />
              <span className="text-xs text-muted">Newton nằm ở 2,00. Thương mại thực nghiệm thường gần 1.</span>
            </label>
            {focus && chosen ? (
              <div className="rounded-card bg-paper-2 px-3 py-3">
                <p className="text-sm font-medium">
                  {focus.name} × {chosen.econ.name}
                </p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  D = {formatKm(chosen.km)} · GDP {formatGdp(focus.gdp)} × {formatGdp(chosen.econ.gdp)} nghìn tỷ
                  USD
                </p>
                <p className="mt-2 text-sm">
                  Phần dòng chảy {comma(chosen.share, 0)}%. Với số mũ 2, cùng G, cặp này còn khoảng{" "}
                  {comma(Math.max(chosen.newtonPct, 0.1), chosen.newtonPct < 10 ? 1 : 0)}% so với γ hiện tại.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Chọn một dòng bên dưới để xem một cặp.</p>
            )}
            {pairId && focus ? (
              <label className="block">
                <span className="mb-1 flex items-baseline justify-between text-sm">
                  <span>Ưu đãi cặp (FTA, ngôn ngữ)</span>
                  <span className="tabular-nums font-medium">{comma(boost, 1)}×</span>
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={boost}
                  aria-label="Ưu đãi cho cặp đang chọn"
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setBoosts((prev) => ({ ...prev, [pairKey(focus.id, pairId)]: v }));
                  }}
                />
              </label>
            ) : null}
            <div>
              <div className="mb-2 flex items-center justify-between text-xs text-muted">
                <span>Từ {focus?.name ?? "—"}</span>
                <span className="inline-flex items-center gap-2">
                  <span className="inline-block size-2 rounded-full bg-teal" /> γ
                  <span className="inline-block size-2 rounded-full bg-amber" /> mũ 2
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
                      <span className="w-8 shrink-0 text-sm font-medium">{row.econ.short}</span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="block h-1.5 overflow-hidden rounded-full bg-paper">
                          <span
                            className="block h-full rounded-full bg-teal"
                            style={{ width: `${Math.min(100, row.share)}%` }}
                          />
                        </span>
                        <span className="block h-1.5 overflow-hidden rounded-full bg-paper">
                          <span
                            className="block h-full rounded-full bg-amber"
                            style={{ width: `${Math.min(100, row.newtonShare)}%` }}
                          />
                        </span>
                      </span>
                      <span className="w-12 shrink-0 text-right text-sm tabular-nums">{comma(row.share, 0)}%</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <details className="rounded-card border border-line px-3 py-2">
              <summary className="min-h-11 text-sm font-medium">Vì sao không phải r²?</summary>
              <p className="pb-2 text-sm text-muted">
                Định luật Newton khóa số mũ ở 2. Trong thương mại, γ được ước lượng và thường nhỏ hơn, vì chi phí
                vận tải không phình như lực hấp dẫn. Anderson và van Wincoop (2003) chỉ ra G trong thương mại không phải
                hằng số vũ trụ: biên giới, ngôn ngữ và sức cản đa phương nằm trong đó. GDP danh nghĩa xấp xỉ 2024, làm
                tròn để giảng — mô hình tối giản này không thay một hồi quy đầy đủ.
              </p>
            </details>
            <button
              type="button"
              onClick={() => {
                setMode("orbit");
              }}
              className="min-h-11 self-start rounded-full border border-line px-3 text-sm font-medium"
            >
              Xem lại quỹ đạo
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("lab");
              }}
              className="rounded-card border border-teal bg-paper-2 px-3 py-3 text-left"
            >
              <p className="font-serif text-lg leading-snug">Cùng phương trình, với FDI</p>
              <p className="mt-1 text-sm text-muted">
                Phan và Đỗ (2019) ước lượng khoảng cách địa lý, thể chế, văn hóa và kinh tế của dòng vốn vào Việt Nam.
                Mũ không còn là 2.
              </p>
              <p className="mt-2 text-sm font-medium">Mở Gravity Lab</p>
            </button>
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
