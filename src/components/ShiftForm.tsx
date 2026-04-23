"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ShiftForm() {
  // デフォルトを「来月」に設定する
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const [targetYear, setTargetYear] = useState(nextMonth.getFullYear());
  const [targetMonth, setTargetMonth] = useState(nextMonth.getMonth() + 1);
  const [targetPeriod, setTargetPeriod] = useState<"first" | "second">("first");

  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 💡 年・月・期間が変わるたびに、自動でカレンダー（入力枠）を生成する関数
  useEffect(() => {
    const generateDays = () => {
      const newShifts = [];
      const startDay = targetPeriod === "first" ? 1 : 16;
      // その月の最終日を自動計算（例：2月なら28日、5月なら31日）
      const lastDay = new Date(targetYear, targetMonth, 0).getDate();
      const endDay = targetPeriod === "first" ? 15 : lastDay;

      for (let d = startDay; d <= endDay; d++) {
        const dateObj = new Date(targetYear, targetMonth - 1, d);
        const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"][dateObj.getDay()];
        
        // YYYY-MM-DD 形式の文字列を作成（データベース保存用）
        const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

        newShifts.push({
          shift_date: dateStr,
          displayDate: `${d}日 (${dayOfWeek})`,
          day: dayOfWeek, // 互換性のため曜日も保持
          isWorking: false,
          startTime: "17:00", // 塾によくある開始時間にデフォルトを変更
          endTime: "21:30",
        });
      }
      setShifts(newShifts);
    };

    generateDays();
  }, [targetYear, targetMonth, targetPeriod]);

  // 特定の日付のデータを更新する関数
  const updateShift = (index: number, field: string, value: any) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("ログインしていません");
      setLoading(false);
      return;
    }

    // 期間IDを作成（例: "2026-05-first"）
    const termId = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${targetPeriod}`;

    // データベースに保存する形式に変換
    const dataToSave = shifts.map((shift) => ({
      user_id: user.id,
      shift_date: shift.shift_date,
      term_id: termId,
      day: shift.day,
      is_working: shift.isWorking,
      start_time: shift.isWorking ? shift.startTime : null,
      end_time: shift.isWorking ? shift.endTime : null,
    }));

    // user_id と shift_date のペアを基準にして、あれば上書き、なければ新規作成
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      
      {/* ▼ 期間選択コントローラー */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
        <h2 className="text-sm font-bold text-gray-500 mb-3">提出する期間を選んでください</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            value={targetYear} 
            onChange={(e) => setTargetYear(Number(e.target.value))}
            className="p-2 rounded-lg border font-bold text-gray-700 outline-none"
          >
            <option value={today.getFullYear()}>{today.getFullYear()}年</option>
            <option value={today.getFullYear() + 1}>{today.getFullYear() + 1}年</option>
          </select>
          
          <select 
            value={targetMonth} 
            onChange={(e) => setTargetMonth(Number(e.target.value))}
            className="p-2 rounded-lg border font-bold text-gray-700 outline-none"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}月</option>
            ))}
          </select>

          <div className="flex bg-white rounded-lg border overflow-hidden">
            <button
              type="button"
              onClick={() => setTargetPeriod("first")}
              className={`px-4 py-2 font-bold text-sm transition-colors ${targetPeriod === "first" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
            >
              前半 (1〜15日)
            </button>
            <button
              type="button"
              onClick={() => setTargetPeriod("second")}
              className={`px-4 py-2 font-bold text-sm transition-colors ${targetPeriod === "second" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100"}`}
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
            className={`p-4 rounded-xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 
              ${shift.isWorking ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            {/* 左側：チェックボックスと日付 */}
            <label className="flex items-center space-x-3 cursor-pointer w-40">
              <input
                type="checkbox"
                checked={shift.isWorking}
                onChange={(e) => updateShift(index, "isWorking", e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded cursor-pointer"
              />
              <span className={`font-bold text-lg ${shift.isWorking ? "text-blue-700" : "text-gray-600"}`}>
                {shift.displayDate}
              </span>
            </label>

            {/* 右側：時間入力 */}
            {shift.isWorking ? (
              <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border border-blue-100">
                <input
                  type="time"
                  value={shift.startTime}
                  onChange={(e) => updateShift(index, "startTime", e.target.value)}
                  className="p-1 outline-none text-gray-700 font-medium"
                />
                <span className="text-gray-400">〜</span>
                <input
                  type="time"
                  value={shift.endTime}
                  onChange={(e) => updateShift(index, "endTime", e.target.value)}
                  className="p-1 outline-none text-gray-700 font-medium"
                />
              </div>
            ) : (
              <span className="text-gray-400 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full border">
                出勤不可
              </span>
            )}
          </div>
        ))}

        <div className="pt-6 mt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:bg-gray-400"
          >
            {loading ? "送信中..." : `${targetMonth}月${targetPeriod === "first" ? "前半" : "後半"}のシフトを提出`}
          </button>
        </div>
      </form>
    </div>
  );
}