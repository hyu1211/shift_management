"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const routeByRole = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile?.full_name?.trim()) {
        router.replace("/setup-profile");
        return;
      }

      if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      router.replace("/teacher");
    };

    routeByRole();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 via-slate-50 to-zinc-100/80 p-10 text-zinc-500">
      読み込み中...
    </div>
  );
}
