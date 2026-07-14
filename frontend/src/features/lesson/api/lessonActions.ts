"use server";

import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/serverAuth";
import type { CreateLessonInput } from "@/types/lesson";

type ActionResult = { success: true } | { success: false; message: string };

export async function createLesson(input: CreateLessonInput): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  if (input.period < 1 || input.period > 8) {
    return { success: false, message: "時限は1〜8の範囲で指定してください。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").insert({
    lesson_date: input.lesson_date,
    period: input.period,
    subject: input.subject.trim(),
    student_name: input.student_name.trim(),
    start_time: input.start_time?.trim() || null,
  });

  if (error) {
    console.error(error);
    return { success: false, message: "授業の登録に失敗しました。" };
  }

  return { success: true };
}

export async function deleteLesson(lessonId: string): Promise<ActionResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);

  if (error) {
    console.error(error);
    return { success: false, message: "授業の削除に失敗しました。" };
  }

  return { success: true };
}
