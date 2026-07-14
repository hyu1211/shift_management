export const GRADE_OPTIONS = [
  "小1", "小2", "小3", "小4", "小5", "小6",
  "中1", "中2", "中3",
  "高1", "高2", "高3",
] as const;

export type Grade = (typeof GRADE_OPTIONS)[number];

export type Student = {
  id: string;
  name: string;
  grade: Grade;
  school: string | null;
  note: string | null;
  created_at: string;
};

export type StudentInput = {
  name: string;
  grade: Grade;
  school?: string | null;
  note?: string | null;
};
