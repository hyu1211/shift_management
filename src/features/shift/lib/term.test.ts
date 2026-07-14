import { describe, expect, it } from "vitest";
import { buildTermId } from "./term";

describe("buildTermId", () => {
  it("前半期のIDを組み立てる", () => {
    expect(buildTermId(2026, 7, "first")).toBe("2026-07-first");
  });

  it("後半期のIDを組み立てる", () => {
    expect(buildTermId(2026, 12, "second")).toBe("2026-12-second");
  });

  it("1桁の月はゼロ埋めする", () => {
    expect(buildTermId(2026, 1, "first")).toBe("2026-01-first");
  });
});
