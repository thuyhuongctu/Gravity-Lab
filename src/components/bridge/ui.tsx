import type { ReactNode } from "react";
import { fmt } from "@/lib/prefs";

/** Small kicker above a block. */
export function Kicker({
  tone = "teal",
  children,
}: {
  tone?: "teal" | "amber" | "clay";
  children: ReactNode;
}) {
  const color = tone === "amber" ? "text-amber" : tone === "clay" ? "text-clay" : "text-teal";
  return <p className={"text-xs font-semibold uppercase tracking-[0.08em] " + color}>{children}</p>;
}

/** Inset panel inside a lab. */
export function Inset({
  tone = "line",
  className = "",
  children,
}: {
  tone?: "line" | "clay";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={
        "rounded-2xl border bg-paper-2/60 p-3.5 " +
        (tone === "clay" ? "border-clay/40 " : "border-line ") +
        className
      }
    >
      {children}
    </div>
  );
}

/** Segmented control (two to five options). */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (id: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex gap-1 rounded-full border border-line bg-paper-2/60 p-1"
    >
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={
            "min-h-10 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold " +
            (value === o.id ? "bg-teal text-paper" : "text-muted")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** One estimate row: label, note, bar against a reference mark, value. */
export function EstimateBar({
  name,
  note,
  value,
  reference,
  max,
  tone,
}: {
  name: string;
  note: string;
  value: number;
  reference: number;
  max: number;
  tone: "muted" | "teal" | "clay";
}) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  const bar = tone === "teal" ? "bg-teal" : tone === "clay" ? "bg-clay" : "bg-mist";
  const text = tone === "teal" ? "text-teal" : tone === "clay" ? "text-clay" : "text-muted";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{name}</span>
        <span className="text-[13px] text-muted">{note}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative h-2.5 flex-1 rounded-full border border-line bg-paper-2/60">
          <div
            className="absolute -top-1 -bottom-1 w-0.5 bg-muted"
            style={{ left: `${(reference / max) * 100}%` }}
            aria-hidden="true"
          />
          <div
            className={"absolute inset-y-0 left-0 rounded-full " + bar}
            style={{ width: `${w}%` }}
          />
        </div>
        <b className={"w-14 text-right text-lg tabular-nums " + text}>{fmt(value, 2)}</b>
      </div>
    </div>
  );
}

/** Slider with a label on the left and the formatted value on the right. */
export function Slider({
  label,
  valueText,
  min,
  max,
  step = 1,
  value,
  onChange,
  tone = "teal",
}: {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  tone?: "teal" | "amber" | "clay";
}) {
  const color =
    tone === "amber"
      ? "text-amber accent-amber"
      : tone === "clay"
        ? "text-clay accent-clay"
        : "text-teal accent-teal";
  return (
    <label className="block">
      <span className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <b className={"tabular-nums " + color}>{valueText}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
        className={"h-7 w-full " + color}
      />
    </label>
  );
}

/** Legend swatch. */
export function Swatch({
  kind,
  tone,
  children,
}: {
  kind: "dot" | "line" | "dash" | "ring";
  tone: "teal" | "amber" | "clay" | "muted";
  children: ReactNode;
}) {
  const bg =
    tone === "teal"
      ? "bg-teal"
      : tone === "amber"
        ? "bg-amber"
        : tone === "clay"
          ? "bg-clay"
          : "bg-mist";
  const border =
    tone === "teal"
      ? "border-teal"
      : tone === "amber"
        ? "border-amber"
        : tone === "clay"
          ? "border-clay"
          : "border-mist";
  const mark =
    kind === "dot" ? (
      <span className={"size-2.5 rounded-full " + bg} />
    ) : kind === "line" ? (
      <span className={"h-0.5 w-4 rounded " + bg} />
    ) : kind === "dash" ? (
      <span className={"w-4 border-t-2 border-dashed " + border} />
    ) : (
      <span className={"size-3 rounded-full border-2 " + border} />
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted">
      <span aria-hidden="true" className="inline-flex items-center">
        {mark}
      </span>
      {children}
    </span>
  );
}
