"use server";

import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/serverAuth";
import type { StudentInput } from "@/types/student";

type ActionResult = { success: true } | { success: false; message: string };

export async function createStudent(input: StudentInput): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase.from("students").insert({
    name: input.name.trim(),
    grade: input.grade,
    school: input.school?.trim() || null,
    note: input.note?.trim() || null,
  });

  if (error) {
    console.error(error);
    return { success: false, message: "生徒の登録に失敗しました。" };
  }

  return { success: true };
}

export async function updateStudent(
  studentId: string,
  input: StudentInput,
): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({
      name: input.name.trim(),
      grade: input.grade,
      school: input.school?.trim() || null,
      note: input.note?.trim() || null,
    })
    .eq("id", studentId);

  if (error) {
    console.error(error);
    return { success: false, message: "生徒情報の更新に失敗しました。" };
  }

  return { success: true };
}

export async function deleteStudent(studentId: string): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", studentId);

  if (error) {
    console.error(error);
    return { success: false, message: "生徒の削除に失敗しました。" };
  }

  return { success: true };
}
