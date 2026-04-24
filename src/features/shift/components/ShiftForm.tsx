"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ShiftForm() {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [targetYear, setTargetYear] = useState(nextMonth.getFullYear());
  const [targetMonth, setTargetMonth] = useState(nextMonth.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<"first" | "second">("first");

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateDays = () => {
      const newShifts = [];
      const startDay = targetPeriod === "first" ? 1 : 16;
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      const endDay = targetPeriod === "first" ? 15 : lastDay;

      for (let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(targetYear, targetMonth - 1, d);
        const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()];
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        newShifts.push({
          shift_date: dateStr,
          displayDate: `${d}日 (${dayOfWeek})`,
          day: dayOfWeek,
          isWorking: false,
          startTime: "17:00",
          endTime: "21:30",
        });
      }
      setShifts(newShifts);
    };

    generateDays();
  }, [targetYear, targetMonth, targetPeriod]);

  const updateShift = (index: number, field: string, value: any) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインしていません");
      setLoading(false);
      return;
    }

    const termId = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${targetPeriod}`;

    const dataToSave = shifts.map((shift) => ({
      user_id: user.id,
      shift_date: shift.shift_date,
      term_id: termId,
      day: shift.day,
      is_working: shift.isWorking,
      start_time: shift.isWorking ? shift.startTime : null,
      end_time: shift.isWorking ? shift.endTime : null,
    }));

    const { error } = await supabase
      .from("shifts")
      .upsert(dataToSave, { onConflict: "user_id, shift_date" });

    if (error) {
      console.error(error);
      alert("保存に失敗しました");
    } else {
      alert(`${targetMonth}月 ${targetPeriod === "first" ? "前半" : "後半"} のシフトを提出しました！`);
    }
    setLoading(false);
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 md:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
      <div className="mb-8 rounded-2xl border border-zinc-100/90 bg-zinc-50/80 p-4 md:p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500">提出する期間を選んでください</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={targetYear}
            onChange={(e) => setTargetYear(Number(e.target.value))}
            className="rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-500 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            <option value={today.getFullYear()}>{today.getFullYear()}年</option>
            <option value={today.getFullYear() + 1}>{today.getFullYear() + 1}年</option>
          </select>

          <select
            value={targetMonth}
            onChange={(e) => setTargetMonth(Number(e.target.value))}
            className="rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-500 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}月
              </option>
            ))}
          </select>

          <div className="flex rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-1.5 overflow-hidden shadow-inner shadow-zinc-200/30">
            <button
              type="button"
              onClick={() => setTargetPeriod("first")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-500 ${
                targetPeriod === "first"
                  ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              前半 (1〜15日)
            </button>
            <button
              type="button"
              onClick={() => setTargetPeriod("second")}
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold tracking-wide transition-all duration-500 ${
                targetPeriod === "second"
                  ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              後半 (16〜末日)
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {shifts.map((shift, index) => (
          <div
            key={shift.shift_date}
            className={`p-4 rounded-2xl border transition-all duration-500 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shadow-zinc-200/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/40
              ${shift.isWorking ? "border-emerald-200/80 bg-emerald-50/70" : "border-zinc-100/90 bg-white/90"}`}
          >
            <label className="flex items-center space-x-3 cursor-pointer w-40">
              <input
                type="checkbox"
                checked={shift.isWorking}
                onChange={(e) => updateShift(index, "isWorking", e.target.checked)}
                className="h-5 w-5 cursor-pointer rounded border-zinc-300 text-zinc-700 focus:ring-zinc-400"
              />
              <span className={`font-semibold tracking-wide text-lg ${shift.isWorking ? "text-zinc-800" : "text-zinc-600"}`}>
                {shift.displayDate}
              </span>
            </label>

            {shift.isWorking ? (
              <div className="flex items-center space-x-2 bg-white/95 p-2.5 rounded-xl shadow-sm border border-zinc-200">
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(e) => updateShift(index, "startTime", e.target.value)}
                  className="rounded-lg border border-zinc-200 px-2 py-1.5 outline-none text-zinc-700 text-sm font-medium focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
                <span className="text-zinc-400">〜</span>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(e) => updateShift(index, "endTime", e.target.value)}
                  className="rounded-lg border border-zinc-200 px-2 py-1.5 outline-none text-zinc-700 text-sm font-medium focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
              </div>
            ) : (
              <span className="rounded-full border border-zinc-200 bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-500">
                出勤不可
              </span>
            )}
          </div>
        ))}

        <div className="pt-6 mt-6 border-t border-zinc-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-800 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-zinc-300/50 transition-all duration-500 hover:-translate-y-0.5 hover:bg-zinc-700 disabled:translate-y-0 disabled:border-zinc-300 disabled:bg-zinc-300"
          >
            {loading ? "送信中..." : `${targetMonth}月${targetPeriod === "first" ? "前半" : "後半"}のシフトを提出`}
          </button>
        </div>
      </form>
    </div>
  );
}
