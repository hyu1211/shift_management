"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { ShiftRow } from "@/types/shift";
import { buildTermId, type ShiftTerm } from "@/features/shift/lib/term";
import { formatTimeHHmm } from "@/features/shift/lib/time";
import YearMonthSelect from "@/features/shift/components/YearMonthSelect";
import PeriodToggle from "@/features/shift/components/PeriodToggle";

export default function MyShiftsPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<ShiftTerm>(
    today.getDate() <= 15 ? "first" : "second"
  );

  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchMyShifts = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // AuthGuardが認証済みであることを保証済みのため、ここでは
        // クエリに使うuser.idの取得のみ行う（未認証時のリダイレクトはAuthGuardの責務）
        if (!user) {
          if (!cancelled) setLoading(false);
          return;
        }

        const termId = buildTermId(targetYear, targetMonth, targetPeriod);

        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", user.id)
          .eq("term_id", termId)
          .eq("is_working", true)
          .order("shift_date", { ascending: true })
          .order("start_time", { ascending: true });

        if (cancelled) return;

        if (error) {
          console.error(error);
          setShifts([]);
          return;
        }

        setShifts(data ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMyShifts();

    return () => {
      cancelled = true;
    };
  }, [targetMonth, targetPeriod, targetYear]);

  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 md:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
      <div className="mb-6 border-b border-zinc-100/90 pb-4">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">提出シフトの確認</h2>
        <p className="mt-1 text-sm text-zinc-500">確定前は「確認中」、管理者承認後は「確定」と表示されます</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-zinc-100/90 bg-zinc-50/80 p-4 sm:grid-cols-2">
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
          fullWidth
        />
      </div>

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : shifts.length > 0 ? (
        <div className="space-y-3.5">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className={`flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-lg shadow-zinc-200/20 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/40 ${
                shift.is_confirmed
                  ? "border-emerald-200/80 bg-emerald-50/70"
                  : "border-zinc-100/90 bg-white/90"
              }`}
            >
              <div>
                <div className="mb-1 text-sm font-semibold tracking-wide text-zinc-700">
                  {shift.shift_date.split("-")[2]}日 ({shift.day})
                </div>
                <div className="text-sm font-medium text-zinc-500">
                  {formatTimeHHmm(shift.start_time)} - {formatTimeHHmm(shift.end_time)}
                </div>
              </div>

              <span
                className={`rounded-full px-3.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] ${
                  shift.is_confirmed
                    ? "border border-emerald-300/70 bg-emerald-500 text-white shadow-sm shadow-emerald-200/60"
                    : "border border-zinc-200 bg-zinc-100 text-zinc-500"
                }`}
              >
                {shift.is_confirmed ? "確定" : "確認中"}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 py-10 text-center">
          <p className="text-sm font-medium text-zinc-400">この期間の提出データはありません</p>
        </div>
      )}
    </div>
  );
}
