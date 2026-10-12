import { tr } from "@/lib/prefs";
import { CiteApp } from "@/components/CiteApp";

type Ref = {
  id: string;
  parts: Array<{ text: string; em?: boolean }>;
};

const REFS: Ref[] = [
  {
    id: "anderson-2003",
    parts: [
      {
        text: "Anderson, J. E., & van Wincoop, E. (2003). Gravity with gravitas: A solution to the border puzzle. ",
      },
      { text: "American Economic Review, 93", em: true },
      { text: "(1), 170–192. https://doi.org/10.1257/000282803321455214" },
    ],
  },
  {
    id: "ashby-2003",
    parts: [
      { text: "Ashby, N. (2003). Relativity in the Global Positioning System. " },
      { text: "Living Reviews in Relativity, 6", em: true },
      { text: ", Article 1. https://doi.org/10.12942/lrr-2003-1" },
    ],
  },
  {
    id: "bacchetta-2012",
    parts: [
      {
        text: "Bacchetta, M., Beverelli, C., Cadot, O., Fugazza, M., Grether, J.-M., Helble, M., Nicita, A., & Piermartini, R. (2012). ",
      },
      { text: "A practical guide to trade policy analysis", em: true },
      {
        text: ". World Trade Organization; United Nations Conference on Trade and Development. https://www.wto.org/english/res_e/publications_e/wto_unctad12_e.htm",
      },
    ],
  },
  {
    id: "cavendish-1798",
    parts: [
      { text: "Cavendish, H. (1798). Experiments to determine the density of the earth. " },
      { text: "Philosophical Transactions of the Royal Society of London, 88", em: true },
      { text: ", 469–526. https://doi.org/10.1098/rstl.1798.0022" },
    ],
  },
  {
    id: "disdier-2008",
    parts: [
      {
        text: "Disdier, A.-C., & Head, K. (2008). The puzzling persistence of the distance effect on bilateral trade. ",
      },
      { text: "The Review of Economics and Statistics, 90", em: true },
      { text: "(1), 37–48. https://doi.org/10.1162/rest.90.1.37" },
    ],
  },
  {
    id: "dyson-1920",
    parts: [
      {
        text: "Dyson, F. W., Eddington, A. S., & Davidson, C. (1920). A determination of the deflection of light by the Sun's gravitational field, from observations made at the total eclipse of May 29, 1919. ",
      },
      { text: "Philosophical Transactions of the Royal Society of London. Series A, 220", em: true },
      { text: ", 291–333. https://doi.org/10.1098/rsta.1920.0009" },
    ],
  },
  {
    id: "einstein-1916",
    parts: [
      {
        text: "Einstein, A. (1916). Die Grundlage der allgemeinen Relativitätstheorie [The foundation of the general theory of relativity]. ",
      },
      { text: "Annalen der Physik, 354", em: true },
      { text: "(7), 769–822. https://doi.org/10.1002/andp.19163540702" },
    ],
  },
  {
    id: "galilei-1914",
    parts: [
      { text: "Galilei, G. (1914). " },
      { text: "Dialogues concerning two new sciences", em: true },
      { text: " (H. Crew & A. de Salvio, Trans.). Macmillan. (Original work published 1638)" },
    ],
  },
  {
    id: "kepler-1997",
    parts: [
      { text: "Kepler, J. (1997). " },
      { text: "The harmony of the world", em: true },
      {
        text: " (E. J. Aiton, A. M. Duncan, & J. V. Field, Trans.). American Philosophical Society. (Original work published 1619)",
      },
    ],
  },
  {
    id: "majumdar-2023",
    parts: [
      {
        text: "Majumdar, D., & Basu, S. (2023). Exchange rate uncertainty and India's bilateral trade: A gravity model approach. ",
      },
      { text: "Arthaniti: Journal of Economic Theory and Practice", em: true },
      { text: ". Advance online publication. https://doi.org/10.1177/09767479231178953" },
    ],
  },
  {
    id: "mohr-2025",
    parts: [
      {
        text: "Mohr, P. J., Newell, D. B., Taylor, B. N., & Tiesinga, E. (2025). CODATA recommended values of the fundamental physical constants: 2022. ",
      },
      { text: "Reviews of Modern Physics, 97", em: true },
      { text: ", Article 025002. https://doi.org/10.1103/RevModPhys.97.025002" },
    ],
  },
  {
    id: "newton-1999",
    parts: [
      { text: "Newton, I. (1999). " },
      { text: "The Principia: Mathematical principles of natural philosophy", em: true },
      {
        text: " (I. B. Cohen & A. Whitman, Trans.). University of California Press. (Original work published 1687)",
      },
    ],
  },
  {
    id: "pathak-2026",
    parts: [
      { text: "Pathak, A. (2026, June 30). " },
      { text: "Is FDI enough? The quality versus quantity debate", em: true },
      { text: ". Hinrich Foundation. https://www.hinrichfoundation.com/research/fdi" },
    ],
  },
  {
    id: "phan-2019",
    parts: [
      {
        text: "Phan, A. T., & Do, T. H. (2019). Tác động của khoảng cách, quy mô thị trường và dòng vốn FDI vào Việt Nam giai đoạn 2006–2015: Ứng dụng mô hình lực hấp dẫn [The impact of distance and market size on FDI into Vietnam, 2006–2015: Applying the gravity model]. ",
      },
      { text: "Tạp chí Kinh tế Đối ngoại", em: true },
      { text: ", (114), 14–26." },
    ],
  },
  {
    id: "pwc-2025",
    parts: [
      { text: "PwC Vietnam. (2025). " },
      { text: "Vietnam economic update 9M 2025", em: true },
      { text: ". PwC (Vietnam) Company Limited. https://www.pwc.com/vn" },
    ],
  },
  {
    id: "rubin-1970",
    parts: [
      {
        text: "Rubin, V. C., & Ford, W. K., Jr. (1970). Rotation of the Andromeda Nebula from a spectroscopic survey of emission regions. ",
      },
      { text: "The Astrophysical Journal, 159", em: true },
      { text: ", 379–403. https://doi.org/10.1086/150317" },
    ],
  },
  {
    id: "silva-2006",
    parts: [
      { text: "Santos Silva, J. M. C., & Tenreyro, S. (2006). The log of gravity. " },
      { text: "The Review of Economics and Statistics, 88", em: true },
      { text: "(4), 641–658. https://doi.org/10.1162/rest.88.4.641" },
    ],
  },
  {
    id: "stukeley-1936",
    parts: [
      { text: "Stukeley, W. (1936). " },
      { text: "Memoirs of Sir Isaac Newton's life", em: true },
      { text: " (A. H. White, Ed.). Taylor & Francis. (Original work written 1752)" },
    ],
  },
  {
    id: "tinbergen-1962",
    parts: [
      { text: "Tinbergen, J. (1962). " },
      {
        text: "Shaping the world economy: Suggestions for an international economic policy",
        em: true,
      },
      { text: ". Twentieth Century Fund." },
    ],
  },
  {
    id: "westfall-1980",
    parts: [
      { text: "Westfall, R. S. (1980). " },
      { text: "Never at rest: A biography of Isaac Newton", em: true },
      { text: ". Cambridge University Press." },
    ],
  },
  {
    id: "williams-nd",
    parts: [
      { text: "Williams, D. R. (n.d.). " },
      { text: "Planetary fact sheet – Metric", em: true },
      {
        text: ". NASA Goddard Space Flight Center. Retrieved October 12, 2026, from https://nssdc.gsfc.nasa.gov/planetary/factsheet/",
      },
    ],
  },
  {
    id: "xuan-2008",
    parts: [
      {
        text: "Xuan, N. T., & Xing, Y. (2008). Foreign direct investment and exports: The experiences of Vietnam. ",
      },
      { text: "Economics of Transition, 16", em: true },
      { text: "(2), 183–197. https://doi.org/10.1111/j.1468-0351.2008.00321.x" },
    ],
  },
  {
    id: "yotov-2016",
    parts: [
      { text: "Yotov, Y. V., Piermartini, R., Monteiro, J.-A., & Larch, M. (2016). " },
      { text: "An advanced guide to trade policy analysis: The structural gravity model", em: true },
      {
        text: ". World Trade Organization; United Nations Conference on Trade and Development. https://www.wto.org/english/res_e/booksp_e/advancedwtounctad2016_e.pdf",
      },
    ],
  },
];

