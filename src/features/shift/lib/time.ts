export function formatTimeHHmm(timeStr: string | null): string {
  if (!timeStr) return "--:--";
  return timeStr.slice(0, 5);
}
