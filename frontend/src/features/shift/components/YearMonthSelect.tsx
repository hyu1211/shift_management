"use client";

type YearMonthSelectProps = {
  year: number;
  month: number;
  yearOptions: number[];
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
};

const selectClassName =
  "rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-500 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export default function YearMonthSelect({
  year,
  month,
  yearOptions,
  onYearChange,
  onMonthChange,
}: YearMonthSelectProps) {
  return (
    <>
      <select
        value={year}
        onChange={(e) => onYearChange(Number(e.target.value))}
        className={selectClassName}
      >
        {yearOptions.map((y) => (
          <option key={y} value={y}>
            {y}年
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => onMonthChange(Number(e.target.value))}
        className={selectClassName}
      >
        {[...Array(12)].map((_, i) => (
          <option key={i + 1} value={i + 1}>
            {i + 1}月
          </option>
        ))}
      </select>
    </>
  );
}
