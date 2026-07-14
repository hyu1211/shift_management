"use client";

import type { ShiftTerm } from "../lib/term";

type PeriodToggleProps = {
  value: ShiftTerm;
  onChange: (value: ShiftTerm) => void;
  firstLabel?: string;
  secondLabel?: string;
  fullWidth?: boolean;
};

export default function PeriodToggle({
  value,
  onChange,
  firstLabel = "前半",
  secondLabel = "後半",
  fullWidth = false,
}: PeriodToggleProps) {
  const buttonBase =
    "rounded-xl py-2.5 font-semibold tracking-wide transition-all duration-500";
  const activeClass = "bg-white text-zinc-800 shadow-md shadow-zinc-300/40";
  const inactiveClass = "text-zinc-500 hover:text-zinc-700";
  const sizeClass = fullWidth ? "flex-1 text-xs" : "px-4 text-sm";

  return (
    <div
      className={`flex overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-1.5 shadow-inner shadow-zinc-200/40 ${
        fullWidth ? "sm:col-span-2" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onChange("first")}
        className={`${buttonBase} ${sizeClass} ${value === "first" ? activeClass : inactiveClass}`}
      >
        {firstLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange("second")}
        className={`${buttonBase} ${sizeClass} ${value === "second" ? activeClass : inactiveClass}`}
      >
        {secondLabel}
      </button>
    </div>
  );
}
