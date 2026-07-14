"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { createLesson } from "@/features/lesson/api/lessonActions";
import { ALL_SUBJECTS } from "@/features/teacher/lib/subjects";
import { getErrorMessage } from "@/lib/errors";
import Button from "@/components/common/Button";
import type { Student } from "@/types/student";

type LessonFormProps = {
  defaultDate: string;
  onCreated: () => void;
};

const PERIOD_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export default function LessonForm({ defaultDate, onCreated }: LessonFormProps) {
  const [lessonDate, setLessonDate] = useState(defaultDate);
  const [period, setPeriod] = useState(1);
  const [subject, setSubject] = useState("");
  const [studentName, setStudentName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    setLessonDate(defaultDate);
  }, [defaultDate]);

  useEffect(() => {
    const loadStudents = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }
      setStudents((data ?? []) as Student[]);
    };

    loadStudents();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await createLesson({
        lesson_date: lessonDate,
        period,
        subject,
        student_name: studentName,
        start_time: startTime || null,
      });

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setSubject("");
      setStudentName("");
      setStartTime("");
      setSuccessMessage("授業を登録しました。");
      onCreated();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur-md"
    >
      <div>
        <h3 className="text-lg font-semibold tracking-wide text-zinc-800">
          授業を登録
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          自動割り当てで使う授業データを追加します
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            授業日
          </span>
          <input
            type="date"
            required
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            className={inputClassName}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            時限
          </span>
          <select
            required
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className={inputClassName}
          >
            {PERIOD_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}限
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            科目
          </span>
          <select
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClassName}
          >
            <option value="" disabled>
              選択してください
            </option>
            {ALL_SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            生徒名
          </span>
          {students.length > 0 ? (
            <select
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className={inputClassName}
            >
              <option value="" disabled>
                選択してください
              </option>
              {students.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}（{s.grade}）
                </option>
              ))}
            </select>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-4 py-2.5 text-xs text-zinc-400">
              生徒が未登録です。先に「生徒情報」ページで登録してください。
            </p>
          )}
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            開始時刻（任意）
          </span>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClassName}
          />
        </label>
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      )}

      <div className="text-right">
        <Button type="submit" variant="action-blue" disabled={submitting}>
          {submitting ? "登録中..." : "授業を追加"}
        </Button>
      </div>
    </form>
  );
}
