import { useState } from "react";
import { Languages, X } from "lucide-react";
import { chosenLang, setLang } from "@/lib/prefs";
import { shouldSuggestVietnamese } from "@/sim/lang-hint";

const KEY = "gravity-lab:lang-hint";

function initiallyOpen(): boolean {
  if (typeof window === "undefined") return false;
  let dismissed = false;
  try {
    dismissed = !!localStorage.getItem(KEY);
  } catch {
    // Storage blocked: offer it this visit.
  }
  let timeZone: string | undefined;
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    timeZone = undefined;
  }
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language ?? ""];
  return shouldSuggestVietnamese({ languages, timeZone, chosen: chosenLang(), dismissed });
}

/**
 * The interface opens in English. On a device that looks Vietnamese, a small card offers the
 * Vietnamese version once; either answer is remembered, and the VI/EN switch stays in the header.
 */
export function LangHint() {
  const [open, setOpen] = useState(initiallyOpen);
  if (!open) return null;
  const close = (vi: boolean) => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Not remembered: it may show again next visit.
    }
    if (vi) setLang("vi");
    setOpen(false);
  };
  return (
    <div
      role="region"
      aria-label="Language · Ngôn ngữ"
      className="surface noir-card fixed inset-x-3 top-[max(12px,env(safe-area-inset-top))] z-[70] mx-auto flex max-w-[440px] items-start gap-2.5 rounded-[22px] p-3.5 text-ink"
    >
      <Languages className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p lang="vi" className="font-semibold leading-snug">
          Bạn muốn dùng tiếng Việt?
        </p>
        <p className="mt-0.5 text-[13px] leading-snug text-muted">
          <span lang="vi">Gravity Lab có bản tiếng Việt đầy đủ.</span>{" "}
          <span lang="en">The full app is also available in Vietnamese.</span>
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            lang="vi"
            onClick={() => close(true)}
            className="cosmic-btn inline-flex min-h-11 items-center rounded-full px-3.5 text-[13px] font-semibold"
          >
            Dùng tiếng Việt
          </button>
          <button
            type="button"
            lang="en"
            onClick={() => close(false)}
            className="inline-flex min-h-11 items-center rounded-full border border-line px-3.5 text-[13px] font-semibold"
          >
            Keep English
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => close(false)}
        aria-label="Close · Đóng"
        className="-mt-2 -mr-2 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-muted"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
