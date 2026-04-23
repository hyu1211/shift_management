"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/LogoutButton";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        // 1. ログインチェック
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        // 2. プロフィールと権限チェック
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError || !profile?.full_name) {
          router.push("/setup-profile");
          return;
        }

        if (profile?.role === "admin") {
          router.push("/admin"); // 管理者なら管理者画面へ
          return;
        }

        // スタッフならこのままホームを表示
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) return <div className="p-10 text-center">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">講師用メニュー</h1>
          <LogoutButton />
        </div>

        <div className="grid gap-4">
          {/* シフト提出ボタン */}
          <button
            onClick={() => router.push("/submit")} 
            className="p-6 bg-white border-2 border-blue-500 rounded-xl shadow-sm hover:bg-blue-50 transition-all text-left"
          >
            <div className="text-blue-500 font-bold text-lg">📅 シフトを提出する</div>
            <p className="text-gray-500 text-sm">来週以降の希望シフトを入力します</p>
          </button>

          {/* シフト確認ボタン（今はまだ空でOK） */}
          <button
            onClick={() => router.push("/my-shifts")}
            className="p-6 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-left"
          >
            <div className="text-gray-700 font-bold text-lg">🔍 シフトを確認する</div>
            <p className="text-gray-500 text-sm">確定したシフト一覧を表示します</p>
          </button>
        </div>
      </div>
    </main>
  );
}