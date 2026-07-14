import { describe, expect, it } from "vitest";
import {
  ALL_SUBJECTS,
  SCHOOL_LEVELS,
  SUBJECTS_BY_LEVEL,
  buildSubjectTag,
  parseSubjectTag,
} from "./subjects";

describe("buildSubjectTag / parseSubjectTag", () => {
  it("学校段階と科目を : で連結する", () => {
    expect(buildSubjectTag("中学", "数学")).toBe("中学:数学");
  });

  it("parse は build の逆変換になっている", () => {
    for (const level of SCHOOL_LEVELS) {
      for (const subject of SUBJECTS_BY_LEVEL[level]) {
        expect(parseSubjectTag(buildSubjectTag(level, subject))).toEqual({
          level,
          subject,
        });
      }
    }
  });
});

describe("ALL_SUBJECTS", () => {
  it("重複がない", () => {
    expect(new Set(ALL_SUBJECTS).size).toBe(ALL_SUBJECTS.length);
  });

  it("全学校段階の科目を網羅している", () => {
    for (const level of SCHOOL_LEVELS) {
      for (const subject of SUBJECTS_BY_LEVEL[level]) {
        expect(ALL_SUBJECTS).toContain(subject);
      }
    }
  });

  it("学校段階間で重複する科目（国語など）は1つにまとまる", () => {
    expect(ALL_SUBJECTS.filter((s) => s === "国語")).toHaveLength(1);
  });
});
