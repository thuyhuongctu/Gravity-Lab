import { Fragment } from "react";
import type { LabPanel } from "@/components/FdiLab";
import { APP_DOI, APP_DOI_URL } from "@/components/CiteApp";
import { ReferenceList } from "@/components/ReferenceList";
import { FormulaBridge } from "@/components/FormulaBridge";
import { HeroScene } from "@/components/HeroScene";
import { VnWatermark } from "@/components/VnWatermark";
import { RoomCover, type CoverRoom } from "@/components/RoomCover";
import { tr } from "@/lib/prefs";

type Room = "orbit" | "trade" | "lab";

type Chapter = {
  year: string;
  who: string;
  vi: { title: string; text: string };
  en: { title: string; text: string };
  formula?: string;
  cover?: CoverRoom;
  /** A clay portrait beside the chapter, with name, dates and a short note. */
  figure?: {
    src: string;
    name: string;
    dates: string;
    vi: { alt: string; note: string };
    en: { alt: string; note: string };
  };
  /** An illustration under the chapter text (square unless a size is given). */
  art?: { src: string; vi: string; en: string; w?: number; h?: number };
  open?: { room: Room; panel: LabPanel | null; vi: string; en: string };
};

const art = (file: string) => `${import.meta.env.BASE_URL}cast/${file}`;

