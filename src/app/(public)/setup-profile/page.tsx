"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetupProfilePage() {
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const guardAlreadySetup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && profile?.full_name?.trim()) {
        router.replace("/");
      }
    };

    guardAlreadySetup();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        alert("氏名を入力してください。");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        alert("セッションが切れました。再度ログインしてください。");
        router.push("/login");
        return;
      }

      const { data: existingProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (profileFetchError) {
        throw profileFetchError;
      }

      const payload = {
        id: user.id,
        full_name: trimmedName,
      };

      const { error } = existingProfile
        ? await supabase.from("profiles").update(payload).eq("id", user.id)
        : await supabase.from("profiles").insert(payload);

      if (error) {
        console.error("プロフィール保存エラー(生データ):", error);
        const message = error.message || "RLSポリシーまたはprofilesテーブル設定を確認してください";
        alert(`プロフィール保存に失敗しました: ${message}`);
      } else {
        alert("プロフィールを設定しました！");
        router.push("/");
      }
    } catch (error: any) {
      console.error("プロフィール保存例外:", error);
      alert(`プロフィール保存に失敗しました: ${error?.message ?? "不明なエラー"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 flex items-center justify-center p-6 md:p-8">
      <div className="max-w-md w-full rounded-3xl border border-white/70 bg-white/80 p-8 md:p-10 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <div className="mb-8 text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Profile Setup</p>
          <h1 className="text-3xl font-semibold tracking-wide text-zinc-800">ようこそ！</h1>
          <p className="text-sm text-zinc-500 mt-2">あなたの名前を教えてください</p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-zinc-600">氏名（フルネーム）</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder=""
              className="w-full rounded-xl border border-zinc-200 bg-white/90 p-4 text-lg text-zinc-700 outline-none transition-all duration-500 placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !fullName.trim()}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-800 py-4 text-sm font-semibold tracking-wide text-white shadow-lg shadow-zinc-300/50 transition-all duration-500 hover:-translate-y-0.5 hover:bg-zinc-700 disabled:translate-y-0 disabled:border-zinc-300 disabled:bg-zinc-300"
          >
            {loading ? "保存中..." : "利用を開始する"}
          </button>
        </form>
      </div>
    </main>
  );
}
