import { tr } from "@/lib/prefs";

export type CoverRoom = "orbit" | "trade" | "lab";

const COVERS: Record<CoverRoom, { file: string; vi: string; en: string }> = {
  orbit: {
    file: "orbit.webp",
    vi: "Mặt Trời và các hành tinh trên quỹ đạo, đất sét phong cách noir",
    en: "The Sun and planets on their orbits, clay noir",
  },
  trade: {
    file: "trade.webp",
    vi: "Hai nền kinh tế lớn nhỏ và chiếc cầu container giữa chúng, đất sét phong cách noir",
    en: "A large and a small economy with a bridge of containers between them, clay noir",
  },
  lab: {
    file: "fdi.webp",
    vi: "Dòng vốn như những đồng xu bay vào nhà máy ở Đồng bằng sông Cửu Long, đất sét phong cách noir",
    en: "Capital as coins arcing into a factory in the Mekong Delta, clay noir",
  },
};

/** Clay-noir cover art for a room (16:9). */
export function RoomCover({ room, className = "" }: { room: CoverRoom; className?: string }) {
  const c = COVERS[room];
  return (
    <img
      src={`${import.meta.env.BASE_URL}noir/${c.file}`}
      alt={tr(c.vi, c.en)}
      width={1200}
      height={675}
      loading="lazy"
      className={"clay-card aspect-video w-full rounded-card bg-[#0a1112] object-cover " + className}
    />
  );
}