/** From Newton's apple to the 2026 lab: the line the app follows, chapter by chapter. */
const CHAPTERS: Chapter[] = [
  {
    year: "1665–1666",
    who: "Isaac Newton · Woolsthorpe",
    vi: {
      title: "Những năm dịch hạch",
      text: "Dịch hạch đóng cửa Cambridge, Newton về quê ở Woolsthorpe gần hai năm. Ông nghiên cứu chuyển động tròn, áp dụng cho Mặt Trăng và các hành tinh, và rút ra rằng lực hướng tâm giảm theo bình phương khoảng cách. Khi ấy thế giới chưa biết gì về những phát hiện này (Westfall, 1980).",
    },
    en: {
      title: "The plague years",
      text: "The plague closed Cambridge, and Newton spent most of two years at home in Woolsthorpe. He studied circular motion, applied it to the Moon and the planets, and derived that the force pulling them inward falls with the square of the distance. The world heard nothing of it at the time (Westfall, 1980).",
    },
    art: {
      src: "noir/newton-scene.webp",
      vi: "Quả táo rơi, quyển Principia và Mặt Trăng: đất sét phong cách noir",
      en: "The falling apple, the Principia and the Moon: clay noir",
    },
  },
  {
    year: "1687",
    who: "Isaac Newton",
    vi: {
      title: "Quả táo và mặt trăng cùng một lực",
      text: "Trong Principia (Newton, 1687/1999), Newton cho rằng lực kéo quả táo rơi cũng giữ Mặt Trăng trên quỹ đạo quanh Trái Đất: mọi vật có khối lượng hút nhau, lực tỷ lệ với tích hai khối lượng và nghịch với bình phương khoảng cách. Giai thoại quả táo do chính Newton kể lại lúc tuổi già (Stukeley, 1752/1936). Ông nối công trình của Galileo (1638/1914) về gia tốc và của Kepler (1619/1997) về chuyển động hành tinh thành một lý thuyết cho cả bầu trời lẫn mặt đất; lý thuyết ấy đứng vững cho đến khi Einstein (1916) mở rộng ở thế kỷ 20.",
    },
    en: {
      title: "The apple and the moon share one force",
      text: "In the Principia (Newton, 1687/1999), Newton argued that the force pulling an apple to the ground also keeps the Moon in orbit around the Earth: all objects with mass attract each other, with a force that grows with the product of the masses and falls with the square of the distance. The apple story comes from Newton himself, told in old age (Stukeley, 1752/1936). He tied Galileo's (1638/1914) work on acceleration and Kepler's (1619/1997) on planetary motion into one theory for the sky and the ground, which stood until Einstein (1916) expanded on it in the 20th century.",
    },
    formula: "F = G m₁m₂ / r²",
    cover: "orbit",
    open: { room: "orbit", panel: null, vi: "Mở Quỹ đạo", en: "Open Orbit" },
    art: {
      src: "scene/minh-long-dome.webp",
      w: 688,
      h: 384,
      vi: "Minh Long trong bộ đồ phi hành gia đứng dưới mái vòm đài thiên văn, tay nâng quả táo phát sáng có quỹ đạo bao quanh; bảng đen phía sau ghi định luật hấp dẫn",
      en: "Minh Long in a spacesuit under an observatory dome, holding a glowing apple ringed by an orbit; the blackboard behind shows the law of gravitation",
    },
  },
  {
    year: "1798",
    who: "Henry Cavendish",
    vi: {
      title: "Cân xoắn trong phòng thí nghiệm",
      text: "Cavendish đo lực hút giữa các quả cầu chì để tính mật độ Trái Đất (Cavendish, 1798). Từ phép đo ấy, về sau người ta suy ra hằng số G.",
    },
    en: {
      title: "A torsion balance in the laboratory",
      text: "Cavendish measured the pull between lead spheres to find the density of the Earth (Cavendish, 1798). The constant G was later derived from his measurement.",
    },
  },
  {
    year: "1962",
    who: "Jan Tinbergen",
    vi: {
      title: "Phương trình ấy, cho thương mại",
      text: "Tinbergen thay khối lượng bằng quy mô kinh tế: thương mại giữa hai nước tăng theo GDP của cả hai và giảm theo khoảng cách. Số mũ khoảng cách không còn khóa ở 2 mà được ước lượng.",
    },
    en: {
      title: "The same equation, for trade",
      text: "Tinbergen replaced mass with economic size: trade between two countries rises with both GDPs and falls with distance. The distance exponent is no longer locked at 2; it is estimated.",
    },
    formula: "Tᵢⱼ = G · YᵢYⱼ / Dᵢⱼᵞ",
    cover: "trade",
    open: { room: "trade", panel: null, vi: "Mở Thương mại", en: "Open Trade" },
    figure: {
      src: "cast/tinbergen.webp",
      name: "Jan Tinbergen",
      dates: "1903–1994",
      vi: {
        alt: "Jan Tinbergen cầm phấn và quả địa cầu, tạo hình đất sét cách điệu",
        note: "Nhà kinh tế học Hà Lan. Năm 1969 ông cùng Ragnar Frisch nhận giải Nobel Kinh tế đầu tiên. Tạo hình đất sét cách điệu, không dựa trên một bức ảnh cụ thể.",
      },
      en: {
        alt: "Jan Tinbergen holding chalk and a globe, a stylised clay figure",
        note: "Dutch economist. In 1969 he shared the first Nobel Memorial Prize in Economic Sciences with Ragnar Frisch. A stylised clay figure, not based on any single photograph.",
      },
    },
    art: {
      src: "scene/lan-chi-board.webp",
      w: 688,
      h: 384,
      vi: "Hai học viên mặc đồ phi hành gia bên bảng đen: một bạn viết F = G m₁m₂/r² và T = G YᵢYⱼ/Dᵞ → FDI, Lan Chi cầm màn hình hologram quỹ đạo",
      en: "Two learners in spacesuits at a blackboard: one writes F = G m₁m₂/r² and T = G YᵢYⱼ/Dᵞ → FDI, Lan Chi holds an orbit hologram",
    },
  },
  {
    year: "2003",
    who: "Anderson & van Wincoop",
    vi: {
      title: "G không phải hằng số vũ trụ",
      text: "Biên giới, ngôn ngữ và sức cản đa phương nằm trong G của thương mại. Mô hình trọng lực có nền tảng lý thuyết vững hơn.",
    },
    en: {
      title: "G is not a universal constant",
      text: "Borders, language and multilateral resistance sit inside trade's G. The gravity model gains a firmer theoretical footing.",
    },
  },
  {
    year: "2006",
    who: "Santos Silva & Tenreyro",
    vi: {
      title: "Logarit của trọng lực",
      text: "Hồi quy trên log làm méo hệ số khi có nhiều quan sát bằng không. PPML ước lượng trực tiếp trên mức và giữ cả mẫu.",
    },
    en: {
      title: "The log of gravity",
      text: "Regressions on logs distort the coefficients when many observations are zero. PPML estimates on levels and keeps the whole sample.",
    },
    open: { room: "lab", panel: "ppml", vi: "Mở Vì sao PPML", en: "Open Why PPML" },
  },
  {
    year: "2008",
    who: "Xuan & Xing",
    vi: {
      title: "FDI và xuất khẩu của Việt Nam",
      text: "Dữ liệu FDI thực hiện vào Việt Nam theo nước nguồn, 1990–2004, đưa mô hình trọng lực về với dòng vốn vào Việt Nam.",
    },
    en: {
      title: "FDI and Vietnam's exports",
      text: "Realised FDI into Vietnam by source country, 1990–2004, brings the gravity model to capital flowing into Vietnam.",
    },
  },
  {
    year: "2019",
    who: "Phan Anh Tu & Do Thuy Huong",
    vi: {
      title: "Khoảng cách và quy mô thị trường của FDI vào Việt Nam",
      text: "Mười sáu đối tác, 2006–2015, tám mô hình hiệu ứng ngẫu nhiên: khoảng cách địa lý, thể chế, văn hóa và kinh tế. Từ mô hình 4, hệ số khoảng cách địa lý giữ quanh −0,38.",
    },
    en: {
      title: "Distance, market size and FDI into Vietnam",
      text: "Sixteen partners, 2006–2015, eight random-effects models: geographic, institutional, cultural and economic distance. From Model 4 on, the geographic distance coefficient holds near −0.38.",
    },
    cover: "lab",
    open: { room: "lab", panel: "coef", vi: "Mở Hệ số 2019", en: "Open 2019 coefficients" },
    art: {
      src: "scene/bao-ngoc-board.webp",
      w: 688,
      h: 384,
      vi: "Bảo Ngọc mặc đồ phi hành gia giảng bên bảng đen ghi β = −0,38 và đồ thị FDI giảm theo số km tới nhà máy",
      en: "Bảo Ngọc in a spacesuit at a blackboard showing β = −0.38 and a curve of FDI falling with the kilometres to the factory",
    },
  },
];

