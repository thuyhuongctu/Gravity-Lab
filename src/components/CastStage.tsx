import type { LabPanel } from "@/components/FdiLab";
import { ReferenceList } from "@/components/ReferenceList";

type Room = "orbit" | "trade" | "lab";

export type Holder = {
  id: string;
  name: string;
  symbol: string;
  line: string;
  src: string;
  alt: string;
  room: Room;
  panel: LabPanel | null;
};

export const HOLDERS: Holder[] = [
  {
    id: "lumina",
    name: "Lumina",
    symbol: "Câu hỏi",
    line: "Không chọn nước. Hỏi khoảng cách nào còn đứng khi vốn vào Việt Nam.",
    src: "/cast/face/lumina.webp",
    alt: "Lumina",
    room: "lab",
    panel: "sim",
  },
  {
    id: "tu",
    name: "Tú Phan",
    symbol: "−0,14 → −0,38",
    line: "Bài Phan và Đỗ (2019). Địa lý vào mô hình 3 chưa có ý nghĩa. Từ mô hình 4, β giữ −0,38.",
    src: "/cast/face/tu.webp",
    alt: "Tú Phan",
    room: "lab",
    panel: "coef",
  },
  {
    id: "minh-long",
    name: "Minh Long",
    symbol: "mũ = 2",
    line: "Vũ trụ đi trước. Mũ khoảng cách đang khóa ở 2 (Newton, 1687/1999).",
    src: "/cast/face/minh-long.webp",
    alt: "Minh Long, jacket xanh, khăn rằn đỏ",
    room: "orbit",
    panel: null,
  },
  {
    id: "lan-chi",
    name: "Lan Chi",
    symbol: "γ",
    line: "γ không còn khóa ở 2. Tinbergen (1962) để γ được ước lượng.",
    src: "/cast/face/lan-chi.webp",
    alt: "Lan Chi, jacket vàng, khăn rằn, loa",
    room: "trade",
    panel: null,
  },
  {
    id: "bao-ngoc",
    name: "Bảo Ngọc",
    symbol: "β = −0,38",
    line: "Km tới nhà máy. Xa hơn 10% đi kèm FDI thấp hơn khoảng 3,6%.",
    src: "/cast/face/bao-ngoc.webp",
    alt: "Bảo Ngọc, jacket ô-liu, khoanh tay",
    room: "lab",
    panel: "sim",
  },
  {
    id: "thu-ha",
    name: "Thu Hà",
    symbol: "0,45 · FTA",
    line: "Vốn năm trước. Có FTA: ngắn hạn khoảng +174,6%, dài hạn khoảng +527,4%.",
    src: "/cast/face/thu-ha.webp",
    alt: "Thu Hà, jacket đất nung, sổ cái",
    room: "lab",
    panel: "sim",
  },
  {
    id: "gia-han",
    name: "Gia Hân",
    symbol: "FDI = 0",
    line: "OLS bỏ năm vốn bằng không. PPML giữ cả mẫu (Santos Silva & Tenreyro, 2006).",
    src: "/cast/face/gia-han.webp",
    alt: "Gia Hân, jacket tím, kẹp hồ sơ",
    room: "lab",
    panel: "ppml",
  },
];

const byId = (id: string) => HOLDERS.find((h) => h.id === id)!;

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

export function HolderBar({ people, onBack }: { people: Holder[]; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-card bg-paper p-2 text-ink">
      <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto">
        {people.map((person) => (
          <div key={person.id} className="flex min-w-0 flex-1 items-center gap-2">
            <img src={person.src} alt={person.alt} className="aspect-[4/5] h-16 w-auto shrink-0 object-cover object-center" />
            <div className="min-w-0">
              <p className="font-serif text-lg leading-tight">{person.symbol}</p>
              <p className="line-clamp-2 text-sm leading-snug text-muted">{person.name}. {person.line}</p>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="min-h-11 shrink-0 px-2 text-sm font-medium text-teal" onClick={onBack}>
        Về lớp
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
  return (
    <div className="absolute inset-0 overflow-y-auto bg-paper text-ink">
      <div className="mx-auto max-w-lg px-4 pt-4">
        <p className="text-xs font-medium text-teal">Cả lớp khám phá vũ trụ</p>
        <h2 className="mt-1 font-serif text-3xl leading-tight">Từ lực hấp dẫn đến dòng vốn</h2>
        <p className="mt-1 font-serif text-lg leading-snug">F = G m₁m₂ / r² → T = G YᵢYⱼ / Dᵞ → FDI</p>
        <p className="mt-1 text-sm text-muted">
          Bước 1 là bầu trời. Cùng một dạng phương trình, rồi mới hỏi vốn. Bấm một người: mặt họ đi theo số họ giữ.
        </p>
      </div>
      <div className="mx-auto grid max-w-lg grid-cols-2 gap-3 px-4 pt-4">
        <Advisor person={lumina} onOpen={onOpen} />
        <Advisor person={tu} onOpen={onOpen} />
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
                <img src={person.src} alt={person.alt} className="aspect-[4/5] w-24 shrink-0 object-cover object-center" />
                <span className="min-w-0">
                  <span className="text-xs font-medium text-teal">{index + 1}</span>
                  <span className="block font-serif text-2xl leading-none">{person.symbol}</span>
                  <span className="mt-1 block text-sm font-medium">{person.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">{person.line}</span>
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
        Tạo hình đất sét thư viện BizOn. Lumina giữ câu hỏi và không chọn hộ. Hệ số FDI lấy từ Phan và Đỗ (2019), mô hình
        8, trừ chỗ nói mô hình 3 và 4.
      </p>
    </div>
  );
}

function Advisor({
  person,
  onOpen,
}: {
  person: Holder;
  onOpen: (room: Room, panel: LabPanel | null, id: string) => void;
}) {
  return (
    <button type="button" className="text-left" onClick={() => onOpen(person.room, person.panel, person.id)}>
      <img src={person.src} alt={person.alt} className="aspect-[4/5] w-full object-cover object-center" />
      <span className="mt-2 block font-serif text-xl leading-tight">{person.symbol}</span>
      <span className="block text-sm font-medium">{person.name}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{person.line}</span>
    </button>
  );
}
