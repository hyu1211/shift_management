"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < MIN_PASSWORD_LENGTH) {
      showToast(`パスワードは${MIN_PASSWORD_LENGTH}文字以上で入力してください。`, "error");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      showToast("パスワードを再設定しました。ログインしてください。");
      router.push("/login");
    } catch (error: unknown) {
      showToast(`パスワードの再設定に失敗しました: ${getErrorMessage(error)}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 flex items-center justify-center p-6 md:p-8">
      <div className="max-w-md w-full rounded-3xl border border-white/70 bg-white/80 p-8 md:p-10 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Shift App</p>
          <h2 className="text-3xl font-semibold tracking-wide text-zinc-800">
            パスワード再設定
          </h2>
          <p className="text-sm text-zinc-500">新しいパスワードを入力してください</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-zinc-600">
              新しいパスワード (6文字以上)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={MIN_PASSWORD_LENGTH}
              className="w-full rounded-xl border border-zinc-200 bg-white/90 p-3 text-zinc-700 outline-none transition-all duration-500 placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
              required
            />
          </div>

          <Button type="submit" variant="primary" fullWidth disabled={submitting}>
            {submitting ? "設定中..." : "パスワードを更新する"}
          </Button>
        </form>
      </div>
    </div>
  );
}