export function ReferenceList() {
  return (
    <details>
      <summary className="min-h-11 cursor-pointer text-sm font-medium">
        {tr("Tài liệu tham khảo (APA 7)", "References (APA 7)")}
      </summary>
      <ul className="flex flex-col gap-3 pb-2">
        {REFS.map((ref) => (
          <li
            key={ref.id}
            className="ps-6 text-sm leading-relaxed text-muted [overflow-wrap:anywhere] [text-indent:-1.5rem]"
          >
            {ref.parts.map((part, index) =>
              part.em ? <em key={index}>{part.text}</em> : <span key={index}>{part.text}</span>,
            )}
          </li>
        ))}
      </ul>
      <p className="pb-2 text-xs leading-relaxed text-muted">
        {tr(
          "Trích trong bài theo họ và năm. G = 6,67430 × 10⁻¹¹ m³ kg⁻¹ s⁻², độ không đảm bảo chuẩn 0,00015 × 10⁻¹¹, là giá trị CODATA 2022. Quỹ đạo trên màn hình dùng đơn vị riêng và làm mềm Plummer, không phải phép đo hằng số này.",
          "Cited in the text by author and year. G = 6.67430 × 10⁻¹¹ m³ kg⁻¹ s⁻², standard uncertainty 0.00015 × 10⁻¹¹, is the CODATA 2022 value. The on-screen orbits use their own units and Plummer softening; they are not a measurement of this constant.",
        )}
      </p>
      <CiteApp />
    </details>
  );
}
