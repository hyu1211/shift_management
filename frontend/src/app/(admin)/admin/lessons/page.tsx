"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { deleteLesson } from "@/features/lesson/api/lessonActions";
import LessonForm from "@/features/lesson/components/LessonForm";
import { formatShiftDate } from "@/features/shift/lib/period";
import YearMonthSelect from "@/features/shift/components/YearMonthSelect";
import { useToast } from "@/components/common/Toast";
import { useConfirm } from "@/components/common/ConfirmDialog";
import Button from "@/components/common/Button";
import { TrashIcon } from "@/components/common/icons";
import type { Lesson } from "@/types/lesson";

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(year, month - 1, day).getDay()
  ];
  return `${month}/${day}（${weekday}）`;
}

function formatTime(time: string | null) {
  if (!time) return "—";
  return time.slice(0, 5);
}

export default function AdminLessonsPage() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const defaultDate = formatShiftDate(targetYear, targetMonth, 1);

  const fetchLessons = useCallback(async () => {
    setLoading(true);

    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const startDate = formatShiftDate(targetYear, targetMonth, 1);
    const endDate = formatShiftDate(targetYear, targetMonth, lastDay);

    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .gte("lesson_date", startDate)
      .lte("lesson_date", endDate)
      .order("lesson_date", { ascending: true })
      .order("period", { ascending: true });

    if (error) {
      console.error(error);
      setLessons([]);
    } else {
      setLessons((data ?? []) as Lesson[]);
    }

    setLoading(false);
  }, [targetMonth, targetYear]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons, reloadKey]);

  const lessonsByDate = useMemo(() => {
    const grouped = new Map<string, Lesson[]>();
    for (const lesson of lessons) {
      const items = grouped.get(lesson.lesson_date) ?? [];
      items.push(lesson);
      grouped.set(lesson.lesson_date, items);
    }
    return grouped;
  }, [lessons]);

  const handleDelete = async (lessonId: string) => {
    const confirmed = await confirm("この授業を削除しますか？");
    if (!confirmed) return;

    setDeletingId(lessonId);
    const result = await deleteLesson(lessonId);
    setDeletingId(null);

    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    setReloadKey((key) => key + 1);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">
          授業登録
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          自動割り当てに使う授業予定を登録・管理します
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/70 bg-white/75 p-6 shadow-xl shadow-zinc-200/40 backdrop-blur-md">
        <YearMonthSelect
          year={targetYear}
          month={targetMonth}
          yearOptions={yearOptions}
          onYearChange={setTargetYear}
          onMonthChange={setTargetMonth}
        />
        <span className="text-sm text-zinc-500">登録済み: {lessons.length}件</span>
      </div>

      <LessonForm
        defaultDate={defaultDate}
        onCreated={() => setReloadKey((key) => key + 1)}
      />

      {loading ? (
        <p className="rounded-2xl border border-zinc-100 bg-zinc-50/70 py-10 text-center text-sm font-medium text-zinc-400">
          読み込み中...
        </p>
      ) : lessons.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-10 text-center text-sm font-medium text-zinc-400">
          {targetYear}年{targetMonth}月の授業はまだ登録されていません
        </p>
      ) : (
        <div className="grid gap-6">
          {Array.from(lessonsByDate.entries()).map(([date, dateLessons]) => (
            <section
              key={date}
              className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-zinc-200/40 backdrop-blur-md"
            >
              <div className="border-b border-zinc-100/90 bg-zinc-50/70 px-6 py-4">
                <span className="text-base font-semibold tracking-wide text-zinc-700">
                  {formatDisplayDate(date)}
                </span>
                <span className="ml-3 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium text-zinc-500">
                  {dateLessons.length}件
                </span>
              </div>

              <div className="divide-y divide-zinc-100">
                {dateLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">
                          {lesson.period}限
                        </span>
                        <span className="text-sm font-semibold text-zinc-800">
                          {lesson.subject}
                        </span>
                        <span className="text-sm text-zinc-500">
                          {lesson.student_name}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">
                        開始: {formatTime(lesson.start_time)}
                      </p>
                    </div>

                    <Button
                      variant="outline-danger"
                      onClick={() => handleDelete(lesson.id)}
                      disabled={deletingId === lesson.id}
                      className="inline-flex items-center gap-1.5"
                    >
                      <TrashIcon className="h-4 w-4" />
                      {deletingId === lesson.id ? "削除中..." : "削除"}
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
