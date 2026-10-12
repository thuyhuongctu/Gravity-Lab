import { Globe, type GlobeArc, type GlobeNode } from "@/components/Globe";
import { WorldMap } from "@/components/WorldMap";
import { partnerRows, radiusForGdp, type Economy } from "@/sim/trade";
import { tr } from "@/lib/prefs";

type Props = {
  economies: Economy[];
  focusId: string;
  pairId: string | null;
  gamma: number;
  boosts: Record<string, number>;
  onTap: (id: string) => void;
  /** Draw a flat world map instead of the globe. */
  flat?: boolean;
};

/** The trade gravity model on the globe: real coordinates, great-circle flows from the focus economy. */
export function GlobeCanvas({ economies, focusId, pairId, gamma, boosts, onTap, flat = false }: Props) {
  const home = economies.find((e) => e.id === focusId) ?? null;
  const pair = pairId ? (economies.find((e) => e.id === pairId) ?? null) : null;
  const rows = partnerRows(economies, focusId, gamma, pairId, boosts);
  const maxShare = Math.max(rows[0]?.share ?? 1, 1);

  const nodes: GlobeNode[] = economies.map((e) => ({
    id: e.id,
    lon: e.lon,
    lat: e.lat,
    label: tr(e.short, e.shortEn),
    r: radiusForGdp(e.gdp) * 0.5,
    color: e.color,
    ring: e.id === focusId ? "teal" : e.id === pairId ? "amber" : undefined,
  }));

  const arcs: GlobeArc[] = home
    ? rows.map((row) => ({
        id: row.econ.id,
        from: home,
        to: row.econ,
        weight: row.share / maxShare,
        highlight: row.econ.id === pairId,
      }))
    : [];

  if (flat) {
    return (
      <WorldMap
        nodes={nodes}
        arcs={arcs}
        onTap={onTap}
        label={tr(
          "Bản đồ thế giới của mô hình trọng lực thương mại. Kéo để di chuyển, chụm hoặc cuộn để thu phóng. Chạm một nền kinh tế để chọn gốc dòng chảy.",
          "World map of the trade gravity model. Drag to pan, pinch or scroll to zoom. Tap an economy to make it the origin of the flows.",
        )}
      />
    );
  }

  return (
    <Globe
      nodes={nodes}
      arcs={arcs}
      focus={home ? (pair ? [home, pair] : [home]) : []}
      onTap={onTap}
      label={tr(
        "Địa cầu mô hình trọng lực thương mại. Kéo để xoay, chụm hoặc cuộn để thu phóng. Chạm một nền kinh tế để chọn gốc dòng chảy.",
        "Trade gravity globe. Drag to turn, pinch or scroll to zoom. Tap an economy to make it the origin of the flows.",
      )}
    />
  );
}
