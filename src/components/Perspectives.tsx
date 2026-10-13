import { tr } from "@/lib/prefs";

type Tag = "ok" | "warn" | "open";
type Item = { tag: Tag; vi: [string, string]; en: [string, string]; cite: string };

const TAG: Record<Tag, { vi: string; en: string; cls: string }> = {
  ok: { vi: "Vững", en: "Holds", cls: "bg-[#4fd1c5] text-[#062a30]" },
  warn: { vi: "Mở rộng", en: "Extended", cls: "bg-[#ffc56b] text-[#3a1a05]" },
  open: { vi: "Đang khám phá", en: "Open question", cls: "bg-[#ff7a9c] text-[#3a0d1c]" },
};

/** Where the gravity law holds and where it is extended, in physics and in economics. */
const LENSES: Array<{ vi: string; en: string; items: Item[] }> = [
  {
    vi: "Góc nhìn vật lý",
    en: "The physics view",
    items: [
      {
        tag: "ok",
        vi: ["Trường yếu, vận tốc thấp", "Định luật bình phương nghịch đảo vẫn là công cụ chính để tính quỹ đạo hành tinh và tàu vũ trụ trong Hệ Mặt Trời."],
        en: ["Weak fields, low speeds", "The inverse-square law is still the main tool for computing the orbits of planets and spacecraft in the Solar System."],
        cite: "Newton (1687/1999)",
      },
      {
        tag: "warn",
        vi: ["Điểm cận nhật của Sao Thủy", "Thuyết tương đối rộng kế thừa Newton và giải thích thêm khoảng 43″ mỗi thế kỷ trong quỹ đạo Sao Thủy; ở trường yếu, hai lý thuyết trùng nhau."],
        en: ["Mercury's perihelion", "General relativity builds on Newton and accounts for an extra 43″ or so per century in Mercury's orbit; in weak fields the two theories agree."],
        cite: "Einstein (1916)",
      },
      {
        tag: "warn",
        vi: ["Ánh sáng và đồng hồ", "Hấp dẫn còn bẻ cong ánh sáng và làm chậm thời gian; GPS hiệu chỉnh khoảng 38 μs mỗi ngày để định vị chính xác."],
        en: ["Light and clocks", "Gravity also bends light and slows time; GPS corrects about 38 μs a day to keep positions accurate."],
        cite: "Dyson et al. (1920); Ashby (2003)",
      },
      {
        tag: "open",
        vi: ["Thiên hà quay quá nhanh", "Đường cong quay của thiên hà mở ra câu hỏi về vật chất tối, một hướng nghiên cứu còn đang sôi động."],
        en: ["Galaxies spin too fast", "Galaxy rotation curves opened the question of dark matter, still an active field of research."],
        cite: "Rubin & Ford (1970)",
      },
    ],
  },
  {
    vi: "Góc nhìn kinh tế",
    en: "The economics view",
    items: [
      {
        tag: "ok",
        vi: ["Quy luật thực nghiệm bền vững", "Quy mô và khoảng cách giải thích phần lớn dòng thương mại; độ co giãn theo khoảng cách trung bình khoảng −0,9 qua hàng trăm nghiên cứu."],
        en: ["A durable empirical regularity", "Size and distance explain most of trade; the distance elasticity averages about −0.9 across hundreds of studies."],
        cite: "Tinbergen (1962); Disdier & Head (2008)",
      },
      {
        tag: "warn",
        vi: ["Thêm “lực cản đa phương”", "Đưa chi phí thương mại với phần còn lại của thế giới vào mô hình giúp nền tảng lý thuyết vững hơn và ước lượng sát hơn."],
        en: ["Adding multilateral resistance", "Bringing trade costs with the rest of the world into the model gives it firmer theory and better estimates."],
        cite: "Anderson & van Wincoop (2003)",
      },
      {
        tag: "warn",
        vi: ["PPML giữ lại các dòng bằng 0", "Ước lượng trên mức thay vì log giúp dùng toàn bộ mẫu và vững khi phương sai thay đổi."],
        en: ["PPML keeps the zero flows", "Estimating on levels rather than logs uses the whole sample and is robust to heteroskedasticity."],
        cite: "Santos Silva & Tenreyro (2006)",
      },
      {
        tag: "open",
        vi: ["Mở rộng sang FDI", "Khoảng cách địa lý có tác động rõ đến dòng vốn FDI vào Việt Nam (FDI inflows; β = −0,38); vai trò của thể chế, văn hóa và quan hệ nhân quả là hướng để lớp học tiếp tục kiểm định."],
        en: ["Extending to FDI", "Geographic distance clearly matters for FDI into Việt Nam (β = −0.38); the roles of institutions, culture and causality are for the class to keep testing."],
        cite: "Phan & Do (2019)",
      },
    ],
  },
];

export function Perspectives() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-8">
      <p className="kicker text-amber">{tr("Trọng lực: vững ở đâu, mở rộng ở đâu", "Gravity: where it holds, where it is extended")}</p>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {LENSES.map((lens) => (
          <div key={lens.en} className="noir-card rounded-[26px] p-4 sm:p-5">
            <h3 className="font-serif text-2xl leading-tight">{tr(lens.vi, lens.en)}</h3>
            <ul className="mt-3 flex flex-col gap-3">
              {lens.items.map((it) => {
                const h = tr(it.vi[0], it.en[0]);
                const p = tr(it.vi[1], it.en[1]);
                return (
                  <li key={it.cite + h} className="noir-track flex items-start gap-3 rounded-[20px] p-3.5">
                    <span className={"mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold " + TAG[it.tag].cls}>
                      {tr(TAG[it.tag].vi, TAG[it.tag].en)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{h}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted">{p}</span>
                      <span className="mt-1 block text-xs text-muted">{it.cite}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
