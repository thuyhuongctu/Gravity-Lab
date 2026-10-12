import vnMap from "@/assets/vn-map.svg";

/**
 * A faint map of Vietnam, with the Hoàng Sa and Trường Sa archipelagos, pinned
 * behind a scrolling page. Place it first inside the scroll container; the
 * content that follows needs `relative` to sit above it.
 */
export function VnWatermark({ className = "" }: { className?: string }) {
  const mask = `url("${vnMap}")`;
  return (
    <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 h-0 overflow-visible">
      <div
        className={"absolute right-0 top-4 h-[min(88dvh,46rem)] w-[min(78vw,32rem)] bg-teal opacity-[0.08] " + className}
        style={{
          WebkitMaskImage: mask,
          maskImage: mask,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "right top",
          maskPosition: "right top",
        }}
      />
    </div>
  );
}
