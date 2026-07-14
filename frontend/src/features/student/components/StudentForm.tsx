"use client";

import { useEffect, useState } from "react";
import { createStudent, updateStudent } from "@/features/student/api/studentActions";
import { getErrorMessage } from "@/lib/errors";
import { GRADE_OPTIONS, type Grade, type Student } from "@/types/student";
import Button from "@/components/common/Button";

type StudentFormProps = {
  editingStudent: Student | null;
  onSaved: () => void;
  onCancelEdit: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-all duration-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200";

export default function StudentForm({ editingStudent, onSaved, onCancelEdit }: StudentFormProps) {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState<Grade>("小1");
  const [school, setSchool] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (editingStudent) {
      setName(editingStudent.name);
      setGrade(editingStudent.grade);
      setSchool(editingStudent.school ?? "");
      setNote(editingStudent.note ?? "");
    } else {
      setName("");
      setGrade("小1");
      setSchool("");
      setNote("");
    }
  }, [editingStudent]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const input = { name, grade, school: school || null, note: note || null };
      const result = editingStudent
        ? await updateStudent(editingStudent.id, input)
        : await createStudent(input);

      if (!result.success) {
        setErrorMessage(result.message);
        return;
      }

      setSuccessMessage(editingStudent ? "生徒情報を更新しました。" : "生徒を登録しました。");
      if (editingStudent) {
        onCancelEdit();
      } else {
        setName("");
        setSchool("");
        setNote("");
      }
      onSaved();
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
          {editingStudent ? "生徒情報を編集" : "生徒を登録"}
        </h3>
        <p className="mt-1 text-sm text-zinc-500">氏名・学年・学校・備考を登録します</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">氏名</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: 山田太郎"
            className={inputClassName}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">学年</span>
          <select
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value as Grade)}
            className={inputClassName}
          >
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">学校（任意）</span>
          <input
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="例: 〇〇小学校"
            className={inputClassName}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">備考（任意）</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例: 送迎あり"
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

      <div className="flex justify-end gap-3">
        {editingStudent && (
          <Button type="button" variant="outline-neutral" onClick={onCancelEdit} disabled={submitting}>
            編集をキャンセル
          </Button>
        )}
        <Button type="submit" variant="action-blue" disabled={submitting}>
          {submitting ? "保存中..." : editingStudent ? "更新する" : "生徒を追加"}
        </Button>
      </div>
    </form>
  );
}
