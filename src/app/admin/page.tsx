"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const today = new Date();
  const router = useRouter();
  
  // 💡 年の選択肢を動的に生成（今年を中心に前後1年ずつ、計3年分など）
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
          shift_date,
          start_time,
          end_time,
          is_confirmed,
          profiles ( full_name )
        `)
        .eq("term_id", termId)
        .eq("is_working", true)
        .order("start_time", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      data?.forEach((shift: any) => {
        const target = datesInRange.find((d) => d.date === shift.shift_date);
        if (target) target.shifts.push(shift);
      });

      setDisplayDates(datesInRange);
    } finally {
      setLoading(false);
    }
  };

  // 💡 時間の文字列から秒を消す便利な関数
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return timeStr.slice(0, 5); // "17:00:00" -> "17:00"
  };

  const toggleConfirm = async (shiftId: number, currentStatus: boolean) => {
    const { error } = await supabase
      .from("shifts")
      .update({ is_confirmed: !currentStatus })
      .eq("id", shiftId);

    if (!error) fetchData();
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-blue-600 font-bold">←</Link>
            <h1 className="text-xl font-bold">シフト管理システム</h1>
          </div>
          <LogoutButton />
        </div>

        {/* 💡 期間切り替えセクター（年・月・期間） */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <select 
              value={targetYear} 
              onChange={(e) => setTargetYear(Number(e.target.value))} 
              className="p-2 bg-gray-100 rounded-lg font-bold outline-none border-none"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(Number(e.target.value))} 
              className="p-2 bg-gray-100 rounded-lg font-bold outline-none border-none"
            >
              {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
            </select>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button onClick={() => setTargetPeriod("first")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${targetPeriod === "first" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>前半</button>
            <button onClick={() => setTargetPeriod("second")} className={`px-5 py-2 rounded-lg font-bold text-sm transition-all ${targetPeriod === "second" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}>後半</button>
          </div>
        </div>

        <div className="grid gap-4">
          {displayDates.map((item) => (
            <div key={item.date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                <span className="font-bold text-gray-700">{item.label}</span>
                <span className="text-sm font-bold text-gray-400">{item.shifts.length}名</span>
              </div>

              <div className="p-4 space-y-2">
                {item.shifts.length > 0 ? (
                  item.shifts.map((shift: any) => (
                    <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <span className="font-bold mr-4">{shift.profiles?.full_name} 先生</span>
                        {/* 💡 formatTime関数を使って秒をカット！ */}
                        <span className="text-sm text-gray-500 font-medium">
                          {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleConfirm(shift.id, shift.is_confirmed)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${shift.is_confirmed ? "bg-green-500 text-white shadow-sm" : "bg-white text-gray-400 border border-gray-200"}`}
                      >
                        {shift.is_confirmed ? "確定済" : "未確定"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-2 text-gray-300 text-sm italic">講師はいません</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}