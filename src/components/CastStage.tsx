import type { LabPanel } from "@/components/FdiLab";
import { ReferenceList } from "@/components/ReferenceList";
import { VnWatermark } from "@/components/VnWatermark";
import { useState } from "react";
import { tr } from "@/lib/prefs";

type Room = "orbit" | "trade" | "lab";

export type Holder = {
  id: string;
  name: string;
  symbol: string;
  line: string;
  src: string;
  /** Full-length figure, shown on the cast page. */
  body: string;
  /** Astronaut portrait, worn while exploring gravity in the orbit room. */
  astro: string;
  /** Full-length figure in the spacesuit. */
  suit: string;
  alt: string;
  en: { symbol: string; line: string; alt: string };
  room: Room;
  panel: LabPanel | null;
};

export const HOLDERS: Holder[] = [
  {
    id: "lumina",
    name: "Lumina",
    symbol: "Câu hỏi",
    line: "Không chọn nước. Hỏi khoảng cách nào còn đứng khi vốn vào Việt Nam.",
    src: `${import.meta.env.BASE_URL}cast/face/huong.webp`,
    body: `${import.meta.env.BASE_URL}cast/huong.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/huong-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/huong.webp`,
    alt: "Lumina",
    en: {
      symbol: "The question",
      line: "Picks no country. Asks which distances still matter when capital flows into Vietnam.",
      alt: "Lumina",
    },
    room: "lab",
    panel: "sim",
  },
  {
    id: "tu",
    name: "Tú Phan",
    symbol: "−0,14 → −0,38",
    line: "Bài Phan và Do (2019). Địa lý vào mô hình 3 chưa có ý nghĩa. Từ mô hình 4, β giữ −0,38.",
    src: `${import.meta.env.BASE_URL}cast/face/tu.webp`,
    body: `${import.meta.env.BASE_URL}cast/tu-vest.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/tu-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/tu.webp`,
    alt: "Tú Phan",
    en: {
      symbol: "−0.14 → −0.38",
      line: "Phan and Do (2019). Geography is not yet significant in Model 3. From Model 4 on, β holds at −0.38.",
      alt: "Tú Phan",
    },
    room: "lab",
    panel: "coef",
  },
  {
    id: "minh-long",
    name: "Minh Long",
    symbol: "mũ = 2",
    line: "Vũ trụ đi trước. Mũ khoảng cách đang khóa ở 2 (Newton, 1687/1999).",
    src: `${import.meta.env.BASE_URL}cast/face/minh-long.webp`,
    body: `${import.meta.env.BASE_URL}cast/minh-long.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/minh-long-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/minh-long.webp`,
    alt: "Minh Long, jacket xanh, khăn rằn đỏ",
    en: {
      symbol: "exponent = 2",
      line: "The universe comes first. The distance exponent is locked at 2 (Newton, 1687/1999).",
      alt: "Minh Long, blue jacket, red checked scarf",
    },
    room: "orbit",
    panel: null,
  },
  {
    id: "lan-chi",
    name: "Lan Chi",
    symbol: "γ",
    line: "γ không còn khóa ở 2. Tinbergen (1962) để γ được ước lượng.",
    src: `${import.meta.env.BASE_URL}cast/face/lan-chi.webp`,
    body: `${import.meta.env.BASE_URL}cast/lan-chi.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/lan-chi-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/lan-chi.webp`,
    alt: "Lan Chi, jacket vàng, khăn rằn, loa",
    en: {
      symbol: "γ",
      line: "γ is no longer locked at 2. Tinbergen (1962) lets γ be estimated.",
      alt: "Lan Chi, yellow jacket, checked scarf, megaphone",
    },
    room: "trade",
    panel: null,
  },
  {
    id: "bao-ngoc",
    name: "Bảo Ngọc",
    symbol: "β = −0,38",
    line: "Km tới nhà máy. Xa hơn 10% đi kèm FDI thấp hơn khoảng 3,6%.",
    src: `${import.meta.env.BASE_URL}cast/face/bao-ngoc.webp`,
    body: `${import.meta.env.BASE_URL}cast/bao-ngoc.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/bao-ngoc-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/bao-ngoc.webp`,
    alt: "Bảo Ngọc, jacket ô-liu, khoanh tay",
    en: {
      symbol: "β = −0.38",
      line: "Kilometres to the factory. 10% farther goes with about 3.6% less FDI.",
      alt: "Bảo Ngọc, olive jacket, arms folded",
    },
    room: "lab",
    panel: "sim",
  },
  {
    id: "thu-ha",
    name: "Thu Hà",
    symbol: "0,45 · FTA",
    line: "Vốn năm trước. Có FTA: ngắn hạn khoảng +174,6%, dài hạn khoảng +527,4%.",
    src: `${import.meta.env.BASE_URL}cast/face/thu-ha.webp`,
    body: `${import.meta.env.BASE_URL}cast/thu-ha.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/thu-ha-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/thu-ha.webp`,
    alt: "Thu Hà, jacket đất nung, sổ cái",
    en: {
      symbol: "0.45 · FTA",
      line: "Last year's capital. With an FTA: about +174.6% in the short run, about +527.4% in the long run.",
      alt: "Thu Hà, terracotta jacket, ledger",
    },
    room: "lab",
    panel: "sim",
  },
  {
    id: "gia-han",
    name: "Gia Hân",
    symbol: "FDI = 0",
    line: "OLS bỏ năm vốn bằng không. PPML giữ cả mẫu (Santos Silva & Tenreyro, 2006).",
    src: `${import.meta.env.BASE_URL}cast/face/gia-han.webp`,
    body: `${import.meta.env.BASE_URL}cast/gia-han.webp`,
    astro: `${import.meta.env.BASE_URL}cast/v2/gia-han-face.webp`,
    suit: `${import.meta.env.BASE_URL}cast/v2/gia-han.webp`,
    alt: "Gia Hân, jacket tím, kẹp hồ sơ",
    en: {
      symbol: "FDI = 0",
      line: "OLS drops years with zero capital. PPML keeps the whole sample (Santos Silva & Tenreyro, 2006).",
      alt: "Gia Hân, purple jacket, clipboard",
    },
    room: "lab",
    panel: "ppml",
  },
];

