import { useState } from "react";
import { Check, ExternalLink, FlaskConical, Moon, Music, Orbit, Sun, Trash2, User } from "lucide-react";
import type { LabPanel } from "@/components/FdiLab";
import { sceneTitle } from "@/components/SpaceJourney";
import { SONGS, getSong, pickSong, toggleSong } from "@/lib/song";
import { setAmbient } from "@/lib/sound";
import { useSound } from "@/lib/use-sound";
import { lastScene, toggleCalm, useCalm } from "@/lib/journey-state";
import { setLang, setTheme, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";

const ISSUES_URL = "https://github.com/thuyhuongctu/Gravity-Lab/issues";

/** What Pro unlocks (design handoff, GL Play Store 1f). The last two already run on the device, for free, in phase 1. */
const PRO: Array<{ t: [string, string]; s: [string, string]; ready: boolean }> = [
  {
    t: ["Bộ dữ liệu FDI Việt Nam đã làm sạch (cleaned dataset)", "Cleaned Viet Nam FDI dataset"],
    s: ["Đối tác × năm 1990–2004, khoảng cách; giữ quan sát bằng 0 (zero flows); CSV, Stata .do, từ điển biến", "Partner × year 1990–2004 with distance; zero flows retained; CSV, Stata .do and codebook"],
    ready: true,
  },
  {
    t: ["Bản nháp kết quả chuẩn công bố (publication-ready)", "Publication-ready results draft"],
    s: ["Bảng hệ số có sao, diễn giải VI/EN, APA 7; xuất Word và LaTeX", "Coefficient table with significance stars, VI/EN interpretation, APA 7 references; Word and LaTeX"],
    ready: true,
  },
  {
    t: ["Ước lượng PPML trên dữ liệu CSV/Excel của bạn", "PPML estimation on your own CSV/Excel data"],
    s: ["Xử lý ngay trên thiết bị (on-device)", "Processed on your device"],
    ready: true,
  },
  {
    t: ["Trợ giảng AI không giới hạn (unlimited)", "Unlimited AI teaching assistant"],
    s: ["Trả lời từ tài liệu trong app, ngay trên thiết bị", "Answers from the app’s own references, on your device"],
    ready: true,
  },
];

function Row({ label, sub, value, action }: { label: string; sub?: string; value?: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-3 border-t border-line py-2.5 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {sub ? <p className="text-xs leading-relaxed text-muted">{sub}</p> : null}
      </div>
      {value ? <span className="shrink-0 text-xs text-muted">{value}</span> : null}
      {action}
    </div>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={"relative h-7 w-12 shrink-0 rounded-full transition-colors " + (on ? "bg-[#0b8a7a]" : "bg-[#2a2c31]")}
    >
      <span
        aria-hidden="true"
        className={"absolute top-1 size-5 rounded-full bg-[#f1ece2] shadow transition-[left] " + (on ? "left-6" : "left-1")}
      />
    </button>
  );
}

/**
 * The Me room: account, where to continue, shortcuts, Gravity Lab Pro and settings
 * (design handoff, GL Play Store 1d–1g). Phase 1 of the release plan: every Pro feature that exists is open to all.
 */
export function MeStage({
  onStory,
  onRoom,
  onAbout,
  onPrivacy,
}: {
  onStory: (scene: number) => void;
  onRoom: (room: "orbit" | "lab", panel: LabPanel | null) => void;
  onAbout: () => void;
  onPrivacy: () => void;
}) {
  const { lang, theme } = usePrefs();
  const sound = useSound();
  const calm = useCalm();
  const [yearly, setYearly] = useState(true);
  const L = lang === "vi" ? 0 : 1;
  const scene = lastScene();
  const song = getSong();

  const tiles: Array<{ n: string; s: string; pro?: boolean; icon: React.ReactNode; go: () => void }> = [
    {
      n: tr("Mô phỏng quỹ đạo", "Orbit simulator"),
      s: tr("Thay đổi số mũ (exponent) n", "Change exponent n"),
      icon: <Orbit className="size-5" />,
      go: () => onRoom("orbit", null),
    },
    {
      n: tr("Hệ số FDI 2019", "2019 FDI coefficients"),
      s: tr("Mô hình 8 · Bảng 6", "Model 8 · Table 6"),
      icon: <FlaskConical className="size-5" />,
      go: () => onRoom("lab", "coef"),
    },
    {
      n: tr("PPML và bộ dữ liệu", "PPML and the dataset"),
      s: tr("Dữ liệu của bạn hoặc fdi_vn_panel", "Your data or fdi_vn_panel"),
      pro: true,
      icon: <FlaskConical className="size-5" />,
      go: () => onRoom("lab", "data"),
    },
    {
      n: tr("Bài hát chủ đề", "Theme song"),
      s: SONGS[lang].title,
      icon: <Music className="size-5" />,
      go: () => {
        if (!song.playing && song.id !== lang) pickSong(lang);
        toggleSong();
      },
    },
  ];

  function clearLocal() {
    const ok = window.confirm(
      tr(
        "Xóa mọi dữ liệu Gravity Lab trên thiết bị này (lựa chọn, tiến độ, bộ nhớ ngoại tuyến)? App sẽ tải lại.",
        "Delete all Gravity Lab data on this device (choices, progress, offline cache)? The app will reload.",
      ),
    );
    if (!ok) return;
    try {
      localStorage.clear();
    } catch {
      // Nothing stored.
    }
    const done = () => window.location.reload();
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(done, done);
    } else done();
  }

  return (
    <div className="surface nebula absolute inset-0 overflow-y-auto bg-paper text-ink">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 pb-16">
        {/* Account */}
        <section className="noir-card rounded-[26px] p-5 sm:p-6" aria-labelledby="me-acc">
          <div className="flex items-center gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_36%_25%,#d3f6f1,#4fd1c5_48%,#1fa294)] text-[#062a30]">
              <User className="size-6" />
            </span>
            <div className="min-w-0">
              <p className="kicker text-amber">{tr("Tài khoản (account)", "Account")}</p>
              <h2 id="me-acc" className="font-serif text-2xl leading-tight">
                {tr("Chế độ khách (guest mode)", "Guest mode")}
              </h2>
              <p className="text-sm text-muted">
                {tr("Tiến độ và lựa chọn được lưu trên thiết bị này.", "Progress and choices are kept on this device.")}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {tr(
              "Đăng nhập (sign in) để lưu tiến độ và đồng bộ (sync) giữa các thiết bị sẽ có cùng bản Android trên CH Play.",
              "Signing in to save progress and sync across devices arrives with the Android app on Google Play.",
            )}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" disabled className="noir-raise min-h-11 rounded-full px-4 text-sm font-semibold text-ink opacity-50">
              {tr("Tiếp tục với Google", "Continue with Google")}
            </button>
            <button type="button" disabled className="noir-raise min-h-11 rounded-full px-4 text-sm font-semibold text-ink opacity-50">
              {tr("Gửi mã đăng nhập (sign-in code)", "Send sign-in code")}
            </button>
            <span className="pill-on inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold">
              <Check className="mr-1.5 size-4" />
              {tr("Dùng thử không cần tài khoản (guest mode)", "Try without an account")}
            </span>
          </div>
        </section>

        {/* Continue + shortcuts */}
        <section className="grid gap-4 md:grid-cols-[1.1fr_1fr]" aria-label={tr("Tiếp tục", "Continue")}>
          <button
            type="button"
            onClick={() => onStory(scene)}
            className="noir-card flex items-center gap-4 rounded-[26px] p-5 text-left sm:p-6"
          >
            <div className="min-w-0 flex-1">
              <p className="kicker text-amber">{tr("Chào mừng trở lại", "Welcome back")}</p>
              <p className="mt-1 font-serif text-xl leading-tight">
                {tr(`Tiếp tục · Cảnh ${scene + 1}/9`, `Continue · Scene ${scene + 1}/9`)}
              </p>
              <p className="mt-1 text-sm text-muted">{sceneTitle(scene, lang)}</p>
            </div>
            <span aria-hidden="true" className="cosmic-btn flex size-12 shrink-0 items-center justify-center rounded-full text-lg">
              ▶
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => (
              <button key={t.n} type="button" onClick={t.go} className="noir-card relative flex flex-col gap-2 rounded-[22px] p-4 text-left">
                <span className="text-[#4fd1c5]">{t.icon}</span>
                <span className="text-sm leading-tight font-semibold">{t.n}</span>
                <span className="text-xs text-muted">{t.s}</span>
                {t.pro ? (
                  <span className="absolute top-3 right-3 rounded-full bg-[#ffc56b] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#3a1a05]">PRO</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        {/* Pro */}
        <section className="noir-card rounded-[26px] p-5 sm:p-6" aria-labelledby="me-pro">
          <p className="kicker text-amber">{tr("Nâng cấp Pro", "Upgrade to Pro")}</p>
          <h2 id="me-pro" className="mt-1 font-serif text-3xl leading-tight">
            Gravity Lab Pro
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">
            {tr(
              "Mọi bài học vẫn miễn phí. Pro giúp bạn tạo kết quả cho luận văn (thesis).",
              "All lessons remain free. Pro helps you produce results for your thesis.",
            )}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#4fd1c5]/15 px-3 py-1.5 text-sm font-semibold text-[#4fd1c5]">
            <Check className="size-4" />
            {tr("Giai đoạn 1: Pro mở miễn phí cho mọi người", "Phase 1: Pro is open to everyone, free")}
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {PRO.map((f) => (
              <li key={f.t[1]} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full " +
                    (f.ready ? "bg-[#0b8a7a] text-white" : "bg-[#2a2c31] text-[#a8a297]")
                  }
                >
                  <Check className="size-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {f.t[L]}
                    {f.ready ? null : (
                      <span className="ml-2 rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-muted">{tr("sắp có", "coming")}</span>
                    )}
                  </span>
                  <span className="block text-xs text-muted">{f.s[L]}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={tr("Gói thuê bao", "Plan")}>
            {(
              [
                ["m", tr("Theo tháng (monthly)", "Monthly"), "49.000đ", tr("/ tháng", "/ month"), tr("Hủy bất cứ lúc nào", "Cancel anytime"), false],
                ["y", tr("Theo năm (annual)", "Annual"), "399.000đ", tr("/ năm", "/ year"), tr("≈ 33.000đ/tháng · tiết kiệm 32%", "≈ 33.000đ/month · save 32%"), true],
              ] as const
            ).map(([id, n, price, per, note, popular]) => {
              const on = yearly === (id === "y");
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setYearly(id === "y")}
                  className={
                    "relative rounded-[22px] p-4 text-left transition-shadow " +
                    (on ? "noir-raise shadow-[inset_0_0_0_2px_#4fd1c5]" : "noir-raise opacity-80")
                  }
                >
                  {popular ? (
                    <span className="absolute top-3 right-3 rounded-full bg-[#ffc56b] px-2 py-0.5 text-[10px] font-bold text-[#3a1a05]">
                      {tr("Phổ biến", "Popular")}
                    </span>
                  ) : null}
                  <span className="block text-sm font-semibold">{n}</span>
                  <span className="mt-1 block font-serif text-2xl">
                    {price} <span className="text-sm text-muted">{per}</span>
                  </span>
                  <span className="block text-xs text-muted">{note}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => onRoom("lab", "data")} className="cosmic-btn min-h-12 rounded-full px-5 text-sm font-semibold">
              {tr("Mở phòng PPML và bộ dữ liệu →", "Open PPML and the dataset →")}
            </button>
            <p className="text-xs leading-relaxed text-muted">
              {yearly
                ? tr("Trên CH Play: dùng thử 7 ngày, sau đó 399.000đ/năm.", "On Google Play: 7-day free trial, then 399.000đ/year.")
                : tr("Trên CH Play: dùng thử 7 ngày, sau đó 49.000đ/tháng.", "On Google Play: 7-day free trial, then 49.000đ/month.")}
            </p>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {tr(
              "Khi bản Android ra mắt: thanh toán qua Google Play, tự động gia hạn (auto-renew); hủy trong Gói thuê bao (Subscriptions) ít nhất 24 giờ trước kỳ mới; giảm giá cho email .edu.vn. Trên web, các tính năng Pro đã có vẫn miễn phí.",
              "With the Android app: billed through Google Play, renews automatically; cancel in Subscriptions at least 24 hours before the next period; discounts for .edu.vn emails. On the web, the Pro features that exist stay free.",
            )}
          </p>
        </section>

        {/* Settings */}
        <section className="noir-card rounded-[26px] p-5 sm:p-6" aria-labelledby="me-set">
          <p className="kicker text-amber">{tr("Cài đặt (settings)", "Settings")}</p>
          <h2 id="me-set" className="mt-1 font-serif text-2xl leading-tight">
            {tr("Hiển thị, âm thanh và quyền riêng tư", "Display, sound and privacy")}
          </h2>

          <h3 className="mt-4 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{tr("Tài khoản (account)", "Account")}</h3>
          <Row label={tr("Gói hiện tại", "Current plan")} value={tr("Pro · giai đoạn 1, miễn phí", "Pro · phase 1, free")} />
          <Row label={tr("Quản lý gói thuê bao (subscription)", "Manage subscription")} value={tr("Google Play · bản Android", "Google Play · Android app")} />
          <Row
            label={tr("Ngôn ngữ", "Language")}
            action={
              <div className="noir-track flex rounded-full p-1" role="group" aria-label={tr("Ngôn ngữ", "Language")}>
                {(["vi", "en"] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    lang={l}
                    aria-pressed={lang === l}
                    onClick={() => setLang(l)}
                    className={"min-h-9 min-w-10 rounded-full px-2 text-xs font-semibold uppercase " + (lang === l ? "cosmic-btn" : "text-muted")}
                  >
                    {l === "vi" ? "VI" : "EN"}
                  </button>
                ))}
              </div>
            }
          />

          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{tr("Hiển thị và âm thanh", "Display and sound")}</h3>
          <Row
            label={tr("Giao diện tối", "Dark theme")}
            action={
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-pressed={theme === "dark"}
                className="noir-raise inline-flex min-h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-ink"
              >
                {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                {theme === "dark" ? tr("Tối", "Dark") : tr("Sáng", "Light")}
              </button>
            }
          />
          <Row
            label={tr("Giảm chuyển động (reduce motion)", "Reduce motion")}
            sub={tr("Không nhảy camera, không vệt sao khi cuộn", "No camera hop or warp streaks while scrolling")}
            action={<Switch on={calm} onChange={toggleCalm} label={tr("Giảm chuyển động", "Reduce motion")} />}
          />
          <Row
            label={tr("Âm vũ trụ (cosmic tones)", "Cosmic tones")}
            sub={tr("Tần số các hành tinh; tự giảm khi bài hát hoặc Lumina nói", "Planetary frequencies; duck while the song or Lumina plays")}
            action={<Switch on={sound.ambient} onChange={() => setAmbient(!sound.ambient)} label={tr("Âm vũ trụ", "Cosmic tones")} />}
          />
          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{tr("Quyền riêng tư (privacy)", "Privacy")}</h3>
          <Row
            label={tr("Chia sẻ dữ liệu sử dụng ẩn danh (anonymous usage data)", "Share anonymous usage data")}
            sub={tr("App không thu thập dữ liệu sử dụng.", "The app collects no usage data.")}
            value={tr("Tắt", "Off")}
          />
          <Row
            label={tr("Lưu lịch sử trợ giảng", "Keep tutor history")}
            sub={tr("Câu hỏi không được gửi đi và không được lưu.", "Questions are not sent anywhere and are not stored.")}
            value={tr("Không lưu", "Not kept")}
          />
          <Row
            label={tr("Dữ liệu PPML của bạn", "Your PPML data")}
            sub={tr("Không tải lên máy chủ (server).", "Never uploaded to a server.")}
            value={tr("Chỉ trên thiết bị", "On-device only")}
          />

          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">{tr("Hỗ trợ (support)", "Support")}</h3>
          <Row
            label={tr("Giới thiệu Gravity Lab (about)", "About Gravity Lab")}
            action={
              <button type="button" onClick={onAbout} className="noir-raise min-h-10 rounded-full px-3 text-sm font-semibold text-ink">
                {tr("Mở", "Open")} ›
              </button>
            }
          />
          <Row
            label={tr("Chính sách quyền riêng tư (Privacy Policy)", "Privacy Policy")}
            action={
              <button type="button" onClick={onPrivacy} className="noir-raise min-h-10 rounded-full px-3 text-sm font-semibold text-ink">
                {tr("Mở", "Open")} ›
              </button>
            }
          />
          <Row
            label={tr("Báo cáo câu trả lời AI không phù hợp", "Report an inappropriate AI answer")}
            sub={tr("Mở trang vấn đề (issues) của dự án trên GitHub.", "Opens the project’s issues page on GitHub.")}
            action={
              <a href={ISSUES_URL} target="_blank" rel="noreferrer" className="noir-raise inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink">
                GitHub <ExternalLink className="size-3.5" />
              </a>
            }
          />
          <Row
            label={tr("Xóa dữ liệu trên thiết bị", "Delete data on this device")}
            sub={tr("Lựa chọn, tiến độ và bộ nhớ ngoại tuyến. Không có tài khoản nào để xóa.", "Choices, progress and the offline cache. There is no account to delete.")}
            action={
              <button
                type="button"
                onClick={clearLocal}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#ff7a9c]/50 px-3 text-sm font-semibold text-[#ff7a9c]"
              >
                <Trash2 className="size-4" />
                {tr("Xóa", "Delete")}
              </button>
            }
          />
        </section>
      </div>
    </div>
  );
}
