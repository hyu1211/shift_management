"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import LogoutButton from "@/components/common/LogoutButton";

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile || profileError || !profile.full_name?.trim()) {
          router.push("/setup-profile");
          return;
        }

        if (profile?.role === "admin") {
          router.push("/admin");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  if (loading) return <div className="p-10 text-center text-zinc-500">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-6 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Teacher Dashboard</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-wide text-zinc-800">講師用メニュー</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="grid gap-4 md:gap-5">
          <button
            onClick={() => router.push("/submit")}
            className="group rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
          >
            <div className="text-zinc-800 font-semibold tracking-wide text-lg">📅 シフトを提出する</div>
            <p className="mt-1 text-zinc-500 text-sm">来週以降の希望シフトを入力します</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-400 transition-all duration-500 group-hover:text-zinc-600">
              Submit Availability
            </p>
          </button>

          <button
            onClick={() => router.push("/my-shifts")}
            className="group rounded-3xl border border-white/70 bg-white/85 p-6 text-left shadow-xl shadow-zinc-200/40 backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-zinc-200/60"
          >
            <div className="text-zinc-800 font-semibold tracking-wide text-lg">🔍 シフトを確認する</div>
            <p className="mt-1 text-zinc-500 text-sm">確定したシフト一覧を表示します</p>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-zinc-400 transition-all duration-500 group-hover:text-zinc-600">
              View Confirmed Shifts
            </p>
          </button>
        </div>
      </div>
    </main>
  );
}
