"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import HomeButton from "@/components/HomeButton";
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

      // 💡 選択された年・月・期間（term_id）で絞り込む
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

  // 💡 秒をカットして HH:mm 形式にする関数
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "--:--";
    return timeStr.slice(0, 5);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-md mx-auto space-y-6">
        
        <div className="mb-4">
          <HomeButton />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-xl font-bold mb-6 border-b pb-2">確定シフトの確認</h1>

          {/* 💡 講師側でも期間を切り替えられるようにする */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-3 bg-gray-50 rounded-xl">
            <select 
              value={targetYear} 
              onChange={(e) => setTargetYear(Number(e.target.value))}
              className="p-2 bg-white rounded-lg border border-gray-200 font-bold text-sm"
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
            <select 
              value={targetMonth} 
              onChange={(e) => setTargetMonth(Number(e.target.value))}
              className="p-2 bg-white rounded-lg border border-gray-200 font-bold text-sm"
            >
              {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}月</option>)}
            </select>
            <div className="col-span-2 flex bg-white rounded-lg border mt-2 overflow-hidden">
              <button
                onClick={() => setTargetPeriod("first")}
                className={`flex-1 py-2 text-xs font-bold transition-all ${targetPeriod === "first" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                前半 (1〜15日)
              </button>
              <button
                onClick={() => setTargetPeriod("second")}
                className={`flex-1 py-2 text-xs font-bold transition-all ${targetPeriod === "second" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                後半 (16〜末日)
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-gray-400 py-10">読み込み中...</p>
          ) : shifts.length > 0 ? (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div 
                  key={shift.id} 
                  className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between
                    ${shift.is_confirmed ? "border-green-400 bg-green-50" : "border-gray-100 bg-white"}`}
                >
                  <div>
                    <div className="font-bold text-gray-700 mb-1">
                      {shift.shift_date.split('-')[2]}日 ({shift.day})
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                    ${shift.is_confirmed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"}`}
                  >
                    {shift.is_confirmed ? "Confirmed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-400 text-sm font-medium">この期間の提出データはありません</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}