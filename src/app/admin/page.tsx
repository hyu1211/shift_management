"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

export default function AdminDashboard() {
  const [allData, setAllData] = useState<any[]>([]);
  const days = ["月", "火", "水", "木", "金", "土", "日"];

  useEffect(() => {
    const fetchAllShifts = async () => {
      // 1. 講師一覧(profiles)とシフト(shifts)を一度に取得（リレーションを利用）
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          full_name,
          shifts (
            day,
            is_working,
            start_time,
            end_time
          )
        `);

if (error) {
        // 💡 エラーの中身を強制的に文字列にして全て表示する
        console.error("データ取得エラー詳細:", JSON.stringify(error, null, 2));
        console.error("エラーメッセージ:", error.message);
        alert(`データ取得に失敗しました: ${error.message}`);
      } else {
        setAllData(data || []);
      }
    };

    fetchAllShifts();
  }, []);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">全体シフト一覧（管理者用）</h1>
      
      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                講師名
              </th>
              {days.map(day => (
                <th key={day} className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allData.map((profile, i) => (
              <tr key={i}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap font-bold">{profile.full_name || "未設定"}</p>
                </td>
                {days.map(day => {
                  const shift = profile.shifts?.find((s: any) => s.day === day);
                  return (
                    <td key={day} className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">
                      {shift?.is_working ? (
                        <div className="text-blue-600 font-medium">
                          {shift.start_time?.slice(0, 5)} - {shift.end_time?.slice(0, 5)}
                        </div>
                      ) : (
                        <span className="text-gray-300">ー</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <LogoutButton/>
    </div>
  );
}