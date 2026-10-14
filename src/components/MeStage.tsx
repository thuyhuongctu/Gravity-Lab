import {
  Check,
  ExternalLink,
  FlaskConical,
  ListChecks,
  Moon,
  Music,
  Orbit,
  Sun,
  Trash2,
  User,
} from "lucide-react";
import { Exercises } from "@/components/Exercises";
import type { LabPanel } from "@/components/FdiLab";
import { sceneTitle } from "@/components/SpaceJourney";
import { SONGS, getSong, pickSong, toggleSong } from "@/lib/song";
import { setAmbient } from "@/lib/sound";
import { useSound } from "@/lib/use-sound";
import { lastScene, toggleCalm, useCalm } from "@/lib/journey-state";
import { setLang, setTheme, tr } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";
import { ProSection } from "@/components/ProSection";

const ISSUES_URL = "https://github.com/thuyhuongctu/Gravity-Lab/issues";

function Row({
  label,
  sub,
  value,
  action,
}: {
  label: string;
  sub?: string;
  value?: string;
  action?: React.ReactNode;
}) {
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
      className={
        "relative h-7 w-12 shrink-0 rounded-full transition-colors " + (on ? "bg-teal" : "bg-line")
      }
    >
      <span
        aria-hidden="true"
        className={
          "absolute top-1 size-5 rounded-full bg-[#f1ece2] shadow transition-[left] " +
          (on ? "left-6" : "left-1")
        }
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
  onBridge,
  onAbout,
  onPrivacy,
}: {
  onStory: (scene: number) => void;
  onRoom: (room: "orbit" | "trade" | "lab", panel: LabPanel | null) => void;
  onBridge: () => void;
  onAbout: () => void;
  onPrivacy: () => void;
}) {
  const { lang, theme } = usePrefs();
  const sound = useSound();
  const calm = useCalm();
  const L = lang === "vi" ? 0 : 1;
  const scene = lastScene();
  const song = getSong();

  const tiles: Array<{
    n: string;
    s: string;
    pro?: boolean;
    icon: React.ReactNode;
    go: () => void;
  }> = [
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
      n: tr("Bài tập", "Exercises"),
      s: tr("6 câu, chấm ngay trên máy", "6 questions, marked on device"),
      icon: <ListChecks className="size-5" />,
      go: () =>
        document.getElementById("me-ex")?.scrollIntoView({ behavior: "smooth", block: "start" }),
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
      Object.keys(localStorage)
        .filter((k) => k.startsWith("gravity-lab:"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // Nothing stored.
    }
    const done = () => window.location.reload();
    if ("caches" in window) {
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((k) => k.startsWith("gl-")).map((k) => caches.delete(k))),
        )
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
                {tr(
                  "Tiến độ và lựa chọn được lưu trên thiết bị này.",
                  "Progress and choices are kept on this device.",
                )}
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
            <button
              type="button"
              disabled
              className="noir-raise min-h-11 rounded-full px-4 text-sm font-semibold text-ink opacity-50"
            >
              {tr("Tiếp tục với Google", "Continue with Google")}
            </button>
            <button
              type="button"
              disabled
              className="noir-raise min-h-11 rounded-full px-4 text-sm font-semibold text-ink opacity-50"
            >
              {tr("Gửi mã đăng nhập (sign-in code)", "Send sign-in code")}
            </button>
            <span className="pill-on inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold">
              <Check className="mr-1.5 size-4" />
              {tr("Dùng thử không cần tài khoản (guest mode)", "Try without an account")}
            </span>
          </div>
        </section>

        {/* Continue + shortcuts */}
        <section
          className="grid gap-4 md:grid-cols-[1.1fr_1fr]"
          aria-label={tr("Tiếp tục", "Continue")}
        >
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
            <span
              aria-hidden="true"
              className="cosmic-btn flex size-12 shrink-0 items-center justify-center rounded-full text-lg"
            >
              ▶
            </span>
          </button>
          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => (
              <button
                key={t.n}
                type="button"
                onClick={t.go}
                className="noir-card relative flex flex-col gap-2 rounded-[22px] p-4 text-left"
              >
                <span className="text-teal">{t.icon}</span>
                <span className="text-sm leading-tight font-semibold">{t.n}</span>
                <span className="text-xs text-muted">{t.s}</span>
                {t.pro ? (
                  <span className="absolute top-3 right-3 rounded-full bg-amber-2 px-2 py-0.5 text-[11px] font-bold tracking-wider text-void">
                    PRO
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        {/* Pro */}
        <ProSection onRoom={onRoom} />

        {/* Exercises */}
        <section
          className="noir-card scroll-mt-4 rounded-[26px] p-5 sm:p-6"
          aria-labelledby="me-ex"
        >
          <p className="kicker text-amber">
            {tr("Bài tập · chấm ngay trên thiết bị", "Exercises · marked on this device")}
          </p>
          <h2 id="me-ex" className="mt-1 font-serif text-2xl leading-tight">
            {tr("Kiểm tra nhanh: từ Newton đến FDI", "Quick check: from Newton to FDI")}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted">
            {tr(
              "Sáu câu, mỗi câu gắn với một phòng hoặc một bước của cầu công thức.",
              "Six questions, each tied to a room or a step of the formula bridge.",
            )}
          </p>
          <Exercises
            onOpen={(t) => {
              if (t.room === "story") onBridge();
              else onRoom(t.room, t.panel ?? null);
            }}
          />
        </section>

        {/* Settings */}
        <section className="noir-card rounded-[26px] p-5 sm:p-6" aria-labelledby="me-set">
          <p className="kicker text-amber">{tr("Cài đặt (settings)", "Settings")}</p>
          <h2 id="me-set" className="mt-1 font-serif text-2xl leading-tight">
            {tr("Hiển thị, âm thanh và quyền riêng tư", "Display, sound and privacy")}
          </h2>

          <h3 className="mt-4 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {tr("Tài khoản (account)", "Account")}
          </h3>
          <Row
            label={tr("Gói hiện tại", "Current plan")}
            value={tr("Pro · giai đoạn 1, miễn phí", "Pro · phase 1, free")}
          />
          <Row
            label={tr("Quản lý gói thuê bao (subscription)", "Manage subscription")}
            value={tr("Chưa có trên web", "Not on the web")}
          />
          <Row
            label={tr("Ngôn ngữ", "Language")}
            action={
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
                      "min-h-9 min-w-10 rounded-full px-2 text-xs font-semibold uppercase " +
                      (lang === l ? "cosmic-btn" : "text-muted")
                    }
                  >
                    {l === "vi" ? "VI" : "EN"}
                  </button>
                ))}
              </div>
            }
          />

          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {tr("Hiển thị và âm thanh", "Display and sound")}
          </h3>
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
            sub={tr(
              "Không nhảy camera, không vệt sao khi cuộn",
              "No camera hop or warp streaks while scrolling",
            )}
            action={
              <Switch
                on={calm}
                onChange={toggleCalm}
                label={tr("Giảm chuyển động", "Reduce motion")}
              />
            }
          />
          <Row
            label={tr("Âm vũ trụ (cosmic tones)", "Cosmic tones")}
            sub={tr(
              "Tần số các hành tinh; tự giảm khi bài hát hoặc Lumina nói",
              "Planetary frequencies; duck while the song or Lumina plays",
            )}
            action={
              <Switch
                on={sound.ambient}
                onChange={() => setAmbient(!sound.ambient)}
                label={tr("Âm vũ trụ", "Cosmic tones")}
              />
            }
          />
          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {tr("Quyền riêng tư (privacy)", "Privacy")}
          </h3>
          <Row
            label={tr(
              "Chia sẻ dữ liệu sử dụng ẩn danh (anonymous usage data)",
              "Share anonymous usage data",
            )}
            sub={tr("App không thu thập dữ liệu sử dụng.", "The app collects no usage data.")}
            value={tr("Tắt", "Off")}
          />
          <Row
            label={tr("Lưu lịch sử trợ giảng", "Keep tutor history")}
            sub={tr(
              "Câu hỏi không được gửi đi và không được lưu.",
              "Questions are not sent anywhere and are not stored.",
            )}
            value={tr("Không lưu", "Not kept")}
          />
          <Row
            label={tr("Dữ liệu PPML của bạn", "Your PPML data")}
            sub={tr("Không tải lên máy chủ (server).", "Never uploaded to a server.")}
            value={tr("Chỉ trên thiết bị", "On-device only")}
          />

          <h3 className="mt-5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
            {tr("Hỗ trợ (support)", "Support")}
          </h3>
          <Row
            label={tr("Giới thiệu Gravity Lab (about)", "About Gravity Lab")}
            action={
              <button
                type="button"
                onClick={onAbout}
                className="noir-raise min-h-10 rounded-full px-3 text-sm font-semibold text-ink"
              >
                {tr("Mở", "Open")} ›
              </button>
            }
          />
          <Row
            label={tr("Chính sách quyền riêng tư (Privacy Policy)", "Privacy Policy")}
            action={
              <button
                type="button"
                onClick={onPrivacy}
                className="noir-raise min-h-10 rounded-full px-3 text-sm font-semibold text-ink"
              >
                {tr("Mở", "Open")} ›
              </button>
            }
          />
          <Row
            label={tr("Báo lỗi câu trả lời của Lumina", "Report a wrong Lumina answer")}
            sub={tr(
              "Mở trang vấn đề (issues) của dự án trên GitHub.",
              "Opens the project’s issues page on GitHub.",
            )}
            action={
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noreferrer"
                className="noir-raise inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-ink"
              >
                GitHub <ExternalLink className="size-3.5" />
              </a>
            }
          />
          <Row
            label={tr("Xóa dữ liệu trên thiết bị", "Delete data on this device")}
            sub={tr(
              "Lựa chọn, tiến độ và bộ nhớ ngoại tuyến. Không có tài khoản nào để xóa.",
              "Choices, progress and the offline cache. There is no account to delete.",
            )}
            action={
              <button
                type="button"
                onClick={clearLocal}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-clay/50 px-3 text-sm font-semibold text-clay"
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
