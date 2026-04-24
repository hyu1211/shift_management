"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HomeButton from "@/components/common/HomeButton";
import { useRouter } from "next/navigation";

export default function MyShiftsPage() {
  const today = new Date();
  const router = useRouter();
  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<"first" | "second">(
    today.getDate() <= 15 ? "first" : "second"
  );

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyShifts();
  }, [targetYear, targetMonth, targetPeriod]);

  const fetchMyShifts = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const termId = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${targetPeriod}`;

      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .eq("user_id", user.id)
        .eq("term_id", termId)
        .eq("is_working", true)
        .order("shift_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error(error);
        setShifts([]);
        return;
      }

      setShifts(data || []);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return timeStr.slice(0, 5);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-6 md:p-8 text-zinc-800">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="mb-1">
          <HomeButton />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 md:p-8 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
          <div className="mb-6 border-b border-zinc-100/90 pb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">My Schedule</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-wide text-zinc-800">確定シフトの確認</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 rounded-2xl border border-zinc-100/90 bg-zinc-50/80 p-4">
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-500 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
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
            <div className="sm:col-span-2 flex rounded-2xl border border-zinc-200/90 bg-zinc-100/80 p-1.5 overflow-hidden shadow-inner shadow-zinc-200/30">
              <button
                onClick={() => setTargetPeriod("first")}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all duration-500 ${
                  targetPeriod === "first"
                    ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                前半 (1〜15日)
              </button>
              <button
                onClick={() => setTargetPeriod("second")}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold tracking-wide transition-all duration-500 ${
                  targetPeriod === "second"
                    ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                後半 (16〜末日)
              </button>
            </div>
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
                  className={`p-4 rounded-2xl border transition-all duration-500 flex items-center justify-between gap-4 shadow-lg shadow-zinc-200/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/40
                    ${
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
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </div>
                  </div>

                  <span
                    className={`px-3.5 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em] transition-all duration-500
                    ${
                      shift.is_confirmed
                        ? "border border-emerald-300/70 bg-emerald-500 text-white shadow-sm shadow-emerald-200/60"
                        : "border border-zinc-200 bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {shift.is_confirmed ? "Confirmed" : "Pending"}
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
      </div>
    </main>
  );
}
