"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトエラー:", error.message);
      alert("ログアウトに失敗しました");
    } else {
      router.push("/login");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-red-200 bg-white/90 px-4 py-2 text-sm font-medium tracking-wide text-red-600 transition-all duration-300 hover:border-red-300 hover:bg-red-50"
    >
      ログアウト
    </button>
  );
}
