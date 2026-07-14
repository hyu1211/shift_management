import { describe, expect, it } from "vitest";
import { formatTimeHHmm, validateShiftTimes } from "./time";

describe("formatTimeHHmm", () => {
  it("HH:MM:SS を HH:MM に切り詰める", () => {
    expect(formatTimeHHmm("09:30:00")).toBe("09:30");
  });

  it("HH:MM はそのまま返す", () => {
    expect(formatTimeHHmm("18:00")).toBe("18:00");
  });

  it("null はプレースホルダーを返す", () => {
    expect(formatTimeHHmm(null)).toBe("--:--");
  });

  it("空文字はプレースホルダーを返す", () => {
    expect(formatTimeHHmm("")).toBe("--:--");
  });
});

describe("validateShiftTimes", () => {
  it("開始 < 終了 なら null（エラーなし）", () => {
    expect(validateShiftTimes("09:00", "18:00")).toBeNull();
  });

  it("開始 = 終了 はエラー", () => {
    expect(validateShiftTimes("09:00", "09:00")).not.toBeNull();
  });

  it("開始 > 終了 はエラー", () => {
    expect(validateShiftTimes("18:00", "09:00")).not.toBeNull();
  });
});
