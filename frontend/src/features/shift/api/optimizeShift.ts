"use server";

import { createClient } from "@/lib/supabase/server";
import { assertAdmin } from "@/lib/serverAuth";

export type OptimizedScheduleItem = {
  lessonId: string;
  time: string | null | undefined;
  period: number;
  subject: string;
  studentName: string | null | undefined;
  assignedInstructorId: string | null;
  assignedInstructorName: string;
  isAlert: boolean;
  currentAssignedInstructorId: string | null;
};

export type OptimizeShiftResult =
  | { success: true; schedule: OptimizedScheduleItem[] }
  | { success: false; message: string };

function toHHmm(time: string | null | undefined): string | null {
  return time ? time.slice(0, 5) : null;
}

export async function generateOptimizedShift(
  targetDate: string,
): Promise<OptimizeShiftResult> {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  const supabase = await createClient();

  const { data: lessons, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("lesson_date", targetDate);

  if (lessonError) {
    console.error(lessonError);
    return {
      success: false,
      message: "授業データの取得に失敗しました。",
    };
  }

  const { data: shifts, error: shiftError } = await supabase
    .from("shifts")
    .select("user_id, start_time, end_time")
    .eq("shift_date", targetDate)
    .eq("is_working", true);

  if (shiftError) {
    console.error(shiftError);
    return {
      success: false,
      message: "シフトデータの取得に失敗しました。",
    };
  }

  const availabilityByUserId = new Map(
    (shifts ?? []).map((s) => [s.user_id, s]),
  );
  const workingUserIds = Array.from(availabilityByUserId.keys());

  let profiles: { id: string; full_name: string | null; subject: string | null }[] =
    [];
  if (workingUserIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, subject")
      .in("id", workingUserIds)
      .neq("role", "admin");

    if (profileError) {
      console.error(profileError);
      return {
        success: false,
        message: "講師情報の取得に失敗しました。",
      };
    }

    profiles = profileData ?? [];
  }

  if (!lessons || lessons.length === 0) {
    return {
      success: false,
      message: `${targetDate} の授業データが0件です。授業を登録してから再度お試しください。`,
    };
  }

  if (profiles.length === 0) {
    return {
      success: false,
      message: `${targetDate} にシフトを出している講師がいません。`,
    };
  }

  const dummyId = "DUMMY_INSTRUCTOR";

  const instructorsPayload = profiles.map((p) => {
    const availability = availabilityByUserId.get(p.id);
    return {
      id: p.id,
      subject: p.subject,
      available_start: toHHmm(availability?.start_time),
      available_end: toHHmm(availability?.end_time),
    };
  });
  instructorsPayload.push({
    id: dummyId,
    subject: null,
    available_start: null,
    available_end: null,
  });

  const classesPayload = lessons.map((lesson) => ({
    id: lesson.id,
    period: lesson.period,
    subject: lesson.subject,
    start_time: toHHmm(lesson.start_time),
  }));

  const apiUrl =
    process.env.OPTIMIZE_API_URL ?? "http://127.0.0.1:8000/api/optimize";
  const apiKey = process.env.OPTIMIZE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      message: "OPTIMIZE_API_KEY が設定されていません。サーバーの環境変数を確認してください。",
    };
  }

  let response: Response;
  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        instructors: instructorsPayload,
        classes: classesPayload,
        dummy_instructor: dummyId,
      }),
    });
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message:
        "最適化APIに接続できません。api/ で uvicorn main:app --reload を起動してください。",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      message: `最適化APIがエラーを返しました（${response.status}）。`,
    };
  }

  const result = await response.json();

  if (result.status === "infeasible") {
    return {
      success: false,
      message: "条件が厳しすぎます。シフトを組めませんでした。",
    };
  }

  const formattedSchedule: OptimizedScheduleItem[] = result.schedule.map(
    (item: {
      class_id: string;
      assigned_instructor: string;
      is_unassigned: boolean;
    }) => {
      const targetLesson = lessons.find(
        (l) => String(l.id) === String(item.class_id),
      );

      let instructorName = "未配置（担当者なし）";
      if (!item.is_unassigned) {
        const targetProfile = profiles.find(
          (p) => p.id === item.assigned_instructor,
        );
        instructorName = targetProfile?.full_name ?? "不明な講師";
      }

      return {
        lessonId: item.class_id,
        time: targetLesson?.start_time,
        period: targetLesson?.period,
        subject: targetLesson?.subject,
        studentName: targetLesson?.student_name,
        assignedInstructorId: item.is_unassigned ? null : item.assigned_instructor,
        assignedInstructorName: instructorName,
        isAlert: item.is_unassigned,
        currentAssignedInstructorId: targetLesson?.assigned_user_id ?? null,
      };
    },
  );

  return { success: true, schedule: formattedSchedule };
}
