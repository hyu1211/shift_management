"use server";

import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/serverAuth";

type ActionResult = { success: true } | { success: false; message: string };

export async function updateTeacherSubjects(
  teacherId: string,
  subjects: string[],
): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ teachable_subjects: subjects })
    .eq("id", teacherId);

  if (error) {
    console.error(error);
    return { success: false, message: "担当教科の更新に失敗しました。" };
  }

  return { success: true };
}
