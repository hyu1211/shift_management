"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert("ログインしました！");
        router.push("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (!data.session) {
          alert("確認メールを送信しました。メール認証後にログインしてください。");
          setIsLogin(true);
          return;
        }

        alert("ユーザー登録が完了しました！");
        router.push("/setup-profile");
      }
    } catch (error: unknown) {
      alert(`エラー: ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 flex items-center justify-center p-6 md:p-8">
      <div className="max-w-md w-full rounded-3xl border border-white/70 bg-white/80 p-8 md:p-10 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Shift App</p>
          <h2 className="text-3xl font-semibold tracking-wide text-zinc-800">
            {isLogin ? "ログイン" : "新規登録"}
          </h2>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-zinc-600">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/90 p-3 text-zinc-700 outline-none transition-all duration-500 placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-zinc-600">パスワード (6文字以上)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white/90 p-3 text-zinc-700 outline-none transition-all duration-500 placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-800 py-3.5 px-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-zinc-300/50 transition-all duration-500 hover:-translate-y-0.5 hover:bg-zinc-700"
          >
            {isLogin ? "ログインする" : "登録してはじめる"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium tracking-wide text-zinc-500 transition-all duration-300 hover:text-zinc-700"
          >
            {isLogin ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
          </button>
        </div>
      </div>
    </div>
  );
}
