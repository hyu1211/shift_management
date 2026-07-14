"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatShiftDate } from "@/features/shift/lib/period";
import YearMonthSelect from "@/features/shift/components/YearMonthSelect";
import UnassignedAlertBanner from "@/features/shift/components/UnassignedAlertBanner";
import { AlertTriangleIcon, UserIcon } from "@/components/common/icons";
import type { Lesson } from "@/types/lesson";

type ConfirmedLesson = Lesson & {
  assigned_user: { full_name: string | null } | null;
};

function formatDisplayDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const weekday = ["日", "月", "火", "水", "木", "金", "土"][
    new Date(year, month - 1, day).getDay()
  ];
  return `${month}/${day}（${weekday}）`;
}

export default function AdminConfirmedShiftsPage() {
  const today = new Date();
  const currentYear = today.getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

  const [targetYear, setTargetYear] = useState(currentYear);
  const [targetMonth, setTargetMonth] = useState(today.getMonth() + 1);
  const [lessons, setLessons] = useState<ConfirmedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLessons = useCallback(async () => {
    setLoading(true);

    const lastDay = new Date(targetYear, targetMonth, 0).getDate();
    const startDate = formatShiftDate(targetYear, targetMonth, 1);
    const endDate = formatShiftDate(targetYear, targetMonth, lastDay);

    const { data, error } = await supabase
      .from("lessons")
      .select("*, assigned_user:profiles(full_name)")
      .gte("lesson_date", startDate)
      .lte("lesson_date", endDate)
      .order("lesson_date", { ascending: true })
      .order("period", { ascending: true });

    if (error) {
      console.error(error);
      setLessons([]);
    } else {
      setLessons((data ?? []) as unknown as ConfirmedLesson[]);
    }

    setLoading(false);
  }, [targetMonth, targetYear]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const lessonsByDate = useMemo(() => {
    const grouped = new Map<string, ConfirmedLesson[]>();
    for (const lesson of lessons) {
      const items = grouped.get(lesson.lesson_date) ?? [];
      items.push(lesson);
      grouped.set(lesson.lesson_date, items);
    }
    return grouped;
  }, [lessons]);

  const unassignedItems = useMemo(
    () =>
      lessons
        .filter((lesson) => !lesson.assigned_user_id)
        .map((lesson) => ({
          id: `lesson-${lesson.id}`,
          label: `${formatDisplayDate(lesson.lesson_date)} ${lesson.period}限 ${lesson.subject} - ${lesson.student_name}`,
        })),
    [lessons],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md">
        <h2 className="text-2xl font-semibold tracking-wide text-zinc-800">確定シフト</h2>
        <p className="mt-1 text-sm text-zinc-500">
          確定済みの授業担当割り当てを月単位で確認します（閲覧専用）
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
        <span className="text-sm text-zinc-500">対象授業: {lessons.length}件</span>
      </div>

      {!loading && <UnassignedAlertBanner items={unassignedItems} />}

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

              <div className="grid grid-cols-1 gap-3 p-5 md:p-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                  const lessonsInPeriod = dateLessons.filter((lesson) => lesson.period === p);
                  if (lessonsInPeriod.length === 0) return null;

                  return (
                    <div
                      key={p}
                      className="flex overflow-hidden rounded-r-xl border-l-4 border-blue-400 bg-white shadow-sm"
                    >
                      <div className="flex w-16 shrink-0 flex-col items-center justify-center border-r border-blue-100 bg-blue-50/50">
                        <span className="text-xl font-black text-blue-700">{p}</span>
                        <span className="text-[10px] font-bold uppercase text-blue-600">限</span>
                      </div>

                      <div className="flex min-h-[70px] flex-1 flex-wrap items-center gap-3 p-3">
                        {lessonsInPeriod.map((lesson) => {
                          const isAlert = !lesson.assigned_user_id;
                          return (
                            <div
                              key={lesson.id}
                              id={`lesson-${lesson.id}`}
                              className={`min-w-[180px] scroll-mt-6 rounded-lg border p-3 ${
                                isAlert
                                  ? "border-red-200 bg-red-50"
                                  : "border-emerald-200 bg-emerald-50/50"
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between">
                                <span className="text-sm font-bold text-zinc-700">
                                  {lesson.subject}
                                </span>
                                <span className="rounded border border-zinc-200 bg-white px-2 py-0.5 text-[10px] text-zinc-500">
                                  {lesson.student_name}
                                </span>
                              </div>
                              <div
                                className={`flex items-center gap-1.5 text-sm font-black ${
                                  isAlert ? "text-red-600" : "text-emerald-700"
                                }`}
                              >
                                {isAlert ? (
                                  <>
                                    <AlertTriangleIcon className="h-4 w-4" />
                                    未配置
                                  </>
                                ) : (
                                  <>
                                    <UserIcon className="h-4 w-4" />
                                    {lesson.assigned_user?.full_name ?? "不明な講師"}
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
