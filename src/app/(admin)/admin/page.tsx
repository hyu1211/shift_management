"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/common/LogoutButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const today = new Date();
  const router = useRouter();

  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<"first" | "second">("first");

  const [displayDates, setDisplayDates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [targetYear, targetMonth, targetPeriod]);

  const fetchData = async () => {
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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        router.push("/");
        return;
      }

      const termId = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${targetPeriod}`;
      const startDay = targetPeriod === "first" ? 1 : 16;
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      const endDay = targetPeriod === "first" ? 15 : lastDay;

      const datesInRange: any[] = [];
      for (let d = startDay; d <= endDay; d++) {
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][new Date(targetYear, targetMonth - 1, d).getDay()];
        datesInRange.push({ date: dateStr, label: `${d}日 (${dayOfWeek})`, shifts: [] });
      }

      const { data, error } = await supabase
        .from("shifts")
        .select(`
          id,
          user_id,
          shift_date,
          start_time,
          end_time,
          is_confirmed
        `)
        .eq("term_id", termId)
        .eq("is_working", true)
        .order("start_time", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      const userIds = Array.from(new Set((data ?? []).map((shift: any) => shift.user_id)));
      const { data: profileRows, error: profileRowsError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      if (profileRowsError) {
        console.error(profileRowsError);
      }
      if (!profileRowsError && userIds.length > 0 && (profileRows?.length ?? 0) === 0) {
        console.warn("profilesが0件です。RLSポリシーで他ユーザーのprofiles参照が拒否されている可能性があります。", {
          shiftUserCount: userIds.length,
        });
      }

      const profileMap = new Map((profileRows ?? []).map((row: any) => [row.id, row.full_name]));

      data?.forEach((shift: any) => {
        const target = datesInRange.find((d) => d.date === shift.shift_date);
        if (target) {
          target.shifts.push({
            ...shift,
            teacherName: profileMap.get(shift.user_id) ?? "名前未設定",
          });
        }
      });

      setDisplayDates(datesInRange);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return timeStr.slice(0, 5);
  };

  const toggleConfirm = async (shiftId: number, currentStatus: boolean) => {
    const { error } = await supabase.from("shifts").update({ is_confirmed: !currentStatus }).eq("id", shiftId);

    if (!error) fetchData();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-6 md:p-8 text-zinc-800">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200/80 bg-white/90 text-zinc-500 transition-all duration-500 hover:-translate-y-0.5 hover:border-zinc-300 hover:text-zinc-700"
            >
              ←
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Admin Console</p>
              <h1 className="text-2xl font-semibold tracking-wide text-zinc-800">シフト管理システム</h1>
            </div>
          </div>
          <LogoutButton />
        </div>

        <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={targetYear}
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
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
              className="rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}月
                </option>
              ))}
            </select>
          </div>

          <div className="flex rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-1.5 shadow-inner shadow-zinc-200/40">
            <button
              onClick={() => setTargetPeriod("first")}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-500 ${
                targetPeriod === "first"
                  ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              前半
            </button>
            <button
              onClick={() => setTargetPeriod("second")}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold tracking-wide transition-all duration-500 ${
                targetPeriod === "second"
                  ? "bg-white text-zinc-800 shadow-md shadow-zinc-300/40"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              後半
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          {displayDates.map((item) => (
            <section
              key={item.date}
              className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-zinc-200/40 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-zinc-100/90 bg-zinc-50/70 px-6 py-4">
                <span className="text-base font-semibold tracking-wide text-zinc-700">{item.label}</span>
                <span className="rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium tracking-wide text-zinc-500">
                  {item.shifts.length}名
                </span>
              </div>

              <div className="space-y-3 p-5 md:p-6">
                {item.shifts.length > 0 ? (
                  item.shifts.map((shift: any) => (
                    <div
                      key={shift.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-100/80 bg-white/90 p-4 shadow-lg shadow-zinc-200/30 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-200/50"
                    >
                      <div className="space-y-1">
                        <span className="text-sm font-semibold tracking-wide text-zinc-800">{shift.teacherName} 先生</span>
                        <p className="text-sm font-medium text-zinc-500">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleConfirm(shift.id, shift.is_confirmed)}
                        className={`rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all duration-500 ${
                          shift.is_confirmed
                            ? "border border-emerald-300/80 bg-emerald-500 text-white shadow-md shadow-emerald-200/60"
                            : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
                        }`}
                      >
                        {shift.is_confirmed ? "確定済" : "未確定"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-6 text-center text-sm font-medium italic text-zinc-400">
                    講師はいません
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
