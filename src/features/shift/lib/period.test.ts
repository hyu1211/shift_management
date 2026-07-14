import { describe, expect, it } from "vitest";
import {
  buildAdminDateGroups,
  buildPeriodDaySlots,
  formatShiftDate,
  getDayOfWeekJa,
  getPeriodDayRange,
} from "./period";

describe("getDayOfWeekJa", () => {
  it("2024-01-01 は月曜", () => {
    expect(getDayOfWeekJa(2024, 1, 1)).toBe("月");
  });

  it("2024-01-07 は日曜", () => {
    expect(getDayOfWeekJa(2024, 1, 7)).toBe("日");
  });
});

describe("formatShiftDate", () => {
  it("月・日をゼロ埋めした YYYY-MM-DD を返す", () => {
    expect(formatShiftDate(2026, 7, 5)).toBe("2026-07-05");
  });

  it("2桁の月・日はそのまま", () => {
    expect(formatShiftDate(2026, 12, 31)).toBe("2026-12-31");
  });
});

describe("getPeriodDayRange", () => {
  it("前半は 1〜15 日", () => {
    expect(getPeriodDayRange(2026, 7, "first")).toEqual({
      startDay: 1,
      endDay: 15,
    });
  });

  it("後半は 16〜月末", () => {
    expect(getPeriodDayRange(2026, 7, "second")).toEqual({
      startDay: 16,
      endDay: 31,
    });
  });

  it("後半の月末は月の日数に追随する（平年2月）", () => {
    expect(getPeriodDayRange(2023, 2, "second")).toEqual({
      startDay: 16,
      endDay: 28,
    });
  });

  it("後半の月末は月の日数に追随する（うるう年2月）", () => {
    expect(getPeriodDayRange(2024, 2, "second")).toEqual({
      startDay: 16,
      endDay: 29,
    });
  });
});

describe("buildPeriodDaySlots", () => {
  it("前半は15日分のスロットを作る", () => {
    const slots = buildPeriodDaySlots(2026, 7, "first");
    expect(slots).toHaveLength(15);
    expect(slots[0].shift_date).toBe("2026-07-01");
    expect(slots[14].shift_date).toBe("2026-07-15");
  });

  it("表示用ラベルに日付と曜日を含める", () => {
    const slots = buildPeriodDaySlots(2024, 1, "first");
    // 2024-01-01 は月曜
    expect(slots[0].displayDate).toBe("1日 (月)");
    expect(slots[0].day).toBe("月");
  });

  it("後半は16日から月末まで", () => {
    const slots = buildPeriodDaySlots(2024, 2, "second");
    expect(slots[0].shift_date).toBe("2024-02-16");
    expect(slots[slots.length - 1].shift_date).toBe("2024-02-29");
  });
});

describe("buildAdminDateGroups", () => {
  it("各日付に空の shifts 配列を持つグループを作る", () => {
    const groups = buildAdminDateGroups(2026, 7, "first");
    expect(groups).toHaveLength(15);
    expect(groups[0]).toEqual({
      date: "2026-07-01",
      label: "1日 (水)",
      shifts: [],
    });
  });
});
