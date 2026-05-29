"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthGuardProps = {
  children: React.ReactNode;
  mode: "teacher" | "admin";
};

export default function AuthGuard({ children, mode }: AuthGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
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

      if (mode === "admin") {
        if (profile.role !== "admin") {
          router.replace("/teacher");
          return;
        }
      } else if (profile.role === "admin") {
        router.replace("/admin");
        return;
      }

      setReady(true);
    };

    check();
  }, [mode, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-zinc-500">
        読み込み中...
      </div>
    );
  }

  return <>{children}</>;
}
