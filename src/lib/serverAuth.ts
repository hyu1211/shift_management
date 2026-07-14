import { createClient } from "@/lib/supabase/server";

export type AdminGuardError = { success: false; message: string };

export async function assertAdmin(): Promise<AdminGuardError | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "ログインが必要です。" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { success: false, message: "管理者のみ操作できます。" };
  }

  return null;
}
