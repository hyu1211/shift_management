"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Supabaseからログアウト
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error("ログアウトエラー:", error.message);
      alert("ログアウトに失敗しました");
    } else {
      // 成功したらログイン画面に強制移動
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
    >
      ログアウト
    </button>
  );
}