const byId = (id: string) => HOLDERS.find((h) => h.id === id)!;

/** A holder's symbol, line and alt text in the current language. */
function say(h: Holder) {
  return { symbol: tr(h.symbol, h.en.symbol), line: tr(h.line, h.en.line), alt: tr(h.alt, h.en.alt) };
}

export function facesFor(mode: "orbit" | "trade" | "lab" | "cast", panel: LabPanel): Holder[] {
  if (mode === "orbit") return [byId("minh-long")];
  if (mode === "trade") return [byId("lan-chi")];
  if (mode === "lab" && panel === "coef") return [byId("tu")];
  if (mode === "lab" && panel === "ppml") return [byId("gia-han")];
  if (mode === "lab" && panel === "sim") return [byId("bao-ngoc")];
  if (mode === "lab" && panel === "data") return [byId("lumina")];
  return [];
}

export function shownPeople(
  mode: "orbit" | "trade" | "lab" | "cast",
  panel: LabPanel,
  who: string | null,
): Holder[] {
  if (who) {
    const person = HOLDERS.find((item) => item.id === who);
    if (person && person.room === mode && (mode !== "lab" || person.panel === panel)) return [person];
  }
  return facesFor(mode, panel).slice(0, 1);
}

export function HolderBar({
  people,
  onBack,
  suited = false,
}: {
  people: Holder[];
  onBack: () => void;
  /** Show the astronaut portrait (the orbit room). */
  suited?: boolean;
}) {
  return (
    <div className="surface noir-card flex items-center gap-3 rounded-[24px] p-2.5 text-ink">
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto">
        {people.map((person) => (
          <div key={person.id} className="flex min-w-0 flex-1 items-center gap-2">
            <img
              src={suited ? person.astro : person.src}
              alt={suited ? tr(`${person.name}, trang phục phi hành gia`, `${person.name} in a spacesuit`) : say(person).alt}
              className="aspect-[4/5] h-16 w-auto shrink-0 rounded-xl object-cover object-center"
            />
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight text-amber">{say(person).symbol}</p>
              <p className="line-clamp-2 text-sm leading-snug text-muted">{person.name}. {say(person).line}</p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="min-h-11 shrink-0 px-2.5 text-sm font-medium text-teal" onClick={onBack}>
        {tr("Về lớp", "Back to class")}
      </button>
    </div>
  );
}

const STEPS = ["minh-long", "lan-chi", "bao-ngoc", "thu-ha", "gia-han"];

export function CastStage({
  onOpen,
}: {
  onOpen: (room: Room, panel: LabPanel | null, id: string) => void;
}) {
  const lumina = byId("lumina");
  const tu = byId("tu");
  const [suited, setSuited] = useState(true);
  const look = (p: Holder) => (suited ? p.suit : p.body);
  return (
    <div className="surface nebula absolute inset-0 overflow-y-auto bg-paper text-ink">
      <VnWatermark />
      <div className="relative">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <p className="kicker text-amber">{tr("Cả lớp khám phá vũ trụ", "The class explores the universe")}</p>
        <h2 className="mt-1.5 font-serif text-3xl leading-[1.1]">{tr("Từ lực hấp dẫn đến dòng vốn", "From gravity to capital flows")}</h2>
        <p className="mt-1 font-math text-lg leading-snug">F = G m₁m₂ / r² → T = G YᵢYⱼ / Dᵞ → FDI</p>
        <p className="mt-1 text-sm text-muted">
          {tr(
            "Bước 1 là bầu trời. Cùng một dạng phương trình, rồi mới hỏi vốn. Bấm một người: mặt họ đi theo số họ giữ.",
            "Step 1 is the sky. The same form of equation comes first, then the question about capital. Tap a person: each face goes with the number they hold.",
          )}
        </p>
      </div>
      <div className="mx-auto max-w-lg px-4 pt-3">
        <div role="group" aria-label={tr("Trang phục", "Outfit")} className="noir-track flex rounded-full p-1">
          {[
            { on: false, vi: "Trang phục thường", en: "Everyday" },
            { on: true, vi: "Trang phục vũ trụ", en: "Spacesuits" },
          ].map((o) => (
            <button
              key={o.vi}
              type="button"
              aria-pressed={suited === o.on}
              onClick={() => setSuited(o.on)}
              className={
                "min-h-11 flex-1 rounded-full px-4 text-sm font-medium " + (suited === o.on ? "cosmic-btn" : "text-muted")
              }
            >
              {tr(o.vi, o.en)}
            </button>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-lg px-4 pt-3.5">
        <img
          src={`${import.meta.env.BASE_URL}cast/class-board.webp`}
          alt={tr(
            "Cả lớp trong bộ đồ phi hành gia đứng trước bảng đen ghi F = G m₁m₂/r², T = G YᵢYⱼ/Dᵞ, PPML và FDI = 0",
            "The class in spacesuits in front of a blackboard showing F = G m₁m₂/r², T = G YᵢYⱼ/Dᵞ, PPML and FDI = 0",
          )}
          width={688}
          height={384}
          className="h-44 w-full rounded-[22px] object-cover shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_26px_34px_-22px_rgba(0,0,0,0.95)] sm:h-56"
        />
      </div>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 px-4 pt-3">
        <Advisor person={lumina} src={look(lumina)} onOpen={onOpen} />
        <Advisor person={tu} src={look(tu)} onOpen={onOpen} />
      </div>
      <div className="mx-auto max-w-lg px-4 pt-4">
        <p className="mb-2 text-xs font-medium text-muted">{tr("Năm bước · chạm một gương mặt", "Five steps · tap a face")}</p>
        <ul className="flex justify-between gap-1">
          {STEPS.map((id) => {
            const person = byId(id);
            return (
              <li key={id} className="w-[3.75rem]">
                <button
                  type="button"
                  onClick={() => onOpen(person.room, person.panel, person.id)}
                  className="flex w-full flex-col items-center gap-1.5"
                >
                  <img
                    src={suited ? person.astro : person.src}
                    alt={person.name}
                    loading="lazy"
                    className="size-14 rounded-full bg-[#f1e8de] object-cover shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_0_0_2px_rgba(79,209,197,0.35),0_12px_18px_-8px_rgba(0,0,0,0.95)]"
                  />
                  <span className="font-serif text-xs leading-tight whitespace-nowrap text-amber">{say(person).symbol}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <ol className="mx-auto max-w-lg pt-4">
        {STEPS.map((id, index) => {
          const person = byId(id);
          return (
            <li key={id} className="border-t border-line">
              <button
                type="button"
                className="flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() => onOpen(person.room, person.panel, person.id)}
              >
                <img
                  src={look(person)}
                  alt={suited ? tr(`${person.name}, trang phục phi hành gia`, `${person.name} in a spacesuit`) : say(person).alt}
                  loading="lazy"
                  className={
                    "h-44 w-24 shrink-0 rounded-card bg-[#f4ede1] object-bottom " +
                    (suited ? "object-cover" : "object-contain")
                  }
                />
                <span className="min-w-0">
                  <span className="text-xs font-medium text-teal">{index + 1}</span>
                  <span className="block font-serif text-2xl leading-none">{say(person).symbol}</span>
                  <span className="mt-1 block text-sm font-medium">{person.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{say(person).line}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mx-auto max-w-lg px-4 pt-6">
        <ReferenceList />
      </div>
      <p className="mx-auto max-w-lg px-4 py-8 text-sm leading-relaxed text-muted">
        {tr(
          "Tạo hình đất sét thư viện BizOn. Lumina giữ câu hỏi và không chọn hộ. Hệ số FDI lấy từ Phan và Do (2019), mô hình 8, trừ chỗ nói mô hình 3 và 4.",
          "Clay characters from the BizOn library. Lumina holds the question and does not choose for you. FDI coefficients are from Phan and Do (2019), Model 8, except where Models 3 and 4 are named.",
        )}
      </p>
      </div>
    </div>
  );
}

function Advisor({
  person,
  src,
  onOpen,
}: {
  person: Holder;
  src: string;
  onOpen: (room: Room, panel: LabPanel | null, id: string) => void;
}) {
  return (
    <button
      type="button"
      className="noir-card flex flex-col overflow-hidden rounded-[24px] text-left"
      onClick={() => onOpen(person.room, person.panel, person.id)}
    >
      <img src={src} alt={src === person.suit ? tr(`${person.name}, trang phục phi hành gia`, `${person.name} in a spacesuit`) : say(person).alt} className={
          "h-60 w-full bg-[#f1e8de] sm:h-72 " +
          (src === person.suit ? "object-cover object-[center_20%]" : "object-contain object-bottom")
        }
      />
      <span className="block px-3 pt-2.5 pb-3">
        <span className="block font-serif text-lg leading-tight text-amber">{say(person).symbol}</span>
        <span className="mt-0.5 block text-sm font-medium">{person.name}</span>
        <span className="mt-1 block text-sm leading-relaxed text-muted">{say(person).line}</span>
      </span>
    </button>
  );
}

/** The whole class, suited up for the orbit room. */
const CREW: Array<{ id: string; name: string; src: string }> = [
  ...HOLDERS.filter((h) => h.id !== "lumina").map((h) => ({ id: h.id, name: h.name, src: h.astro })),
  { id: "huong", name: "Thùy Hương", src: `${import.meta.env.BASE_URL}cast/v2/huong-face.webp` },
];

export function Crew() {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted">{tr("Phi hành đoàn khám phá trọng lực", "The crew exploring gravity")}</p>
      <ul className="grid grid-cols-4 gap-2">
        {CREW.map((c) => (
          <li key={c.id} className="text-center">
            <img
              src={c.src}
              alt={tr(`${c.name}, trang phục phi hành gia`, `${c.name} in a spacesuit`)}
              loading="lazy"
              className="aspect-[4/5] w-full rounded-lg bg-[#f4ede1] object-cover"
            />
            <span className="mt-1 block truncate text-xs text-muted">{c.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
