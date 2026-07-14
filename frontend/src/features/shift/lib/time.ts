export function formatTimeHHmm(timeStr: string | null): string {
  if (!timeStr) return "--:--";
  return timeStr.slice(0, 5);
}

export function validateShiftTimes(startTime: string, endTime: string): string | null {
  if (startTime >= endTime) {
    return "終了時刻は開始時刻より後にしてください";
  }
  return null;
}
