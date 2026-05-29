"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/common/LogoutButton";
import { supabase } from "@/lib/supabase";

type DashboardShellProps = {
  mode: "teacher" | "admin";
  children: React.ReactNode;
};

export default function DashboardShell({ mode, children }: DashboardShellProps) {
  const pathname = usePathname();
  const homePath = mode === "teacher" ? "/teacher" : "/admin";
  const isHome = pathname === homePath;
  const isWideAdmin = mode === "admin" && pathname.startsWith("/admin/shifts");

  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.full_name?.trim()) {
        setFullName(profile.full_name.trim());
      }
    };

    loadProfile();
  }, []);

  const menuTitle = mode === "teacher" ? "講師用メニュー" : "管理者用メニュー";
  const roleLabel = mode === "teacher" ? "講師" : "管理者";

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-6 md:p-8 text-zinc-800">
      <div
        className={`mx-auto space-y-6 md:space-y-8 ${isWideAdmin ? "max-w-5xl" : "max-w-2xl"}`}
      >
        <header className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
          {!isHome && (
            <Link
              href={homePath}
              className="mb-4 inline-flex items-center text-sm font-medium tracking-wide text-zinc-500 transition-all duration-300 hover:text-zinc-700"
            >
              <span className="mr-2">←</span>
              {menuTitle}に戻る
            </Link>
          )}

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{roleLabel}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-wide text-zinc-800">
                {fullName ?? menuTitle}
              </h1>
              {fullName && (
                <p className="mt-1 text-sm text-zinc-500">{menuTitle}</p>
              )}
            </div>
            <LogoutButton />
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}