export function StoryStage({ onOpen }: { onOpen: (room: Room, panel: LabPanel | null) => void }) {
  return (
    <div className="surface nebula absolute inset-0 overflow-y-auto bg-paper text-ink">
      <VnWatermark />
      <div className="relative">
      <section className="relative isolate overflow-hidden bg-[#0b0a1f] text-[#fbfaff]">
        <div className="absolute inset-0 -z-10">
          <HeroScene />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(11,10,31,0.85)_0%,rgba(11,10,31,0)_32%,rgba(11,10,31,0)_62%,rgba(11,10,31,0.92)_100%)]"
        />
        <div className="pointer-events-none mx-auto flex min-h-[min(44rem,92svh)] max-w-2xl flex-col justify-between px-4 pt-5 pb-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 py-1 ps-1 pe-3 text-xs font-semibold backdrop-blur">
              <span
                aria-hidden="true"
                className="inline-flex size-6 items-center justify-center rounded-full bg-[#da251d] text-xs leading-none text-[#ffde00]"
              >
                ★
              </span>
              {tr(
                "Thiết kế tại Đồng bằng sông Cửu Long · Đại học Cần Thơ",
                "Made in the Mekong Delta · Can Tho University",
              )}
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-[1.06] drop-shadow-[0_2px_12px_rgba(11,10,31,0.9)] sm:text-5xl">
              {tr("Từ quả táo của Newton đến ", "From Newton's apple to ")}
              <span className="hero-gradient">{tr("dòng vốn vào Việt Nam.", "capital flowing into Vietnam.")}</span>
            </h2>
          </div>
          <div>
            <p className="font-math text-base text-[#5eead4] sm:text-lg">F = G m₁m₂ / r² → T = G YᵢYⱼ / Dᵞ → FDI</p>
            <p className="mt-2 max-w-xl leading-relaxed text-[#d9d6f2]">
              {tr(
                "Ba thế kỷ, một dạng phương trình: quy mô ở tử số, khoảng cách ở mẫu số. Mỗi chương dưới đây mở ra một phần của phòng thí nghiệm.",
                "Three centuries, one form of equation: size in the numerator, distance in the denominator. Each chapter below opens a part of the lab.",
              )}
            </p>
            <p className="mt-2 text-xs text-[#b9b4e0]">
              {tr(
                "Kéo để xoay Trái Đất. Quả táo và Mặt Trăng cùng chịu một lực; các vệt sáng là dòng vốn FDI chảy về Việt Nam.",
                "Drag to turn the Earth. The apple and the Moon answer to one force; the streaks of light are FDI flowing into Vietnam.",
              )}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4">
        <figure className="mt-5">
          <img
            src={`${import.meta.env.BASE_URL}noir/vietnam.webp`}
            alt={tr(
              "Bản đồ Việt Nam bằng đất sét dưới ánh đèn rọi, có Hà Nội, Cần Thơ, quần đảo Hoàng Sa và quần đảo Trường Sa",
              "A clay map of Vietnam under a spotlight, with Hà Nội, Cần Thơ, the Hoàng Sa and Trường Sa archipelagos",
            )}
            width={1600}
            height={1000}
            className="clay-card aspect-[8/5] w-full rounded-card bg-[#0b0a1f] object-cover"
          />
          <figcaption className="mt-2 text-xs text-muted">
            {tr(
              "Bản đồ đất sét: đường bờ biển theo Natural Earth; quần đảo Hoàng Sa và Trường Sa theo tọa độ các đảo chính.",
              "Clay map: coastline from Natural Earth; the Hoàng Sa and Trường Sa archipelagos from the coordinates of their main islands.",
            )}
          </figcaption>
        </figure>
      </div>

      <ul aria-hidden="true" className="mx-auto mt-4 grid max-w-2xl grid-cols-3 gap-2 px-4">
        {["apple-compass", "globe-telescope", "telescope-orbits"].map((f) => (
          <li key={f}>
            <img
              src={`${import.meta.env.BASE_URL}scene/${f}.webp`}
              alt=""
              width={600}
              height={448}
              loading="lazy"
              className="clay-card aspect-[4/3] w-full rounded-card bg-[#f1e8de] object-cover"
            />
          </li>
        ))}
      </ul>

      <figure className="mx-auto mt-4 grid max-w-2xl grid-cols-[minmax(0,10rem)_1fr] items-center gap-4 px-4">
        <img
          src={art("newton.webp")}
          alt={tr(
            "Isaac Newton cầm quả táo, tạo hình đất sét theo chân dung của Godfrey Kneller (1689)",
            "Isaac Newton holding an apple, a clay figure after Godfrey Kneller's 1689 portrait",
          )}
          width={448}
          height={600}
          className="clay-card aspect-[3/4] w-full rounded-card bg-[#f1e8de] object-contain"
        />
        <figcaption>
          <p className="font-serif text-xl leading-tight">Isaac Newton</p>
          <p className="text-sm text-muted">1643–1727</p>
          <p className="text-xs text-muted">
            {tr(
              "Sinh 25/12/1642 theo lịch cũ (4/1/1643 lịch mới), Woolsthorpe, Anh; mất 31/3/1727, London.",
              "Born 25 December 1642 Old Style (4 January 1643 New Style), Woolsthorpe, England; died 31 March 1727, London.",
            )}
          </p>
          <p className="mt-2 font-math text-lg">F = G m₁m₂ / r²</p>
          <p className="mt-2 text-xs text-muted">
            {tr(
              "Tạo hình đất sét theo chân dung của Godfrey Kneller (1689).",
              "Clay figure after Godfrey Kneller's 1689 portrait.",
            )}
          </p>
        </figcaption>
      </figure>

      <ol className="relative mx-auto mt-6 max-w-2xl px-4">
        {CHAPTERS.map((c) => {
          const t = tr(c.vi.title, c.en.title);
          const body = tr(c.vi.text, c.en.text);
          return (
            <Fragment key={c.year}>
              <li className="relative border-l-2 border-line pb-6 pl-5">
                <span
                  className="absolute -left-[7px] top-1 size-3 rounded-full border-2 border-paper bg-teal"
                  aria-hidden="true"
                />
                <p className="text-xs font-medium tabular-nums text-teal">
                  {c.year} · {c.who}
                </p>
                <h3 className="mt-1 font-serif text-xl leading-snug">{t}</h3>
                {c.formula ? <p className="mt-1 font-math text-lg">{c.formula}</p> : null}
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                {c.figure ? (
                  <figure className="mt-3 grid grid-cols-[minmax(0,8rem)_1fr] items-center gap-4">
                    <img
                      src={`${import.meta.env.BASE_URL}${c.figure.src}`}
                      alt={tr(c.figure.vi.alt, c.figure.en.alt)}
                      width={448}
                      height={600}
                      loading="lazy"
                      className="clay-card aspect-[3/4] w-full rounded-card bg-[#f1e8de] object-contain"
                    />
                    <figcaption>
                      <p className="font-serif text-lg leading-tight">{c.figure.name}</p>
                      <p className="text-sm text-muted">{c.figure.dates}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        {tr(c.figure.vi.note, c.figure.en.note)}
                      </p>
                    </figcaption>
                  </figure>
                ) : null}
                {c.art ? (
                  <img
                    src={`${import.meta.env.BASE_URL}${c.art.src}`}
                    alt={tr(c.art.vi, c.art.en)}
                    width={c.art.w ?? 1024}
                    height={c.art.h ?? 1024}
                    loading="lazy"
                    style={{ aspectRatio: `${c.art.w ?? 1} / ${c.art.h ?? 1}` }}
                    className={
                      "clay-card mt-3 w-full rounded-card bg-[#0b0a1f] object-cover " +
                      (c.art.w ? "max-w-xl" : "max-w-sm")
                    }
                  />
                ) : null}
                {c.cover ? <RoomCover room={c.cover} className="mt-3" /> : null}
                {c.open ? (
                  <button
                    type="button"
                    onClick={() => onOpen(c.open!.room, c.open!.panel)}
                    className="mt-2 min-h-11 rounded-full border border-line px-3 text-sm font-medium"
                  >
                    {tr(c.open.vi, c.open.en)} →
                  </button>
                ) : null}
              </li>
              {c.year === "1962" ? (
                <li className="relative border-l-2 border-line pb-6 pl-5">
                  <span
                    className="absolute -left-[7px] top-1 size-3 rounded-full border-2 border-paper bg-amber"
                    aria-hidden="true"
                  />
                  <figure className="mb-4">
                    <img
                      src={`${import.meta.env.BASE_URL}cast/newton-tinbergen.webp`}
                      alt={tr(
                        "Newton cầm quả táo và Tinbergen cầm quả địa cầu đứng trước bảng đen có công thức lực hấp dẫn và mô hình thương mại, tạo hình đất sét",
                        "Newton with an apple and Tinbergen with a globe in front of a blackboard showing the law of gravitation and the trade model, clay figures",
                      )}
                      width={688}
                      height={384}
                      loading="lazy"
                      className="clay-card aspect-[43/24] w-full rounded-card bg-[#2f4a43] object-cover"
                    />
                    <figcaption className="mt-2 text-xs leading-relaxed text-muted">
                      {tr(
                        "Newton (1687/1999) và Tinbergen (1962) trước cùng một tấm bảng. Công thức trên bảng là dạng giản lược; phương trình đầy đủ và từng bước chuyển hóa ở ngay bên dưới.",
                        "Newton (1687/1999) and Tinbergen (1962) at the same blackboard. The chalk shows a simplified form; the full equations and each step of the transition follow below.",
                      )}
                    </figcaption>
                  </figure>
                  <FormulaBridge onOpen={onOpen} />
                </li>
              ) : null}
            </Fragment>
          );
        })}
        <li className="relative pl-5">
          <span
            className="absolute -left-[5px] top-1 size-3 rounded-full bg-amber"
            aria-hidden="true"
          />
          <p className="text-xs font-medium tabular-nums text-amber">2026 · Gravity Lab</p>
          <h3 className="mt-1 font-serif text-2xl leading-snug">
            {tr(
              "Phòng thí nghiệm của nhóm, mở cho lớp học",
              "The team's lab, opened to the classroom",
            )}
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <figure>
              <img
                src={art("tu-vest.webp")}
                alt={tr(
                  "PGS.TS. Phan Anh Tu, phong cách đất sét",
                  "Assoc. Prof. Phan Anh Tu, clay style",
                )}
                loading="lazy"
                className="h-72 w-full rounded-card bg-[#f4ede1] object-contain object-bottom"
              />
              <figcaption className="mt-2">
                <p className="text-sm font-medium">
                  {tr("PGS.TS. Phan Anh Tu", "Assoc. Prof. Phan Anh Tu")}
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={art("huong.webp")}
                alt={tr(
                  "NCS. Do Thuy Huong, phong cách đất sét",
                  "Do Thuy Huong, PhD candidate, clay style",
                )}
                loading="lazy"
                className="h-72 w-full rounded-card bg-[#f4ede1] object-contain object-bottom"
              />
              <figcaption className="mt-2">
                <p className="text-sm font-medium">
                  {tr("NCS. Do Thuy Huong", "Do Thuy Huong, PhD candidate")}
                </p>
              </figcaption>
            </figure>
          </div>
          <img
            src={`${import.meta.env.BASE_URL}scene/lumina-minh-long.webp`}
            alt={tr(
              "Lumina và Minh Long trong bộ đồ phi hành gia cùng xem màn hình so sánh định luật hấp dẫn với mô hình thương mại",
              "Lumina and Minh Long in spacesuits reading a screen that sets the law of gravitation beside the trade model",
            )}
            width={688}
            height={384}
            loading="lazy"
            className="clay-card mt-3 aspect-[43/24] w-full rounded-card bg-[#0b0a1f] object-cover"
          />
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {tr(
              "Trường Kinh tế, Đại học Cần Thơ. Gravity Lab đưa cả chặng đường lên trình duyệt: quỹ đạo Newton, mô hình thương mại Tinbergen, hệ số FDI năm 2019, phép thử PPML và ước lượng trên dữ liệu của chính người học.",
              "School of Economics, Can Tho University. Gravity Lab puts the whole journey in the browser: Newton's orbits, Tinbergen's trade model, the 2019 FDI coefficients, the PPML test and estimation on the learner's own data.",
            )}
          </p>
          <p className="mt-2 text-sm">
            <a
              className="underline decoration-line underline-offset-2"
              href={APP_DOI_URL}
              target="_blank"
              rel="noreferrer"
            >
              DOI {APP_DOI}
            </a>
          </p>
          <div className="mt-4 pb-10">
            <ReferenceList />
          </div>
        </li>
      </ol>
      </div>
    </div>
  );
}
