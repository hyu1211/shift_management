"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetupProfilePage() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. 現在ログインしているユーザーのIDを取得
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert("セッションが切れました。再度ログインしてください。");
      router.push("/login");
      return;
    }

    // 2. profilesテーブルの該当ユーザーの名前を更新（または作成）
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,        // 認証IDと紐付け
        full_name: fullName, // 入力された名前
        updated_at: new Date(),
      });

    if (error) {
      console.error(error);
      alert("エラーが発生しました");
    } else {
      alert("プロフィールを設定しました！");
      router.push("/"); // ホーム画面へ移動
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">ようこそ！</h1>
          <p className="text-gray-500 mt-2">あなたの名前を教えてください</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              氏名（フルネーム）
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="例：原田 友"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-lg"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !fullName}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg disabled:bg-gray-300"
          >
            {loading ? "保存中..." : "利用を開始する"}
          </button>
        </form>
      </div>
    </main>
  );
}