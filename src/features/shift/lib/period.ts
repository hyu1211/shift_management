import type { AdminShiftDisplay } from "@/types/shift";
import type { ShiftTerm } from "./term";

const DAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"] as const;

export function getDayOfWeekJa(year: number, month: number, day: number): string {
  return DAY_NAMES[new Date(year, month - 1, day).getDay()];
}

export function formatShiftDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getPeriodDayRange(
  year: number,
  month: number,
  period: ShiftTerm
): { startDay: number; endDay: number } {
  const lastDay = new Date(year, month, 0).getDate();
  const startDay = period === "first" ? 1 : 16;
  const endDay = period === "first" ? 15 : lastDay;
  return { startDay, endDay };
}

export type PeriodDaySlot = {
  shift_date: string;
  displayDate: string;
  day: string;
};

export function buildPeriodDaySlots(
  year: number,
  month: number,
  period: ShiftTerm
): PeriodDaySlot[] {
  const { startDay, endDay } = getPeriodDayRange(year, month, period);
  const slots: PeriodDaySlot[] = [];

  for (let d = startDay; d <= endDay; d++) {
    const day = getDayOfWeekJa(year, month, d);
    const shift_date = formatShiftDate(year, month, d);
    slots.push({
      shift_date,
      displayDate: `${d}日 (${day})`,
      day,
    });
  }

  return slots;
}

export function buildAdminDateGroups(year: number, month: number, period: ShiftTerm) {
  return buildPeriodDaySlots(year, month, period).map((slot) => ({
    date: slot.shift_date,
    label: slot.displayDate,
    shifts: [] as AdminShiftDisplay[],
  }));
}
