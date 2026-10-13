import { tr } from "@/lib/prefs";
import { CiteApp } from "@/components/CiteApp";
import { REFS } from "@/sim/refs";

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
