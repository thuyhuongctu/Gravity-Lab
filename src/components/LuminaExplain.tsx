import { useState } from "react";
import { Copy } from "lucide-react";
import { tr } from "@/lib/prefs";
import type { Explanation } from "@/sim/explain";

/** Lumina reads the user's own estimate back in plain language. Stage tokens (dark surface). */
export function LuminaExplain({ ex }: { ex: Explanation }) {
  const [copied, setCopied] = useState(false);
  const paras = tr("vi", "en") === "en" ? ex.paragraphs.en : ex.paragraphs.vi;
  const text = paras.join("\n\n");
  const copy = () => {
    void navigator.clipboard?.writeText(text).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  return (
    <section
      className="noir-card flex flex-col gap-3 rounded-[22px] p-4 text-paper"
      aria-labelledby="lumina-explain"
    >
      <div className="flex items-start gap-3">
        <img
          src={`${import.meta.env.BASE_URL}cast/v2/huong-face.webp`}
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-full bg-[#f1e8de] object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="kicker text-amber-2">
            {tr(
              "Lumina giải thích · tính trên thiết bị",
              "Lumina explains · computed on this device",
            )}
          </p>
          <h3 id="lumina-explain" className="mt-0.5 font-serif text-lg leading-snug">
            {tr(ex.title.vi, ex.title.en)}
          </h3>
        </div>
        <button
          type="button"
          onClick={copy}
          className="noir-raise inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-paper"
        >
          <Copy className="size-3.5" />
          {copied ? tr("Đã chép", "Copied") : tr("Chép", "Copy")}
        </button>
      </div>
      <div className="flex flex-col gap-2.5">
        {paras.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed">
            {p}
          </p>
        ))}
      </div>
      <p className="text-xs text-mist">
        {tr(
          "Câu chữ là mẫu cố định điền bằng số liệu của bạn; không dùng AI tạo sinh, không gửi dữ liệu đi đâu.",
          "The wording is a fixed template filled with your own numbers; no generative AI, nothing leaves this device.",
        )}
      </p>
    </section>
  );
}
