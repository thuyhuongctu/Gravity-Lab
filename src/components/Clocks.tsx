import { useEffect, useState } from "react";
import { tr } from "@/lib/prefs";

/** Three local times: where the class is, where Newton was, where Tinbergen was. */
const ZONES = [
  { id: "vn", tz: "Asia/Ho_Chi_Minh", vi: "Cần Thơ", en: "Cần Thơ", title: ["Việt Nam · Cần Thơ (UTC+7)", "Việt Nam · Cần Thơ (UTC+7)"] },
  { id: "uk", tz: "Europe/London", vi: "Woolsthorpe", en: "Woolsthorpe", title: ["Anh · Newton (UTC+0/+1)", "England · Newton (UTC+0/+1)"] },
  { id: "nl", tz: "Europe/Amsterdam", vi: "The Hague", en: "The Hague", title: ["Hà Lan · Tinbergen (UTC+1/+2)", "Netherlands · Tinbergen (UTC+1/+2)"] },
] as const;

export function Flag({ id }: { id: (typeof ZONES)[number]["id"] }) {
  const common = { viewBox: "0 0 30 20", width: 18, height: 12, "aria-hidden": true, className: "shrink-0 rounded-[2px]" };
  if (id === "vn")
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#DA251D" />
        <polygon points="15,4 16.35,8.15 20.71,8.15 17.18,10.71 18.53,14.85 15,12.29 11.47,14.85 12.82,10.71 9.29,8.15 13.65,8.15" fill="#FFFF00" />
      </svg>
    );
  if (id === "uk")
    return (
      <svg {...common}>
        <rect width="30" height="20" fill="#012169" />
        <path d="M0 0L30 20M30 0L0 20" stroke="#fff" strokeWidth="4" />
        <path d="M0 0L30 20M30 0L0 20" stroke="#C8102E" strokeWidth="1.6" />
        <path d="M15 0V20M0 10H30" stroke="#fff" strokeWidth="6" />
        <path d="M15 0V20M0 10H30" stroke="#C8102E" strokeWidth="3.4" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect width="30" height="20" fill="#21468B" />
      <rect width="30" height="13.33" fill="#fff" />
      <rect width="30" height="6.67" fill="#AE1C28" />
    </svg>
  );
}

function times(): string[] {
  const d = new Date();
  return ZONES.map((z) => {
    try {
      return new Intl.DateTimeFormat("en-GB", { timeZone: z.tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    } catch {
      return "--:--";
    }
  });
}

/**
 * Header clocks; daylight saving is handled by Intl. In the lab rooms they show only at 2xl;
 * over the story they are always there, Cần Thơ first, the other two from 900px and the names from 1440px.
 */
export function Clocks({ story = false }: { story?: boolean }) {
  const [now, setNow] = useState<string[]>(() => ["--:--", "--:--", "--:--"]);
  useEffect(() => {
    setNow(times());
    const id = window.setInterval(() => setNow(times()), 15000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className={"items-center gap-1.5 " + (story ? "flex" : "hidden 2xl:flex")} aria-label={tr("Giờ địa phương", "Local times")}>
      {ZONES.map((z, i) => (
        <span
          key={z.id}
          title={tr(z.title[0], z.title[1])}
          className={
            "noir-track flex min-h-9 items-center gap-1.5 rounded-full px-2.5 " + (i ? (story ? "hidden min-[900px]:flex" : "hidden 2xl:flex") : "")
          }
        >
          <Flag id={z.id} />
          <b className="text-[13px] font-semibold text-paper tabular-nums">{now[i]}</b>
          <i className={"hidden text-[11px] whitespace-nowrap text-mist not-italic " + (story ? "min-[1440px]:inline" : "2xl:inline")}>
            {tr(z.vi, z.en)}
          </i>
        </span>
      ))}
    </div>
  );
}
