import { useState } from "react";
import { fmt, fmtInt, tr } from "@/lib/prefs";
import { pairKm, type Economy } from "@/sim/trade";
import { shareState, type ShareState } from "@/lib/shareState";

/** Trade agreements in force with Viet Nam, by trade.ts economy id. */
const FTA: Record<string, string> = {
  th: "AFTA", sg: "AFTA", id: "AFTA", cn: "ACFTA", kr: "VKFTA", jp: "VJEPA", eu: "EVFTA", us: "—",
};

interface Props {
  focus: Economy; // Viet Nam
  partner: Economy;
  gamma: number;
  share: number; // partner's share of the focus's flow (%), from partnerRows()
  state: ShareState; // current room/view/sliders, for the share link
  onOpenCase?: () => void;
  onFocus?: () => void; // the old tap behaviour: make this economy the origin of the flows
  onClose: () => void;
}

/** Card shown when a partner is tapped on the plane or the globe (mockup 2f). */
export function PartnerCard({ focus, partner, gamma, share, state, onOpenCase, onFocus, onClose }: Props) {
  const [msg, setMsg] = useState("");
  const km = pairKm(focus, partner);
  const name = tr(partner.name, partner.nameEn);
  const onShare = async () => {
    const r = await shareState({ ...state, pair: partner.id, gamma }, "Gravity Lab");
    setMsg(r === "copied" ? tr("Đã chép link", "Link copied") : r === "failed" ? tr("Không chia sẻ được", "Could not share") : "");
  };
  return (
    <div role="dialog" aria-label={name} className="noir-card pointer-events-auto flex w-full max-w-sm flex-col gap-3 rounded-[26px] p-[18px] text-paper">
      <div className="flex items-center gap-2.5">
        <span aria-hidden="true" className="clay-ball ball-violet size-3" />
        <h3 className="flex-1 font-serif text-[19px]">
          {name} → {tr(focus.name, focus.nameEn)}
        </h3>
        <button type="button" onClick={onClose} aria-label={tr("Đóng", "Close")} className="grid size-11 place-items-center text-mist">
          ✕
        </button>
      </div>
      <dl className="grid grid-cols-3 gap-2">
        {[
          [tr("Khoảng cách", "Distance"), `${fmtInt(km)} km`],
          ["FTA", FTA[partner.id] ?? "—"],
          [tr("Tỷ trọng", "Share"), `${fmt(share, 1)}%`],
        ].map(([k, v]) => (
          <div key={k} className="noir-track rounded-2xl p-2.5">
            <dt className="text-[11px] text-mist">{k}</dt>
            <dd className="text-[15px] font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        {onOpenCase && (
          <button type="button" onClick={onOpenCase} className="cosmic-btn min-h-11 flex-1 rounded-full text-[13px] font-semibold">
            {tr("Mở hồ sơ điều tra", "Open case file")}
          </button>
        )}
        <button type="button" onClick={onShare} className="noir-raise min-h-11 rounded-full px-3.5 text-[13px] font-semibold text-paper">
          {tr("Chia sẻ", "Share")}
        </button>
      </div>
      {onFocus && (
        <button type="button" onClick={onFocus} className="min-h-11 self-start text-[13px] font-medium text-teal-2 underline underline-offset-4">
          {tr(`Lấy ${name} làm gốc dòng chảy`, `Make ${name} the origin of the flows`)}
        </button>
      )}
      <p className="text-[11px] text-mist" aria-live="polite">
        {msg || tr(`Tỷ trọng theo mô hình với γ = ${fmt(gamma, 2)}. Link giữ nguyên phòng, góc nhìn, γ và cặp nước.`, `Model share at γ = ${fmt(gamma, 2)}. The link keeps the room, view, γ and the pair.`)}
      </p>
    </div>
  );
}
