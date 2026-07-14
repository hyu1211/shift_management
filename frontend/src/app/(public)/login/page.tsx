"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";

const MIN_PASSWORD_LENGTH = 6;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin && password.length < MIN_PASSWORD_LENGTH) {
      showToast(`パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`, "error");
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        showToast("ログインしました！");
        router.push("/");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;

        if (!data.session) {
          showToast("確認メールを送信しました。メール認証後にログインしてください。");
          setIsLogin(true);
          return;
        }

        showToast("ユーザー登録が完了しました！");
        router.push("/setup-profile");
      }
    } catch (error: unknown) {
      showToast(`エラー: ${getErrorMessage(error)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast("メールアドレスを入力してください。", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      showToast("パスワード再設定用のメールを送信しました。");
    } catch (error: unknown) {
      showToast(`エラー: ${getErrorMessage(error)}`, "error");
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
                className="w-full rounded-xl border border-zinc-200 bg-white/90 p-3 pr-16 text-zinc-700 outline-none transition-all duration-500 placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                required
              />
              <Button
                variant="ghost"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? "隠す" : "表示"}
              </Button>
            </div>
          </div>

          {isLogin && (
            <div className="text-right">
              <Button variant="ghost" onClick={handleForgotPassword}>
                パスワードをお忘れですか？
              </Button>
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? "処理中..." : isLogin ? "ログインする" : "登録してはじめる"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "アカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
          </Button>
        </div>
      </div>
    </div>
  );
}
