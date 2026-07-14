export const SUBJECTS_BY_LEVEL = {
  小学: ["国語", "算数", "理科", "社会"],
  中学: ["国語", "英語", "数学", "理科", "社会"],
  高校: ["国語", "英語", "数1", "数2", "数3", "物理", "生物", "化学", "日本史", "世界史", "地理"],
} as const;

export type SchoolLevel = keyof typeof SUBJECTS_BY_LEVEL;

export const SCHOOL_LEVELS = Object.keys(SUBJECTS_BY_LEVEL) as SchoolLevel[];

export function buildSubjectTag(level: SchoolLevel, subject: string): string {
  return `${level}:${subject}`;
}

export function parseSubjectTag(tag: string): { level: string; subject: string } {
  const [level, subject] = tag.split(":");
  return { level, subject };
}

// 授業登録（lessons.subject）用: 学校段階の重複を除いた科目名の一覧
export const ALL_SUBJECTS: string[] = Array.from(
  new Set(SCHOOL_LEVELS.flatMap((level) => SUBJECTS_BY_LEVEL[level])),
);
