"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import type { ShiftFormDay } from "@/types/shift";
import { buildPeriodDaySlots } from "@/features/shift/lib/period";
import { buildTermId, type ShiftTerm } from "@/features/shift/lib/term";
import { validateShiftTimes } from "@/features/shift/lib/time";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";
import YearMonthSelect from "@/features/shift/components/YearMonthSelect";
import PeriodToggle from "@/features/shift/components/PeriodToggle";

const DEFAULT_START = "17:00";
const DEFAULT_END = "21:30";

function createEmptyDay(slot: { shift_date: string; displayDate: string; day: string }): ShiftFormDay {
  return {
    ...slot,
    isWorking: false,
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
  };
}

export default function ShiftForm() {
  const { showToast } = useToast();
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [targetYear, setTargetYear] = useState(nextMonth.getFullYear());
  const [targetMonth, setTargetMonth] = useState(nextMonth.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<ShiftTerm>("first");

  const [shifts, setShifts] = useState<ShiftFormDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadShifts = async () => {
      setLoading(true);
      setErrorMessage(null);

      const slots = buildPeriodDaySlots(targetYear, targetMonth, targetPeriod);
      const termId = buildTermId(targetYear, targetMonth, targetPeriod);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setShifts(slots.map(createEmptyDay));
          setLoading(false);
        }
        return;
      }

      const { data: existing, error } = await supabase
        .from("shifts")
        .select("shift_date, is_working, start_time, end_time")
        .eq("user_id", user.id)
        .eq("term_id", termId);

      if (cancelled) return;

      if (error) {
        console.error(error);
        setErrorMessage("提出済みデータの読み込みに失敗しました");
        setShifts(slots.map(createEmptyDay));
        setLoading(false);
        return;
      }

      const existingMap = new Map((existing ?? []).map((row) => [row.shift_date, row]));

      const merged = slots.map((slot) => {
        const saved = existingMap.get(slot.shift_date);
        if (!saved) return createEmptyDay(slot);

        return {
          ...slot,
          isWorking: saved.is_working,
          startTime: saved.start_time?.slice(0, 5) ?? DEFAULT_START,
          endTime: saved.end_time?.slice(0, 5) ?? DEFAULT_END,
        };
      });

      setShifts(merged);
      setLoading(false);
    };

    loadShifts();

    return () => {
      cancelled = true;
    };
  }, [targetYear, targetMonth, targetPeriod]);

  const updateShift = <K extends keyof ShiftFormDay>(index: number, field: K, value: ShiftFormDay[K]) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    for (const shift of shifts) {
      if (!shift.isWorking) continue;
      const validationError = validateShiftTimes(shift.startTime, shift.endTime);
      if (validationError) {
        setErrorMessage(`${shift.displayDate}: ${validationError}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMessage("ログインしていません");
        return;
      }

      const termId = buildTermId(targetYear, targetMonth, targetPeriod);

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

      if (error) throw error;

      showToast(`${targetMonth}月 ${targetPeriod === "first" ? "前半" : "後半"} のシフトを提出しました！`);
    } catch (error) {
      console.error(error);
      setErrorMessage(`保存に失敗しました: ${getErrorMessage(error)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const yearOptions = [today.getFullYear(), today.getFullYear() + 1];

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 md:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
      <div className="mb-8 rounded-2xl border border-zinc-100/90 bg-zinc-50/80 p-4 md:p-5">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-zinc-500">提出する期間を選んでください</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <YearMonthSelect
            year={targetYear}
            month={targetMonth}
            yearOptions={yearOptions}
            onYearChange={setTargetYear}
            onMonthChange={setTargetMonth}
          />

          <PeriodToggle
            value={targetPeriod}
            onChange={setTargetPeriod}
            firstLabel="前半 (1〜15日)"
            secondLabel="後半 (16〜末日)"
          />
        </div>
      </div>

      {errorMessage && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : (
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
                  disabled={submitting}
                  onChange={(e) => updateShift(index, "isWorking", e.target.checked)}
                  className="h-5 w-5 cursor-pointer rounded border-zinc-300 text-zinc-700 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <span
                  className={`font-semibold tracking-wide text-lg ${shift.isWorking ? "text-zinc-800" : "text-zinc-600"}`}
                >
                  {shift.displayDate}
                </span>
              </label>

              {shift.isWorking ? (
                <div className="flex items-center space-x-2 bg-white/95 p-2.5 rounded-xl shadow-sm border border-zinc-200">
                  <input
                    type="time"
                    value={shift.startTime}
                    disabled={submitting}
                    onChange={(e) => updateShift(index, "startTime", e.target.value)}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 outline-none text-zinc-700 text-sm font-medium focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <span className="text-zinc-400">〜</span>
                  <input
                    type="time"
                    value={shift.endTime}
                    disabled={submitting}
                    onChange={(e) => updateShift(index, "endTime", e.target.value)}
                    className="rounded-lg border border-zinc-200 px-2 py-1.5 outline-none text-zinc-700 text-sm font-medium focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Button type="submit" variant="primary" fullWidth disabled={submitting || loading}>
              {submitting ? "送信中..." : `${targetMonth}月${targetPeriod === "first" ? "前半" : "後半"}のシフトを提出`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
