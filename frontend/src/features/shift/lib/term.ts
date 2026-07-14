export type ShiftTerm = "first" | "second";

export function buildTermId(year: number, month: number, term: ShiftTerm): string {
  return `${year}-${String(month).padStart(2, "0")}-${term}`;
}
