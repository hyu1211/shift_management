"use client";

import { useState, useEffect, useId } from "react";
import { supabase } from "@/lib/supabase"; // 接続用クライアントをインポート
import { useRouter } from "next/navigation"; // 画面を移動させるための機能

const daysOfWeek = ["月", "火", "水", "木", "金", "土", "日"];

export default function ShiftForm() {
  //ログイン中のユーザーIDを保存する場所
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const [shifts, setShifts] = useState(
    daysOfWeek.map((day) => ({
      day,
      isWorking: false,
      startTime: "17:00",
      endTime: "22:00",
    }))
  );

  // ページを開いた時にSupabaseからデータを取得する処理
  useEffect(() => {
    const checkUserAndFetchShifts = async () => {
      try {
        // 1. 今ログインしているユーザーの情報を取得
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // もしログインしていなければ、強制的にログイン画面へ飛ばす
          router.push("/login");
          return;
        }

        // ユーザーIDをセット
        setUserId(user.id);

        // 2. 「自分の user_id」のデータだけを取得する！
        const { data, error } = await supabase
          .from("shifts")
          .select("*")
          .eq("user_id", user.id); // 👈 ここが最重要フィルター！
        
        if (error) throw error;

        if (data && data.length > 0) {
          const loadedShifts = daysOfWeek.map((day) => {
            const savedData = data.find((d) => d.day === day);
            if (savedData) {
              return {
                day: day,
                isWorking: savedData.is_working,
                startTime: savedData.start_time || "17:00",
                endTime: savedData.end_time || "22:00",
              };
            }
            return { day, isWorking: false, startTime: "17:00", endTime: "22:00" };
          });
          setShifts(loadedShifts);
        }
      } catch (error) {
        console.error("取得エラー:", error);
      }
    };

    checkUserAndFetchShifts();
  }, [router]);

  const toggleWorking = (index: number) => {
    const newShifts = [...shifts];
    newShifts[index].isWorking = !newShifts[index].isWorking;
    setShifts(newShifts);
  };

  const handleTimeChange = (index: number, field: "startTime" | "endTime", value: string) => {
    const newShifts = [...shifts];
    newShifts[index][field] = value;
    setShifts(newShifts);
  };

  // --- ここからが Supabase への保存処理 ---
  const handleSubmit = async () => {
// 💡 デバッグ用：今の userId をコンソールに表示
  console.log("現在のログインユーザーID:", userId);

    if (!userId) {
      alert("ユーザーIDが取得できていません。一度ログアウトしてログインし直してください。");
      return;
    }
    try {
      // データベースのテーブル定義に合わせてデータを整形
      const dataToSave = shifts.map((shift) => ({
        day: shift.day,
        is_working: shift.isWorking,
        start_time: shift.isWorking ? shift.startTime : null,
        end_time: shift.isWorking ? shift.endTime : null,
        user_id: userId,
      }));

      const { error } = await supabase
        .from("shifts") // テーブル名
        .upsert(dataToSave, { onConflict: "day" }); // "day" が重なったら更新する設定

      if (error) throw error;

      alert("Supabaseにシフトを保存しました！");
    } catch (error: any) {
      // エラーの中身を強制的に文字列にして全て表示する
      console.error("保存エラー詳細:", JSON.stringify(error, null, 2));
      console.error("エラーメッセージ:", error.message);
      alert(`保存に失敗しました: ${error.message || "コンソールを確認してください"}`);
    }
  };
  // --- ここまで ---

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">希望シフト提出</h1>
        <div className="space-y-4">
          {shifts.map((shift, index) => (
            <div key={shift.day} className="border-b border-gray-100 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-medium text-gray-700">{shift.day}曜日</span>
                <button
                  onClick={() => toggleWorking(index)}
                  className={`px-4 py-1 rounded-full text-sm font-semibold transition-colors ${
                    shift.isWorking ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {shift.isWorking ? "出勤" : "休み"}
                </button>
              </div>
              {shift.isWorking && (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="time"
                    value={shift.startTime}
                    onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-gray-500">〜</span>
                  <input
                    type="time"
                    value={shift.endTime}
                    onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                    className="border border-gray-300 rounded-md p-2 text-sm w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            シフトを提出する
          </button>
        </div>
      </div>
    </div>
  );
}