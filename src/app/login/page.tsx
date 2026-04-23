"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation"; // 画面遷移のための機能

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); // ログインモードか新規登録モードか
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // ログイン処理
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert("ログインしました！");
        router.push("/");
      } else {
        // 新規登録処理
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        // メール確認が必要な設定の場合はセッションが作られない
        if (!data.session) {
          alert("確認メールを送信しました。メール認証後にログインしてください。");
          setIsLogin(true);
          return;
        }

        alert("ユーザー登録が完了しました！");
        router.push("/setup-profile");
      }
    } catch (error: any) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          {isLogin ? "ログイン" : "新規登録"}
        </h2>
        <form onSubmit={handleAuth} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード (6文字以上)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isLogin ? "ログインする" : "登録してはじめる"}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:underline text-sm"
          >
            {isLogin ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
          </button>
        </div>
      </div>
    </div>
  );
}