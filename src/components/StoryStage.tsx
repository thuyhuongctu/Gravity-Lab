import { Fragment } from "react";
import type { LabPanel } from "@/components/FdiLab";
import { APP_DOI, APP_DOI_URL } from "@/components/CiteApp";
import { ReferenceList } from "@/components/ReferenceList";
import { FormulaBridge } from "@/components/FormulaBridge";
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
    who: "Phan Anh Tú & Đỗ Thùy Hương",
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
  },
];

export function StoryStage({ onOpen }: { onOpen: (room: Room, panel: LabPanel | null) => void }) {
  return (
    <div className="surface nebula absolute inset-0 overflow-y-auto bg-paper text-ink">
      <VnWatermark />
      <div className="relative">
      <div className="mx-auto max-w-2xl px-4 pt-5">
        <p className="clay-tray inline-flex items-center gap-2 rounded-full bg-paper-2 py-1 ps-1 pe-3 text-xs font-semibold">
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
        <h2 className="mt-3 font-serif text-4xl leading-[1.06] sm:text-5xl">
          {tr("Từ quả táo của Newton đến ", "From Newton's apple to ")}
          <span className="cosmic-text">{tr("dòng vốn vào Việt Nam.", "capital flowing into Vietnam.")}</span>
        </h2>
        <p className="mt-3 max-w-xl leading-relaxed text-muted">
          {tr(
            "Ba thế kỷ, một dạng phương trình: quy mô ở tử số, khoảng cách ở mẫu số. Mỗi chương dưới đây mở ra một phần của phòng thí nghiệm.",
            "Three centuries, one form of equation: size in the numerator, distance in the denominator. Each chapter below opens a part of the lab.",
          )}
        </p>
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

      <figure className="mx-auto mt-4 grid max-w-2xl grid-cols-[minmax(0,10rem)_1fr] items-center gap-4 px-4">
        <img
          src={art("newton.webp")}
          alt={tr("Quả táo rơi, quyển Principia và Mặt Trăng: đất sét phong cách noir", "The falling apple, the Principia and the Moon: clay noir")}
          className="clay-card aspect-square w-full rounded-card bg-[#0b0a1f] object-cover"
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
                  "PGS.TS. Phan Anh Tú, phong cách đất sét",
                  "Assoc. Prof. Phan Anh Tú, clay style",
                )}
                loading="lazy"
                className="h-72 w-full rounded-card bg-[#f4ede1] object-contain object-bottom"
              />
              <figcaption className="mt-2">
                <p className="text-sm font-medium">
                  {tr("PGS.TS. Phan Anh Tú", "Assoc. Prof. Phan Anh Tú")}
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={art("huong.webp")}
                alt={tr(
                  "NCS. Đỗ Thùy Hương, phong cách đất sét",
                  "Đỗ Thùy Hương, PhD candidate, clay style",
                )}
                loading="lazy"
                className="h-72 w-full rounded-card bg-[#f4ede1] object-contain object-bottom"
              />
              <figcaption className="mt-2">
                <p className="text-sm font-medium">
                  {tr("NCS. Đỗ Thùy Hương", "Đỗ Thùy Hương, PhD candidate")}
                </p>
              </figcaption>
            </figure>
          </div>
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
