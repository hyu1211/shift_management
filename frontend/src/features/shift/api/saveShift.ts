// src/features/shift/api/saveShift.ts
"use server";

import { createClient } from '@/lib/supabase/server';
import { assertAdmin } from '@/lib/serverAuth';
import type { OptimizedScheduleItem } from './optimizeShift';

export async function saveAssignedShift(scheduleItems: OptimizedScheduleItem[]) {
  const adminError = await assertAdmin();
  if (adminError) return adminError;

  // サーバー側でSupabaseクライアントを初期化
  const supabase = await createClient();

  try {
    // 受け取ったAIの割り当て結果を一つずつループして、lessonsテーブルを更新する
    for (const item of scheduleItems) {
      // 未配置（ダミー）の場合は null をセットして空き枠として保存
      const assignedId = item.assignedInstructorId || null;

      const { error } = await supabase
        .from('lessons')
        .update({ assigned_user_id: assignedId })
        .eq('id', item.lessonId);

      if (error) {
        console.error(`授業ID ${item.lessonId} の更新中にエラー発生:`, error);
        throw error; // エラーが起きたら中断してcatchブロックへ
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error("シフト保存エラー:", error);
    return { success: false, message: "データベースへの保存に失敗しました。" };
  }
}