"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/common/Button";

export default function LogoutButton() {
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("ログアウトエラー:", error.message);
      showToast("ログアウトに失敗しました", "error");
    } else {
      router.push("/login");
    }
  };

  return (
    <Button variant="outline-danger" onClick={handleLogout}>
      ログアウト
    </Button>
  );
}
